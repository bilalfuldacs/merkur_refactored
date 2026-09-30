import { ApiError, getStoredUser, isNetworkError } from '@/api'
import type { AuthUser } from '@/api'
import {
  getIce2027,
  getIceEvaluation,
  getIceOpenQuestionnaire,
  getIceQuestionnaire,
  saveIceEvaluation,
  saveIceOpenQuestionnaire,
  saveIceQuestionnaire,
} from '@/api/ice2027'
import type {
  IceBootstrap,
  IceEvalRow,
  IceEvaluationPayload,
  IceQuestionnairePayload,
  IceQuestionnaireProducts,
  IceScoutProduct,
} from '@/api/ice2027'
import {
  iceKvClear,
  iceKvDelete,
  iceKvGet,
  iceKvSet,
  icePendingAll,
  icePendingDelete,
  icePendingGet,
  icePendingPut,
} from './iceDb'
import type { IcePendingEvaluation, IcePendingQuestionnaire } from './iceDb'

export type IceSaveResult = {
  message: string
  synced: boolean
}

type CachedBootstrap = {
  userId: number
  data: IceBootstrap
}

const listeners = new Set<() => void>()
let syncing = false

function currentUserId(): number | null {
  return getStoredUser<AuthUser>()?.ID ?? null
}

function questionnaireKey(competitorId: number): string {
  return `questionnaire:${competitorId}`
}

function notify(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeIceOffline(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export async function clearIceOffline(): Promise<void> {
  await iceKvClear()
  notify()
}

export async function countIcePending(): Promise<number> {
  return (await icePendingAll()).length
}

function applyPendingToBootstrap(data: IceBootstrap, pending: Awaited<ReturnType<typeof icePendingAll>>): IceBootstrap {
  const next: IceBootstrap = structuredClone(data)
  for (const item of pending) {
    if (item.kind === 'questionnaire') {
      for (const list of [next.competitors, next.all_competitors]) {
        const row = list.find((competitor) => competitor.ID === item.competitorId)
        if (row) {
          row.questionnaire_done = true
        }
      }
    }
    if (item.kind === 'evaluation') {
      next.me.evaluation_done = true
      for (const list of [next.competitors, next.all_competitors]) {
        for (const row of list) {
          row.evaluation_done = true
        }
      }
    }
  }
  next.me.questionnaires_done = next.competitors.filter((item) => item.questionnaire_done).length
  return next
}

async function cacheBootstrap(data: IceBootstrap): Promise<void> {
  const userId = currentUserId()
  if (!userId) {
    return
  }
  await iceKvSet('bootstrap', { userId, data } satisfies CachedBootstrap)
}

async function readCachedBootstrap(): Promise<IceBootstrap | null> {
  const userId = currentUserId()
  const cached = await iceKvGet<CachedBootstrap>('bootstrap')
  if (!cached || cached.userId !== userId) {
    return null
  }
  return cached.data
}

async function prefetchAssigned(data: IceBootstrap): Promise<void> {
  await Promise.allSettled([
    ...data.competitors.map(async (competitor) => {
      const payload = await getIceQuestionnaire(competitor.ID)
      await iceKvSet(questionnaireKey(competitor.ID), payload)
    }),
    getIceEvaluation().then((payload) => iceKvSet('evaluation', payload)),
  ])
}

export async function loadIceHub(): Promise<{ data: IceBootstrap; fromPhone: boolean }> {
  try {
    if (navigator.onLine) {
      await syncIcePending()
    }
    const data = await getIce2027()
    await cacheBootstrap(data)
    void prefetchAssigned(data)
    const pending = await icePendingAll()
    notify()
    return { data: applyPendingToBootstrap(data, pending), fromPhone: false }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    const cached = await readCachedBootstrap()
    if (!cached) {
      throw error
    }
    return { data: applyPendingToBootstrap(cached, await icePendingAll()), fromPhone: true }
  }
}

export async function loadIceQuestionnaire(
  competitorId: number,
  options?: { preferServer?: boolean },
): Promise<{ data: IceQuestionnairePayload; fromPhone: boolean; pending: boolean }> {
  const pending = options?.preferServer
    ? undefined
    : await icePendingGet<IcePendingQuestionnaire>(questionnaireKey(competitorId))
  try {
    const data = await getIceQuestionnaire(competitorId)
    await iceKvSet(questionnaireKey(competitorId), data)
    if (pending) {
      return {
        data: { ...data, products: pending.products as IceQuestionnaireProducts },
        fromPhone: false,
        pending: true,
      }
    }
    return { data, fromPhone: false, pending: false }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    const cached = await iceKvGet<IceQuestionnairePayload>(questionnaireKey(competitorId))
    if (pending) {
      const competitor = cached?.competitor ?? (await readCachedBootstrap())?.competitors.find((item) => item.ID === competitorId)
      if (competitor) {
        return {
          data: {
            competitor,
            products: pending.products as IceQuestionnaireProducts,
          },
          fromPhone: true,
          pending: true,
        }
      }
    }
    if (cached) {
      return { data: cached, fromPhone: true, pending: false }
    }
    throw error
  }
}

export async function persistIceQuestionnaire(
  competitorId: number,
  products: IceQuestionnaireProducts,
): Promise<IceSaveResult> {
  const saveOnPhone = async (): Promise<IceSaveResult> => {
    await icePendingPut({
      id: questionnaireKey(competitorId),
      kind: 'questionnaire',
      competitorId,
      products,
      savedAt: Date.now(),
    })
    const cached = await iceKvGet<IceQuestionnairePayload>(questionnaireKey(competitorId))
    if (cached) {
      await iceKvSet(questionnaireKey(competitorId), { ...cached, products })
    }
    notify()
    return { message: 'Saved on this phone. It will upload when you are online.', synced: false }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return saveOnPhone()
  }

  try {
    const result = await saveIceQuestionnaire(competitorId, products)
    await icePendingDelete(questionnaireKey(competitorId))
    await iceKvSet(questionnaireKey(competitorId), result)
    notify()
    return { message: result.message || 'Saved to server.', synced: true }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    return saveOnPhone()
  }
}

export async function loadIceOpenQuestionnaire(
  options?: { preferServer?: boolean },
): Promise<{ data: IceQuestionnairePayload; fromPhone: boolean; pending: boolean }> {
  const pending = options?.preferServer
    ? undefined
    : await icePendingGet<IcePendingQuestionnaire>(questionnaireKey(0))
  try {
    const data = await getIceOpenQuestionnaire()
    await iceKvSet(questionnaireKey(0), data)
    if (pending) {
      return {
        data: { ...data, products: pending.products as IceQuestionnaireProducts },
        fromPhone: false,
        pending: true,
      }
    }
    return { data, fromPhone: false, pending: false }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    const cached = await iceKvGet<IceQuestionnairePayload>(questionnaireKey(0))
    if (pending && cached) {
      return { data: { ...cached, products: pending.products as IceQuestionnaireProducts }, fromPhone: true, pending: true }
    }
    if (cached) {
      return { data: cached, fromPhone: true, pending: false }
    }
    throw error
  }
}

export async function persistIceOpenQuestionnaire(products: IceQuestionnaireProducts): Promise<IceSaveResult> {
  const saveOnPhone = async (): Promise<IceSaveResult> => {
    await icePendingPut({
      id: questionnaireKey(0),
      kind: 'questionnaire',
      competitorId: 0,
      products,
      savedAt: Date.now(),
    })
    const cached = await iceKvGet<IceQuestionnairePayload>(questionnaireKey(0))
    if (cached) {
      await iceKvSet(questionnaireKey(0), { ...cached, products })
    }
    notify()
    return { message: 'Saved on this phone. It will upload when you are online.', synced: false }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return saveOnPhone()
  }

  try {
    const result = await saveIceOpenQuestionnaire(products)
    await icePendingDelete(questionnaireKey(0))
    await iceKvSet(questionnaireKey(0), result)
    notify()
    return { message: result.message || 'Saved to server.', synced: true }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    return saveOnPhone()
  }
}

export async function loadIceEval(competitorId?: number | null): Promise<{
  data: IceEvaluationPayload
  fromPhone: boolean
  draft: IceEvalRow[] | null
}> {
  const pending = await icePendingGet<IcePendingEvaluation>('evaluation')
  const draftPack = await readEvalDraft()
  try {
    const data = await getIceEvaluation(competitorId)
    await iceKvSet('evaluation', data)
    if (pending) {
      return {
        data: { ...data, top5: pending.top5 as IceEvalRow[] },
        fromPhone: false,
        draft: null,
      }
    }
    const draft = draftDiffersFromServer(draftPack?.rows, data.top5) ? (draftPack?.rows ?? null) : null
    if (draftPack && !draft) {
      await clearIceEvalDraft()
    }
    return { data, fromPhone: false, draft }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    const cached = await iceKvGet<IceEvaluationPayload>('evaluation')
    if (cached) {
      const top5 = pending ? (pending.top5 as IceEvalRow[]) : cached.top5
      const draft =
        !pending && draftDiffersFromServer(draftPack?.rows, cached.top5) ? (draftPack?.rows ?? null) : null
      return {
        data: pending ? { ...cached, top5 } : cached,
        fromPhone: true,
        draft,
      }
    }
    throw error
  }
}

type EvalDraftPack = {
  userId: number
  eventSlug: string
  rows: IceEvalRow[]
  savedAt: number
}

function currentEventSlug(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return new URLSearchParams(window.location.search).get('e')?.trim() ?? ''
}

function evaluationDraftKey(): string {
  const slug = currentEventSlug()
  return slug ? `evaluation:draft:${slug}` : 'evaluation:draft'
}

export function normalizeIceEvalRow(row: IceEvalRow | undefined | null): Record<string, unknown> {
  return {
    competitor_ID: row?.competitor_ID ?? null,
    competitor: row?.competitor ?? '',
    game_ID: row?.game_ID ?? '',
    game_name: row?.game_name ?? '',
    is_new_product: Boolean(row?.is_new_product),
    game_type: row?.game_type ?? '',
    note: row?.note ?? '',
    graphic: row?.graphic ?? '',
    sound: row?.sound ?? '',
    theme: row?.theme ?? '',
    mechanics: row?.mechanics ?? '',
    entertainment: row?.entertainment ?? '',
    innovation: row?.innovation ?? '',
    potential: row?.potential ?? '',
    general: row?.general ?? '',
    would_play: row?.would_play ?? '',
  }
}

export function iceEvalRowSignature(row: IceEvalRow | undefined | null): string {
  return JSON.stringify(normalizeIceEvalRow(row))
}

export function iceEvalRowsSignatures(rows: IceEvalRow[]): string[] {
  return rows.map((row) => iceEvalRowSignature(row))
}

export function iceEvalRowHasContent(row: IceEvalRow | undefined | null): boolean {
  const normalized = normalizeIceEvalRow(row)
  return Object.values(normalized).some((value) => {
    if (typeof value === 'boolean') {
      return value
    }
    return String(value ?? '').trim() !== '' && value !== null
  })
}

function normalizeEvalRows(rows: IceEvalRow[] | Record<string, IceEvalRow> | undefined): unknown {
  if (!rows) {
    return []
  }
  const list = Array.isArray(rows)
    ? rows
    : Object.keys(rows)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => rows[key])
  return list.map((row) => normalizeIceEvalRow(row))
}

export function draftDiffersFromServer(
  draft: IceEvalRow[] | undefined,
  server: IceEvalRow[] | Record<string, IceEvalRow> | undefined,
): boolean {
  if (!draft || draft.length === 0) {
    return false
  }
  return JSON.stringify(normalizeEvalRows(draft)) !== JSON.stringify(normalizeEvalRows(server))
}

async function readEvalDraft(): Promise<EvalDraftPack | null> {
  const userId = currentUserId()
  const cached = await iceKvGet<EvalDraftPack>(evaluationDraftKey())
  if (!cached || cached.userId !== userId) {
    return null
  }
  const slug = currentEventSlug()
  if (slug && cached.eventSlug && cached.eventSlug !== slug) {
    return null
  }
  return cached
}

export async function saveIceEvalDraft(rows: IceEvalRow[]): Promise<void> {
  const userId = currentUserId()
  if (!userId) {
    return
  }
  await iceKvSet(evaluationDraftKey(), {
    userId,
    eventSlug: currentEventSlug(),
    rows,
    savedAt: Date.now(),
  } satisfies EvalDraftPack)
  notify()
}

export async function clearIceEvalDraft(): Promise<void> {
  await iceKvDelete(evaluationDraftKey())
  notify()
}

type ProductDraftPack = {
  userId: number
  eventSlug: string
  competitorId: number
  index: number
  item: IceScoutProduct
  savedAt: number
}

function productDraftKey(competitorId: number): string {
  const slug = currentEventSlug()
  return slug ? `product-draft:${slug}:${competitorId}` : `product-draft:${competitorId}`
}

export function iceProductDraftHasContent(item: IceScoutProduct | null | undefined, needCompetitorName = false): boolean {
  if (!item) {
    return false
  }
  if (String(item.game_name ?? '').trim()) {
    return true
  }
  if (String(item.category ?? '').trim()) {
    return true
  }
  if ((item.game_ids ?? []).length > 0) {
    return true
  }
  if (needCompetitorName && String(item.competitor_name ?? item.competitor ?? '').trim()) {
    return true
  }
  if ((item.functionality ?? []).length > 0) {
    return true
  }
  if ((item.photos ?? []).some((photo) => photo && photo.id)) {
    return true
  }
  if (item.progressive_jp === 'yes' || item.integrated_jp === 'yes' || item.uhd === 'yes' || item.video_button_panel === 'yes') {
    return true
  }
  const fields: Array<keyof IceScoutProduct> = [
    'win_lines',
    'denomination',
    'bets',
    'theme',
    'cabinet',
    'target_market',
    'usp',
    'mechanics_description',
    'no_of_pots',
    'no_progressives',
    'no_static',
    'monitor_size',
    'number_of_monitors',
    'vbp_functions',
    'integrated_jp_number',
    'number_of_categories',
    'number_of_games',
  ]
  return fields.some((key) => String(item[key] ?? '').trim() !== '')
}

export async function saveIceProductDraft(
  competitorId: number,
  pack: { item: IceScoutProduct; index: number },
): Promise<void> {
  const userId = currentUserId()
  if (!userId || !iceProductDraftHasContent(pack.item)) {
    await clearIceProductDraft(competitorId)
    return
  }
  await iceKvSet(productDraftKey(competitorId), {
    userId,
    eventSlug: currentEventSlug(),
    competitorId,
    index: pack.index,
    item: pack.item,
    savedAt: Date.now(),
  } satisfies ProductDraftPack)
  notify()
}

export async function readIceProductDraft(
  competitorId: number,
): Promise<{ item: IceScoutProduct; index: number; savedAt: number } | null> {
  const userId = currentUserId()
  const cached = await iceKvGet<ProductDraftPack>(productDraftKey(competitorId))
  if (!cached || cached.userId !== userId) {
    return null
  }
  const slug = currentEventSlug()
  if (slug && cached.eventSlug && cached.eventSlug !== slug) {
    return null
  }
  if (!iceProductDraftHasContent(cached.item)) {
    return null
  }
  return { item: cached.item, index: cached.index, savedAt: cached.savedAt }
}

export async function clearIceProductDraft(competitorId: number): Promise<void> {
  await iceKvDelete(productDraftKey(competitorId))
  notify()
}

export async function getIcePendingQuestionnaire(
  competitorId: number,
): Promise<IcePendingQuestionnaire | undefined> {
  return icePendingGet<IcePendingQuestionnaire>(questionnaireKey(competitorId))
}

export async function discardIcePendingQuestionnaire(competitorId: number): Promise<void> {
  await icePendingDelete(questionnaireKey(competitorId))
  notify()
}

export async function persistIceEvaluation(top5: IceEvalRow[]): Promise<IceSaveResult> {
  const saveOnPhone = async (): Promise<IceSaveResult> => {
    await icePendingPut({
      id: 'evaluation',
      kind: 'evaluation',
      top5,
      savedAt: Date.now(),
    })
    const cached = await iceKvGet<IceEvaluationPayload>('evaluation')
    if (cached) {
      await iceKvSet('evaluation', { ...cached, top5 })
    }
    await clearIceEvalDraft()
    notify()
    return { message: 'Saved on this phone. It will upload when you are online.', synced: false }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return saveOnPhone()
  }

  try {
    await saveIceEvaluation(top5)
    await icePendingDelete('evaluation')
    await clearIceEvalDraft()
    const cached = await iceKvGet<IceEvaluationPayload>('evaluation')
    if (cached) {
      await iceKvSet('evaluation', { ...cached, top5 })
    }
    notify()
    return { message: 'Saved to server.', synced: true }
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      await saveIceEvalDraft(top5)
      throw error
    }
    if (!isNetworkError(error)) {
      throw error
    }
    return saveOnPhone()
  }
}

export async function syncIcePending(): Promise<{ uploaded: number; failed: number }> {
  if (syncing) {
    return { uploaded: 0, failed: 0 }
  }
  syncing = true
  let uploaded = 0
  let failed = 0
  try {
    const items = await icePendingAll()
    items.sort((a, b) => a.savedAt - b.savedAt)
    for (const item of items) {
      try {
        if (item.kind === 'questionnaire') {
          if (item.competitorId < 1) {
            await saveIceOpenQuestionnaire(item.products as IceQuestionnaireProducts)
          } else {
            await saveIceQuestionnaire(item.competitorId, item.products as IceQuestionnaireProducts)
          }
        } else {
          await saveIceEvaluation(item.top5 as IceEvalRow[])
        }
        await icePendingDelete(item.id)
        uploaded += 1
      } catch (error) {
        if (isNetworkError(error)) {
          break
        }
        failed += 1
      }
    }
    if (uploaded > 0) {
      notify()
    }
    return { uploaded, failed }
  } finally {
    syncing = false
  }
}

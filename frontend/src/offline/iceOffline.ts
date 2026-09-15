import { getStoredUser, isNetworkError } from '@/api'
import type { AuthUser } from '@/api'
import {
  getIce2027,
  getIceEvaluation,
  getIceQuestionnaire,
  saveIceEvaluation,
  saveIceQuestionnaire,
} from '@/api/ice2027'
import type {
  IceBootstrap,
  IceEvalRow,
  IceEvaluationPayload,
  IceQuestionnairePayload,
  IceQuestionnaireProducts,
} from '@/api/ice2027'
import {
  iceKvClear,
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

export async function loadIceQuestionnaire(competitorId: number): Promise<{ data: IceQuestionnairePayload; fromPhone: boolean }> {
  const pending = await icePendingGet<IcePendingQuestionnaire>(questionnaireKey(competitorId))
  try {
    const data = await getIceQuestionnaire(competitorId)
    await iceKvSet(questionnaireKey(competitorId), data)
    if (pending) {
      return { data: { ...data, products: pending.products as IceQuestionnaireProducts }, fromPhone: false }
    }
    return { data, fromPhone: false }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    const cached = await iceKvGet<IceQuestionnairePayload>(questionnaireKey(competitorId))
    if (pending) {
      const competitor = cached?.competitor ?? (await readCachedBootstrap())?.competitors.find((item) => item.ID === competitorId)
      if (competitor) {
        return {
          data: { competitor, products: pending.products as IceQuestionnaireProducts },
          fromPhone: true,
        }
      }
    }
    if (cached) {
      return { data: cached, fromPhone: true }
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

export async function loadIceEval(competitorId?: number | null): Promise<{ data: IceEvaluationPayload; fromPhone: boolean }> {
  const pending = await icePendingGet<IcePendingEvaluation>('evaluation')
  try {
    const data = await getIceEvaluation(competitorId)
    await iceKvSet('evaluation', data)
    if (pending) {
      return { data: { ...data, top5: pending.top5 as IceEvalRow[] }, fromPhone: false }
    }
    return { data, fromPhone: false }
  } catch (error) {
    if (!isNetworkError(error)) {
      throw error
    }
    const cached = await iceKvGet<IceEvaluationPayload>('evaluation')
    if (cached) {
      return {
        data: pending ? { ...cached, top5: pending.top5 as IceEvalRow[] } : cached,
        fromPhone: true,
      }
    }
    throw error
  }
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
    notify()
    return { message: 'Saved on this phone. It will upload when you are online.', synced: false }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return saveOnPhone()
  }

  try {
    await saveIceEvaluation(top5)
    await icePendingDelete('evaluation')
    const cached = await iceKvGet<IceEvaluationPayload>('evaluation')
    if (cached) {
      await iceKvSet('evaluation', { ...cached, top5 })
    }
    notify()
    return { message: 'Saved to server.', synced: true }
  } catch (error) {
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
          await saveIceQuestionnaire(item.competitorId, item.products as IceQuestionnaireProducts)
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

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import ListSubheader from '@mui/material/ListSubheader'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ApiError } from '@/api'
import { ICE_EVAL_CATEGORIES } from '@/api/ice2027'
import type { IceCompetitor, IceEvalRow, IceEvaluationPayload, IceGame } from '@/api/ice2027'
import { IceEventPicker, IceHero, IceOfflineBar, IceSectionHead, IceTabs, iceCrumbSx, iceStickyBarSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppTextField } from '@/components/ui'
import {
  clearIceEvalDraft,
  iceEvalRowHasContent,
  iceEvalRowSignature,
  iceEvalRowsSignatures,
  loadIceEval,
  persistIceEvaluation,
  saveIceEvalDraft,
} from '@/offline/iceOffline'
import { APP_PATHS, eventSlugFromSearch, ice2027EvaluationPath, ice2027HubPath, useAppPath } from '@/routing'

const CRITERIA = [
  ['graphic', 'Graphic'],
  ['sound', 'Sound'],
  ['theme', 'Theme'],
  ['mechanics', 'Mechanics/Features'],
  ['entertainment', 'Entertainment'],
  ['innovation', 'Innovation'],
  ['potential', 'Potential'],
  ['general', 'General'],
] as const

const SCORE_FIELDS = CRITERIA.map(([field]) => field)
const REQUIRED = 5
const MAX_ROWS = 40
const FIELD_LABELS: Record<string, string> = {
  competitor: 'Competitor',
  game: 'Game',
  ...Object.fromEntries(CRITERIA),
  would_play: 'Would you play this game',
}

const SCALE_CHIPS = [
  '5 = very good',
  '4 = good',
  '3 = average',
  '2 = poor',
  '1 = very poor',
] as const

const mobileInputSx = {
  '& .MuiInputBase-root': { fontSize: 16, minHeight: 42 },
  '& .MuiSelect-select': { fontSize: 16, minHeight: 42, display: 'flex', alignItems: 'center', py: 0 },
} as const

function top5Row(top5: IceEvalRow[] | Record<string, IceEvalRow> | undefined, index: number): IceEvalRow {
  if (!top5) {
    return {}
  }
  if (Array.isArray(top5)) {
    return top5[index] ?? {}
  }
  return top5[index + 1] ?? top5[String(index + 1)] ?? top5[index] ?? {}
}

function competitorIdFromSearch(search: string): number | null {
  const id = Number(new URLSearchParams(search).get('c'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function emptyRow(): IceEvalRow {
  return {
    competitor_ID: null,
    game_ID: '',
    game_name: '',
    is_new_product: false,
    game_type: '',
    note: '',
    graphic: '',
    sound: '',
    theme: '',
    mechanics: '',
    entertainment: '',
    innovation: '',
    potential: '',
    general: '',
    would_play: '',
  }
}

function catalogGameId(row: IceEvalRow): number {
  if (row.game_ID === '__new__') {
    return 0
  }
  const id = Number(row.game_ID ?? 0)
  return Number.isInteger(id) && id > 0 ? id : 0
}

function gamePickValue(row: IceEvalRow): string {
  const id = catalogGameId(row)
  if (id > 0) {
    return String(id)
  }
  if ((row.game_name ?? '').trim() !== '' || row.game_ID === '__new__') {
    return '__new__'
  }
  return ''
}

function rowState(row: IceEvalRow): { started: boolean; complete: boolean; missing: string[] } {
  const missing: string[] = []
  const competitorOk = Number(row.competitor_ID ?? 0) > 0 || Boolean(row.competitor?.trim())
  const gameOk = catalogGameId(row) > 0 || (row.game_name ?? '').trim() !== ''
  if (!competitorOk) {
    missing.push('competitor')
  }
  if (!gameOk) {
    missing.push('game')
  }
  for (const field of SCORE_FIELDS) {
    const score = Number(row[field] ?? 0)
    if (score < 1 || score > 5) {
      missing.push(field)
    }
  }
  if (!['yes', 'no', 'unsure'].includes(row.would_play ?? '')) {
    missing.push('would_play')
  }
  const filled = 11 - missing.length
  return { started: filled > 0, complete: missing.length === 0, missing }
}

function usedCatalogIds(rows: IceEvalRow[], except: number): number[] {
  return rows.flatMap((row, index) => {
    if (index === except) {
      return []
    }
    const id = catalogGameId(row)
    return id > 0 ? [id] : []
  })
}

function gamesForRow(games: IceGame[], competitorId: number | null, rows: IceEvalRow[], index: number): IceGame[] {
  if (!competitorId) {
    return []
  }
  const keep = catalogGameId(rows[index] ?? {})
  const used = new Set(usedCatalogIds(rows, index))
  return games.filter((game) => game.competitor_ID === competitorId && (game.ID === keep || !used.has(game.ID)))
}

function competitorLabel(row: IceEvalRow, competitors: IceCompetitor[]): string {
  if (row.competitor_ID === '__new__' || (Number(row.competitor_ID) < 1 && (row.competitor ?? '').trim())) {
    return (row.competitor ?? '').trim() || 'Competitor'
  }
  const id = Number(row.competitor_ID)
  if (id > 0) {
    return competitors.find((item) => item.ID === id)?.name ?? 'Competitor'
  }
  return 'Competitor'
}

function gameLabel(row: IceEvalRow, games: IceGame[]): string {
  const id = catalogGameId(row)
  if (id > 0) {
    return games.find((game) => game.ID === id)?.name ?? 'Game'
  }
  const typed = (row.game_name ?? '').trim()
  return typed || 'Game'
}

function rowStatus(row: IceEvalRow, dirty: boolean): { label: string; color: string; fontWeight: number } {
  if (dirty) {
    return { label: 'Not saved', color: '#b86a00', fontWeight: 700 }
  }
  const state = rowState(row)
  if (!state.started) {
    return { label: 'Not rated', color: 'text.secondary', fontWeight: 400 }
  }
  if (state.complete) {
    return { label: 'Saved', color: 'success.main', fontWeight: 600 }
  }
  return { label: 'incomplete', color: '#b86a00', fontWeight: 700 }
}

function rowMatchesSearch(row: IceEvalRow, query: string, competitors: IceCompetitor[], games: IceGame[]): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') {
    return true
  }
  const text = `${competitorLabel(row, competitors)} ${gameLabel(row, games)}`.trim().toLowerCase()
  return text !== '' && text.includes(q)
}

type RowFields = {
  competitorField: ReactNode
  gameField: ReactNode
  newProduct: ReactNode
  categoryField: ReactNode
  scoreFields: ReactNode[]
  wouldPlayField: ReactNode
  noteField: ReactNode
}

type RowEditorsProps = {
  row: IceEvalRow
  missing: string[]
  yours: IceCompetitor[]
  others: IceCompetitor[]
  categories: Record<string, string>
  options: IceGame[]
  competitorId: number | null
  competitorPick: string
  pick: string
  mobile: boolean
  onCompetitorChange: (value: string) => void
  onCompetitorName: (value: string) => void
  onGamePick: (value: string) => void
  onPatch: (next: Partial<IceEvalRow>) => void
}

function buildRowFields({
  row,
  missing,
  yours,
  others,
  categories,
  options,
  competitorId,
  competitorPick,
  pick,
  mobile,
  onCompetitorChange,
  onCompetitorName,
  onGamePick,
  onPatch,
}: RowEditorsProps): RowFields {
  const fieldError = (field: string) => missing.includes(field)
  const fieldSx = mobile ? mobileInputSx : undefined
  const size = 'small' as const

  return {
    competitorField: (
      <>
        <AppTextField
          select
          size={size}
          error={fieldError('competitor')}
          value={competitorPick}
          onChange={(event) => onCompetitorChange(event.target.value)}
          sx={fieldSx}
        >
          <MenuItem value="">Competitor…</MenuItem>
          {yours.length > 0 ? <ListSubheader>Your competitors</ListSubheader> : null}
          {yours.map((item) => (
            <MenuItem key={item.ID} value={String(item.ID)}>
              {item.name}
            </MenuItem>
          ))}
          {others.length > 0 ? (
            <ListSubheader>{yours.length > 0 ? 'Other competitors' : 'Competitors'}</ListSubheader>
          ) : null}
          {others.map((item) => (
            <MenuItem key={item.ID} value={String(item.ID)}>
              {item.name}
            </MenuItem>
          ))}
          <MenuItem value="__new__">Type a new competitor name</MenuItem>
        </AppTextField>
        {competitorPick === '__new__' ? (
          <AppTextField
            size={size}
            error={fieldError('competitor')}
            value={row.competitor ?? ''}
            placeholder="Competitor name"
            onChange={(event) => onCompetitorName(event.target.value)}
            sx={{ mt: 1, ...(fieldSx ?? {}) }}
          />
        ) : null}
      </>
    ),
    gameField: (
      <>
        <AppTextField
          select
          size={size}
          error={fieldError('game')}
          value={pick}
          onChange={(event) => onGamePick(event.target.value)}
          sx={fieldSx}
        >
          <MenuItem value="">{competitorId ? 'Select a game…' : 'Select a competitor first'}</MenuItem>
          <MenuItem value="__new__">Type a new game…</MenuItem>
          {options.map((game) => (
            <MenuItem key={game.ID} value={String(game.ID)}>
              {game.name}
            </MenuItem>
          ))}
        </AppTextField>
        {pick === '__new__' ? (
          <AppTextField
            size={size}
            error={fieldError('game')}
            value={row.game_name ?? ''}
            placeholder="New game name"
            onChange={(event) => onPatch({ game_name: event.target.value })}
            sx={{ mt: 1, ...(fieldSx ?? {}) }}
          />
        ) : null}
      </>
    ),
    newProduct: (
      <Checkbox
        checked={Boolean(row.is_new_product)}
        onChange={(event) => onPatch({ is_new_product: event.target.checked })}
        slotProps={{ input: { 'aria-label': 'New product' } }}
        sx={mobile ? { p: 0.5 } : undefined}
      />
    ),
    categoryField: (
      <AppTextField
        select
        size={size}
        value={row.game_type ?? ''}
        onChange={(event) => onPatch({ game_type: event.target.value })}
        sx={fieldSx}
      >
        <MenuItem value="">–</MenuItem>
        {Object.entries(categories).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </AppTextField>
    ),
    scoreFields: SCORE_FIELDS.map((field) => (
      <AppTextField
        key={field}
        select
        size={size}
        error={fieldError(field)}
        value={row[field] != null && row[field] !== '' ? String(row[field]) : ''}
        onChange={(event) => onPatch({ [field]: event.target.value })}
        sx={fieldSx}
      >
        <MenuItem value="">–</MenuItem>
        {[1, 2, 3, 4, 5].map((score) => (
          <MenuItem key={score} value={String(score)}>
            {score}
          </MenuItem>
        ))}
      </AppTextField>
    )),
    wouldPlayField: (
      <AppTextField
        select
        size={size}
        error={fieldError('would_play')}
        value={row.would_play ?? ''}
        onChange={(event) => onPatch({ would_play: event.target.value })}
        sx={fieldSx}
      >
        <MenuItem value="">–</MenuItem>
        <MenuItem value="yes">Yes</MenuItem>
        <MenuItem value="no">No</MenuItem>
        <MenuItem value="unsure">Unsure</MenuItem>
      </AppTextField>
    ),
    noteField: (
      <AppTextField
        size={size}
        value={row.note ?? ''}
        placeholder="Optional"
        onChange={(event) => onPatch({ note: event.target.value })}
        sx={fieldSx}
      />
    ),
  }
}

function MobileEvalFields({ fields }: { fields: RowFields }) {
  const labelSx = { display: 'block', mb: 0.5, fontSize: 12.5, fontWeight: 700, color: 'text.primary' }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, px: 0.25, pb: 0.5 }}>
      <Box>
        <Typography component="span" sx={labelSx}>
          Competitor
        </Typography>
        {fields.competitorField}
      </Box>
      <Box>
        <Typography component="span" sx={labelSx}>
          Game
        </Typography>
        {fields.gameField}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 0.25 }}>
        <Typography component="span" sx={{ ...labelSx, mb: 0 }}>
          New product
        </Typography>
        {fields.newProduct}
      </Box>
      <Box>
        <Typography component="span" sx={labelSx}>
          Category
        </Typography>
        {fields.categoryField}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
        {CRITERIA.map(([field, label], i) => (
          <Box key={field}>
            <Typography component="span" sx={labelSx}>
              {label}
            </Typography>
            {fields.scoreFields[i]}
          </Box>
        ))}
      </Box>
      <Box>
        <Typography component="span" sx={labelSx}>
          Would you play this game when visiting a casino?
        </Typography>
        {fields.wouldPlayField}
      </Box>
      <Box>
        <Typography component="span" sx={labelSx}>
          Note
        </Typography>
        {fields.noteField}
      </Box>
    </Box>
  )
}

export default function Ice2027EvaluationPage() {
  const { navigate, search } = useAppPath()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const focusId = useMemo(() => competitorIdFromSearch(search), [search])
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const [payload, setPayload] = useState<IceEvaluationPayload | null>(null)
  const [rows, setRows] = useState<IceEvalRow[]>(Array.from({ length: REQUIRED }, emptyRow))
  const [baseline, setBaseline] = useState<string[]>([])
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)
  const [invalid, setInvalid] = useState<Record<number, string[]>>({})
  const [draftBanner, setDraftBanner] = useState(false)
  const [openRow, setOpenRow] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const applyingRef = useRef(false)

  const eventName = payload?.event?.name ?? 'Exhibition'
  const catalog = payload?.games ?? []
  const competitors = payload?.competitors ?? []
  const categories = payload?.eval_categories ?? ICE_EVAL_CATEGORIES
  const required = payload?.eval_required_rows ?? REQUIRED
  const maxRows = payload?.eval_max_rows ?? MAX_ROWS
  const assigned = new Set(payload?.assigned_ids ?? [])
  const yours = competitors.filter((item) => assigned.has(item.ID))
  const others = competitors.filter((item) => !assigned.has(item.ID))
  const completeCount = rows.filter((row) => rowState(row).complete).length
  const startedCount = completeCount > 0
  const done = completeCount >= required
  const isScout = Boolean(payload?.scout)
  const formDirty =
    baseline.length > 0 &&
    (rows.length !== baseline.length || rows.some((row, index) => iceEvalRowSignature(row) !== (baseline[index] ?? '')))
  const visibleIndexes = rows
    .map((row, index) => (rowMatchesSearch(row, searchQuery, competitors, catalog) ? index : -1))
    .filter((index) => index >= 0)
  const searchEmpty = searchQuery.trim() !== '' && visibleIndexes.length === 0

  function isRowDirty(index: number): boolean {
    if (baseline.length === 0) {
      return false
    }
    if (index >= baseline.length) {
      return iceEvalRowHasContent(rows[index])
    }
    return iceEvalRowSignature(rows[index]) !== baseline[index]
  }

  const status = done
    ? {
        chip: 'success' as const,
        alert: 'success' as const,
        label: 'Done',
        detail:
          completeCount > required
            ? `You have rated ${completeCount} games. You can still add more or edit your evaluation.`
            : `You have rated ${required} games. You can still add more rows or edit your evaluation.`,
      }
    : startedCount
      ? {
          chip: 'warning' as const,
          alert: 'warning' as const,
          label: `${completeCount}/${required} games rated`,
          detail: `You have rated ${completeCount} of ${required} required games. Fill at least ${required} rows to complete your evaluation. You can add more rows if you need them.`,
        }
      : {
          chip: isScout ? ('error' as const) : ('default' as const),
          alert: isScout ? ('warning' as const) : ('info' as const),
          label: isScout ? 'Not started' : 'Optional',
          detail: isScout
            ? `Rate at least ${required} games. Start with ${required} rows and add more if you want.`
            : `You are not on a scouting team, so this evaluation is optional. Fill at least ${required} rows if you want it to count as done.`,
        }

  useEffect(() => {
    document.title = `${eventName} Evaluation | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [eventName])

  const applyRows = useCallback(
    (top5: IceEvalRow[] | Record<string, IceEvalRow> | undefined, rowRequired: number, rowMax: number) => {
      const savedCount = Array.isArray(top5) ? top5.length : rowRequired
      const count = Math.min(rowMax, Math.max(rowRequired, savedCount))
      return Array.from({ length: count }, (_, index) => {
        const saved = top5Row(top5, index)
        const typedCompetitor = Number(saved.competitor_ID) < 1 && Boolean((saved.competitor ?? '').trim())
        return {
          ...emptyRow(),
          ...saved,
          is_new_product: Boolean(saved.is_new_product),
          competitor_ID: typedCompetitor ? '__new__' : saved.competitor_ID ?? null,
          game_ID: Number(saved.game_ID) > 0 ? Number(saved.game_ID) : (saved.game_name ?? '').trim() !== '' ? '__new__' : '',
        }
      })
    },
    [],
  )

  const loadEval = useCallback(async () => {
    if (!eventSlug) {
      return
    }
    try {
      applyingRef.current = true
      const result = await loadIceEval(focusId)
      const serverRows = applyRows(
        result.data.top5,
        result.data.eval_required_rows ?? REQUIRED,
        result.data.eval_max_rows ?? MAX_ROWS,
      )
      setPayload(result.data)
      setBaseline(iceEvalRowsSignatures(serverRows))
      setInvalid({})
      setFailed('')
      setOpenRow(null)
      setSearchQuery('')
      if (result.draft) {
        const restored = applyRows(
          result.draft,
          result.data.eval_required_rows ?? REQUIRED,
          result.data.eval_max_rows ?? MAX_ROWS,
        )
        setRows(restored)
        setDraftBanner(true)
        setFlash('Restored unsaved draft')
      } else {
        setRows(serverRows)
        setDraftBanner(false)
      }
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Evaluation could not be loaded.')
    } finally {
      applyingRef.current = false
    }
  }, [applyRows, eventSlug, focusId, search])

  useEffect(() => {
    void loadEval()
  }, [loadEval])

  useEffect(() => {
    if (applyingRef.current || !payload || baseline.length === 0) {
      return
    }
    const dirty =
      rows.length !== baseline.length || rows.some((row, index) => iceEvalRowSignature(row) !== (baseline[index] ?? ''))
    const timer = window.setTimeout(() => {
      if (dirty && rows.some(iceEvalRowHasContent)) {
        void saveIceEvalDraft(rows)
      } else {
        void clearIceEvalDraft()
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [rows, baseline, payload])

  if (!eventSlug) {
    return <IceEventPicker buildPath={(slug) => ice2027EvaluationPath(focusId ?? undefined, slug)} />
  }

  function patch(index: number, next: Partial<IceEvalRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...next } : row)))
  }

  function setCompetitor(index: number, competitorId: number | string | null) {
    const row = rows[index]
    const gameId = catalogGameId(row)
    const numericId = typeof competitorId === 'number' ? competitorId : Number(competitorId)
    const stillValid = gameId > 0 && catalog.some((game) => game.ID === gameId && game.competitor_ID === numericId)
    patch(index, {
      competitor_ID: competitorId,
      competitor: competitorId === '__new__' ? row.competitor : '',
      game_ID: stillValid ? gameId : '',
      game_name: stillValid ? '' : '',
    })
  }

  function addRow() {
    setRows((current) => {
      if (current.length >= maxRows) {
        return current
      }
      const next = [...current, emptyRow()]
      if (isMobile) {
        setOpenRow(next.length - 1)
      }
      return next
    })
  }

  function removeRow(index: number) {
    if (index < required) {
      clearRow(index)
      return
    }
    setRows((current) => current.filter((_, i) => i !== index))
    setOpenRow((current) => {
      if (current === null) {
        return null
      }
      if (current === index) {
        return null
      }
      return current > index ? current - 1 : current
    })
    setInvalid((current) => {
      const next: Record<number, string[]> = {}
      Object.entries(current).forEach(([key, value]) => {
        const i = Number(key)
        if (i === index) {
          return
        }
        next[i > index ? i - 1 : i] = value
      })
      return next
    })
  }

  function clearRow(index: number) {
    setRows((current) => current.map((row, i) => (i === index ? emptyRow() : row)))
    setInvalid((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
  }

  function setGamePick(index: number, value: string) {
    if (value === '__new__') {
      patch(index, { game_ID: '__new__' })
      return
    }
    if (value === '') {
      patch(index, { game_ID: '', game_name: '' })
      return
    }
    patch(index, { game_ID: Number(value), game_name: '' })
  }

  function toggleRow(index: number) {
    setOpenRow((current) => (current === index ? null : index))
  }

  function openNextRow(index: number) {
    const position = visibleIndexes.indexOf(index)
    const following = position >= 0 ? visibleIndexes[position + 1] : undefined
    if (following !== undefined) {
      setOpenRow(following)
      return
    }
    setOpenRow(null)
  }

  async function save() {
    setSaving(true)
    setFlash('')
    setFailed('')
    const messages: string[] = []
    const nextInvalid: Record<number, string[]> = {}
    rows.forEach((row, index) => {
      const state = rowState(row)
      if (state.complete) {
        return
      }
      if (!state.started) {
        return
      }
      nextInvalid[index] = state.missing
      messages.push(`Row ${index + 1}: please fill in ${state.missing.map((field) => FIELD_LABELS[field] ?? field).join(', ')}.`)
    })
    const seen: Record<string, number> = {}
    rows.forEach((row, index) => {
      const id = catalogGameId(row)
      if (id < 1) {
        return
      }
      if (seen[id] !== undefined) {
        nextInvalid[index] = [...(nextInvalid[index] ?? []), 'game']
        messages.push(`Row ${index + 1}: you already rated that game in row ${seen[id] + 1}. Pick a different game.`)
      } else {
        seen[id] = index
      }
    })
    if (messages.length > 0) {
      setInvalid(nextInvalid)
      setFailed(`Please complete the highlighted rows before saving. ${messages.join(' ')}`)
      const firstInvalid = Object.keys(nextInvalid)
        .map(Number)
        .sort((a, b) => a - b)[0]
      if (firstInvalid !== undefined && isMobile) {
        setOpenRow(firstInvalid)
      }
      void saveIceEvalDraft(rows)
      setSaving(false)
      return
    }

    try {
      const result = await persistIceEvaluation(rows)
      setFlash(result.message)
      setInvalid({})
      setDraftBanner(false)
      await loadEval()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        await saveIceEvalDraft(rows)
      }
      setFailed(error instanceof ApiError ? error.message : 'Evaluation could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  async function discardDraft() {
    applyingRef.current = true
    await clearIceEvalDraft()
    if (payload) {
      const serverRows = applyRows(payload.top5, required, maxRows)
      setRows(serverRows)
      setBaseline(iceEvalRowsSignatures(serverRows))
    }
    setDraftBanner(false)
    setFlash('')
    applyingRef.current = false
  }

  function rowFields(index: number, mobile: boolean): RowFields {
    const row = rows[index]
    const missing = invalid[index] ?? []
    const competitorPick = row.competitor_ID === '__new__' ? '__new__' : row.competitor_ID ? String(row.competitor_ID) : ''
    const competitorId = Number(row.competitor_ID) > 0 ? Number(row.competitor_ID) : null
    const pick = gamePickValue(row)
    const options = gamesForRow(catalog, competitorId, rows, index)
    return buildRowFields({
      row,
      missing,
      yours,
      others,
      categories,
      options,
      competitorId,
      competitorPick,
      pick,
      mobile,
      onCompetitorChange: (value) => {
        if (value === '__new__') {
          setCompetitor(index, '__new__')
          return
        }
        setCompetitor(index, value === '' ? null : Number(value))
      },
      onCompetitorName: (value) => patch(index, { competitor: value, competitor_ID: '__new__' }),
      onGamePick: (value) => setGamePick(index, value),
      onPatch: (next) => patch(index, next),
    })
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: 3, lg: 4 },
          py: { xs: 1.5, md: 2 },
          pb: { xs: '5.5rem', md: 2 },
        }}
      >
        <Box sx={{ maxWidth: 1480, mx: 'auto', width: '100%' }}>
          <Box
            component="nav"
            aria-label="Breadcrumb"
            sx={{ display: { xs: 'none', md: 'flex' }, flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}
          >
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(ice2027HubPath(eventSlug))} sx={iceCrumbSx}>
              {eventName}
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Evaluation</Box>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <IceHero kicker="Game evaluation" title={eventName}>
              {isScout
                ? `Required. Rate at least ${required} games. Your assigned competitors are listed first; pick one of their games, type a new game, or type a new competitor name.`
                : `Optional. Rate at least ${required} games. Pick a competitor, then one of their games, or type a new name.`}
            </IceHero>
          </Box>

          <IceOfflineBar onUploaded={loadEval} />

          <IceTabs current="evaluation" attendant admin={Boolean(payload?.admin)} showTasks />

          {draftBanner ? (
            <Alert
              severity="warning"
              sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
              action={
                <AppButton size="small" variant="outlined" color="secondary" onClick={() => void discardDraft()}>
                  Discard
                </AppButton>
              }
            >
              Unsaved evaluation draft restored from this browser. Save evaluation to keep it for the team.
            </Alert>
          ) : null}

          {flash && !draftBanner ? (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFlash('')}>
              {flash}
            </Alert>
          ) : null}

          {payload ? (
            <Alert severity={status.alert} sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip size="small" sx={{ fontWeight: 700 }} label={status.label} color={status.chip} />
              <Box component="span" sx={{ flex: 1 }}>
                {status.detail}
              </Box>
              {isScout ? (
                <AppButton size="small" variant="outlined" onClick={() => navigate(ice2027HubPath(eventSlug))}>
                  Back to my tasks
                </AppButton>
              ) : null}
            </Alert>
          ) : null}

          <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <IceSectionHead
              title={`Evaluation of games at ${eventName}`}
              action={
                isMobile ? (
                  <AppButton
                    size="small"
                    variant="outlined"
                    color="inherit"
                    startIcon={<AddOutlinedIcon />}
                    disabled={rows.length >= maxRows}
                    onClick={addRow}
                    sx={{
                      borderColor: 'rgba(255,255,255,0.45)',
                      color: 'common.white',
                      borderRadius: 999,
                      fontWeight: 600,
                      '&:hover': { borderColor: 'common.white', bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  >
                    Add row
                  </AppButton>
                ) : undefined
              }
            />
            <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
              <Box sx={{ mb: 2 }}>
                <AppTextField
                  size="small"
                  fullWidth
                  type="search"
                  label="Search evaluated games"
                  placeholder="Search by competitor or game…"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  slotProps={{ htmlInput: { id: 'ice-eval-search', autoComplete: 'off' } }}
                  sx={isMobile ? mobileInputSx : undefined}
                />
                {searchEmpty ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.75 }}>
                    No evaluated game matches that search.
                  </Typography>
                ) : null}
              </Box>
              {isMobile ? (
                <Box
                  sx={{
                    mb: 1.5,
                    p: 1.25,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                    fontSize: 13,
                    lineHeight: 1.35,
                    color: 'text.secondary',
                  }}
                >
                  <Typography component="span" sx={{ fontWeight: 700, display: 'block', mb: 0.25, fontSize: 13 }}>
                    5-point scale.
                  </Typography>
                  <Typography component="span" sx={{ display: 'block', fontSize: 12.5, mb: 0.75 }}>
                    5 is best, 1 is worst.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {SCALE_CHIPS.map((chip) => (
                      <Box
                        key={chip}
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 999,
                          bgcolor: 'action.hover',
                          whiteSpace: 'nowrap',
                          fontSize: 12,
                        }}
                      >
                        {chip}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography sx={{ color: 'text.secondary', mb: 1.5, fontSize: 14 }}>
                    <strong>5-point scale:</strong> 1 = very poor · 2 = poor · 3 = average · 4 = good · 5 = very good
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: 14, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <InfoOutlinedIcon sx={{ fontSize: 18, mt: '2px' }} />
                    <span>
                      Every row you start has to be filled in completely: game, competitor, all eight ratings, and the casino question. New
                      product, category, and note are optional. After you pick a competitor, choose one of their games or{' '}
                      <strong>Type a new game…</strong>. If the competitor is not in the list, choose <strong>Type a new competitor name</strong>.
                      A catalog game you already rated stays on that row and is hidden from the other rows. Use <strong>Clear</strong> on a row
                      and save to remove that game’s Evaluated tick on Managers.
                    </span>
                  </Typography>
                </>
              )}

              {isMobile ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  {visibleIndexes.map((index) => {
                    const row = rows[index]
                    const missing = invalid[index] ?? []
                    const dirty = isRowDirty(index)
                    const expanded = openRow === index
                    const summaryStatus = rowStatus(row, dirty)
                    const editors = expanded ? rowFields(index, true) : null
                    const borderColor = missing.length > 0 ? 'error.main' : dirty ? '#e6a817' : 'divider'
                    return (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor,
                          borderLeft: dirty || missing.length > 0 ? '3px solid' : '1px solid',
                          borderLeftColor: missing.length > 0 ? 'error.main' : dirty ? '#e6a817' : 'divider',
                          borderRadius: '0.9rem',
                          boxShadow: missing.length > 0
                            ? '0 8px 20px rgba(211, 47, 47, 0.12)'
                            : dirty
                              ? '0 8px 20px rgba(230, 168, 23, 0.14)'
                              : '0 8px 20px rgba(2, 32, 82, 0.06)',
                          overflow: 'hidden',
                          bgcolor: dirty ? 'rgba(255, 193, 7, 0.08)' : 'background.paper',
                        }}
                      >
                        {!expanded ? (
                          <Box
                            component="button"
                            type="button"
                            aria-expanded={false}
                            onClick={() => toggleRow(index)}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
                              alignItems: 'center',
                              gap: 1.25,
                              width: '100%',
                              m: 0,
                              p: 1.5,
                              border: 0,
                              bgcolor: 'transparent',
                              color: 'inherit',
                              textAlign: 'left',
                              minHeight: 68,
                              cursor: 'pointer',
                              appearance: 'none',
                              font: 'inherit',
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 27,
                                height: 27,
                                borderRadius: '50%',
                                bgcolor: 'secondary.main',
                                color: 'common.white',
                                fontSize: 13,
                                fontWeight: 800,
                                flex: '0 0 auto',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.15 }}>
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  lineHeight: 1.25,
                                  color: 'secondary.main',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {competitorLabel(row, competitors)}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: 13,
                                  color: 'text.secondary',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {gameLabel(row, catalog)}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: summaryStatus.color,
                                fontWeight: summaryStatus.fontWeight,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {summaryStatus.label}
                            </Typography>
                            <ExpandMoreIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </Box>
                        ) : (
                          <Box sx={{ px: 1.25, pt: 1.25, pb: 0.5 }}>
                            <Box
                              component="button"
                              type="button"
                              aria-label="Collapse row"
                              onClick={() => toggleRow(index)}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                width: '100%',
                                m: 0,
                                mb: 1,
                                p: 0.5,
                                border: 0,
                                bgcolor: 'transparent',
                                color: 'inherit',
                                textAlign: 'left',
                                cursor: 'pointer',
                                appearance: 'none',
                                font: 'inherit',
                              }}
                            >
                              <Typography sx={{ fontSize: 17, fontWeight: 800, color: 'secondary.main' }}>
                                Game {index + 1}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                {dirty ? (
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      px: 0.75,
                                      py: 0.25,
                                      borderRadius: 999,
                                      bgcolor: '#fff3cd',
                                      color: '#9a5b00',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Not saved
                                  </Box>
                                ) : null}
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: 38,
                                    px: 0.75,
                                    py: 0.25,
                                    borderRadius: 999,
                                    bgcolor: 'rgba(13, 110, 253, 0.12)',
                                    color: 'info.main',
                                    fontSize: 12.5,
                                    fontWeight: 700,
                                  }}
                                >
                                  {index + 1}/{rows.length}
                                </Box>
                                <ExpandLessIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </Box>
                            </Box>
                            {dirty ? (
                              <Box
                                sx={{
                                  mx: 0.25,
                                  mb: 1,
                                  px: 1,
                                  py: 0.75,
                                  borderRadius: '0.6rem',
                                  bgcolor: '#fff3cd',
                                  color: '#7a4b00',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  lineHeight: 1.35,
                                }}
                              >
                                This row is not saved yet. Tap Save evaluation to keep it.
                              </Box>
                            ) : null}
                            {editors ? <MobileEvalFields fields={editors} /> : null}
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                                gap: 1,
                                pt: 1.25,
                                pb: 0.75,
                                px: 0.25,
                              }}
                            >
                              <AppButton
                                size="medium"
                                variant="outlined"
                                color="secondary"
                                onClick={() => (index >= required ? removeRow(index) : clearRow(index))}
                                sx={{ minHeight: 46, borderRadius: '0.6rem', fontWeight: 600 }}
                              >
                                {index >= required ? 'Remove' : 'Clear'}
                              </AppButton>
                              <AppButton
                                size="medium"
                                variant="contained"
                                color="primary"
                                endIcon={
                                  visibleIndexes.indexOf(index) >= 0 &&
                                  visibleIndexes.indexOf(index) + 1 < visibleIndexes.length ? (
                                    <NavigateNextIcon />
                                  ) : undefined
                                }
                                onClick={() => openNextRow(index)}
                                sx={{ minHeight: 46, borderRadius: '0.6rem', fontWeight: 600 }}
                              >
                                {visibleIndexes.indexOf(index) >= 0 &&
                                visibleIndexes.indexOf(index) + 1 < visibleIndexes.length
                                  ? 'Next'
                                  : 'Done'}
                              </AppButton>
                            </Box>
                          </Box>
                        )}
                      </Paper>
                    )
                  })}
                </Box>
              ) : (
                <>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 1480 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Nr</TableCell>
                          <TableCell sx={{ minWidth: 176 }}>Competitor</TableCell>
                          <TableCell sx={{ minWidth: 220 }}>Game</TableCell>
                          <TableCell align="center" sx={{ minWidth: 88 }}>
                            New product
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>Category</TableCell>
                          {CRITERIA.map(([field, label]) => (
                            <TableCell key={field}>{label}</TableCell>
                          ))}
                          <TableCell sx={{ minWidth: 176 }}>Would you play this game when visiting a casino?</TableCell>
                          <TableCell sx={{ minWidth: 160 }}>Note</TableCell>
                          <TableCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {visibleIndexes.map((index) => {
                          const missing = invalid[index] ?? []
                          const dirty = isRowDirty(index)
                          const editors = rowFields(index, false)
                          return (
                            <TableRow
                              key={index}
                              sx={
                                missing.length > 0
                                  ? { bgcolor: 'rgba(211, 47, 47, 0.06)', '& > th': { color: 'error.main', boxShadow: 'inset 3px 0 0', borderColor: 'error.main' } }
                                  : dirty
                                    ? { bgcolor: 'rgba(255, 193, 7, 0.08)', '& > th': { boxShadow: 'inset 3px 0 0 #e6a817' } }
                                    : undefined
                              }
                            >
                              <TableCell component="th" scope="row" sx={{ fontWeight: 800, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                  {index + 1}
                                  {dirty ? (
                                    <Box
                                      component="span"
                                      sx={{
                                        display: 'inline-flex',
                                        px: 0.6,
                                        py: 0.15,
                                        borderRadius: 999,
                                        bgcolor: '#fff3cd',
                                        color: '#9a5b00',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      Not saved
                                    </Box>
                                  ) : null}
                                </Box>
                              </TableCell>
                              <TableCell>{editors.competitorField}</TableCell>
                              <TableCell>{editors.gameField}</TableCell>
                              <TableCell align="center">{editors.newProduct}</TableCell>
                              <TableCell>{editors.categoryField}</TableCell>
                              {SCORE_FIELDS.map((field, i) => (
                                <TableCell key={field}>{editors.scoreFields[i]}</TableCell>
                              ))}
                              <TableCell>{editors.wouldPlayField}</TableCell>
                              <TableCell>{editors.noteField}</TableCell>
                              <TableCell>
                                <AppButton
                                  size="small"
                                  variant="text"
                                  color="error"
                                  onClick={() => (index >= required ? removeRow(index) : clearRow(index))}
                                >
                                  {index >= required ? 'Remove' : 'Clear'}
                                </AppButton>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <AppButton
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<AddOutlinedIcon />}
                      disabled={rows.length >= maxRows}
                      onClick={addRow}
                    >
                      Add row
                    </AppButton>
                  </Box>
                </>
              )}
            </Box>
          </Paper>

          <Box sx={iceStickyBarSx}>
            {failed ? (
              <Alert severity="warning" sx={{ width: '100%', mb: 0 }}>
                {failed}
              </Alert>
            ) : null}
            {formDirty ? (
              <Typography sx={{ width: '100%', color: 'warning.dark', fontWeight: 700, fontSize: 13, mb: failed ? 0 : 0.5 }}>
                You have unsaved changes. They are only stored when you tap Save evaluation.
              </Typography>
            ) : null}
            <AppButton startIcon={<SaveOutlinedIcon />} disabled={saving || !payload} onClick={() => void save()}>
              Save evaluation
            </AppButton>
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

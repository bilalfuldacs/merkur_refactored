import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent, ReactNode } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import FilterListIcon from '@mui/icons-material/FilterList'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Switch from '@mui/material/Switch'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError, getTableView } from '@/api'
import {
  deleteFieldTrialGame,
  deleteFieldTrialMedia,
  getFieldTrialHistory,
  getFieldTrialMarket,
  getFieldTrialMedia,
  getFieldTrialOptions,
  getFieldTrials,
  loadFieldTrialMediaFile,
  saveFieldTrialGame,
  uploadFieldTrialMedia,
} from '@/api/fieldTrials'
import type {
  FieldTrialBar,
  FieldTrialGame,
  FieldTrialMarket,
  FieldTrialMedia,
  FieldTrialOptions,
  FieldTrialPartner,
  FieldTrialRevision,
  FieldTrialSummary,
  FieldTrialTree,
  FieldTrialWeek,
} from '@/api/fieldTrials'
import { TableRecordDialog } from '@/components/tableView/TableRecordDialog'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { tableBrowsePath } from '@/config/tablePages'
import { useI18n } from '@/i18n'
import type { Translate } from '@/i18n/translate'
import { useAppPath } from '@/routing'
import type { TableViewSchema } from '@/tableView'
import { merkurColors } from '@/theme/palette'

const WEEK_COL_REM = 7.25
const TREE_REM = 22
const MACHINES_REM = 5.5
const CABINET_REM = 8.5
const LABEL_REM = TREE_REM + MACHINES_REM + CABINET_REM
const VISIBLE_WEEKS = 7
const MAX_RANGE_WEEKS = 104

function pinnedCells(background: string, zIndex: number) {
  return {
    '& > :nth-of-type(1), & > :nth-of-type(2), & > :nth-of-type(3)': {
      position: 'sticky',
      zIndex,
      bgcolor: background,
      overflow: 'hidden',
    },
    '& > :nth-of-type(1)': { left: 0, width: `${TREE_REM}rem`, minWidth: `${TREE_REM}rem`, maxWidth: `${TREE_REM}rem` },
    '& > :nth-of-type(2)': { left: `${TREE_REM}rem`, width: `${MACHINES_REM}rem`, minWidth: `${MACHINES_REM}rem` },
    '& > :nth-of-type(3)': {
      left: `${TREE_REM + MACHINES_REM}rem`,
      width: `${CABINET_REM}rem`,
      minWidth: `${CABINET_REM}rem`,
      boxShadow: '4px 0 6px -4px rgba(2,32,82,0.35)',
    },
  } as const
}

const STATUS_KEYS: Record<string, string> = {
  planned: 'fieldTrials.statuses.planned',
  expected: 'fieldTrials.statuses.expected',
  'go live': 'fieldTrials.statuses.goLive',
  performance: 'fieldTrials.statuses.performance',
  'replacement plan': 'fieldTrials.statuses.replacementPlan',
  'game replaced': 'fieldTrials.statuses.gameReplaced',
  issues: 'fieldTrials.statuses.issues',
  'connection intended': 'fieldTrials.statuses.connectionIntended',
  installation: 'fieldTrials.statuses.installation',
  'receiving data': 'fieldTrials.statuses.receivingData',
  'issues MARS': 'fieldTrials.statuses.issuesMars',
}

const HISTORY_FIELDS: Record<string, string> = {
  location: 'fieldTrials.location',
  game_system: 'fieldTrials.gameSystem',
  game: 'fieldTrials.gameLabel',
  cabinet: 'fieldTrials.cabinetType',
  machines: 'fieldTrials.machineCount',
  status_date: 'fieldTrials.statusDate',
  general_status: 'fieldTrials.generalStatus',
  status_update: 'fieldTrials.statusUpdate',
  mars_status: 'fieldTrials.marsStatus',
  mars_status_update: 'fieldTrials.marsUpdate',
  info: 'fieldTrials.info',
  remarks: 'fieldTrials.remarks',
}

const STATUS_STYLE: Record<string, { bgcolor: string; color: string }> = {
  planned: { bgcolor: merkurColors.pink, color: '#fff' },
  expected: { bgcolor: merkurColors.yellow, color: '#1a1a1a' },
  golive: { bgcolor: merkurColors.cyan, color: '#fff' },
  performance: { bgcolor: '#2f9e44', color: '#fff' },
  replacement: { bgcolor: '#7c5cbf', color: '#fff' },
  replaced: { bgcolor: '#c8c8c8', color: '#1a1a1a' },
  issues: { bgcolor: merkurColors.red, color: '#fff' },
  default: { bgcolor: merkurColors.blue, color: '#fff' },
}

const LEGEND = ['planned', 'expected', 'go live', 'performance', 'replacement plan', 'game replaced', 'issues'] as const

type GameDraft = {
  id: number
  jurisdictionId: number
  partnerId: number | ''
  venueId: number | ''
  conceptId: number | ''
  gameId: number | ''
  cabinetId: number | ''
  machineCount: string
  trialDate: string
  generalStatus: string
  marsStatus: string
  statusUpdate: string
  marsUpdate: string
  info: string
  remarks: string
  marketName: string
  tab: 'game' | 'assets' | 'history'
}

type VenueCreate = {
  jurisdictionId: number
  partnerId: number | null
  marketName: string
}

type PendingMedia = {
  id: string
  kind: 'picture' | 'video'
  file: File
  url: string
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

function statusKey(status: string) {
  const value = status.toLowerCase()
  if (value.includes('replacement')) return 'replacement'
  if (value.includes('replaced') || value.includes('end')) return 'replaced'
  if (value.includes('planned') || value.includes('intended')) return 'planned'
  if (value.includes('expected')) return 'expected'
  if (value.includes('go live') || value.includes('go-live') || value.includes('golive')) return 'golive'
  if (value.includes('performance') || value === 'live') return 'performance'
  if (value.includes('issue')) return 'issues'
  return 'default'
}

function historyValue(field: string, value: string | null, t: Translate) {
  if (!value) return '—'
  if (field === 'general_status' || field === 'mars_status') return statusLabel(value, t)
  return value
}

function statusLabel(status: string, t: Translate) {
  const key = STATUS_KEYS[status]
  return key ? t(key, status) : status
}

function weekRangeLabel(week: FieldTrialWeek, locale: string) {
  const start = new Date(`${week.start}T00:00:00`)
  const end = new Date(`${week.end}T00:00:00`)
  const format: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${start.toLocaleDateString(locale, format)} – ${end.toLocaleDateString(locale, format)}`
}

function weekStamp(year: number, week: number) {
  return year * 100 + week
}

function isoParts(date: Date): [number, number] {
  const tmp = new Date(date)
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
  const week1 = new Date(tmp.getFullYear(), 0, 4)
  const week = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return [tmp.getFullYear(), week]
}

function previousIsoWeek(year: number, week: number): [number, number] {
  const jan4 = new Date(year, 0, 4)
  const day = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - day + 1 + (week - 1) * 7)
  monday.setDate(monday.getDate() - 7)
  return isoParts(monday)
}

function isoWeekKey(date: string) {
  const [year, week] = isoParts(new Date(`${date}T00:00:00`))
  return `${year}-W${String(week).padStart(2, '0')}`
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + days)
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${value.getFullYear()}-${month}-${day}`
}

function displayStatus(status: string, t: Translate) {
  const label = statusLabel(status, t)
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : status
}

function isIssueStatus(status: string | null | undefined) {
  return Boolean(status && status.toLowerCase().includes('issue'))
}

function isTerminalStatus(status: string) {
  const value = status.toLowerCase()
  return value.includes('replaced') || value.includes('end')
}

function spansForGame(game: FieldTrialGame): FieldTrialBar[] {
  const points = [...(game.timeline ?? [])]
    .filter((point) => point.iso_year && point.iso_week && point.status)
    .sort((a, b) => weekStamp(a.iso_year, a.iso_week) - weekStamp(b.iso_year, b.iso_week))
  const [currentYear, currentWeek] = isoParts(new Date())
  const spans: FieldTrialBar[] = []
  points.forEach((point, index) => {
    let toYear = point.iso_year
    let toWeek = point.iso_week
    const next = points[index + 1]
    if (next) {
      ;[toYear, toWeek] = previousIsoWeek(next.iso_year, next.iso_week)
      if (weekStamp(toYear, toWeek) < weekStamp(point.iso_year, point.iso_week)) {
        toYear = point.iso_year
        toWeek = point.iso_week
      }
    } else if (!isTerminalStatus(point.status) && !isIssueStatus(point.status) && weekStamp(point.iso_year, point.iso_week) <= weekStamp(currentYear, currentWeek)) {
      toYear = currentYear
      toWeek = currentWeek
    }
    if (!isIssueStatus(point.status)) {
      spans.push({
        status: point.status,
        from_year: point.iso_year,
        from_week: point.iso_week,
        to_year: toYear,
        to_week: toWeek,
        count: 0,
      })
    }
  })
  return spans
}

function gameIssue(game: FieldTrialGame) {
  if (!isIssueStatus(game.general_status) && !isIssueStatus(game.mars_status)) return null
  const point = (game.timeline ?? []).find((item) => isIssueStatus(item.status))
  const year = point?.iso_year || game.iso_year
  const week = point?.iso_week || game.iso_week
  if (!year || !week) return null
  return { count: 1, year, week }
}

function clipBar(bar: FieldTrialBar, weeks: FieldTrialWeek[]) {
  if (weeks.length === 0) return null
  const stamps = weeks.map((week) => weekStamp(week.year, week.week))
  const from = weekStamp(bar.from_year, bar.from_week)
  const to = weekStamp(bar.to_year, bar.to_week)
  if (to < stamps[0] || from > stamps[stamps.length - 1]) return null
  let start = from < stamps[0] ? 0 : stamps.findIndex((stamp) => stamp >= from)
  let end = stamps.length - 1
  while (end >= 0 && stamps[end] > to) end -= 1
  if (start < 0 || end < start) return null
  return { start, end }
}

function barText(bar: FieldTrialBar, t: Translate) {
  const status = displayStatus(bar.status, t)
  if (!bar.count) return status
  const noun = bar.count === 1 ? t('fieldTrials.game', 'game') : t('fieldTrials.games', 'games')
  return t('fieldTrials.barCount', '{status} ({count})', { status, count: `${bar.count} ${noun}` })
}

function emptyGame(market: { jurisdictionId: number; marketName: string; partnerId?: number; venueId?: number }): GameDraft {
  return {
    id: 0,
    jurisdictionId: market.jurisdictionId,
    partnerId: market.partnerId ?? '',
    venueId: market.venueId ?? '',
    conceptId: '',
    gameId: '',
    cabinetId: '',
    machineCount: '',
    trialDate: '',
    generalStatus: '',
    marsStatus: '',
    statusUpdate: '',
    marsUpdate: '',
    info: '',
    remarks: '',
    marketName: market.marketName,
    tab: 'game',
  }
}

export default function FieldTrialsPage() {
  const { locale, t } = useI18n()
  const { navigate } = useAppPath()
  const [tree, setTree] = useState<FieldTrialTree | null>(null)
  const [from, setFrom] = useState<string | undefined>(undefined)
  const [until, setUntil] = useState<string | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rangeError, setRangeError] = useState('')
  const [partnersByMarket, setPartnersByMarket] = useState<Record<number, FieldTrialPartner[]>>({})
  const [openMarkets, setOpenMarkets] = useState<number[]>([])
  const [openPartners, setOpenPartners] = useState<string[]>([])
  const [openVenues, setOpenVenues] = useState<number[]>([])
  const [loadingMarket, setLoadingMarket] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [segment, setSegment] = useState<'all' | 'land-based' | 'online'>('all')
  const [onlyTrials, setOnlyTrials] = useState(false)
  const [filtersAnchor, setFiltersAnchor] = useState<HTMLElement | null>(null)
  const [failed, setFailed] = useState('')
  const [game, setGame] = useState<GameDraft | null>(null)
  const [venueCreate, setVenueCreate] = useState<VenueCreate | null>(null)
  const [venueSchema, setVenueSchema] = useState<TableViewSchema | null>(null)
  const [options, setOptions] = useState<FieldTrialOptions | null>(null)
  const [history, setHistory] = useState<FieldTrialRevision[]>([])
  const [media, setMedia] = useState<Array<FieldTrialMedia & { url?: string }>>([])
  const [pending, setPending] = useState<PendingMedia[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.title = `${t('pages.fieldTrials', 'Field Trials')} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [t])

  const loadTree = useCallback((weekFrom?: string, rangeEnd?: string | null) => {
    setFailed('')
    setRangeError('')
    const nextUntil = rangeEnd || undefined
    return getFieldTrials(weekFrom, nextUntil)
      .then((payload) => {
        setTree(payload)
        setFrom(payload.weeks.from)
        setUntil(nextUntil)
        if (!nextUntil) {
          const list = payload.weeks.weeks.slice(0, VISIBLE_WEEKS)
          setStartDate(list[0]?.start ?? '')
          setEndDate(list[list.length - 1]?.end ?? '')
        }
      })
      .catch((error: unknown) => {
        setFailed(errorMessage(error, t('fieldTrials.failed', 'The field-trial board could not be loaded.')))
      })
  }, [t])

  useEffect(() => {
    void loadTree(undefined)
    // The first board load uses the current calendar week. Week buttons call loadTree directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTree])

  const refreshMarket = useCallback(async (jurisdictionId: number) => {
    const result = await getFieldTrialMarket(jurisdictionId)
    setPartnersByMarket((current) => ({ ...current, [jurisdictionId]: result.partners }))
    const payload = await getFieldTrials(from, until)
    setTree(payload)
  }, [from, until])

  const markets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (tree?.markets ?? []).filter((market) => {
      if (segment !== 'all' && market.segment !== segment) return false
      if (onlyTrials && !market.game_count) return false
      if (statusFilter !== 'all' && !(market.statuses ?? []).some((status) => status.toLowerCase() === statusFilter.toLowerCase())) return false
      if (!needle) return true
      return `${market.name} ${market.iso3166} ${market.segment_name} ${market.search ?? ''}`.toLowerCase().includes(needle)
    })
  }, [onlyTrials, query, segment, statusFilter, tree])

  async function toggleMarket(market: FieldTrialMarket) {
    const open = openMarkets.includes(market.jurisdiction_id)
    setOpenMarkets((current) =>
      open ? current.filter((id) => id !== market.jurisdiction_id) : [...current, market.jurisdiction_id],
    )
    if (open || partnersByMarket[market.jurisdiction_id]) return
    setLoadingMarket(market.jurisdiction_id)
    try {
      const result = await getFieldTrialMarket(market.jurisdiction_id)
      setPartnersByMarket((current) => ({ ...current, [market.jurisdiction_id]: result.partners }))
      const partnerKeys: string[] = []
      const venueIds: number[] = []
      for (const partner of result.partners) {
        const withGames = partner.venues.filter((item) => item.games.length > 0)
        if (withGames.length === 0) continue
        partnerKeys.push(`${market.jurisdiction_id}:${partner.id}`)
        venueIds.push(...withGames.map((item) => item.id))
      }
      if (partnerKeys.length) {
        setOpenPartners((current) => [...new Set([...current, ...partnerKeys])])
      }
      if (venueIds.length) {
        setOpenVenues((current) => [...new Set([...current, ...venueIds])])
      }
    } catch (error) {
      setFailed(errorMessage(error, t('fieldTrials.failed', 'The field-trial board could not be loaded.')))
    } finally {
      setLoadingMarket(null)
    }
  }

  function openVenueDialog(market: FieldTrialMarket, partnerId?: number) {
    setFormError('')
    setVenueCreate({
      jurisdictionId: market.jurisdiction_id,
      partnerId: partnerId ?? null,
      marketName: market.name,
    })
    if (!venueSchema) {
      void getTableView('venues')
        .then(setVenueSchema)
        .catch((error: unknown) => {
          setFormError(errorMessage(error, t('fieldTrials.failed', 'The field-trial board could not be loaded.')))
          setVenueCreate(null)
        })
    }
  }

  function clearPending(items: PendingMedia[] = pending) {
    items.forEach((item) => URL.revokeObjectURL(item.url))
    setPending([])
  }

  function openGameDialog(draft: GameDraft) {
    setFormError('')
    clearPending()
    setGame(draft)
    setHistory([])
    setMedia([])
    void getFieldTrialOptions(draft.jurisdictionId, draft.partnerId || undefined)
      .then(setOptions)
      .catch((error: unknown) => {
        setFormError(errorMessage(error, t('fieldTrials.failed', 'The field-trial board could not be loaded.')))
      })
  }

  function editGame(market: FieldTrialMarket, partnerId: number, item: FieldTrialGame, tab: GameDraft['tab']) {
    openGameDialog({
      id: item.id,
      jurisdictionId: market.jurisdiction_id,
      partnerId,
      venueId: item.venue_id,
      conceptId: item.concept_id,
      gameId: item.game_id,
      cabinetId: item.cabinet_id ?? '',
      machineCount: item.machine_count ? String(item.machine_count) : '',
      trialDate: item.trial_date ?? '',
      generalStatus: item.general_status ?? '',
      marsStatus: item.mars_status ?? '',
      statusUpdate: item.status_update ?? '',
      marsUpdate: item.mars_status_update ?? '',
      info: item.info_data ?? '',
      remarks: item.remarks ?? '',
      marketName: market.name,
      tab,
    })
    if (tab === 'history') void loadHistory(item.id)
    if (tab === 'assets') void loadMedia(item.id)
  }

  async function loadHistory(id: number) {
    const result = await getFieldTrialHistory(id)
    setHistory(result.revisions)
  }

  async function loadMedia(id: number) {
    const result = await getFieldTrialMedia(id)
    const withUrls = await Promise.all(
      result.media.map(async (item) => {
        if (item.kind !== 'picture' && item.kind !== 'video') return item
        const blob = await loadFieldTrialMediaFile(id, item.file)
        return { ...item, url: URL.createObjectURL(blob) }
      }),
    )
    setMedia((current) => {
      current.forEach((item) => item.url && URL.revokeObjectURL(item.url))
      return withUrls
    })
  }

  async function submitGame(event: FormEvent) {
    event.preventDefault()
    if (!game || game.venueId === '' || game.conceptId === '' || game.gameId === '') {
      setFormError(t('fieldTrials.chooseRequired', 'Choose a location and a game.'))
      return
    }
    const machines = Number(game.machineCount)
    if (!Number.isInteger(machines) || machines < 1 || machines > 100000) {
      setFormError(t('fieldTrials.machineCount', 'Number of machines required'))
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const saved = await saveFieldTrialGame({
        id: game.id || undefined,
        venue_id: Number(game.venueId),
        concept_id: Number(game.conceptId),
        game_id: Number(game.gameId),
        cabinet_id: game.cabinetId === '' ? '' : Number(game.cabinetId),
        machine_count: machines,
        trial_date: game.trialDate,
        general_status: game.generalStatus,
        status_update: game.statusUpdate,
        mars_status: game.marsStatus,
        mars_status_update: game.marsUpdate,
        info_data: game.info,
        remarks: game.remarks,
      })
      for (const item of pending) {
        await uploadFieldTrialMedia(saved.game.id, item.file)
        URL.revokeObjectURL(item.url)
      }
      setPending([])
      setOpenPartners((current) => {
        const key = `${game.jurisdictionId}:${game.partnerId}`
        return game.partnerId === '' || current.includes(key) ? current : [...current, key]
      })
      if (typeof saved.game.venue_id === 'number') {
        setOpenVenues((current) => (current.includes(saved.game.venue_id) ? current : [...current, saved.game.venue_id]))
      }
      await refreshMarket(game.jurisdictionId)
      setGame({ ...game, id: saved.game.id, tab: 'assets' })
      await loadMedia(saved.game.id)
      setNotice(game.id ? t('fieldTrials.gameUpdated', 'Game updated.') : t('fieldTrials.gameAdded', 'Game added.'))
    } catch (error) {
      setFormError(errorMessage(error, t('fieldTrials.saveFailed', 'That change could not be saved.')))
    } finally {
      setSaving(false)
    }
  }

  async function removeGame(item?: FieldTrialGame, jurisdictionId?: number) {
    const id = item?.id ?? game?.id
    const marketId = jurisdictionId ?? game?.jurisdictionId
    if (!id || !marketId) return
    const label = item?.game_label ?? t('fieldTrials.game', 'game')
    if (!window.confirm(t('fieldTrials.confirmDelete', 'Remove {label} from this field trial?', { label }))) return
    setDeleting(true)
    setFormError('')
    try {
      await deleteFieldTrialGame(id)
      await refreshMarket(marketId)
      if (!item || game?.id === id) setGame(null)
      setNotice(t('fieldTrials.gameRemoved', 'Game removed.'))
    } catch (error) {
      setFormError(errorMessage(error, t('fieldTrials.saveFailed', 'That change could not be saved.')))
    } finally {
      setDeleting(false)
    }
  }

  function queueFiles(list: FileList | null, kind: 'picture' | 'video') {
    if (!list?.length) return
    const limit = kind === 'video' ? tree?.video_max_bytes ?? 0 : tree?.photo_max_bytes ?? 0
    const accepted: PendingMedia[] = []
    for (const file of Array.from(list)) {
      if (limit && file.size > limit) {
        setFormError(
          kind === 'video'
            ? t('fieldTrials.videoTooBig', 'That video is larger than 150 MB.')
            : t('fieldTrials.pictureTooBig', 'That picture is larger than 15 MB.'),
        )
        continue
      }
      accepted.push({ id: `${Date.now()}-${file.name}-${Math.random()}`, kind, file, url: URL.createObjectURL(file) })
    }
    if (!accepted.length) return
    setPending((current) => [...current, ...accepted])
  }

  async function uploadQueued(id: number, items: PendingMedia[]) {
    setSaving(true)
    setFormError('')
    try {
      for (const item of items) {
        await uploadFieldTrialMedia(id, item.file)
        URL.revokeObjectURL(item.url)
      }
      setPending((current) => current.filter((entry) => !items.some((item) => item.id === entry.id)))
      await loadMedia(id)
    } catch (error) {
      setFormError(errorMessage(error, t('fieldTrials.saveFailed', 'That change could not be saved.')))
    } finally {
      setSaving(false)
    }
  }

  function dropPending(id: string) {
    setPending((current) => {
      const item = current.find((entry) => entry.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return current.filter((entry) => entry.id !== id)
    })
  }

  const weeks = until ? (tree?.weeks.weeks ?? []) : (tree?.weeks.weeks ?? []).slice(0, VISIBLE_WEEKS)
  const summary: FieldTrialSummary = tree?.summary ?? {
    active_trials: 0,
    markets: 0,
    games: 0,
    issues: 0,
  }
  const filtersActive = segment !== 'all' || onlyTrials
  const needle = query.trim().toLowerCase()

  function applyRange(start: string, end: string) {
    setStartDate(start)
    setEndDate(end)
    if (!start || !end) return
    if (end < start) {
      setRangeError(t('fieldTrials.rangeOrder', 'The end date needs to be on or after the start date.'))
      return
    }
    setRangeError('')
    void loadTree(isoWeekKey(start), end)
  }

  function stepRange(direction: -1 | 1) {
    if (!tree) return
    if (!until || weeks.length === 0) {
      void loadTree(direction < 0 ? tree.weeks.prev : tree.weeks.next)
      return
    }
    const delta = weeks.length * 7 * direction
    applyRange(addDays(weeks[0].start, delta), addDays(weeks[weeks.length - 1].end, delta))
  }
  const mayEdit = Boolean(tree?.may_edit)
  const busy = saving || deleting
  const venueInitial = useMemo(() => {
    if (!venueCreate) return undefined
    const values: Record<string, unknown> = {
      jurisdiction_ID: venueCreate.jurisdictionId,
      active: true,
    }
    if (venueCreate.partnerId) values.partner_ID = venueCreate.partnerId
    return values
  }, [venueCreate])
  const gameChoices = options?.games ?? []
  const noVenues = Boolean(game && options && options.venues.length === 0)

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2, pb: 4 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1, color: 'info.main', fontSize: 14 }}>
          <CrumbHome />
          <span>/</span>
          <Box component="span">{t('nav.fieldTrials', 'Field Trials')}</Box>
        </Box>
        <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: 28, md: 36 }, mb: 0.5 }}>
          {t('pages.fieldTrials', 'Field Trials')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
          {t('fieldTrials.intro', 'Track games on trial by market, partner, and venue, week by week.')}
        </Typography>
        {!mayEdit && tree ? (
          <Alert severity="info" sx={{ mb: 1.5 }}>
            {t('fieldTrials.readOnly', 'You can look at Field Trials, but you cannot change them.')}
          </Alert>
        ) : null}

        {tree ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
            <SummaryCard icon={<PlayArrowRoundedIcon />} label={t('fieldTrials.summaryActive', 'Active trials')} value={summary.active_trials} />
            <SummaryCard icon={<PublicOutlinedIcon />} label={t('fieldTrials.summaryMarkets', 'Markets')} value={summary.markets} />
            <SummaryCard icon={<SportsEsportsOutlinedIcon />} label={t('fieldTrials.summaryGames', 'Games on trial')} value={summary.games} />
            <SummaryCard icon={<WarningAmberRoundedIcon />} label={t('fieldTrials.summaryIssues', 'Issues to review')} value={summary.issues} tone="alert" />
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.5 }}>
          <TextField
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('fieldTrials.search', 'Search markets, venues or games…')}
            sx={{ flex: '1 1 16rem', minWidth: 200, bgcolor: 'background.paper' }}
          />
          <TextField
            select
            size="small"
            label={t('fieldTrials.statusFilter', 'Status')}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: 160, bgcolor: 'background.paper' }}
          >
            <MenuItem value="all">{t('fieldTrials.all', 'All')}</MenuItem>
            {(tree?.general_statuses ?? []).map((status) => (
              <MenuItem key={status} value={status}>{displayStatus(status, t)}</MenuItem>
            ))}
          </TextField>
          <TrialRangePicker
            start={startDate}
            end={endDate}
            locale={locale}
            error={rangeError}
            onChange={applyRange}
          />
          <Button variant="outlined" startIcon={<ChevronLeftIcon />} onClick={() => stepRange(-1)} sx={{ bgcolor: 'background.paper' }}>
            {t('fieldTrials.prev', 'Previous')}
          </Button>
          <Button variant="outlined" onClick={() => tree && void loadTree()} sx={{ bgcolor: 'background.paper' }}>
            {t('fieldTrials.today', 'Today')}
          </Button>
          <Button variant="outlined" endIcon={<ChevronRightIcon />} onClick={() => stepRange(1)} sx={{ bgcolor: 'background.paper' }}>
            {t('fieldTrials.next', 'Next')}
          </Button>
          {mayEdit ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`${tableBrowsePath('markets_landbased')}?new=1`)}
              sx={{ bgcolor: merkurColors.pink, fontWeight: 800, '&:hover': { bgcolor: merkurColors.darkPink } }}
            >
              {t('fieldTrials.addMarket', 'Add market')}
            </Button>
          ) : null}
        </Box>
        {tree?.weeks.limited ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {t('fieldTrials.rangeLimit', 'The board shows at most {count} weeks. Scroll sideways to see them.', { count: MAX_RANGE_WEEKS })}
          </Typography>
        ) : null}

        {failed ? <Alert severity="error" sx={{ mb: 2 }}>{failed}</Alert> : null}
        {!tree && !failed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 4 }}>
            <CircularProgress size={22} />
            <Typography>{t('fieldTrials.loading', 'Loading the board…')}</Typography>
          </Box>
        ) : null}

        {tree ? (
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', boxShadow: '0 8px 24px rgba(2,32,82,0.04)' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'center', px: 1.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                {LEGEND.map((status) => (
                  <Box key={status} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, fontSize: 13, color: 'text.secondary' }}>
                    {status === 'issues' ? (
                      <WarningAmberRoundedIcon sx={{ fontSize: 16, color: merkurColors.red }} />
                    ) : (
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: STATUS_STYLE[statusKey(status)].bgcolor }} />
                    )}
                    {displayStatus(status, t)}
                  </Box>
                ))}
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={(event) => setFiltersAnchor(event.currentTarget)}
                  sx={{ ml: 'auto', fontWeight: 700, borderColor: filtersActive ? 'primary.main' : 'divider' }}
                >
                  {t('fieldTrials.filters', 'Filters')}
                </Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
            <Box
              component="table"
              sx={{
                width: `calc(${LABEL_REM}rem + ${Math.max(weeks.length, 1) * WEEK_COL_REM}rem)`,
                borderCollapse: 'separate',
                borderSpacing: 0,
                tableLayout: 'fixed',
              }}
            >
              <Box component="thead">
              <Box
                component="tr"
                sx={{
                  color: '#fff',
                  ...pinnedCells(merkurColors.blue, 3),
                  '& > th': { position: 'sticky', top: 0, bgcolor: merkurColors.blue, zIndex: 2 },
                }}
              >
                <HeaderCell>{t('fieldTrials.tree', 'Market / partner / venue / game')}</HeaderCell>
                <HeaderCell align="center">{t('fieldTrials.machines', 'Machines')}</HeaderCell>
                <HeaderCell align="center">{t('fieldTrials.cabinet', 'Cabinet type')}</HeaderCell>
                <Box component="th" sx={{ p: 0, width: `${Math.max(weeks.length, 1) * WEEK_COL_REM}rem` }}>
                <Box sx={{ display: 'grid', width: `${Math.max(weeks.length, 1) * WEEK_COL_REM}rem`, gridTemplateColumns: `repeat(${Math.max(weeks.length, 1)}, ${WEEK_COL_REM}rem)` }}>
                  {weeks.map((week) => (
                    <Box
                      key={`${week.year}-${week.week}`}
                      sx={{
                        px: 0.5,
                        py: 0.75,
                        textAlign: 'center',
                        borderLeft: '1px solid rgba(255,255,255,0.14)',
                        bgcolor: week.current ? merkurColors.cyan : undefined,
                        fontSize: 12,
                        fontWeight: 800,
                        lineHeight: 1.25,
                      }}
                      title={week.current ? t('fieldTrials.thisWeek', 'This week') : undefined}
                    >
                      {t('fieldTrials.cw', 'CW {week}', { week: week.week })}
                      <Box component="div" sx={{ fontWeight: 500, fontSize: 11 }}>
                        {weekRangeLabel(week, locale)}
                      </Box>
                      <Box component="div" sx={{ fontWeight: 500, fontSize: 11, opacity: 0.85 }}>{week.year}</Box>
                    </Box>
                  ))}
                </Box>
                </Box>
              </Box>
              </Box>

              <Box component="tbody">
              {markets.length === 0 ? (
                <Box component="tr">
                  <Box component="td" colSpan={4} sx={{ p: 2, color: 'text.secondary' }}>
                    {t('fieldTrials.empty', 'No markets match these filters.')}
                  </Box>
                </Box>
              ) : (
                markets.map((market) => (
                  <MarketBlock
                    key={`${market.source}-${market.jurisdiction_id}`}
                    market={market}
                    weeks={weeks}
                    open={openMarkets.includes(market.jurisdiction_id)}
                    loading={loadingMarket === market.jurisdiction_id}
                    partners={partnersByMarket[market.jurisdiction_id]}
                    openPartners={openPartners}
                    openVenues={openVenues}
                    mayEdit={mayEdit}
                    needle={needle}
                    statusFilter={statusFilter}
                    t={t}
                    onToggle={() => void toggleMarket(market)}
                    onTogglePartner={(partnerId) => {
                      const key = `${market.jurisdiction_id}:${partnerId}`
                      setOpenPartners((current) =>
                        current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
                      )
                    }}
                    onToggleVenue={(venueId) => {
                      setOpenVenues((current) =>
                        current.includes(venueId) ? current.filter((item) => item !== venueId) : [...current, venueId],
                      )
                    }}
                    onAddVenue={(partnerId) => openVenueDialog(market, partnerId)}
                    onAddGame={(partnerId, venueId) =>
                      openGameDialog(emptyGame({
                        jurisdictionId: market.jurisdiction_id,
                        marketName: market.name,
                        partnerId,
                        venueId,
                      }))
                    }
                    onEditGame={(partnerId, item, tab) => editGame(market, partnerId, item, tab)}
                  />
                ))
              )}
              </Box>
            </Box>
            </Box>
          </Box>
        ) : null}

        <Popover
          open={Boolean(filtersAnchor)}
          anchorEl={filtersAnchor}
          onClose={() => setFiltersAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, width: 280, display: 'grid', gap: 1.5 }}>
            <TextField
              select
              size="small"
              label={t('fieldTrials.segment', 'Segment')}
              value={segment}
              onChange={(event) => setSegment(event.target.value as typeof segment)}
            >
              <MenuItem value="all">{t('fieldTrials.all', 'All')}</MenuItem>
              <MenuItem value="land-based">{t('fieldTrials.landbased', 'Land-based')}</MenuItem>
              <MenuItem value="online">{t('fieldTrials.online', 'Online')}</MenuItem>
            </TextField>
            <FormControlLabel
              control={<Switch checked={onlyTrials} onChange={(event) => setOnlyTrials(event.target.checked)} />}
              label={t('fieldTrials.onlyTrials', 'Only markets with field-trial games')}
            />
          </Box>
        </Popover>

      </Box>
      <AppFooter />

      <Dialog open={Boolean(game)} onClose={() => { clearPending(); setGame(null) }} fullWidth maxWidth="md">
        <DialogTitle>
          {game?.id
            ? t('fieldTrials.gameTitle', 'Field-trial game')
            : t('fieldTrials.newGame', 'New field-trial game')}
          {game ? ` · ${game.marketName}` : ''}
        </DialogTitle>
        <DialogContent>
          {formError ? <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert> : null}
          <Tabs
            value={game?.tab ?? 'game'}
            onChange={(_event, value: GameDraft['tab']) => {
              if (!game) return
              setGame({ ...game, tab: value })
              if (value === 'history' && game.id) void loadHistory(game.id)
              if (value === 'assets' && game.id) void loadMedia(game.id)
            }}
            sx={{ mb: 2 }}
          >
            <Tab value="game" label={t('fieldTrials.gameTab', 'Game')} />
            <Tab value="assets" label={t('fieldTrials.assets', 'Assets')} disabled={!game?.id} />
            <Tab value="history" label={t('fieldTrials.history', 'History')} disabled={!game?.id} />
          </Tabs>

          {game?.tab === 'game' ? (
            <Box component="form" id="field-trial-game" onSubmit={(event) => void submitGame(event)} sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                select
                label={t('fieldTrials.partnerLabel', 'Partner')}
                value={game.partnerId}
                onChange={(event) => {
                  const partnerId = event.target.value === '' ? '' : Number(event.target.value)
                  setGame({ ...game, partnerId, venueId: '' })
                  void getFieldTrialOptions(game.jurisdictionId, partnerId || undefined).then(setOptions)
                }}
              >
                <MenuItem value="">{t('fieldTrials.choosePartner', 'Choose a partner')}</MenuItem>
                {(options?.partners ?? []).map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                required
                label={t('fieldTrials.location', 'Location')}
                value={game.venueId}
                onChange={(event) => setGame({ ...game, venueId: Number(event.target.value) })}
              >
                <MenuItem value="">{t('fieldTrials.chooseLocation', 'Choose a location')}</MenuItem>
                {(options?.venues ?? []).map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.label || item.name}</MenuItem>
                ))}
              </TextField>
              {noVenues ? (
                <Typography variant="caption" color="warning.main">
                  {t('fieldTrials.noVenuesForGame', 'Add a venue in this market first — location is limited to venues of this market.')}
                </Typography>
              ) : null}
              <TextField
                select
                label={t('fieldTrials.gameSystem', 'Game system')}
                value={game.conceptId}
                onChange={(event) => setGame({
                  ...game,
                  conceptId: event.target.value === '' ? '' : Number(event.target.value),
                  gameId: '',
                })}
              >
                <MenuItem value="">{t('fieldTrials.chooseSystem', 'Choose a game system')}</MenuItem>
                {(options?.concepts ?? []).map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                required
                label={t('fieldTrials.gameLabel', 'Game')}
                value={game.gameId}
                onChange={(event) => {
                  const gameId = event.target.value === '' ? '' : Number(event.target.value)
                  const match = options?.games.find((item) => item.id === gameId)
                  setGame({
                    ...game,
                    gameId,
                    conceptId: match?.concept_id || game.conceptId,
                  })
                }}
              >
                <MenuItem value="">{t('fieldTrials.chooseGame', 'Choose a game')}</MenuItem>
                {gameChoices.map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t('fieldTrials.cabinetType', 'Cabinet type')}
                value={game.cabinetId}
                onChange={(event) => setGame({
                  ...game,
                  cabinetId: event.target.value === '' ? '' : Number(event.target.value),
                })}
              >
                <MenuItem value="">{t('fieldTrials.chooseCabinet', 'Cabinet type (optional)')}</MenuItem>
                {(options?.cabinets ?? []).map((item) => (
                  <MenuItem key={item.id} value={item.id}>{item.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                required
                type="number"
                label={t('fieldTrials.machineCount', 'Number of machines required')}
                value={game.machineCount}
                onChange={(event) => setGame({ ...game, machineCount: event.target.value })}
                slotProps={{ htmlInput: { min: 1, max: 100000 } }}
              />
              <TextField
                type="date"
                label={t('fieldTrials.statusDate', 'Status date')}
                value={game.trialDate}
                onChange={(event) => setGame({ ...game, trialDate: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={t('fieldTrials.statusDateHelp', 'The calendar week for this status. If you update a status, it moves to this date and leaves the old week.')}
              />
              <TextField
                select
                label={t('fieldTrials.generalStatus', 'General status')}
                value={game.generalStatus}
                onChange={(event) => setGame({ ...game, generalStatus: event.target.value })}
              >
                <MenuItem value="">{t('fieldTrials.none', 'None')}</MenuItem>
                {(tree?.general_statuses ?? []).map((status) => (
                  <MenuItem key={status} value={status}>{statusLabel(status, t)}</MenuItem>
                ))}
              </TextField>
              <TextField
                multiline
                minRows={2}
                label={t('fieldTrials.statusUpdate', 'Status update')}
                value={game.statusUpdate}
                onChange={(event) => setGame({ ...game, statusUpdate: event.target.value })}
              />
              <TextField
                select
                label={t('fieldTrials.marsStatus', 'MARS status')}
                value={game.marsStatus}
                onChange={(event) => setGame({ ...game, marsStatus: event.target.value })}
              >
                <MenuItem value="">{t('fieldTrials.none', 'None')}</MenuItem>
                {(tree?.mars_statuses ?? []).map((status) => (
                  <MenuItem key={status} value={status}>{statusLabel(status, t)}</MenuItem>
                ))}
              </TextField>
              <TextField
                multiline
                minRows={2}
                label={t('fieldTrials.marsUpdate', 'MARS status update')}
                value={game.marsUpdate}
                onChange={(event) => setGame({ ...game, marsUpdate: event.target.value })}
              />
              <TextField
                multiline
                minRows={2}
                label={t('fieldTrials.info', 'Info data')}
                value={game.info}
                onChange={(event) => setGame({ ...game, info: event.target.value })}
              />
              <TextField
                multiline
                minRows={2}
                label={t('fieldTrials.remarks', 'Remarks')}
                value={game.remarks}
                onChange={(event) => setGame({ ...game, remarks: event.target.value })}
              />
              <Typography variant="body2" color="text.secondary">
                {t('fieldTrials.picturesHint', 'JPG or PNG, up to 15 MB each.')}
              </Typography>
              <Button variant="outlined" component="label" disabled={!mayEdit || busy}>
                {t('fieldTrials.pictures', 'Pictures')}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(event) => {
                    queueFiles(event.target.files, 'picture')
                    event.target.value = ''
                  }}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {t('fieldTrials.videoHint', 'MP4, up to 150 MB.')}
              </Typography>
              <Button variant="outlined" component="label" disabled={!mayEdit || busy}>
                {t('fieldTrials.video', 'Video')}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="video/mp4"
                  onChange={(event) => {
                    queueFiles(event.target.files, 'video')
                    event.target.value = ''
                  }}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {t('fieldTrials.pendingHint', 'New pictures stay here until you save them. Remove any you do not want.')}
              </Typography>
              <PendingMediaStrip pending={pending} onRemove={dropPending} t={t} />
            </Box>
          ) : null}

          {game && game.tab === 'assets' ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('fieldTrials.pendingHint', 'New pictures stay here until you save them. Remove any you do not want.')}
              </Typography>
              <PendingMediaStrip pending={pending} onRemove={dropPending} t={t} />
              {pending.length > 0 && game.id ? (
                <Button variant="contained" disabled={busy} onClick={() => void uploadQueued(game.id, pending)}>
                  {saving ? t('common.saving', 'Saving…') : t('fieldTrials.savePictures', 'Save pictures')}
                </Button>
              ) : null}
              <Typography variant="body2" color="text.secondary">
                {t('fieldTrials.picturesHint', 'JPG or PNG, up to 15 MB each.')}
              </Typography>
              <Button variant="outlined" component="label" disabled={!mayEdit || busy}>
                {t('fieldTrials.pictures', 'Pictures')}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(event) => {
                    queueFiles(event.target.files, 'picture')
                    event.target.value = ''
                  }}
                />
              </Button>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {media.filter((item) => item.kind === 'picture').map((item) => (
                  <Box key={item.file} sx={{ position: 'relative' }}>
                    {item.url ? <Box component="img" src={item.url} alt="" sx={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 1 }} /> : null}
                    {mayEdit ? (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          if (!game.id) return
                          void deleteFieldTrialMedia(game.id, item.file).then(() => loadMedia(game.id))
                        }}
                      >
                        {t('fieldTrials.remove', 'Remove')}
                      </Button>
                    ) : null}
                  </Box>
                ))}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('fieldTrials.videoHint', 'MP4, up to 150 MB.')}
              </Typography>
              <Button variant="outlined" component="label" disabled={!mayEdit || busy}>
                {t('fieldTrials.video', 'Video')}
                <input
                  hidden
                  multiple
                  type="file"
                  accept="video/mp4"
                  onChange={(event) => {
                    queueFiles(event.target.files, 'video')
                    event.target.value = ''
                  }}
                />
              </Button>
              {media.filter((item) => item.kind === 'video').map((item) => (
                <Box key={item.file}>
                  {item.url ? <Box component="video" src={item.url} controls sx={{ maxWidth: '100%' }} /> : null}
                  {mayEdit ? (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        if (!game.id) return
                        void deleteFieldTrialMedia(game.id, item.file).then(() => loadMedia(game.id))
                      }}
                    >
                      {t('fieldTrials.remove', 'Remove')}
                    </Button>
                  ) : null}
                </Box>
              ))}
            </Box>
          ) : null}

          {game?.tab === 'history' ? (
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {history.length === 0 ? (
                <Typography color="text.secondary">{t('fieldTrials.noHistory', 'There is no history for this item yet.')}</Typography>
              ) : history.map((revision) => (
                <Box component="li" key={revision.revision} sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>
                    {t(`fieldTrials.actions.${revision.action}`, revision.action)}
                    {revision.editor ? ` · ${revision.editor}` : ''}
                    {revision.at ? ` · ${revision.at.slice(0, 16).replace('T', ' ')}` : ''}
                  </Typography>
                  {revision.changes.filter((change) => change.from || change.to).map((change) => (
                    <Typography key={change.field} variant="body2" color="text.secondary">
                      {t(HISTORY_FIELDS[change.field] ?? change.field, change.field)}: {historyValue(change.field, change.from, t)} → {historyValue(change.field, change.to, t)}
                    </Typography>
                  ))}
                </Box>
              ))}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          {game?.id && mayEdit ? (
            <Button color="error" disabled={busy} onClick={() => void removeGame()}>
              {deleting ? t('common.deleting', 'Deleting…') : t('fieldTrials.delete', 'Delete')}
            </Button>
          ) : null}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => { clearPending(); setGame(null) }}>{t('common.close', 'Close')}</Button>
          {game?.tab === 'game' && mayEdit ? (
            <Button type="submit" form="field-trial-game" variant="contained" disabled={busy}>
              {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      {venueCreate && !venueSchema ? (
        <Dialog open onClose={() => setVenueCreate(null)}>
          <DialogContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
            <CircularProgress size={22} />
            <Typography>{t('fieldTrials.loading', 'Loading the board…')}</Typography>
          </DialogContent>
        </Dialog>
      ) : null}
      {venueCreate && venueSchema ? (
        <TableRecordDialog
          open
          table="venues"
          schema={venueSchema}
          recordId={null}
          creating
          initialValues={venueInitial}
          onClose={() => setVenueCreate(null)}
          onSaved={() => undefined}
          onCreated={(id) => {
            const created = venueCreate
            setVenueCreate(null)
            void (async () => {
              setOpenMarkets((current) =>
                current.includes(created.jurisdictionId) ? current : [...current, created.jurisdictionId],
              )
              const result = await getFieldTrialMarket(created.jurisdictionId)
              setPartnersByMarket((current) => ({ ...current, [created.jurisdictionId]: result.partners }))
              const partner = result.partners.find((item) => item.venues.some((venue) => venue.id === id))
              if (partner) {
                const key = `${created.jurisdictionId}:${partner.id}`
                setOpenPartners((current) => (current.includes(key) ? current : [...current, key]))
              }
              await refreshMarket(created.jurisdictionId)
              setNotice(t('fieldTrials.venueAdded', 'Venue added. It is also in the Venues table.'))
            })()
          }}
        />
      ) : null}
      <Snackbar
        open={notice !== ''}
        autoHideDuration={3500}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      </Snackbar>
    </PageBackground>
  )
}

function PendingMediaStrip({
  pending,
  onRemove,
  t,
}: {
  pending: PendingMedia[]
  onRemove: (id: string) => void
  t: (key: string, fallback?: string) => string
}) {
  if (!pending.length) return null
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {pending.map((item) => (
        <Box key={item.id} sx={{ position: 'relative' }}>
          {item.kind === 'picture' ? (
            <Box component="img" src={item.url} alt={item.file.name} sx={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
          ) : (
            <Box component="video" src={item.url} sx={{ width: 160, height: 105, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
          )}
          <Button size="small" color="error" onClick={() => onRemove(item.id)}>
            {t('fieldTrials.remove', 'Remove')}
          </Button>
        </Box>
      ))}
    </Box>
  )
}

function HeaderCell({ children, align = 'left' }: { children: string; align?: 'left' | 'center' }) {
  return (
    <Box component="th" sx={{ px: 0.75, py: 1, fontSize: 12, fontWeight: 800, letterSpacing: 0, textAlign: align, lineHeight: 1.25, whiteSpace: 'normal' }}>
      {children}
    </Box>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  tone = 'info',
}: {
  icon: ReactNode
  label: string
  value: number
  tone?: 'info' | 'alert'
}) {
  const alert = tone === 'alert'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.75, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 24px rgba(2,32,82,0.04)' }}>
      <Box sx={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: alert ? '#fde8ee' : '#e7f2fb', color: alert ? merkurColors.pink : merkurColors.blue, flexShrink: 0 }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 28, lineHeight: 1.15, color: alert ? merkurColors.pink : 'text.primary' }}>{value}</Typography>
      </Box>
    </Box>
  )
}

function matchesTrial(trial: FieldTrialGame, statusFilter: string, needle: string) {
  if (statusFilter !== 'all') {
    const statuses = [trial.general_status, ...(trial.timeline ?? []).map((point) => point.status)]
      .filter((status): status is string => Boolean(status))
      .map((status) => status.toLowerCase())
    if (!statuses.includes(statusFilter.toLowerCase())) return false
  }
  if (!needle) return true
  return `${trial.game_label} ${trial.concept_name} ${trial.cabinet_name ?? ''}`.toLowerCase().includes(needle)
}

function MarketBlock({
  market,
  weeks,
  open,
  loading,
  partners,
  openPartners,
  openVenues,
  mayEdit,
  needle,
  statusFilter,
  t,
  onToggle,
  onTogglePartner,
  onToggleVenue,
  onAddVenue,
  onAddGame,
  onEditGame,
}: {
  market: FieldTrialMarket
  weeks: FieldTrialWeek[]
  open: boolean
  loading: boolean
  partners?: FieldTrialPartner[]
  openPartners: string[]
  openVenues: number[]
  mayEdit: boolean
  needle: string
  statusFilter: string
  t: Translate
  onToggle: () => void
  onTogglePartner: (partnerId: number) => void
  onToggleVenue: (venueId: number) => void
  onAddVenue: (partnerId?: number) => void
  onAddGame: (partnerId: number, venueId: number) => void
  onEditGame: (partnerId: number, game: FieldTrialGame, tab: 'game' | 'assets' | 'history') => void
}) {
  const marketNameHit = !needle || `${market.name} ${market.iso3166} ${market.segment_name}`.toLowerCase().includes(needle)
  const childNeedle = marketNameHit ? '' : needle
  return (
    <>
      <BoardRow tone="market">
        <TreeCell>
          <IconButton onClick={onToggle} open={open} />
          <Box component="span" sx={{ fontSize: 18, lineHeight: 1 }}>{market.flag}</Box>
          <Box component="span" sx={{ fontWeight: 800 }}>{market.name}</Box>
          <Muted>
            {market.partner_count} {market.partner_count === 1 ? t('fieldTrials.partner', 'partner') : t('fieldTrials.partners', 'partners')}
            {' · '}
            {market.venue_count} {market.venue_count === 1 ? t('fieldTrials.venue', 'venue') : t('fieldTrials.venues', 'venues')}
            {' · '}
            {market.game_count} {market.game_count === 1 ? t('fieldTrials.game', 'game') : t('fieldTrials.games', 'games')}
          </Muted>
          {mayEdit ? (
            <Button size="small" onClick={() => onAddVenue()} sx={{ ml: 'auto', flexShrink: 0, fontWeight: 700, textTransform: 'none' }}>
              {t('fieldTrials.addVenue', 'Add venue')}
            </Button>
          ) : null}
        </TreeCell>
        <Dash />
        <Dash />
        <TimelineTrack
          weeks={weeks}
          bars={market.bars ?? []}
          issue={market.issue_count ? { count: market.issue_count, year: market.issue_year ?? null, week: market.issue_week ?? null } : null}
          t={t}
        />
      </BoardRow>
      {open && loading ? <NoteRow weeks={weeks} t={t} text={t('fieldTrials.loadingPartners', 'Loading partners…')} /> : null}
      {open && !loading && partners && partners.length === 0 ? (
        <NoteRow
          weeks={weeks}
          t={t}
          text={mayEdit
            ? `${t('fieldTrials.noPartners', 'No partners in this market yet.')} ${t('fieldTrials.noPartnersEdit', 'Add a venue and choose its partner.')}`
            : t('fieldTrials.noPartners', 'No partners in this market yet.')}
        />
      ) : null}
      {open && partners?.map((partner) => {
        const venues = partner.venues.filter((item) => {
          const games = item.games.filter((trial) => matchesTrial(trial, statusFilter, childNeedle))
          if (statusFilter !== 'all' && games.length === 0) return false
          if (!childNeedle) return true
          if (`${partner.name} ${item.name} ${item.city ?? ''}`.toLowerCase().includes(childNeedle)) return true
          return games.length > 0
        })
        if ((statusFilter !== 'all' || childNeedle) && venues.length === 0 && !`${partner.name}`.toLowerCase().includes(childNeedle)) {
          return null
        }
        const partnerOpen = openPartners.includes(`${market.jurisdiction_id}:${partner.id}`)
        const gameCount = partner.venues.reduce((sum, item) => sum + item.games.length, 0)
        return (
          <Box key={partner.id}>
            <BoardRow tone="partner">
              <TreeCell indent={1}>
                <IconButton onClick={() => onTogglePartner(partner.id)} open={partnerOpen} />
                <Box component="span" sx={{ fontWeight: 700 }}>{partner.name}</Box>
                <Muted>
                  {partner.venues.length} {partner.venues.length === 1 ? t('fieldTrials.venue', 'venue') : t('fieldTrials.venues', 'venues')}
                  {' · '}
                  {gameCount} {gameCount === 1 ? t('fieldTrials.game', 'game') : t('fieldTrials.games', 'games')}
                </Muted>
                {mayEdit ? (
                  <Button size="small" onClick={() => onAddVenue(partner.id)} sx={{ ml: 'auto', flexShrink: 0, fontWeight: 700, textTransform: 'none' }}>
                    {t('fieldTrials.addVenue', 'Add venue')}
                  </Button>
                ) : null}
              </TreeCell>
              <Dash />
              <Dash />
              <TimelineTrack weeks={weeks} bars={[]} t={t} />
            </BoardRow>
            {partnerOpen && partner.venues.length === 0 ? (
              <NoteRow weeks={weeks} t={t} text={t('fieldTrials.noVenues', 'No venues yet for this partner in this market.')} />
            ) : null}
            {partnerOpen && venues.map((item) => {
              const venueOpen = openVenues.includes(item.id)
              const games = item.games.filter((trial) => matchesTrial(trial, statusFilter, childNeedle && !`${item.name} ${item.city ?? ''} ${partner.name}`.toLowerCase().includes(childNeedle) ? childNeedle : ''))
              const cabinets = [...new Set(item.games.map((trial) => trial.cabinet_name).filter((name): name is string => Boolean(name)))]
              const venueName = item.city ? `${item.name} (${item.city})` : item.name
              return (
                <Box key={item.id}>
                  <BoardRow>
                    <TreeCell indent={2}>
                      <IconButton onClick={() => onToggleVenue(item.id)} open={venueOpen} />
                      <Box component="span" sx={{ fontWeight: 700 }}>{venueName}</Box>
                      {mayEdit ? (
                        <Button size="small" onClick={() => onAddGame(partner.id, item.id)} sx={{ ml: 'auto', flexShrink: 0, fontWeight: 700, textTransform: 'none' }}>
                          {t('fieldTrials.addGame', 'Add game')}
                        </Button>
                      ) : null}
                    </TreeCell>
                    <Dash>{item.total_machines ?? ''}</Dash>
                    <Dash>{cabinets.length === 1 ? cabinets[0] : ''}</Dash>
                    <TimelineTrack weeks={weeks} bars={[]} t={t} />
                  </BoardRow>
                  {venueOpen && games.length === 0 ? (
                    <NoteRow weeks={weeks} t={t} text={t('fieldTrials.noGames', 'No field-trial games here yet.')} />
                  ) : null}
                  {venueOpen && games.map((trial) => (
                    <BoardRow key={trial.id} tone="game">
                      <TreeCell indent={3}>
                        <Button title={trial.game_label} sx={{ p: 0, minWidth: 0, fontWeight: 700, textTransform: 'none', justifyContent: 'flex-start' }} onClick={() => onEditGame(partner.id, trial, 'game')}>
                          {trial.concept_name || trial.game_label}
                        </Button>
                      </TreeCell>
                      <Dash>{trial.machine_count ?? ''}</Dash>
                      <Dash>{trial.cabinet_name ?? ''}</Dash>
                      <TimelineTrack weeks={weeks} bars={spansForGame(trial)} issue={gameIssue(trial)} t={t} />
                    </BoardRow>
                  ))}
                </Box>
              )
            })}
          </Box>
        )
      })}
    </>
  )
}

function BoardRow({ children, tone }: { children: ReactNode; tone?: 'market' | 'partner' | 'game' }) {
  const bgcolor = tone === 'partner' ? '#f7f9fc' : '#fff'
  return (
    <Box
      component="tr"
      sx={{
        bgcolor,
        color: 'text.primary',
        ...pinnedCells(bgcolor, 1),
        '& > td': { borderTop: '1px solid #e6ebf2', verticalAlign: 'middle' },
      }}
    >
      {children}
    </Box>
  )
}

function TreeCell({ children, indent = 0 }: { children: ReactNode; indent?: number }) {
  return (
    <Box component="td" sx={{ px: 1, py: 0.5, pl: 1 + indent * 1.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  )
}

function TimelineTrack({
  weeks,
  bars,
  issue,
  t,
}: {
  weeks: FieldTrialWeek[]
  bars: FieldTrialBar[]
  issue?: { count: number; year: number | null; week: number | null } | null
  t: Translate
}) {
  const placed = bars.flatMap((bar) => {
    const clip = clipBar(bar, weeks)
    return clip ? [{ ...bar, ...clip }] : []
  }).sort((a, b) => a.start - b.start || a.end - b.end)
  const laneEnds: number[] = []
  const lanes = placed.map((bar) => {
    let lane = laneEnds.findIndex((end) => end < bar.start)
    if (lane < 0) {
      lane = laneEnds.length
      laneEnds.push(bar.end)
    } else {
      laneEnds[lane] = bar.end
    }
    return { ...bar, lane }
  })
  const issueIndex = issue?.year && issue.week
    ? weeks.findIndex((week) => week.year === issue.year && week.week === issue.week)
    : -1
  const height = Math.max(48, laneEnds.length * 28 + 16)

  const weekWidth = `${Math.max(weeks.length, 1) * WEEK_COL_REM}rem`
  return (
    <Box component="td" sx={{ position: 'relative', p: 0, height, width: weekWidth, minWidth: weekWidth }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))`, position: 'absolute', inset: 0 }}>
        {weeks.map((week) => (
          <Box
            key={`${week.year}-${week.week}`}
            sx={{
              borderLeft: '1px solid #e6ebf2',
              bgcolor: week.current ? 'rgba(0,159,227,0.08)' : undefined,
            }}
          />
        ))}
      </Box>
      {lanes.map((bar) => {
        const style = STATUS_STYLE[statusKey(bar.status)] ?? STATUS_STYLE.default
        const span = bar.end - bar.start + 1
        return (
          <Box
            key={`${bar.status}-${bar.start}-${bar.end}`}
            title={barText(bar, t)}
            sx={{
              position: 'absolute',
              top: 12 + bar.lane * 28,
              left: `calc(${(bar.start / weeks.length) * 100}% + 6px)`,
              width: `calc(${(span / weeks.length) * 100}% - 12px)`,
              height: 22,
              borderRadius: 999,
              px: 1,
              display: 'flex',
              alignItems: 'center',
              fontSize: 11,
              fontWeight: 800,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              zIndex: 1,
              ...style,
            }}
          >
            {barText(bar, t)}
          </Box>
        )
      })}
      {issue && issue.count > 0 && issueIndex >= 0 ? (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: `calc(${((issueIndex + 0.08) / weeks.length) * 100}%)`,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.35,
            height: 22,
            px: 0.8,
            borderRadius: 999,
            bgcolor: '#fde8ee',
            color: merkurColors.red,
            fontSize: 11,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />
          {issue.count === 1
            ? t('fieldTrials.issueBadge', '{count} issue', { count: issue.count })
            : t('fieldTrials.issueBadges', '{count} issues', { count: issue.count })}
        </Box>
      ) : null}
    </Box>
  )
}

function IconButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <Box component="button" type="button" onClick={onClick} aria-expanded={open} sx={{ border: 0, bgcolor: 'transparent', color: 'inherit', p: 0, display: 'inline-flex', cursor: 'pointer' }}>
      {open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
    </Box>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return <Box component="span" sx={{ opacity: 0.75, fontSize: 13 }}>{children}</Box>
}

function Dash({ children }: { children?: ReactNode }) {
  return (
    <Box component="td" sx={{ px: 1, textAlign: 'center', color: 'text.secondary', fontSize: 13 }}>
      {children || '—'}
    </Box>
  )
}

function NoteRow({ weeks, text, t }: { weeks: FieldTrialWeek[]; text: string; t: Translate }) {
  return (
    <BoardRow>
      <TreeCell indent={2}><Muted>{text}</Muted></TreeCell>
      <Dash />
      <Dash />
      <TimelineTrack weeks={weeks} bars={[]} t={t} />
    </BoardRow>
  )
}

function formatDay(value: string, locale: string) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1)
  const pad = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<Date | null> = Array.from({ length: pad }, () => null)
  for (let day = 1; day <= days; day += 1) cells.push(new Date(year, month, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function TrialRangePicker({
  start,
  end,
  locale,
  error,
  onChange,
}: {
  start: string
  end: string
  locale: string
  error: string
  onChange: (start: string, end: string) => void
}) {
  const { t } = useI18n()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [draftStart, setDraftStart] = useState(start)
  const [draftEnd, setDraftEnd] = useState(end)
  const initial = start ? new Date(`${start}T00:00:00`) : new Date()
  const [cursor, setCursor] = useState({ year: initial.getFullYear(), month: initial.getMonth() })

  function open(event: MouseEvent<HTMLElement>) {
    const base = start ? new Date(`${start}T00:00:00`) : new Date()
    setDraftStart(start)
    setDraftEnd(end)
    setCursor({ year: base.getFullYear(), month: base.getMonth() })
    setAnchor(event.currentTarget)
  }

  function pick(day: string) {
    if (!draftStart || draftEnd) {
      setDraftStart(day)
      setDraftEnd('')
      return
    }
    if (day < draftStart) {
      setDraftStart(day)
      return
    }
    setDraftEnd(day)
    onChange(draftStart, day)
    setAnchor(null)
  }

  const cells = monthCells(cursor.year, cursor.month)
  const weekdays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2024, 0, 1 + index)
    return date.toLocaleDateString(locale, { weekday: 'narrow' })
  })
  const label = start && end
    ? `${formatDay(start, locale)} – ${formatDay(end, locale)}`
    : t('fieldTrials.pickRange', 'Select a start date, then an end date')
  const from = draftStart && !draftEnd ? draftStart : draftStart && draftEnd && draftStart < draftEnd ? draftStart : draftEnd
  const to = draftStart && draftEnd ? (draftStart < draftEnd ? draftEnd : draftStart) : ''

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CalendarMonthOutlinedIcon />}
        onClick={open}
        sx={{ bgcolor: 'background.paper', fontWeight: 700, textTransform: 'none', minWidth: 240 }}
      >
        {label}
      </Button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box sx={{ p: 1.5, width: 320 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>
            {draftStart && !draftEnd
              ? t('fieldTrials.endDate', 'End')
              : t('fieldTrials.pickRange', 'Select a start date, then an end date')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box component="button" type="button" aria-label={t('fieldTrials.prev', 'Previous')} onClick={() => setCursor((current) => {
              const date = new Date(current.year, current.month - 1, 1)
              return { year: date.getFullYear(), month: date.getMonth() }
            })} sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'inline-flex', color: 'text.primary' }}>
              <ChevronLeftIcon fontSize="small" />
            </Box>
            <Typography sx={{ flex: 1, textAlign: 'center', fontWeight: 800 }}>
              {new Date(cursor.year, cursor.month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </Typography>
            <Box component="button" type="button" aria-label={t('fieldTrials.next', 'Next')} onClick={() => setCursor((current) => {
              const date = new Date(current.year, current.month + 1, 1)
              return { year: date.getFullYear(), month: date.getMonth() }
            })} sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', display: 'inline-flex', color: 'text.primary' }}>
              <ChevronRightIcon fontSize="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
            {weekdays.map((weekday, index) => (
              <Typography key={`${weekday}-${index}`} sx={{ textAlign: 'center', fontSize: 12, color: 'text.secondary' }}>{weekday}</Typography>
            ))}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
            {cells.map((date, index) => {
              if (!date) return <Box key={`empty-${index}`} />
              const key = dateKey(date)
              const selected = key === draftStart || key === draftEnd
              const inside = Boolean(from && to && key >= from && key <= to)
              return (
                <Box
                  key={key}
                  component="button"
                  type="button"
                  onClick={() => pick(key)}
                  sx={{
                    border: 0,
                    height: 36,
                    borderRadius: selected ? '50%' : 0,
                    cursor: 'pointer',
                    fontWeight: selected ? 800 : 500,
                    bgcolor: selected ? merkurColors.cyan : inside ? 'rgba(0,159,227,0.16)' : 'transparent',
                    color: selected ? '#fff' : 'text.primary',
                  }}
                >
                  {date.getDate()}
                </Box>
              )
            })}
          </Box>
          {error ? <Typography sx={{ mt: 1, color: 'error.main', fontSize: 13 }}>{error}</Typography> : null}
        </Box>
      </Popover>
    </>
  )
}

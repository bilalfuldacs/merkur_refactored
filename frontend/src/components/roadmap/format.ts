import type {
  RoadmapGame,
  RoadmapGameStatusKey,
  RoadmapJurisdictionPreset,
  RoadmapJurisdictionPresetKey,
  RoadmapMilestone,
  RoadmapRow,
} from '@/api'

export type RoadmapStatusFilter = 'released' | 'planned'
export type RoadmapSortBy = RoadmapGameStatusKey | 'nam'

export type RoadmapFilterState = {
  jurisdictionPreset: RoadmapJurisdictionPresetKey | 'all'
  platformId: number | 'all'
  statuses: RoadmapStatusFilter[]
  showSubtitles: boolean
  showDevelopment: boolean
  sortBy: RoadmapSortBy
  sortAscending: boolean
  includeUnknownDates: boolean
  expandAllDetails: boolean
  search: string
  fromKey: string
  toKey: string | null
}

export const emptyRoadmapFilters: RoadmapFilterState = {
  jurisdictionPreset: 'default',
  platformId: 'all',
  statuses: ['released', 'planned'],
  showSubtitles: true,
  showDevelopment: false,
  sortBy: 'tri',
  sortAscending: true,
  includeUnknownDates: false,
  expandAllDetails: false,
  search: '',
  fromKey: '',
  toKey: null,
}

export const GAME_STATUS_KEYS: RoadmapGameStatusKey[] = ['req', 'dev', 'tri', 'rel']

export const GAME_STATUS_COLORS: Record<RoadmapGameStatusKey, { bg: string; fg: string }> = {
  req: { bg: '#ffcc00', fg: '#022052' },
  dev: { bg: '#022052', fg: '#ffffff' },
  tri: { bg: '#009fe3', fg: '#ffffff' },
  rel: { bg: '#a2c617', fg: '#022052' },
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export type RoadmapMonth = {
  key: string
  label: string
  year: number
  month: number
}

export function rowTitle(row: RoadmapRow): string {
  return [row.name, row.name2].filter(Boolean).join(' ')
}

export function milestoneKindAllowed(milestone: RoadmapMilestone, filters: RoadmapFilterState): boolean {
  if (milestone.kind === 'development' && !filters.showDevelopment) {
    return false
  }
  if (milestone.kind === 'development') {
    return true
  }
  if (milestone.kind === 'released') {
    return filters.statuses.includes('released')
  }
  return filters.statuses.includes('planned')
}

function presetIds(
  presets: RoadmapJurisdictionPreset[],
  key: RoadmapJurisdictionPresetKey,
): number[] {
  return presets.find((preset) => preset.key === key)?.ids ?? []
}

export function filterRoadmapRows(
  rows: RoadmapRow[],
  filters: RoadmapFilterState,
  presets: RoadmapJurisdictionPreset[] = [],
): RoadmapRow[] {
  const defaultIds = presetIds(presets, 'default')
  const gliIds = presetIds(presets, 'gli')
  const nongliIds = presetIds(presets, 'nongli')

  return rows
    .filter((row) => filters.platformId === 'all' || row.platform?.ID === filters.platformId)
    .map((row) => ({
      ...row,
      milestones: row.milestones.filter((milestone) => {
        if (filters.fromKey && milestone.month_key < filters.fromKey) {
          return false
        }
        if (filters.toKey && milestone.month_key > filters.toKey) {
          return false
        }
        const jurisdictionId = milestone.jurisdiction?.ID
        if (filters.jurisdictionPreset === 'default' && defaultIds.length > 0) {
          if (!jurisdictionId || !defaultIds.includes(jurisdictionId)) {
            return false
          }
        } else if (filters.jurisdictionPreset === 'gli' && gliIds.length > 0) {
          if (!jurisdictionId || !gliIds.includes(jurisdictionId)) {
            return false
          }
        } else if (filters.jurisdictionPreset === 'nongli' && nongliIds.length > 0) {
          if (!jurisdictionId || !nongliIds.includes(jurisdictionId)) {
            return false
          }
        } else if (filters.jurisdictionPreset === 'specific' && defaultIds.length > 0) {
          if (jurisdictionId && defaultIds.includes(jurisdictionId)) {
            return false
          }
        }
        return milestoneKindAllowed(milestone, filters)
      }),
    }))
    .filter((row) => row.milestones.length > 0)
}

export function filterRoadmapGames(games: RoadmapGame[], filters: RoadmapFilterState): RoadmapGame[] {
  const query = filters.search.trim().toLowerCase()
  return games.filter((game) => {
    if (query && !gameSearchText(game).includes(query)) {
      return false
    }
    if (filters.sortBy === 'nam') {
      return true
    }
    const status = game.statuses[filters.sortBy]
    if (!status?.expected_month) {
      return filters.includeUnknownDates
    }
    if (filters.fromKey && status.expected_month < filters.fromKey) {
      return false
    }
    if (filters.toKey && status.expected_month > filters.toKey) {
      return false
    }
    return true
  })
}

export type RoadmapGameGroup = {
  key: string
  label: string
  games: RoadmapGame[]
}

export function groupRoadmapGames(games: RoadmapGame[], filters: RoadmapFilterState): RoadmapGameGroup[] {
  const sorted = [...games].sort((left, right) => compareGames(left, right, filters))
  if (filters.sortBy === 'nam') {
    return [{ key: 'name', label: 'By name', games: sorted }]
  }

  const groups = new Map<string, RoadmapGame[]>()
  for (const game of sorted) {
    const month = game.statuses[filters.sortBy]?.sort_month ?? 'unknown'
    const list = groups.get(month) ?? []
    list.push(game)
    groups.set(month, list)
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === 'unknown') {
        return 1
      }
      if (right === 'unknown') {
        return -1
      }
      return filters.sortAscending ? left.localeCompare(right) : right.localeCompare(left)
    })
    .map(([key, items]) => ({
      key,
      label: key === 'unknown' ? 'Unknown date' : monthLabel(key),
      games: items,
    }))
}

function compareGames(left: RoadmapGame, right: RoadmapGame, filters: RoadmapFilterState): number {
  const name = left.name.localeCompare(right.name)
  if (filters.sortBy === 'nam') {
    return filters.sortAscending ? name : -name
  }
  const leftMonth = left.statuses[filters.sortBy]?.sort_month
  const rightMonth = right.statuses[filters.sortBy]?.sort_month
  if (leftMonth === rightMonth) {
    return name
  }
  if (!leftMonth) {
    return 1
  }
  if (!rightMonth) {
    return -1
  }
  const byDate = leftMonth.localeCompare(rightMonth)
  return filters.sortAscending ? byDate : -byDate
}

function gameSearchText(game: RoadmapGame): string {
  return [
    game.name,
    game.code,
    game.studio,
    game.platform?.name,
    game.target_market?.name,
    game.target_market?.iso3166,
    game.portfolio_strategy,
    game.resolution,
    game.version_from,
    game.details.theme,
    game.details.base_game_USP,
    game.details.feature_game_USP,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function monthsFromRows(rows: RoadmapRow[]): RoadmapMonth[] {
  const keys = new Set<string>()
  for (const row of rows) {
    for (const milestone of row.milestones) {
      if (milestone.month_key) {
        keys.add(milestone.month_key)
      }
    }
  }
  return monthsFromKeys([...keys])
}

export function monthsFromGames(games: RoadmapGame[]): RoadmapMonth[] {
  const keys = new Set<string>()
  for (const game of games) {
    for (const status of Object.values(game.statuses)) {
      if (status?.expected_month) {
        keys.add(status.expected_month)
      }
      if (status?.sort_month) {
        keys.add(status.sort_month)
      }
    }
  }
  return monthsFromKeys([...keys])
}

function monthsFromKeys(keys: string[]): RoadmapMonth[] {
  const sorted = [...new Set(keys)].sort()
  if (sorted.length === 0) {
    return []
  }
  const first = parseMonthKey(sorted[0])
  const last = parseMonthKey(sorted[sorted.length - 1])
  if (!first || !last) {
    return []
  }
  const months: RoadmapMonth[] = []
  let year = first.year
  let month = first.month
  while (year < last.year || (year === last.year && month <= last.month)) {
    const key = `${year}-${String(month).padStart(2, '0')}`
    months.push({
      key,
      label: `${MONTH_SHORT[month - 1]} ${year}`,
      year,
      month,
    })
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return months
}

export function rangeLabel(months: RoadmapMonth[]): string {
  if (months.length === 0) {
    return 'Dynamic roadmap'
  }
  const first = months[0]
  const last = months[months.length - 1]
  if (first.year === last.year && first.month === last.month) {
    return `Dynamic roadmap ${MONTH_LONG[first.month - 1]} ${first.year}`
  }
  if (first.year === last.year) {
    return `Dynamic roadmap ${MONTH_LONG[first.month - 1]}–${MONTH_LONG[last.month - 1]} ${first.year}`
  }
  return `Dynamic roadmap ${MONTH_LONG[first.month - 1]} ${first.year} – ${MONTH_LONG[last.month - 1]} ${last.year}`
}

export function sliderMonthSpan(dataMonths: RoadmapMonth[]): RoadmapMonth[] {
  const currentYear = new Date().getFullYear()
  let minYear = currentYear - 2
  let maxYear = currentYear + 3
  for (const month of dataMonths) {
    minYear = Math.min(minYear, month.year)
    maxYear = Math.max(maxYear, month.year)
  }
  return monthsFromKeys([`${minYear}-01`, `${maxYear}-12`])
}

export function defaultTimeRange(view: 'versions' | 'games'): { fromKey: string; toKey: string | null } {
  const year = new Date().getFullYear()
  return {
    fromKey: view === 'games' ? `${year - 1}-10` : `${year - 1}-07`,
    toKey: null,
  }
}

export function clampRangeToSpan(
  range: { fromKey: string; toKey: string | null },
  span: RoadmapMonth[],
): { fromKey: string; toKey: string | null } {
  if (span.length === 0) {
    return range
  }
  const first = span[0].key
  const last = span[span.length - 1].key
  const fromKey = range.fromKey < first ? first : range.fromKey > last ? last : range.fromKey
  if (range.toKey == null) {
    return { fromKey, toKey: null }
  }
  const toKey = range.toKey < fromKey ? fromKey : range.toKey > last ? last : range.toKey
  return { fromKey, toKey }
}

export function monthsForGrid(
  span: RoadmapMonth[],
  filters: RoadmapFilterState,
  dataLastKey?: string,
): RoadmapMonth[] {
  if (span.length === 0 || !filters.fromKey) {
    return []
  }
  const to = filters.toKey ?? dataLastKey ?? span[span.length - 1].key
  return span.filter((month) => month.key >= filters.fromKey && month.key <= to)
}

export function monthLabel(key: string): string {
  const parsed = parseMonthKey(key)
  if (!parsed) {
    return key
  }
  return `${MONTH_SHORT[parsed.month - 1]} ${parsed.year}`
}

export function filtersAreDefault(
  filters: RoadmapFilterState,
  defaults?: { fromKey: string; toKey: string | null },
  view: 'versions' | 'games' = 'versions',
): boolean {
  const shared =
    (!defaults || (filters.fromKey === defaults.fromKey && filters.toKey === defaults.toKey)) &&
    filters.platformId === 'all'
  if (view === 'games') {
    return (
      shared &&
      filters.sortBy === 'tri' &&
      filters.sortAscending &&
      !filters.includeUnknownDates &&
      !filters.expandAllDetails &&
      filters.search === ''
    )
  }
  return (
    shared &&
    filters.jurisdictionPreset === 'default' &&
    filters.statuses.includes('released') &&
    filters.statuses.includes('planned') &&
    filters.showSubtitles &&
    !filters.showDevelopment
  )
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const match = key.match(/^(\d{4})-(\d{2})$/)
  if (!match) {
    return null
  }
  return { year: Number(match[1]), month: Number(match[2]) }
}

export function flagLabel(value: boolean | null | undefined): string {
  if (value === true) {
    return 'Yes'
  }
  if (value === false) {
    return 'No'
  }
  return 'Unknown'
}

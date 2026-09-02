import { apiRequest } from './client'

export type MarketReportPerson = {
  ID: number
  initials?: string | null
  firstname?: string | null
  lastname?: string | null
  jobtitle?: string | null
  bcolor?: string | null
  color?: string | null
  role_ID?: number | null
  role?: string | null
}

export type MarketReportChange = {
  at: string | null
  by: string | null
}

export type MarketReportMatrixCell = string | number | null | { color: string }

export type MarketReportMatrix = {
  col_headers: string[]
  row_headers: string[]
  data: MarketReportMatrixCell[][]
}

export type MarketReportSlice = {
  value: number
  color: string
  label: string
}

export type MarketReportProperty = {
  key: string
  label: string
  value: string | null
  in_exec_summary: boolean
}

export type MarketReportCustomer = {
  id: number
  name: string | null
  website: string | null
  total_machines: number | null
  share_of_mfrs: string | null
}

export type MarketReportSite = {
  ID: number
  venue: string
  venue_ID: number | null
  date: string | null
  live: number
  test: number
  planned: number
  perf_label: string | null
  tech_rating: 'red' | 'yellow' | 'green' | null
  comment: string | null
}

export type MarketReportVersion = {
  ID: number
  label: string
  first_installed: string | null
  live: number
  test: number
  planned: number
  records: number
  performance: string | null
  ratings: Record<string, number>
  tech: { red: number; yellow: number; green: number }
  sites: MarketReportSite[]
}

export type MarketReportAvailability = {
  ID: number
  label: string
  priority: string | null
}

export type MarketReportLandbased = {
  id: number | null
  table: string
  kind: 'landbased'
  kpis: {
    total_egms: number | null
    total_venues: number | null
    total_market_revenue: number | null
    merkur_egms: number | null
    floor_share: number | null
    share_growth: number | null
    target_win_rate: number | null
    asp_per_machine: string | null
    replacement_rate: string | null
    openness_to_switch: string | null
  }
  competitors: { matrix: MarketReportMatrix | null; slices: MarketReportSlice[] }
  swot: MarketReportMatrix | null
  top_games: MarketReportMatrix | null
  top_games_comment: string | null
  game_types: MarketReportMatrix | null
  game_types_comment: string | null
  top_cabinets: MarketReportMatrix | null
  key_perf_metrics: MarketReportMatrix | null
  key_perf_metrics_comment: string | null
  mechanics: MarketReportProperty[]
  commercial: MarketReportProperty[]
  players: MarketReportProperty[]
  insights: MarketReportProperty[]
  regulatory: MarketReportProperty[]
  recommendations: MarketReportProperty[]
  notes: string | null
}

export type MarketReportOnline = {
  id: number | null
  table: string
  kind: 'online'
  groups: Array<{ title: string; rows: MarketReportProperty[] }>
  notes: string | null
}

export type MarketReportEmpty = {
  id: null
  table: string
  kind: 'landbased' | 'online'
}

export type MarketReportPayload = {
  generated_at: string
  can_edit: boolean
  access: { allowed: boolean; reason: string | null }
  jurisdiction: {
    id: number
    flag: string | null
    name: string | null
    name_english: string | null
    segment: 'land-based' | 'online' | string
    cluster: string | null
    iso4217: string | null
    currency_name_english: string | null
    authority: { name: string | null; website: string | null } | null
  }
  stakeholders: MarketReportPerson[]
  last_modified: {
    market: MarketReportChange | null
    jurisdiction: MarketReportChange | null
    installations: MarketReportChange | null
    availabilities: MarketReportChange | null
  }
  market: MarketReportLandbased | MarketReportOnline | MarketReportEmpty | null
  key_customers: MarketReportCustomer[]
  installations: {
    totals: { live: number; test: number; planned: number; records: number }
    versions: MarketReportVersion[]
  }
  availabilities: {
    available: MarketReportAvailability[]
    intent: MarketReportAvailability[]
    no_intent: MarketReportAvailability[]
  }
}

export function getMarketReport(jurisdictionId: number): Promise<MarketReportPayload> {
  return apiRequest<MarketReportPayload>(`/people-markets/report?j=${jurisdictionId}`)
}

export function isLandbasedMarket(
  market: MarketReportPayload['market'],
): market is MarketReportLandbased {
  return Boolean(market && market.kind === 'landbased' && market.id)
}

export function isOnlineMarket(market: MarketReportPayload['market']): market is MarketReportOnline {
  return Boolean(market && market.kind === 'online' && market.id)
}

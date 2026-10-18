import { apiFile, apiRequest } from './client'

export type FieldTrialWeek = {
  year: number
  week: number
  start: string
  end: string
  current: boolean
  past: boolean
}

export type FieldTrialWeeks = {
  from: string
  prev: string
  next: string
  today: string
  until?: string | null
  limited?: boolean
  weeks: FieldTrialWeek[]
}

export type FieldTrialBar = {
  status: string
  from_year: number
  from_week: number
  to_year: number
  to_week: number
  count: number
}

export type FieldTrialSummary = {
  active_trials: number
  markets: number
  games: number
  issues: number
}

export type FieldTrialMarket = {
  source: string
  market_id: number
  jurisdiction_id: number
  flag: string
  name: string
  iso3166: string
  segment: string
  segment_name: string
  partner_count: number
  venue_count: number
  game_count: number
  bars?: FieldTrialBar[]
  issue_count?: number
  issue_year?: number | null
  issue_week?: number | null
  statuses?: string[]
  search?: string
}

export type FieldTrialPoint = {
  status: string
  from: string | null
  iso_year: number
  iso_week: number
}

export type FieldTrialGame = {
  id: number
  venue_id: number
  concept_id: number
  concept_name: string
  game_id: number
  game_label: string
  cabinet_id: number | null
  cabinet_name: string | null
  machine_count: number | null
  trial_date: string | null
  mod_date: string | null
  iso_year: number | null
  iso_week: number | null
  general_status: string | null
  status_update: string | null
  mars_status: string | null
  mars_status_update: string | null
  info_data: string | null
  remarks: string | null
  timeline: FieldTrialPoint[]
}

export type FieldTrialVenue = {
  id: number
  name: string
  city: string | null
  total_machines: number | null
  active: boolean
  games: FieldTrialGame[]
}

export type FieldTrialPartner = {
  id: number
  name: string
  active: boolean
  venues: FieldTrialVenue[]
}

export type FieldTrialTree = {
  may_edit: boolean
  weeks: FieldTrialWeeks
  markets: FieldTrialMarket[]
  summary?: FieldTrialSummary
  general_statuses: string[]
  mars_statuses: string[]
  photo_max_bytes: number
  video_max_bytes: number
}

export type FieldTrialOption = {
  id: number
  name?: string
  label?: string
  concept_id?: number
  partner_id?: number | null
}

export type FieldTrialOptions = {
  concepts: FieldTrialOption[]
  games: FieldTrialOption[]
  cabinets: FieldTrialOption[]
  partners: FieldTrialOption[]
  venues: FieldTrialOption[]
  general_statuses: string[]
  mars_statuses: string[]
}

export type FieldTrialHistoryChange = {
  field: string
  from: string | null
  to: string | null
}

export type FieldTrialRevision = {
  revision: number
  action: string
  at: string | null
  editor: string | null
  changes: FieldTrialHistoryChange[]
}

export type FieldTrialMedia = {
  file: string
  name: string
  kind: 'picture' | 'video'
  bytes: number
}

export type FieldTrialGameInput = {
  id?: number
  venue_id: number
  concept_id?: number | ''
  game_id: number
  cabinet_id?: number | ''
  machine_count: number
  trial_date?: string
  general_status?: string
  status_update?: string
  mars_status?: string
  mars_status_update?: string
  info_data?: string
  remarks?: string
}

export function getFieldTrials(from?: string, to?: string) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const query = params.toString()
  return apiRequest<FieldTrialTree>(`/field-trials${query ? `?${query}` : ''}`)
}

export function getFieldTrialMarket(jurisdictionId: number) {
  return apiRequest<{ partners: FieldTrialPartner[] }>(
    `/field-trials/market?jurisdiction_id=${jurisdictionId}`,
  )
}

export function getFieldTrialOptions(jurisdictionId: number, partnerId?: number) {
  const partner = partnerId ? `&partner_id=${partnerId}` : ''
  return apiRequest<FieldTrialOptions>(
    `/field-trials/options?jurisdiction_id=${jurisdictionId}${partner}`,
  )
}

export function saveFieldTrialGame(input: FieldTrialGameInput) {
  return apiRequest<{ game: FieldTrialGame }>('/field-trials/games', {
    method: 'POST',
    body: input,
  })
}

export function deleteFieldTrialGame(id: number) {
  return apiRequest<{ ok: boolean }>(`/field-trials/games/${id}`, { method: 'DELETE' })
}

export function saveFieldTrialVenue(input: {
  jurisdiction_id: number
  partner_id: number
  name: string
  city?: string
  street_address?: string
  province?: string
  postal_code?: string
  total_machines?: string
}) {
  return apiRequest<{ venue: { id: number; name: string } }>('/field-trials/venues', {
    method: 'POST',
    body: input,
  })
}

export function saveFieldTrialPartner(input: {
  jurisdiction_id: number
  partner_id?: number
  name?: string
  website?: string
}) {
  return apiRequest<{ partner: { id: number; name: string } }>('/field-trials/partners', {
    method: 'POST',
    body: input,
  })
}

export function getFieldTrialHistory(id: number) {
  return apiRequest<{ revisions: FieldTrialRevision[] }>(`/field-trials/games/${id}/history`)
}

export function getFieldTrialMedia(id: number) {
  return apiRequest<{ media: FieldTrialMedia[] }>(`/field-trials/games/${id}/media`)
}

export function uploadFieldTrialMedia(id: number, file: File) {
  const body = new FormData()
  body.append('file', file)
  return apiRequest<{ item: FieldTrialMedia }>(`/field-trials/games/${id}/media`, {
    method: 'POST',
    body,
  })
}

export function deleteFieldTrialMedia(id: number, file: string) {
  return apiRequest<{ ok: boolean }>(`/field-trials/games/${id}/media`, {
    method: 'DELETE',
    body: { file },
  })
}

export function loadFieldTrialMediaFile(id: number, file: string) {
  return apiFile(`/field-trials/games/${id}/media-file?f=${encodeURIComponent(file)}`)
}

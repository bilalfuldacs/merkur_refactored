import { apiRequest } from './client'

export type RoadmapView = 'versions' | 'games'
export type RoadmapGameStatusKey = 'req' | 'dev' | 'tri' | 'rel'
export type RoadmapJurisdictionPresetKey = 'default' | 'gli' | 'nongli' | 'specific'

export type RoadmapLookup = {
  ID: number
  name: string | null
  iso3166?: string | null
  color?: string | null
  tint_roadmap?: boolean
}

export type RoadmapPerson = {
  ID: number
  initials: string | null
  firstname: string | null
  lastname: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
}

export type RoadmapMilestone = {
  ID: number
  month_key: string
  date_label: string
  done: boolean
  kind: 'released' | 'planned' | 'development'
  comment: string | null
  status: { ID: number; name: string | null; color: string | null } | null
  jurisdiction: { ID: number; name: string | null; iso3166: string | null } | null
}

export type RoadmapRow = {
  ID: number
  name: string
  name2: string | null
  subtitle: string | null
  platform: RoadmapLookup | null
  milestones: RoadmapMilestone[]
}

export type RoadmapGameStatus = {
  expected_label: string | null
  actual_label: string | null
  expected_month: string | null
  sort_month: string | null
  done: boolean
}

export type RoadmapGame = {
  ID: number
  name: string
  code: string | null
  studio: string | null
  studio_owner: RoadmapPerson | null
  pm_owners: RoadmapPerson[]
  target_market: { ID: number; name: string | null; iso3166: string | null; color: string | null } | null
  portfolio_strategy: string | null
  platform: RoadmapLookup | null
  resolution: string | null
  version_from: string | null
  supports_signage: boolean | null
  details: {
    base_game_USP: string | null
    feature_game_USP: string | null
    IP_licensed: boolean | null
    trademarks: { region: string; value: boolean | null }[]
    theme: string | null
    reels: string | null
    progressive_type: string | null
    cash_on_reels: boolean | null
    hold_and_spin: boolean | null
    feature_in_feature: boolean | null
    num_PP_pots: number | null
    true_persistence: string | null
    estimated_effort: string | null
  }
  statuses: Record<RoadmapGameStatusKey, RoadmapGameStatus | null>
}

export type RoadmapJurisdictionPreset = {
  key: RoadmapJurisdictionPresetKey
  label: string
  ids: number[]
}

export type RoadmapPayload = {
  view: RoadmapView
  can_show_development: boolean
  jurisdiction_presets: RoadmapJurisdictionPreset[]
  rows: RoadmapRow[]
  games: RoadmapGame[]
  game_status_labels: Partial<Record<RoadmapGameStatusKey, string>>
  jurisdictions: RoadmapLookup[]
  platforms: RoadmapLookup[]
}

export function getRoadmap(view: RoadmapView): Promise<RoadmapPayload> {
  const params = view === 'games' ? '?view=games' : ''
  return apiRequest<RoadmapPayload>(`/roadmap${params}`)
}

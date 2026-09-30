import { apiRequest, downloadApiFile } from './client'

function withEvent(path: string): string {
  if (typeof window === 'undefined') {
    return path
  }
  const eventSlug = new URLSearchParams(window.location.search).get('e')
  if (!eventSlug) {
    return path
  }
  const join = path.includes('?') ? '&' : '?'
  return `${path}${join}e=${encodeURIComponent(eventSlug)}`
}

export const ICE_GAME_TYPES = {
  new_product: 'New product',
  mlp: 'MLP',
  sap: 'SAP',
  multigame: 'Multigame',
  cabinet: 'Cabinet',
} as const

export type IceGameType = keyof typeof ICE_GAME_TYPES

export type IcePerson = {
  ID: number
  firstname: string | null
  lastname: string | null
  username: string | null
  name?: string | null
  iceattendent2027?: boolean
  may_manage?: boolean
}

export type IceTeamMember = {
  user_ID: number
  firstname: string | null
  lastname: string | null
  username: string | null
  name?: string | null
}

export type IceCompetitor = {
  ID: number
  name: string
  team_ID: number | null
  team_name?: string | null
  game_count: number
  questionnaire_started?: boolean
  questionnaire_done?: boolean
  evaluation_started?: boolean
  evaluation_done?: boolean
}

export type IceTeamSummary = {
  ID: number
  name: string
}

export type IceTeam = IceTeamSummary & {
  members: IceTeamMember[]
  competitors: IceCompetitor[]
  games: IceGame[]
}

export type IceGame = {
  ID: number
  name: string
  game_type: string | null
  competitor_ID: number
  competitor_name?: string | null
  team_ID?: number | null
  team_name?: string | null
}

export type IceEvent = {
  ID: number
  slug: string
  name: string
}

export type IceEvalProgress = {
  rows: number
  required: number
  complete: boolean
  started: boolean
  label: string
  detail: string
}

export type IceMe = {
  attendant: boolean
  admin: boolean
  scout: boolean
  team: IceTeamSummary | null
  team_members?: string[]
  evaluation_done: boolean
  evaluation_progress?: IceEvalProgress
  questionnaires_started?: number
  questionnaires_done: number
  questionnaires_total: number
  open_questionnaire?: boolean
  extra_questionnaire?: {
    started: boolean
    complete: boolean
    products: number
    bucket_ID: number
  }
  superuser?: boolean
}

export type IceBootstrap = {
  me: IceMe
  competitors: IceCompetitor[]
  all_competitors: IceCompetitor[]
  all_games?: IceGame[]
  game_types: Record<string, string>
  mechanics_options?: Record<string, string>
  theme_worlds?: string[]
  event?: IceEvent
}

export type IceProgressPhoto = {
  id: string
  name: string
  url: string
  kind?: 'image' | 'video'
}

export type IceStandardProduct = {
  category?: string
  competitor_ID?: number | string | null
  competitor_name?: string
  competitor?: string
  progressive_jp?: string
  no_progressives?: string | number
  no_static?: string | number
  functionality?: string[]
  mechanics_description?: string
  no_of_pots?: string | number
  win_lines?: string
  denomination?: string
  bets?: string | number
  theme?: string
  cabinet?: string
  target_market?: string
  usp?: string
  number_of_monitors?: string | number
  monitor_size?: string
  uhd?: string
  video_button_panel?: string
  vbp_functions?: string
}

export type IceMultigameProduct = {
  integrated_jp?: string
  integrated_jp_number?: string | number
  number_of_categories?: string | number
  number_of_games?: string | number
}

export type IceScoutProduct = IceStandardProduct &
  IceMultigameProduct & {
    is_new_product?: boolean
    game_name?: string
    game_ids?: number[]
    photos?: IceProgressPhoto[]
  }

export type IceQuestionnaireSectioned = {
  new?: IceStandardProduct[]
  mlp?: IceStandardProduct[]
  sap?: IceStandardProduct[]
  multigame?: IceMultigameProduct[]
}

export type IceQuestionnaireProducts = IceScoutProduct[]

export type IceQuestionnaireHistory = {
  ID: number
  by: string
  at: string | null
  product_count: number
  products?: IceScoutProduct[]
  is_current?: boolean
}

export type IceQuestionnairePayload = {
  competitor: IceCompetitor
  products: IceQuestionnaireProducts
  games?: IceGame[]
  all_competitors?: IceCompetitor[]
  all_games?: IceGame[]
  game_types?: Record<string, string>
  mechanics_options?: Record<string, string>
  theme_worlds?: string[]
  open?: boolean
  need_competitor_name?: boolean
  force_new_product?: boolean
  team_members?: string[]
  updated_by?: string | null
  updated_at?: string | null
  history?: IceQuestionnaireHistory[]
  started?: boolean
  complete?: boolean
  message?: string
}

export const ICE_MECHANICS_OPTIONS = {
  hold_and_spin: 'Hold & Spin',
  perceived_persistence: 'Perceived Persistence',
  feature_in_feature: 'Feature in Feature',
  cash_collect: 'Cash Collect',
  true_persistence: 'True Persistence',
  combination_persist_hold: 'Second Screen Bonus',
} as const

export const ICE_EVAL_CATEGORIES = {
  mlp: 'MLP',
  sap: 'SAP',
  multigame: 'Multigame',
  cabinet: 'Cabinet',
} as const

export type IceEvalRow = {
  competitor_ID?: number | string | null
  competitor?: string
  game_ID?: number | string | null
  game_name?: string
  is_new_product?: boolean | number
  game_type?: string
  note?: string
  graphic?: string
  sound?: string
  theme?: string
  mechanics?: string
  entertainment?: string
  innovation?: string
  potential?: string
  general?: string
  would_play?: string
}

export type IceEvaluationPayload = {
  scout: boolean
  admin: boolean
  evaluation_done: boolean
  progress?: IceEvalProgress
  assigned_ids: number[]
  competitors: IceCompetitor[]
  games?: IceGame[]
  game_types: Record<string, string>
  eval_categories?: Record<string, string>
  eval_required_rows?: number
  eval_max_rows?: number
  top5: IceEvalRow[]
  event?: IceEvent
}

export type IceAdminStats = {
  attendants: number
  teams: number
  max_teams: number
  members: number
  max_members: number
  competitors: number
  max_competitors: number
  games: number
}

export type IceReminder = {
  user_ID: number
  name: string
  email: string
  valid_email: boolean
  team: string
  questionnaires: { ID: number; name: string; started: boolean }[]
  eval: IceEvalProgress
}

export type IceAdminPayload = {
  message?: string
  stats: IceAdminStats
  users: IcePerson[]
  teams: IceTeam[]
  competitors: IceCompetitor[]
  games: IceGame[]
  game_types: Record<string, string>
  reminders?: IceReminder[]
  event?: IceEvent
}

export function getIce2027(): Promise<IceBootstrap> {
  return apiRequest<IceBootstrap>(withEvent('/ice2027'))
}

export function getIceQuestionnaire(competitorId: number): Promise<IceQuestionnairePayload> {
  return apiRequest<IceQuestionnairePayload>(withEvent(`/ice2027/questionnaire/${competitorId}`))
}

export function getIceOpenQuestionnaire(): Promise<IceQuestionnairePayload> {
  return apiRequest<IceQuestionnairePayload>(withEvent('/ice2027/questionnaire/open'))
}

export function saveIceQuestionnaire(
  competitorId: number,
  products: IceQuestionnaireProducts,
): Promise<IceQuestionnairePayload & { message: string }> {
  return apiRequest<IceQuestionnairePayload & { message: string }>(withEvent(`/ice2027/questionnaire/${competitorId}`), {
    method: 'PUT',
    body: { products },
  })
}

export function saveIceOpenQuestionnaire(
  products: IceQuestionnaireProducts,
): Promise<IceQuestionnairePayload & { message: string }> {
  return apiRequest<IceQuestionnairePayload & { message: string }>(withEvent('/ice2027/questionnaire/open'), {
    method: 'PUT',
    body: { products },
  })
}

export function uploadIcePhoto(competitorId: number, file: File): Promise<{ ok: boolean; photo: IceProgressPhoto }> {
  const body = new FormData()
  body.append('competitor_ID', String(competitorId))
  body.append('photo', file)
  return apiRequest<{ ok: boolean; photo: IceProgressPhoto }>(withEvent('/ice2027/photo'), {
    method: 'POST',
    body,
  })
}

export function deleteIcePhoto(competitorId: number, fileId: string): Promise<{ ok: boolean }> {
  const body = new FormData()
  body.append('competitor_ID', String(competitorId))
  body.append('f', fileId)
  return apiRequest<{ ok: boolean }>(withEvent('/ice2027/photo/delete'), {
    method: 'POST',
    body,
  })
}

export function getIceEvaluation(competitorId?: number | null): Promise<IceEvaluationPayload> {
  const query = competitorId && competitorId > 0 ? `?c=${competitorId}` : ''
  return apiRequest<IceEvaluationPayload>(withEvent(`/ice2027/evaluation${query}`))
}

export function saveIceEvaluation(top5: IceEvalRow[]): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(withEvent('/ice2027/evaluation'), {
    method: 'PUT',
    body: { top5 },
  })
}

export function getIceAdmin(): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent('/ice2027/admin'))
}

export function setIceAttendant(userId: number, enabled: boolean, mayManage?: boolean): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/attendants/${userId}`), {
    method: 'PATCH',
    body: {
      enabled,
      ...(mayManage === undefined ? {} : { may_manage: mayManage }),
    },
  })
}

export function saveIceAttendants(attendantIds: number[], manageIds: number[]): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent('/ice2027/admin/attendants'), {
    method: 'PUT',
    body: { attendant: attendantIds, manage: manageIds },
  })
}

export function sendIceReminders(): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent('/ice2027/admin/reminders'), {
    method: 'POST',
  })
}

export function renameIceTeam(teamId: number, name: string): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/teams/${teamId}`), {
    method: 'PATCH',
    body: { name },
  })
}

export function addIceTeam(
  name: string,
  member1: number | null,
  member2: number | null,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent('/ice2027/admin/teams'), {
    method: 'POST',
    body: { name, member_1: member1 ?? 0, member_2: member2 ?? 0 },
  })
}

export function saveIceTeam(
  name: string,
  member1: number | null,
  member2: number | null,
): Promise<IceAdminPayload> {
  return addIceTeam(name, member1, member2)
}

export function setIceTeamMembers(
  teamId: number,
  member1: number | null,
  member2: number | null,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/teams/${teamId}/members`), {
    method: 'PUT',
    body: { member_1: member1 ?? 0, member_2: member2 ?? 0 },
  })
}

export function addIceCompetitor(name: string, teamId: number | null): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent('/ice2027/admin/competitors'), {
    method: 'POST',
    body: { name, team_ID: teamId },
  })
}

export function updateIceCompetitor(
  competitorId: number,
  name: string,
  teamId: number | null,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/competitors/${competitorId}`), {
    method: 'PATCH',
    body: { name, team_ID: teamId },
  })
}

export function deleteIceCompetitor(competitorId: number): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/competitors/${competitorId}`), {
    method: 'DELETE',
  })
}

export function addIceGame(
  name: string,
  competitorId: number,
  gameType: string,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent('/ice2027/admin/games'), {
    method: 'POST',
    body: { name, competitor_ID: competitorId, game_type: gameType },
  })
}

export function updateIceGame(
  gameId: number,
  name: string,
  competitorId: number,
  gameType: string,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/games/${gameId}`), {
    method: 'PATCH',
    body: { name, competitor_ID: competitorId, game_type: gameType },
  })
}

export function deleteIceGame(gameId: number): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(withEvent(`/ice2027/admin/games/${gameId}`), {
    method: 'DELETE',
  })
}

export type IceDashboardGame = {
  key: string
  place: number
  game_ID?: number
  game: string
  competitor_ID?: number
  competitor: string
  game_type: string
  game_type_label: string
  is_new_product?: boolean
  ratings: number
  voters: number
  rank1: number
  avg_rank: number
  average: number
  averages: Record<string, number>
  play_yes: number
  play_no: number
  play_unsure: number
  play_pct: number
  has_official?: boolean
  rank_score?: number
  vote_pct?: number
  team_voters?: number
  team_pool?: number
  below_threshold?: boolean
  floor_average?: number
  floor_averages?: Record<string, number>
  floor_ratings?: number
  floor_voters?: number
  floor_play_pct?: number
  photos?: IceProgressPhoto[]
  photo_count?: number
}

export type IceDashboardRating = {
  user_ID: number
  rater: string
  team: string
  source?: 'teams' | 'attendants'
  competitor: string
  game: string
  game_type: string
  scores: Record<string, number>
  average: number
  would_play: string
  vote_pct?: number
  team_voters?: number
  team_pool?: number
}

export type IceDashboardType = {
  type: string
  label: string
  count: number
  ratings: number
  average: number
}

export type IceDashboardPhotoGame = {
  competitor: string
  game: string
  is_new?: boolean
  photos: IceProgressPhoto[]
}

export type IceDashboardView = 'evaluation' | 'questionnaire'

export type IceQuestionnaireDashItem = {
  key: string
  game_ID?: number
  game: string
  competitor_ID?: number
  competitor: string
  game_type: string
  is_new_product?: boolean
  teams: string[]
  filled_by: string[]
  photos?: IceProgressPhoto[]
  photo_count?: number
}

export type IceDashboardFilters = {
  view?: IceDashboardView
  team?: number | ''
  competitor?: number | ''
  type?: string
  play?: string
}

export type IceDashboardPayload = {
  event?: IceEvent
  criteria?: Record<string, string>
  game_types?: Record<string, string>
  teams?: { ID: number; name: string }[]
  competitors?: { ID: number; name: string }[]
  stats: {
    submissions?: number
    ratings?: number
    games?: number
    play_yes?: number
    play_pct?: number
    official_games?: number
    floor_ratings?: number
    floor_people?: number
    team_pool?: number
    attendant_pool?: number
    threshold_pct?: number
    assigned?: number
    new_products?: number
    photos?: number
  }
  winner?: IceDashboardGame | null
  games?: IceDashboardGame[]
  official?: IceDashboardGame[]
  team_pool?: number
  threshold_pct?: number
  by_criterion?: Record<string, IceDashboardGame | null>
  by_type?: IceDashboardType[]
  ratings?: IceDashboardRating[]
  photo_games?: IceDashboardPhotoGame[]
  assigned?: IceQuestionnaireDashItem[]
  new_products?: IceQuestionnaireDashItem[]
  rows?: unknown[]
}

export type IceProgressGameCheck = {
  key?: string
  game_ID?: number
  name: string
  is_new?: boolean
  questionnaire: boolean
  evaluated: boolean
  photos: IceProgressPhoto[]
  photo_count: number
}

export type IceProgressPerson = {
  user_ID: number
  name: string
  team: string
  evaluation: boolean
  eval_started: boolean
  eval_rows: number
  eval_required: number
  eval_at?: string
}

export type IceProgressCompetitor = {
  ID: number
  name: string
  questionnaire: boolean
  catalog: number
  covered: number
  new_products: number
  products: number
  percent: number
  complete: boolean
  started: boolean
  updated_at: string
  updated_by: string
  games: IceProgressGameCheck[]
}

export type IceProgressTeam = {
  ID: number
  name: string
  members: IceProgressPerson[]
  competitors: IceProgressCompetitor[]
  assigned: number
  done: number
  percent: number
  member_count: number
  eval_done: number
  questionnaires_done: number
  questionnaires_total: number
  evaluations_done: number
  evaluations_total: number
}

export type IceProgressGameRow = {
  team: string
  competitor: string
  game: string
  is_new?: boolean
  category: string
  category_label: string
  questionnaire?: boolean
  evaluated: boolean
  photos: IceProgressPhoto[]
  photo_count: number
}

export type IceProgressPayload = {
  event?: IceEvent
  stats: {
    teams: number
    scouts: number
    evaluations_done: number
    evaluations_total: number
    competitors_done: number
    competitors_total: number
    catalog_games: number
    catalog_covered: number
    products: number
    research_pct: number
  }
  teams: IceProgressTeam[]
  people: IceProgressPerson[]
  game_matrix: IceProgressGameRow[]
  new_games: IceProgressGameRow[]
}

export function getIceDashboard(filters: IceDashboardFilters = {}): Promise<IceDashboardPayload> {
  const params = new URLSearchParams()
  if (filters.view && filters.view !== 'evaluation') {
    params.set('view', filters.view)
  }
  if (filters.team) {
    params.set('team', String(filters.team))
  }
  if (filters.competitor) {
    params.set('competitor', String(filters.competitor))
  }
  if (filters.type) {
    params.set('type', filters.type)
  }
  if (filters.play) {
    params.set('play', filters.play)
  }
  const qs = params.toString()
  return apiRequest<IceDashboardPayload>(withEvent(`/ice2027/dashboard${qs ? `?${qs}` : ''}`))
}

export function getIceDashboardGame(gameKey: string): Promise<IceDashboardGameDetail> {
  const params = new URLSearchParams()
  params.set('game', gameKey)
  return apiRequest<IceDashboardGameDetail>(withEvent(`/ice2027/dashboard/game?${params.toString()}`))
}

export async function downloadIceDashboardExport(kind: 'all' | 'questionnaire' | 'evaluation' = 'all'): Promise<void> {
  const fallback =
    kind === 'questionnaire' ? 'scouting-questionnaires.xlsx' : kind === 'evaluation' ? 'scouting-ratings.xlsx' : 'scouting-ratings.xlsx'
  const join = withEvent('/ice2027/dashboard/export').includes('?') ? '&' : '?'
  await downloadApiFile(`${withEvent('/ice2027/dashboard/export')}${join}kind=${encodeURIComponent(kind)}`, fallback)
}

export type IceDashboardGameDetail = {
  event?: IceEvent
  criteria: Record<string, string>
  game: IceDashboardGame
  ratings: IceDashboardRating[]
  team_ratings: IceDashboardRating[]
  floor_ratings: IceDashboardRating[]
  stats: IceDashboardPayload['stats']
  team_pool: number
  threshold_pct: number
}

export function getIceProgress(): Promise<IceProgressPayload> {
  return apiRequest<IceProgressPayload>(withEvent('/ice2027/progress'))
}

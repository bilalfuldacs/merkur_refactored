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
  team_name?: string | null
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
  mechanics_help?: Record<string, string>
  rating_scale?: Record<string, string>
  theme_worlds?: string[]
  video_max_bytes?: number
  event?: IceEvent
}

export type IceProgressPhoto = {
  id: string
  name: string
  url: string
  kind?: 'image' | 'video'
}

/** Eight 1–5 criteria, in form order (same keys as the evaluation rows). */
export const ICE_EVAL_CRITERIA = [
  { key: 'graphic', label: 'Graphic' },
  { key: 'sound', label: 'Sound' },
  { key: 'theme', label: 'Theme' },
  { key: 'mechanics', label: 'Mechanics/Features' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'innovation', label: 'Innovation' },
  { key: 'potential', label: 'Potential' },
  { key: 'general', label: 'General' },
] as const

export type IceEvalCriterion = (typeof ICE_EVAL_CRITERIA)[number]['key']

/** This person's 1–5 scores for one game. Personal: never shared with teammates. */
export type IceProductRating = Partial<Record<IceEvalCriterion, string | number>>

/** Denominations offered on the questionnaire (value → label). */
export const ICE_DENOMINATIONS: Record<string, string> = {
  '0.01': '1¢',
  '0.02': '2¢',
  '0.05': '5¢',
  '0.10': '10¢',
  '0.25': '25¢',
  '0.50': '50¢',
  '1': '1',
  '2': '2',
}

export type IceStandardProduct = {
  category?: string
  competitor_ID?: number | string | null
  competitor_name?: string
  competitor?: string
  progressive_jp?: string
  no_progressives?: string | number
  no_static?: string | number
  progressive_reset?: string
  /** 'show' (default) or 'field' (played live in a casino: market, venue, bets, denominations expected). */
  played_at?: string
  field_market?: string
  field_venue?: string
  functionality?: string[]
  mechanics_description?: string
  no_of_pots?: string | number
  win_lines?: string
  denomination?: string
  denominations?: string[]
  denomination_other?: string
  bets?: string | number | string[]
  bet_other?: string
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
    /** Personal evaluation, kept in the user's own evaluation store and stripped from the shared questionnaire. */
    rating?: IceProductRating
    would_play?: string
    eval_note?: string
    photos?: IceProgressPhoto[]
    draft_key?: string
    is_draft?: boolean
    draft_by?: string
    draft_at?: string
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
  drafts?: IceScoutProduct[]
  games?: IceGame[]
  all_competitors?: IceCompetitor[]
  all_games?: IceGame[]
  game_types?: Record<string, string>
  mechanics_options?: Record<string, string>
  mechanics_help?: Record<string, string>
  theme_worlds?: string[]
  open?: boolean
  need_competitor_name?: boolean
  force_new_product?: boolean
  share_drafts?: boolean
  team_members?: string[]
  updated_by?: string | null
  updated_at?: string | null
  history?: IceQuestionnaireHistory[]
  started?: boolean
  complete?: boolean
  message?: string
}

export type IceMediaLibrary = {
  games: Array<{
    competitor?: string
    game?: string
    photos?: IceProgressPhoto[]
    [key: string]: unknown
  }>
  by_competitor: Record<string, Record<string, IceProgressPhoto[]>>
}

export const ICE_MECHANICS_OPTIONS = {
  hold_and_spin: 'Hold & Spin',
  perceived_persistence: 'Perceived Persistence',
  feature_in_feature: 'Feature in Feature',
  cash_collect: 'Cash Collect',
  true_persistence: 'True Persistence',
  combination_persist_hold: 'Second Screen Bonus',
  freegames: 'Freegames',
  unlocked_reels: 'Unlocked Reels',
  multiplier: 'Multiplier',
  cash_on_reels: 'Cash on Reels',
  respin: 'Respin',
  expanding_wild: 'Expanding Wild',
  sticky_wild: 'Sticky Wild',
  collection: 'Collection / Trail',
  pick_bonus: 'Pick Bonus',
} as const

/** Short shared definitions so teams use the same words for each mechanic. */
export const ICE_MECHANICS_HELP: Record<string, string> = {
  hold_and_spin: 'Symbols lock in place and the remaining positions spin again until the feature ends.',
  perceived_persistence: 'The game looks as if progress carries over, but it is not really stored for a later session.',
  feature_in_feature: 'A feature can start another feature before the first one ends.',
  cash_collect: 'Cash or credit symbols are gathered and paid as a prize.',
  true_persistence: 'Progress is actually stored and continues on a later spin or session.',
  combination_persist_hold: 'The bonus plays on a second screen, separate from the base reels.',
  freegames: 'A set of spins that play without a new wager, often with an extra rule.',
  unlocked_reels: 'One or more reels stay free to spin, or spin on their own, while others are held.',
  multiplier: 'A win is multiplied by a value, which may grow during the feature.',
  cash_on_reels: 'Symbols show credit amounts on the reels that can be collected.',
  respin: 'One or more reels spin again after the first result, without a new game start.',
  expanding_wild: 'A wild grows to cover more positions, often the whole reel.',
  sticky_wild: 'A wild stays in place for the following spins of the feature.',
  collection: 'Something is collected across spins, such as a trail, coins, or a meter, until it triggers.',
  pick_bonus: 'The player chooses hidden prizes instead of spinning.',
}

/** Shared 1–5 scale. 5 is best, 1 is worst. 3 is a typical game. */
export const ICE_RATING_SCALE: Record<number, string> = {
  5: 'We would want this',
  4: 'Above average for this kind of game',
  3: 'Typical for this kind of game',
  2: 'Below average for this kind of game',
  1: 'Well below what we would put on the floor',
}

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
    silent: true,
  })
}

export function saveIceDraft(
  competitorId: number,
  draftKey: string,
  product: IceScoutProduct,
): Promise<{ ok: boolean; draft: IceScoutProduct }> {
  return apiRequest<{ ok: boolean; draft: IceScoutProduct }>(withEvent('/ice2027/draft'), {
    method: 'POST',
    body: {
      competitor_ID: competitorId,
      draft_key: draftKey,
      product,
      action: 'save',
    },
    silent: true,
  })
}

export function deleteIceDraft(competitorId: number, draftKey: string): Promise<{ ok: boolean; deleted: boolean }> {
  return apiRequest<{ ok: boolean; deleted: boolean }>(withEvent('/ice2027/draft'), {
    method: 'POST',
    body: {
      competitor_ID: competitorId,
      draft_key: draftKey,
      action: 'delete',
    },
    silent: true,
  })
}

export function getIceMedia(): Promise<IceMediaLibrary> {
  return apiRequest<IceMediaLibrary>(withEvent('/ice2027/media'))
}

export type IceGameMediaPhoto = IceProgressPhoto & { can_delete?: boolean }

/** Pictures and videos already saved for one competitor + game, from every questionnaire. */
export function getIceGameMedia(params: {
  gameId?: number
  gameName?: string
  competitorName?: string
}): Promise<{ ok: boolean; photos: IceGameMediaPhoto[] }> {
  const query = new URLSearchParams()
  if (params.gameId && params.gameId > 0) {
    query.set('game_ID', String(params.gameId))
  }
  if (params.gameName) {
    query.set('game_name', params.gameName)
  }
  if (params.competitorName) {
    query.set('competitor_name', params.competitorName)
  }
  return apiRequest<{ ok: boolean; photos: IceGameMediaPhoto[] }>(withEvent(`/ice2027/game-media?${query.toString()}`), {
    silent: true,
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

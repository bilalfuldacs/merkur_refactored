import { apiRequest } from './client'

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
  questionnaire_done?: boolean
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

export type IceMe = {
  attendant: boolean
  admin: boolean
  scout: boolean
  team: IceTeamSummary | null
  evaluation_done: boolean
  questionnaires_done: number
  questionnaires_total: number
}

export type IceBootstrap = {
  me: IceMe
  competitors: IceCompetitor[]
  all_competitors: IceCompetitor[]
  game_types: Record<string, string>
}

export type IceStandardProduct = {
  category?: string
  progressive_jp?: string
  no_progressives?: string | number
  no_static?: string | number
  functionality?: string[]
  no_of_pots?: string | number
  win_lines?: string
  denomination?: string
  theme?: string
  cabinet?: string
  target_market?: string
  usp?: string
}

export type IceMultigameProduct = {
  integrated_jp?: string
  integrated_jp_number?: string | number
  number_of_categories?: string | number
  number_of_games?: string | number
}

export type IceQuestionnaireProducts = {
  new?: IceStandardProduct[]
  mlp?: IceStandardProduct[]
  sap?: IceStandardProduct[]
  multigame?: IceMultigameProduct[]
}

export type IceQuestionnairePayload = {
  competitor: IceCompetitor
  products: IceQuestionnaireProducts
}

export type IceEvalRow = {
  competitor_ID?: number | null
  game_type?: string
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
  assigned_ids: number[]
  competitors: IceCompetitor[]
  game_types: Record<string, string>
  top5: IceEvalRow[]
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

export type IceAdminPayload = {
  message?: string
  stats: IceAdminStats
  users: IcePerson[]
  teams: IceTeam[]
  competitors: IceCompetitor[]
  games: IceGame[]
  game_types: Record<string, string>
}

export function getIce2027(): Promise<IceBootstrap> {
  return apiRequest<IceBootstrap>('/ice2027')
}

export function getIceQuestionnaire(competitorId: number): Promise<IceQuestionnairePayload> {
  return apiRequest<IceQuestionnairePayload>(`/ice2027/questionnaire/${competitorId}`)
}

export function saveIceQuestionnaire(
  competitorId: number,
  products: IceQuestionnaireProducts,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/ice2027/questionnaire/${competitorId}`, {
    method: 'PUT',
    body: { products },
  })
}

export function getIceEvaluation(competitorId?: number | null): Promise<IceEvaluationPayload> {
  const query = competitorId && competitorId > 0 ? `?c=${competitorId}` : ''
  return apiRequest<IceEvaluationPayload>(`/ice2027/evaluation${query}`)
}

export function saveIceEvaluation(top5: IceEvalRow[]): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/ice2027/evaluation', {
    method: 'PUT',
    body: { top5 },
  })
}

export function getIceAdmin(): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>('/ice2027/admin')
}

export function setIceAttendant(userId: number, enabled: boolean): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(`/ice2027/admin/attendants/${userId}`, {
    method: 'PATCH',
    body: { enabled },
  })
}

export function renameIceTeam(teamId: number, name: string): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(`/ice2027/admin/teams/${teamId}`, {
    method: 'PATCH',
    body: { name },
  })
}

export function setIceTeamMembers(
  teamId: number,
  member1: number | null,
  member2: number | null,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(`/ice2027/admin/teams/${teamId}/members`, {
    method: 'PUT',
    body: { member_1: member1 ?? 0, member_2: member2 ?? 0 },
  })
}

export function addIceCompetitor(name: string, teamId: number | null): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>('/ice2027/admin/competitors', {
    method: 'POST',
    body: { name, team_ID: teamId },
  })
}

export function updateIceCompetitor(
  competitorId: number,
  name: string,
  teamId: number | null,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(`/ice2027/admin/competitors/${competitorId}`, {
    method: 'PATCH',
    body: { name, team_ID: teamId },
  })
}

export function deleteIceCompetitor(competitorId: number): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(`/ice2027/admin/competitors/${competitorId}`, {
    method: 'DELETE',
  })
}

export function addIceGame(
  name: string,
  competitorId: number,
  gameType: string,
): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>('/ice2027/admin/games', {
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
  return apiRequest<IceAdminPayload>(`/ice2027/admin/games/${gameId}`, {
    method: 'PATCH',
    body: { name, competitor_ID: competitorId, game_type: gameType },
  })
}

export function deleteIceGame(gameId: number): Promise<IceAdminPayload> {
  return apiRequest<IceAdminPayload>(`/ice2027/admin/games/${gameId}`, {
    method: 'DELETE',
  })
}

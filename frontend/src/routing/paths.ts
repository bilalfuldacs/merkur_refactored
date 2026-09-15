import { APP_PATHS } from './AppPathProvider'

export function marketReportPath(jurisdictionId: number): string {
  return `${APP_PATHS.marketReport}?j=${jurisdictionId}`
}

export function productGamesListPath(versionId: number): string {
  return `${APP_PATHS.productGamesList}?v=${versionId}`
}

export function ice2027QuestionnairePath(competitorId: number, eventSlug?: string): string {
  const query = new URLSearchParams()
  query.set('c', String(competitorId))
  if (eventSlug) {
    query.set('e', eventSlug)
  }
  return `${APP_PATHS.ice2027}?${query.toString()}`
}

export function ice2027EvaluationPath(competitorId?: number, eventSlug?: string): string {
  const query = new URLSearchParams()
  if (competitorId && competitorId > 0) {
    query.set('c', String(competitorId))
  }
  if (eventSlug) {
    query.set('e', eventSlug)
  }
  const suffix = query.toString()
  return suffix === '' ? APP_PATHS.ice2027Evaluation : `${APP_PATHS.ice2027Evaluation}?${suffix}`
}

export function ice2027AdminPath(eventSlug?: string): string {
  return eventSlug ? `${APP_PATHS.ice2027Admin}?e=${encodeURIComponent(eventSlug)}` : APP_PATHS.ice2027Admin
}

export function ice2027DashboardPath(eventSlug?: string): string {
  return eventSlug ? `${APP_PATHS.ice2027Dashboard}?e=${encodeURIComponent(eventSlug)}` : APP_PATHS.ice2027Dashboard
}

export function ice2027ProgressPath(eventSlug?: string): string {
  return eventSlug ? `${APP_PATHS.ice2027Progress}?e=${encodeURIComponent(eventSlug)}` : APP_PATHS.ice2027Progress
}

export function ice2027HubPath(eventSlug?: string): string {
  return eventSlug ? `${APP_PATHS.ice2027}?e=${encodeURIComponent(eventSlug)}` : APP_PATHS.ice2027
}

export function eventSlugFromSearch(search: string): string | undefined {
  const slug = new URLSearchParams(search).get('e')?.trim()
  return slug ? slug : undefined
}

export function findPath(query: string): string {
  const trimmed = query.trim()
  return trimmed === '' ? APP_PATHS.find : `${APP_PATHS.find}?q=${encodeURIComponent(trimmed)}`
}

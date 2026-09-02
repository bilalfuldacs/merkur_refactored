import { APP_PATHS } from './AppPathProvider'

export function marketReportPath(jurisdictionId: number): string {
  return `${APP_PATHS.marketReport}?j=${jurisdictionId}`
}

export function productGamesListPath(versionId: number): string {
  return `${APP_PATHS.productGamesList}?v=${versionId}`
}

export function ice2027QuestionnairePath(competitorId: number): string {
  return `${APP_PATHS.ice2027}?c=${competitorId}`
}

export function ice2027EvaluationPath(competitorId?: number): string {
  return competitorId && competitorId > 0
    ? `${APP_PATHS.ice2027Evaluation}?c=${competitorId}`
    : APP_PATHS.ice2027Evaluation
}

export function findPath(query: string): string {
  const trimmed = query.trim()
  return trimmed === '' ? APP_PATHS.find : `${APP_PATHS.find}?q=${encodeURIComponent(trimmed)}`
}

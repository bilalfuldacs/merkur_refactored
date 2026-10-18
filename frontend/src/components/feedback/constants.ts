import type { FeedbackStatus, FeedbackType } from '@/api'
import type { Translate } from '@/i18n'

export const FEEDBACK_TYPES: {
  id: FeedbackType
  labelKey: string
  detailKey: string
}[] = [
  {
    id: 'improvement',
    labelKey: 'feedback.typeImprovement',
    detailKey: 'feedback.typeImprovementDetail',
  },
  {
    id: 'problem',
    labelKey: 'feedback.typeProblem',
    detailKey: 'feedback.typeProblemDetail',
  },
  {
    id: 'idea',
    labelKey: 'feedback.typeIdea',
    detailKey: 'feedback.typeIdeaDetail',
  },
]

export const FEEDBACK_AREAS = [
  'General',
  'Products',
  'Roadmap',
  'People & Markets',
  'Community',
  'Docs',
  'Help',
  'Tables',
  'Home',
] as const

export const DESCRIPTION_MAX = 1200

const STATUS_KEYS: Record<FeedbackStatus, string> = {
  new: 'feedback.statusNew',
  under_review: 'feedback.statusUnderReview',
  planned: 'feedback.statusPlanned',
  in_progress: 'feedback.statusInProgress',
  completed: 'feedback.statusCompleted',
  declined: 'feedback.statusDeclined',
}

const AREA_KEYS: Record<string, string> = {
  General: 'feedback.areaGeneral',
  Products: 'feedback.areaProducts',
  Roadmap: 'feedback.areaRoadmap',
  'People & Markets': 'feedback.areaPeopleMarkets',
  Community: 'feedback.areaCommunity',
  Docs: 'feedback.areaDocs',
  Help: 'feedback.areaHelp',
  Tables: 'feedback.areaTables',
  Home: 'feedback.areaHome',
}

export function feedbackStatusLabel(t: Translate, status: FeedbackStatus): string {
  return t(STATUS_KEYS[status], status)
}

export function feedbackTypeLabel(t: Translate, type: FeedbackType): string {
  const option = FEEDBACK_TYPES.find((item) => item.id === type)
  return option ? t(option.labelKey, type) : type
}

export function feedbackAreaLabel(t: Translate, area: string): string {
  const key = AREA_KEYS[area]
  return key ? t(key, area) : area
}

export function formatSubmittedAt(value: string | null, locale?: string): string {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

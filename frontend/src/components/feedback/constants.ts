import type { FeedbackStatus, FeedbackType } from '@/api'

export const FEEDBACK_TYPES: {
  id: FeedbackType
  label: string
  detail: string
}[] = [
  {
    id: 'improvement',
    label: 'Improvement',
    detail: 'Make an existing feature easier or better.',
  },
  {
    id: 'problem',
    label: 'Problem',
    detail: 'Something is confusing or not working as expected.',
  },
  {
    id: 'idea',
    label: 'New idea',
    detail: 'Suggest a capability that does not exist yet.',
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

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'Submitted',
  under_review: 'Under review',
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Updated',
  declined: 'Declined',
}

export function typeLabel(type: FeedbackType): string {
  return FEEDBACK_TYPES.find((item) => item.id === type)?.label ?? 'Improvement'
}

export function formatSubmittedAt(value: string | null): string {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

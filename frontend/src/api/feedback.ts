import { apiFile, apiRequest } from './client'
import type { Paginated } from './tableRows'

export type FeedbackType = 'improvement' | 'problem' | 'idea'

export type FeedbackStatus =
  | 'new'
  | 'under_review'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'declined'

export type FeedbackPerson = {
  ID: number
  username: string | null
  firstname: string | null
  lastname: string | null
}

export type FeedbackSubmission = {
  id: number
  mod_by: number
  submitter_name: string
  submitter_email: string
  department: string
  feedback_type: string
  type: FeedbackType
  type_label: string
  related_area: string | null
  subject: string
  description: string
  expected_impact: string | null
  priority: string
  has_screenshot: boolean
  reference: string
  status: FeedbackStatus
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: number | null
  submitter?: FeedbackPerson | null
  reviewer?: FeedbackPerson | null
}

export type FeedbackInput = {
  type: FeedbackType
  subject: string
  description: string
  related_area: string
  screenshot?: File | null
}

type Wrapped<T> = T | { data: T }

function unwrapResource<T>(payload: Wrapped<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !('id' in payload)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function getMyFeedback(query: {
  page?: number
  per_page?: number
  q?: string
  status?: string
} = {}): Promise<Paginated<FeedbackSubmission>> {
  const params = new URLSearchParams()
  params.set('mine', '1')
  params.set('page', String(query.page ?? 1))
  params.set('per_page', String(query.per_page ?? 25))
  if (query.q?.trim()) {
    params.set('q', query.q.trim())
  }
  if (query.status) {
    params.set('status', query.status)
  }
  return apiRequest<Paginated<FeedbackSubmission>>(`/feedback-submissions?${params.toString()}`)
}

export async function createFeedback(input: FeedbackInput): Promise<FeedbackSubmission> {
  const form = new FormData()
  form.append('feedback_type', input.type)
  form.append('subject', input.subject)
  form.append('description', input.description)
  form.append('related_area', input.related_area)
  if (input.screenshot) {
    form.append('screenshot', input.screenshot)
  }
  const payload = await apiRequest<Wrapped<FeedbackSubmission>>('/feedback-submissions', {
    method: 'POST',
    body: form,
  })
  return unwrapResource(payload)
}

export function feedbackScreenshotPath(id: number): string {
  return `/feedback-submissions/${id}/screenshot`
}

export async function openFeedbackScreenshot(id: number): Promise<void> {
  const blob = await apiFile(feedbackScreenshotPath(id))
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
}

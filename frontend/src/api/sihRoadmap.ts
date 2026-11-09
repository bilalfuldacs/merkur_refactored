import { apiRequest } from './client'

export type SihRoadmapStatus = 'planned' | 'active' | 'done'

export type SihRoadmapAuthor = {
  ID: number
  name: string
  initials: string | null
  firstname: string | null
  lastname: string | null
  username: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
}

export type SihRoadmapLink = {
  id: number
  label: string
  url: string
}

export type SihRoadmapComment = {
  id: number
  body: string
  created_at: string | null
  author: SihRoadmapAuthor | null
}

export type SihRoadmapAttachment = {
  id: number
  name: string
  mime: string
  size: number
}

export type SihRoadmapMilestone = {
  id: number
  title: string
  description: string | null
  year: number
  quarter: number
  status: SihRoadmapStatus
  is_hidden: boolean
  can_delete: boolean
  updated_at: string | null
  links: SihRoadmapLink[]
  comments: SihRoadmapComment[]
  attachments: SihRoadmapAttachment[]
}

export type SihRoadmapQuarter = {
  year: number
  quarter: number
  current: boolean
  milestones: SihRoadmapMilestone[]
}

export type SihRoadmapBoard = {
  can_edit: boolean
  now: { year: number; quarter: number }
  quarters: SihRoadmapQuarter[]
}

export type SihRoadmapMutation = {
  milestone_id: number | null
  board: SihRoadmapBoard
}

export type SihRoadmapDraft = {
  title: string
  description?: string | null
  year: number
  quarter: number
  status?: SihRoadmapStatus
}

export type SihRoadmapPatch = Partial<{
  title: string
  description: string | null
  year: number
  quarter: number
  status: SihRoadmapStatus
  is_hidden: boolean
}>

export function getSihRoadmap(): Promise<SihRoadmapBoard> {
  return apiRequest('/sih-roadmap')
}

export function createSihRoadmapMilestone(body: SihRoadmapDraft): Promise<SihRoadmapMutation> {
  return apiRequest('/sih-roadmap/milestones', { method: 'POST', body })
}

export function updateSihRoadmapMilestone(id: number, body: SihRoadmapPatch): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}`, { method: 'PATCH', body })
}

export function deleteSihRoadmapMilestone(id: number): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}`, { method: 'DELETE' })
}

export function addSihRoadmapLink(id: number, label: string, url: string): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}/links`, { method: 'POST', body: { label, url } })
}

export function deleteSihRoadmapLink(id: number, linkId: number): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}/links/${linkId}`, { method: 'DELETE' })
}

export function addSihRoadmapComment(id: number, body: string): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}/comments`, { method: 'POST', body: { body } })
}

export function deleteSihRoadmapComment(id: number, commentId: number): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}/comments/${commentId}`, { method: 'DELETE' })
}

export function uploadSihRoadmapAttachment(id: number, file: File): Promise<SihRoadmapMutation> {
  const body = new FormData()
  body.append('file', file)
  return apiRequest(`/sih-roadmap/milestones/${id}/attachments`, { method: 'POST', body })
}

export function deleteSihRoadmapAttachment(id: number, attachmentId: number): Promise<SihRoadmapMutation> {
  return apiRequest(`/sih-roadmap/milestones/${id}/attachments/${attachmentId}`, { method: 'DELETE' })
}

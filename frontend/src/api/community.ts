import { apiRequest } from './client'
import type { Paginated } from './tableRows'

export type CommunityPerson = {
  ID: number
  username: string | null
  firstname: string | null
  lastname: string | null
  initials: string | null
  jobtitle?: string | null
  bcolor?: string | null
  color?: string | null
  role_ID?: number | null
}

export type CommunityComment = {
  ID: number
  mod_date: string | null
  mod_by: number | null
  post_ID: number
  parent_ID: number | null
  note: string | null
  can_edit: boolean
  editor: CommunityPerson | null
  replies?: CommunityComment[]
}

export type CommunityPost = {
  ID: number
  mod_date: string | null
  mod_by: number | null
  table: string | null
  item_ID: number | null
  note: string | null
  num_comments: number
  num_replies: number
  num_likes: number
  num_dislikes: number
  num_bookmarks: number
  my_like?: boolean
  my_dislike?: boolean
  my_bookmark?: boolean
  can_edit: boolean
  editor: CommunityPerson | null
  comments?: CommunityComment[]
  imagePreview?: string | null
}

export type CommunityFeedView = 'timeline' | 'bookmarks' | 'mentions' | 'item'

export type MentionablePerson = {
  ID: number
  initials: string
  firstname: string | null
  lastname: string | null
  name: string
  jobtitle: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
}

export async function getMentionablePeople(): Promise<MentionablePerson[]> {
  const payload = await apiRequest<Wrapped<MentionablePerson[]>>('/community/mentionables')
  const people = unwrapResource(payload)
  return Array.isArray(people) ? people.filter((person) => person.initials) : []
}

type Wrapped<T> = T | { data: T }

function unwrapResource<T>(payload: Wrapped<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !('ID' in payload)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function getCommunityPosts(query: {
  view?: CommunityFeedView
  page?: number
  per_page?: number
  table?: string
  item_ID?: number
}): Promise<Paginated<CommunityPost>> {
  const params = new URLSearchParams()
  params.set('per_page', String(query.per_page ?? 20))
  params.set('page', String(query.page ?? 1))
  if (query.view === 'item' && query.table && query.item_ID) {
    params.set('view', 'item')
    params.set('table', query.table)
    params.set('item_ID', String(query.item_ID))
  } else if (query.view && query.view !== 'timeline') {
    params.set('view', query.view)
  }
  return apiRequest<Paginated<CommunityPost>>(`/community-posts?${params}`)
}

export async function createCommunityPost(
  note: string,
  context?: { table: string; item_ID: number },
): Promise<CommunityPost> {
  const payload = await apiRequest<Wrapped<CommunityPost>>('/community-posts', {
    method: 'POST',
    body: { note, ...(context ?? {}) },
  })
  return unwrapResource(payload)
}

export async function toggleCommunityLike(id: number): Promise<CommunityPost> {
  const payload = await apiRequest<Wrapped<CommunityPost>>(`/community-posts/${id}/like`, { method: 'POST' })
  return unwrapResource(payload)
}

export async function toggleCommunityBookmark(id: number): Promise<CommunityPost> {
  const payload = await apiRequest<Wrapped<CommunityPost>>(`/community-posts/${id}/bookmark`, { method: 'POST' })
  return unwrapResource(payload)
}

export async function updateCommunityPost(id: number, note: string): Promise<CommunityPost> {
  const payload = await apiRequest<Wrapped<CommunityPost>>(`/community-posts/${id}`, {
    method: 'PATCH',
    body: { note },
  })
  return unwrapResource(payload)
}

export async function deleteCommunityPost(id: number): Promise<void> {
  await apiRequest<void>(`/community-posts/${id}`, { method: 'DELETE' })
}

export async function getCommunityLikes(postId: number): Promise<CommunityPerson[]> {
  const payload = await apiRequest<Wrapped<CommunityPerson[]>>(`/community-posts/${postId}/likes`)
  const people = unwrapResource(payload)
  return Array.isArray(people) ? people : []
}

export async function getCommunityComments(postId: number): Promise<CommunityComment[]> {
  const payload = await apiRequest<Wrapped<CommunityComment[]>>(`/community-posts/${postId}/comments`)
  return unwrapResource(payload)
}

export async function createCommunityComment(postId: number, note: string): Promise<CommunityComment> {
  const payload = await apiRequest<Wrapped<CommunityComment>>(`/community-posts/${postId}/comments`, {
    method: 'POST',
    body: { note },
  })
  return unwrapResource(payload)
}

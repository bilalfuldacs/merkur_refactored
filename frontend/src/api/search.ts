import { apiRequest } from './client'

export type FindItem = {
  id: number
  title: string
  subtitle: string | null
}

export type FindCategory = {
  table: string
  title: string
  color: string
  icon: string | null
  count: number
  capped: boolean
  query: string
  items: FindItem[]
}

export type FindPayload = {
  query: string
  total: number
  elapsed: number
  limit: number
  categories: FindCategory[]
}

export function getGlobalSearch(query: string, limit = 100, silent = false): Promise<FindPayload> {
  const params = new URLSearchParams()
  params.set('q', query)
  params.set('limit', String(limit))
  return apiRequest<FindPayload>(`/search?${params}`, { silent })
}

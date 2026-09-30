import { apiRequest } from './client'
import type { Paginated } from './tableRows'

export type MerkuriosityWord = {
  id: number
  word: string
}

type Wrapped<T> = T | { data: T }

function unwrapResource<T>(payload: Wrapped<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !('id' in payload)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export function getMerkuriosityWords(query: {
  page?: number
  per_page?: number
  q?: string
} = {}): Promise<Paginated<MerkuriosityWord>> {
  const params = new URLSearchParams()
  params.set('page', String(query.page ?? 1))
  params.set('per_page', String(query.per_page ?? 100))
  if (query.q?.trim()) {
    params.set('q', query.q.trim())
  }
  return apiRequest<Paginated<MerkuriosityWord>>(`/merkuriosity/words?${params.toString()}`)
}

export async function createMerkuriosityWord(word: string): Promise<MerkuriosityWord> {
  const payload = await apiRequest<Wrapped<MerkuriosityWord>>('/merkuriosity/words', {
    method: 'POST',
    body: { word: word.trim().toLowerCase() },
  })
  return unwrapResource(payload)
}

export async function deleteMerkuriosityWord(id: number): Promise<void> {
  await apiRequest<void>(`/merkuriosity/words/${id}`, { method: 'DELETE' })
}

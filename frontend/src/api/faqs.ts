import { apiRequest } from './client'

export type FaqEditor = {
  ID: number
  username: string | null
  firstname: string | null
  lastname: string | null
}

export type FaqArticle = {
  ID: number
  title: string
  article: string
  order: number | null
  mod_date: string | null
  editor?: FaqEditor | null
}

type Wrapped<T> = T | { data: T }

function unwrapResource<T>(payload: Wrapped<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !Array.isArray(payload)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export async function getHelpFaqs(): Promise<FaqArticle[]> {
  const payload = await apiRequest<Wrapped<FaqArticle[]>>('/help/faqs')
  const faqs = unwrapResource(payload)
  return Array.isArray(faqs) ? faqs : []
}

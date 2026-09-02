import { ApiError, apiFile, apiRequest } from './client'

export type StaticDocCreator = {
  ID: number
  username: string | null
  firstname: string | null
  lastname: string | null
}

export type StaticDoc = {
  id: number
  mod_by: number | null
  title: string
  subfolder: string | null
  description: string | null
  is_complete: boolean | number | string | null
  file: string | null
  file_size: number | null
  upload_date: string | null
  uploaded: boolean
  can_edit: boolean
  can_delete: boolean
  has_pdf: boolean
  has_thumbnail: boolean
  creator?: StaticDocCreator | null
}

export type StaticDocInput = {
  title: string
  subfolder?: string
  description?: string
  is_complete?: boolean | null
  pdf?: File | null
  thumbnail?: File | null
}

type Wrapped<T> = T | { data: T }

function unwrapResource<T>(payload: Wrapped<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !('id' in payload)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function appendDocFields(form: FormData, input: StaticDocInput, forUpdate = false) {
  form.append('title', input.title)
  form.append('subfolder', input.subfolder ?? '')
  form.append('description', input.description ?? '')
  if (input.is_complete === null) {
    form.append('is_complete', '')
  } else if (typeof input.is_complete === 'boolean') {
    form.append('is_complete', input.is_complete ? '1' : '0')
  }
  if (input.pdf) {
    form.append('pdf', input.pdf)
  }
  if (input.thumbnail) {
    form.append('thumbnail', input.thumbnail)
  }
  if (forUpdate) {
    form.append('_method', 'PATCH')
  }
}

export async function getStaticDocs(): Promise<StaticDoc[]> {
  const payload = await apiRequest<Wrapped<StaticDoc[]>>('/static-docs')
  const docs = unwrapResource(payload)
  return Array.isArray(docs) ? docs : []
}

export async function createStaticDoc(input: StaticDocInput): Promise<StaticDoc> {
  if (!input.pdf) {
    throw new ApiError('A PDF file is required.', 422)
  }
  const form = new FormData()
  appendDocFields(form, input)
  const payload = await apiRequest<Wrapped<StaticDoc>>('/static-docs', { method: 'POST', body: form })
  return unwrapResource(payload)
}

export async function updateStaticDoc(id: number, input: StaticDocInput): Promise<StaticDoc> {
  const form = new FormData()
  appendDocFields(form, input, true)
  const payload = await apiRequest<Wrapped<StaticDoc>>(`/static-docs/${id}`, { method: 'POST', body: form })
  return unwrapResource(payload)
}

export async function deleteStaticDoc(id: number): Promise<void> {
  await apiRequest<void>(`/static-docs/${id}`, { method: 'DELETE' })
}

export function staticDocPdfPath(id: number): string {
  return `/static-docs/${id}/pdf`
}

export function staticDocThumbnailPath(id: number): string {
  return `/static-docs/${id}/thumbnail`
}

export async function openStaticDocPdf(id: number): Promise<void> {
  const blob = await apiFile(staticDocPdfPath(id))
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
}

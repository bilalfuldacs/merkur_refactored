import { apiRequest, downloadApiFile, openApiPdf } from './client'

export type Paginated<T> = {
  data: T[]
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
}

export type TableRowsQuery = {
  page?: number
  q?: string
  per_page?: number
  sort_by?: string
  sort_dir?: string
  sort_by2?: string
  sort_dir2?: string
}

export type TableExportFormat = 'csv' | 'xlsx' | 'pdf' | 'print'

export type TableRow = { ID: number } & Record<string, unknown>

export type RelationLookupOption = {
  id: number
  label: string
}

export type TableHistoryEditor = {
  ID: number
  firstname?: string | null
  lastname?: string | null
  initials?: string | null
  bcolor?: string | null
  color?: string | null
  role_ID?: number | null
}

export type TableHistoryChange = {
  key: string
  label: string
  previous: string | null
  current: string | null
}

export type TableHistoryRevision = {
  action: 'insert' | 'update' | 'delete' | string
  revision: number
  modified_at: string | null
  editor: TableHistoryEditor | null
  changes: TableHistoryChange[]
}

export function getTableRows<T extends { ID: number } = TableRow>(
  listPath: string,
  query: TableRowsQuery = {},
): Promise<Paginated<T>> {
  const params = new URLSearchParams()
  params.set('per_page', String(query.per_page ?? 25))
  params.set('page', String(query.page ?? 1))
  if (query.q?.trim()) {
    params.set('q', query.q.trim())
  }
  if (query.sort_by) {
    params.set('sort_by', query.sort_by)
  }
  if (query.sort_dir) {
    params.set('sort_dir', query.sort_dir)
  }
  if (query.sort_by2) {
    params.set('sort_by2', query.sort_by2)
  }
  if (query.sort_dir2) {
    params.set('sort_dir2', query.sort_dir2)
  }

  return apiRequest<Paginated<T>>(`${listPath}?${params.toString()}`)
}

export function getTableRow(table: string, id: number): Promise<TableRow> {
  return apiRequest<{ data: TableRow }>(`/tables/${encodeURIComponent(table)}/rows/${id}`).then(
    (payload) => payload.data,
  )
}

export function createTableRow(table: string, values: Record<string, unknown>): Promise<TableRow> {
  return apiRequest<{ data: TableRow }>(`/tables/${encodeURIComponent(table)}/rows`, {
    method: 'POST',
    body: values,
  }).then((payload) => payload.data)
}

export function updateTableRow(table: string, id: number, values: Record<string, unknown>): Promise<TableRow> {
  return apiRequest<{ data: TableRow }>(`/tables/${encodeURIComponent(table)}/rows/${id}`, {
    method: 'PATCH',
    body: values,
  }).then((payload) => payload.data)
}

export function deleteTableRow(table: string, id: number): Promise<void> {
  return apiRequest(`/tables/${encodeURIComponent(table)}/rows/${id}`, {
    method: 'DELETE',
  })
}

export function getTableLookups(table: string): Promise<Record<string, RelationLookupOption[]>> {
  return apiRequest<{ lookups: Record<string, RelationLookupOption[]> }>(
    `/tables/${encodeURIComponent(table)}/lookups`,
  ).then((payload) => payload.lookups ?? {})
}

export function getTableRowHistory(table: string, id: number): Promise<TableHistoryRevision[]> {
  return apiRequest<{ revisions: TableHistoryRevision[] }>(
    `/tables/${encodeURIComponent(table)}/rows/${id}/history`,
  ).then((payload) => payload.revisions ?? [])
}

export async function exportTable(
  table: string,
  format: TableExportFormat,
  query: TableRowsQuery & { columns?: string[]; preview?: Window | null } = {},
): Promise<void> {
  const params = new URLSearchParams()
  const fileFormat = format === 'print' ? 'pdf' : format
  params.set('format', fileFormat)
  if (format === 'print') {
    params.set('inline', '1')
  }
  if (query.sort_by) {
    params.set('sort_by', query.sort_by)
  }
  if (query.sort_dir) {
    params.set('sort_dir', query.sort_dir)
  }
  if (query.sort_by2) {
    params.set('sort_by2', query.sort_by2)
  }
  if (query.sort_dir2) {
    params.set('sort_dir2', query.sort_dir2)
  }
  if (query.columns?.length) {
    params.set('columns', query.columns.join(','))
  }

  const path = `/tables/${encodeURIComponent(table)}/export?${params.toString()}`
  if (format === 'print') {
    await openApiPdf(path, query.preview)
    return
  }

  await downloadApiFile(path, `${table}.${fileFormat === 'xlsx' ? 'xlsx' : fileFormat === 'pdf' ? 'pdf' : 'csv'}`)
}

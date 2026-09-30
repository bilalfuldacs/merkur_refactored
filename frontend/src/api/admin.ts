import { apiRequest, downloadApiFile } from './client'

export type AdminTrashItem = {
  path: string
  relative: string
  name: string
  deleted_at: string | null
  size: number
}

export type AdminUserActivityRow = {
  user_ID: number
  username: string | null
  firstname: string | null
  lastname: string | null
  active: boolean
  num_logins: number
  last_login: string | null
}

export type AdminTableHistoryRow = {
  table: string
  title: string
  has_history: boolean
  history_table_exists: boolean
}

export async function getAdminAttachmentsTrash(): Promise<AdminTrashItem[]> {
  const payload = await apiRequest<{ items: AdminTrashItem[] }>('/admin/attachments-trash')
  return payload.items
}

export async function purgeAdminAttachmentsTrash(input: {
  paths?: string[]
  all?: boolean
}): Promise<{ purged: number; missing: number }> {
  return apiRequest('/admin/attachments-trash/purge', {
    method: 'POST',
    body: input,
  })
}

export async function getAdminUserActivity(sort: 'last_login' | 'logins' = 'last_login'): Promise<AdminUserActivityRow[]> {
  const payload = await apiRequest<{ users: AdminUserActivityRow[] }>(`/admin/user-activity?sort=${sort}`)
  return payload.users
}

export async function getAdminTableHistory(): Promise<{
  command: string
  tables: AdminTableHistoryRow[]
}> {
  return apiRequest('/admin/table-history')
}

export function downloadFeedbackExport(query: Record<string, string | undefined>): Promise<void> {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })
  const suffix = params.toString()
  return downloadApiFile(
    `/feedback-submissions/export${suffix ? `?${suffix}` : ''}`,
    `merkurflow-feedback-export-${new Date().toISOString().slice(0, 10)}.csv`,
  )
}

import { apiRequest } from './client'

export type AdminRole = {
  ID: number
  name: string
  description: string | null
  needs_subscriptions: boolean | null
  'may_create-update_items': boolean | null
  may_delete_items: boolean | null
  'may_create-update-delete_system-items': boolean | null
  'may_use_tlp-red': boolean | null
  'may_access_unsubscribed-markets': boolean | null
}

export type RoleInput = {
  name: string
  description: string
  needs_subscriptions?: boolean
  'may_create-update_items': boolean
  may_delete_items: boolean
  'may_create-update-delete_system-items': boolean
  'may_use_tlp-red': boolean
  'may_access_unsubscribed-markets': boolean
}

export type RoleUpdate = Partial<RoleInput>

type Wrapped<T> = T | { data: T }

function unwrapResource<T>(payload: Wrapped<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !('ID' in payload)) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function unwrapCollection<T>(payload: Wrapped<T[]> | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data
  }
  return []
}

export async function getRoles(): Promise<AdminRole[]> {
  const payload = await apiRequest<Wrapped<AdminRole[]> | AdminRole[]>('/roles')
  return unwrapCollection(payload)
}

export async function createRole(input: RoleInput): Promise<AdminRole> {
  const payload = await apiRequest<Wrapped<AdminRole>>('/roles', {
    method: 'POST',
    body: input,
  })
  return unwrapResource(payload)
}

export async function updateRole(id: number, input: RoleUpdate): Promise<AdminRole> {
  const payload = await apiRequest<Wrapped<AdminRole>>(`/roles/${id}`, {
    method: 'PUT',
    body: input,
  })
  return unwrapResource(payload)
}

export async function deleteRole(id: number): Promise<void> {
  await apiRequest<void>(`/roles/${id}`, { method: 'DELETE' })
}

import { apiRequest } from './client'
import type { AdminRole } from './roles'

export type AdminUser = {
  ID: number
  initials: string | null
  name_COMBINED: string | null
  active: boolean | null
  lastname: string | null
  firstname: string | null
  prefix: string | null
  username: string
  bcolor: string | null
  color: string | null
  role_ID: number | null
  role?: AdminRole | null
  beta: boolean | null
  jobtitle: string | null
  birthday: string | null
  decolorize_avatars: boolean | null
  appearance: string | null
  notifications: string | null
  last_ads_mail_timestamp: string | null
  iceattendent2027: boolean | null
}

export type UserCreateInput = {
  initials: string
  active: boolean
  lastname: string
  firstname: string
  prefix?: string | null
  username: string
  password: string
  role_ID: number
  beta: boolean
  jobtitle: string
  birthday?: string | null
  iceattendent2027?: boolean
}

export type UserUpdateInput = {
  initials?: string
  active?: boolean
  lastname?: string
  firstname?: string
  prefix?: string | null
  username?: string
  password?: string
  role_ID?: number
  beta?: boolean
  jobtitle?: string
  birthday?: string | null
  iceattendent2027?: boolean
}

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

export async function getUsers(): Promise<AdminUser[]> {
  const payload = await apiRequest<Wrapped<AdminUser[]> | AdminUser[]>('/users')
  return unwrapCollection(payload)
}

export async function createUser(input: UserCreateInput): Promise<AdminUser> {
  const payload = await apiRequest<Wrapped<AdminUser>>('/users', {
    method: 'POST',
    body: input,
  })
  return unwrapResource(payload)
}

export async function updateUser(id: number, input: UserUpdateInput): Promise<AdminUser> {
  const payload = await apiRequest<Wrapped<AdminUser>>(`/users/${id}`, {
    method: 'PUT',
    body: input,
  })
  return unwrapResource(payload)
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest<void>(`/users/${id}`, { method: 'DELETE' })
}

import { apiRequest } from './client'

export type OnlineUser = {
  ID: number
  initials: string | null
  firstname: string | null
  lastname: string | null
  name: string
  bcolor: string | null
  color: string | null
  role_ID: number | null
  last_login_at: string
  recent: boolean
}

export type OnlineUsersResponse = {
  now: string
  users: OnlineUser[]
}

export function getOnlineUsers(): Promise<OnlineUsersResponse> {
  return apiRequest<OnlineUsersResponse>('/online-users', { silent: true })
}

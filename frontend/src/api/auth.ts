import { apiRequest } from './client'


/** this file contains the API endpoints for the authentication system */

/** this type is used to login a user  means user should provide his username and password . it is just like my own variable for user credentials*/
export type LoginRequest = {
  username: string
  password: string
}

export type NotificationPreference = 'off' | 'daily' | 'weekly'

/** this type is used to define the role of a user. it is just like my own variable for user role. either it is superuser or normal user*/
export type AuthRole = {
  ID: number
  name: string
  description?: string | null
  needs_subscriptions?: boolean | null
  'may_create-update_items'?: boolean | null
  may_delete_items?: boolean | null
  'may_create-update-delete_system-items'?: boolean | null
  'may_use_tlp-red'?: boolean | null
  'may_access_unsubscribed-markets'?: boolean | null
}

/** this type is used to define the user of a user. it is just like my own variable for user. it contains the user's ID, username, initials, firstname, lastname, name_COMBINED, role_ID, role, bcolor, color, and decolorize_avatars*/
export type AuthUser = {
  ID: number
  username: string
  initials: string | null
  firstname: string | null
  lastname: string | null
  name_COMBINED: string | null
  role_ID: number | null
  role: AuthRole | null
  jobtitle?: string | null
  bcolor: string | null
  color: string | null
  decolorize_avatars: boolean | null
  notifications?: NotificationPreference | null
  iceattendent2027?: boolean | null
}

export type ProfileStake = {
  jurisdiction_ID: number
  iso3166: string | null
  segment_name: string | null
  flag: string | null
  as_deputy: boolean
}

export type ProfileLogin = {
  when: string | null
  IP: string | null
  agent: string | null
}

export type ProfilePayload = {
  user: AuthUser
  stakes: ProfileStake[]
  logins: ProfileLogin[]
}

export type ProfileUpdate = {
  decolorize_avatars?: boolean
  jobtitle?: string | null
  bcolor?: string
  color?: string
  notifications?: NotificationPreference
}

export type ChangePasswordRequest = {
  current_password: string
  password: string
  password_confirmation: string
}

/** this type is used to define the response of a login request. it is just like my own variable for login response. it contains the token, token_type, and user*/
export type LoginResponse = {
  token: string
  token_type: 'Bearer' | string
  user: AuthUser
}

/** this function is used to login a user. it takes the credentials as an argument and returns a promise that resolves to the login response*/
export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: credentials,
  })
}

export function logout(): Promise<void> {
  return apiRequest<void>('/logout', {
    method: 'POST',
  })
}

export function getMyProfile(): Promise<ProfilePayload> {
  return apiRequest<ProfilePayload>('/me/profile')
}

export async function getMe(): Promise<AuthUser> {
  const payload = await apiRequest<AuthUser | { data: AuthUser }>('/me', { silent: true })
  if (payload && typeof payload === 'object' && 'data' in payload && payload.data && typeof payload.data === 'object' && 'ID' in payload.data) {
    return payload.data
  }
  return payload as AuthUser
}

export function updateMyPreferences(body: ProfileUpdate): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/me', {
    method: 'PATCH',
    body,
  })
}

export function changeMyPassword(body: ChangePasswordRequest): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/me/password', {
    method: 'POST',
    body,
  })
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/password/forgot', {
    method: 'POST',
    body: { email },
  })
}

export function checkPasswordResetToken(token: string): Promise<{ valid: boolean; message?: string }> {
  return apiRequest<{ valid: boolean; message?: string }>(`/password/reset?token=${encodeURIComponent(token)}`)
}

export function completePasswordReset(body: {
  token: string
  password: string
  password_confirmation: string
}): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/password/reset', {
    method: 'POST',
    body,
  })
}

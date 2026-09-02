const tokenKey = 'merkur.accessToken'
const userKey = 'merkur.user'

export function getAccessToken(): string | null {
  return localStorage.getItem(tokenKey)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(tokenKey, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(tokenKey)
}

export function getStoredUser<T>(): T | null {
  const raw = localStorage.getItem(userKey)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function setStoredUser(user: unknown | null): void {
  if (user === null) {
    localStorage.removeItem(userKey)
    return
  }

  localStorage.setItem(userKey, JSON.stringify(user))
}

export function clearSession(): void {
  clearAccessToken()
  setStoredUser(null)
}

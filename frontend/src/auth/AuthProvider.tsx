import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  clearSession,
  getAccessToken,
  getMe,
  getStoredUser,
  login as loginRequest,
  logout as logoutRequest,
  setAccessToken,
  setStoredUser,
  subscribeSessionExpired,
  updateMyPreferences,
} from '@/api'
import type { AuthUser, LoginRequest } from '@/api'
import { clearIceOffline } from '@/offline/iceOffline'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  signIn: (credentials: LoginRequest) => Promise<void>
  signOut: () => Promise<void>
  applyUser: (next: AuthUser) => void
  setDecolorizeAvatars: (value: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitialUser(): AuthUser | null {
  if (!getAccessToken()) {
    return null
  }

  return getStoredUser<AuthUser>()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readInitialUser)

  const applyUser = useCallback((next: AuthUser) => {
    setStoredUser(next)
    setUser(next)
  }, [])

  useEffect(() => {
    return subscribeSessionExpired(() => {
      setUser(null)
    })
  }, [])

  useEffect(() => {
    if (!getAccessToken()) {
      return
    }
    let cancelled = false
    void getMe()
      .then((next) => {
        if (!cancelled) {
          applyUser(next)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [applyUser])

  const signIn = useCallback(async (credentials: LoginRequest) => {
    const result = await loginRequest(credentials)
    await clearIceOffline()
    setAccessToken(result.token)
    setStoredUser(result.user)
    setUser(result.user)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Local session still needs to clear if the API call fails.
    }
    await clearIceOffline()
    clearSession()
    setUser(null)
  }, [])

  const setDecolorizeAvatars = useCallback(async (value: boolean) => {
    setUser((current) => {
      if (!current) {
        return current
      }
      const next = { ...current, decolorize_avatars: value }
      setStoredUser(next)
      return next
    })

    try {
      const result = await updateMyPreferences({ decolorize_avatars: value })
      setStoredUser(result.user)
      setUser(result.user)
    } catch {
      setUser((current) => {
        if (!current) {
          return current
        }
        const next = { ...current, decolorize_avatars: !value }
        setStoredUser(next)
        return next
      })
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      signIn,
      signOut,
      applyUser,
      setDecolorizeAvatars,
    }),
    [user, signIn, signOut, applyUser, setDecolorizeAvatars],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

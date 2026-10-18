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

/**
 * Reads the existing user session synchronously from localStorage on application boot.
 *
 * Why this is needed:
 * 1. Prevents a "Flash of Unauthenticated Content" (FOUC) and avoids accidental
 *    redirects to /login when refreshing protected routes.
 * 2. Ensures the user is only considered logged in if both the bearer token
 *    and the user profile payload are present in browser storage.
 * 3. Passed as a function reference to useState (lazy initialization) so
 *    localStorage and JSON parsing run only once on startup.
 */
function readInitialUser(): AuthUser | null {
  if (!getAccessToken()) {
    return null
  }

  return getStoredUser<AuthUser>()
}

/**
 * Root authentication provider component.
 *
 * Manages the reactive user session state in memory, keeps browser storage in sync,
 * listens for background expiration events, and exposes auth actions (signIn, signOut, etc.)
 * to all descendant components via React Context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readInitialUser)

  /**
   * Partially updates specific fields on the current user (e.g. settings toggles).
   *
   * 1. Safely merges the patch object into current user state.
   * 2. Immediately writes the updated user back to localStorage.
   * 3. Primarily used for optimistic UI updates where changes should reflect instantly.
   */
  const patchUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((current) => {
      if (!current) {
        return current
      }
      const next = { ...current, ...patch }
      setStoredUser(next)
      return next
    })
  }, [])

  /**
   * Replaces the entire user object in both localStorage and React state.
   *
   * Used when receiving a complete AuthUser payload:
   * - Immediately following successful login.
   * - When refreshing profile data from /api/me.
   * - When the user saves full profile changes.
   */
  const applyUser = useCallback((next: AuthUser) => {
    setStoredUser(next)
    setUser(next)
  }, [])

  /**
   * Subscribes to global "session-expired" events dispatched by the API client (api/client.ts).
   *
   * When any API request receives an HTTP 401 Unauthorized response, the API client
   * clears tokens and fires a global event. This effect catches that event, resets user
   * to null, and causes protected route guards to immediately redirect to /login.
   */
  useEffect(() => {
    return subscribeSessionExpired(() => {
      setUser(null)
    })
  }, [])

  /**
   * Background session auditor (Stale-While-Revalidate).
   *
   * On initial mount, if a token exists in localStorage, this effect quietly queries
   * GET /api/me to confirm the session is still valid in the database and refresh any
   * stale user attributes (roles, permissions, names).
   *
   * Uses a `cancelled` cleanup flag to avoid updating state if the component unmounts
   * before the network request finishes.
   */
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

  /**
   * Authenticates the user with username/email and password.
   *
   * Sequence:
   * 1. Calls POST /api/login via loginRequest().
   * 2. Clears IndexedDB offline cache to prevent cross-user data leakage.
   * 3. Persists the Sanctum bearer token to localStorage.
   * 4. Updates both localStorage and React state with the returned user record.
   */
  const signIn = useCallback(async (credentials: LoginRequest) => {
    const result = await loginRequest(credentials)
    await clearIceOffline()
    setAccessToken(result.token)
    applyUser(result.user)
  }, [applyUser])

  /**
   * Terminates the current authenticated session.
   *
   * Sequence:
   * 1. Attempts to notify the backend via POST /api/logout to revoke the database token.
   * 2. Regardless of network success or failure (in finally block):
   *    - Clears IndexedDB offline survey storage.
   *    - Clears token and user JSON from localStorage.
   *    - Sets React user state to null, triggering route protection to redirect to login.
   */
  const signOut = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Local session still needs to clear if the API call fails or network is offline.
    } finally {
      await clearIceOffline()
      clearSession()
      setUser(null)
    }
  }, [])

  /**
   * Updates the user's avatar color preference using an Optimistic UI pattern.
   *
   * 1. Optimistic step: Immediately toggles `decolorize_avatars` in state and localStorage
   *    so the UI reflects the change without any latency.
   * 2. Network step: Sends PATCH /api/me to persist the change in the database.
   * 3. Rollback step: If the backend request fails, reverts the toggle back to its previous state.
   */
  const setDecolorizeAvatars = useCallback(async (value: boolean) => {
    patchUser({ decolorize_avatars: value })

    try {
      const result = await updateMyPreferences({ decolorize_avatars: value })
      applyUser(result.user)
    } catch {
      patchUser({ decolorize_avatars: !value })
    }
  }, [patchUser, applyUser])

  /**
   * Memoizes the context value object so consumer components only re-render
   * when the authenticated user actually changes, not on unrelated parent renders.
   */
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

/**
 * Custom consumer hook to access authentication context.
 *
 * Provides { user, isAuthenticated, signIn, signOut, applyUser, setDecolorizeAvatars }.
 * Throws a descriptive runtime error if invoked outside of <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

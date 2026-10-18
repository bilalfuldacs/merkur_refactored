import { Suspense } from 'react'
import { useAuth } from '@/auth'
import { SearchProvider } from '@/search'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { APP_PATHS } from './paths'
import { RouteFallback } from './RouteError'

/** Login / forgot / reset — redirect away if already signed in. */
export function PublicOnlyLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
    const target =
      from?.pathname && from.pathname !== APP_PATHS.login
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
        : APP_PATHS.home

    return <Navigate to={target} replace />
  }

  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  )
}

/** Authenticated app shell — send guests to login and preserve the intended URL. */
export function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to={APP_PATHS.login} replace state={{ from: location }} />
  }

  return (
    <SearchProvider>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </SearchProvider>
  )
}

import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_PATHS } from './paths'

export type NavigateOptions = {
  replace?: boolean
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname || APP_PATHS.home
}

/**
 * Project navigation helper on top of React Router.
 * Prefer this (or useNavigate/useLocation/useSearchParams) over window.history.
 */
export function useAppPath() {
  const location = useLocation()
  const routerNavigate = useNavigate()

  const navigate = useCallback(
    (to: string, options?: NavigateOptions) => {
      routerNavigate(to, { replace: options?.replace })
    },
    [routerNavigate],
  )

  return {
    path: normalizePath(location.pathname),
    search: location.search,
    navigate,
  }
}

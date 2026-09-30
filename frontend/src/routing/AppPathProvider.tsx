import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export const APP_PATHS = {
  home: '/',
  tables: '/tables',
  peopleMarkets: '/people-markets',
  marketReport: '/people-markets/report',
  products: '/products',
  community: '/community',
  docs: '/docs',
  help: '/help',
  feedback: '/feedback',
  feedbackAdmin: '/feedback/admin',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminRoles: '/admin/roles',
  adminAttachmentsTrash: '/admin/attachments-trash',
  adminUserActivity: '/admin/user-activity',
  adminTableHistory: '/admin/table-history',
  profile: '/profile',
  latestChanges: '/reports/latest-changes',
  reports: '/reports',
  installationsReport: '/reports/installations',
  focusGroupsReport: '/reports/focus-groups',
  issuesReport: '/reports/issues',
  roadmap: '/roadmap',
  roadmapGames: '/roadmap/games',
  roadmapDocs: '/roadmap/docs',
  tasks: '/tasks',
  find: '/find',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  merkuriosity: '/merkuriosity',
  merkuriosityWords: '/merkuriosity/words',
  ice2027: '/ice2027',
  ice2027Evaluation: '/ice2027/evaluation',
  ice2027Admin: '/ice2027/admin',
  ice2027Dashboard: '/ice2027/dashboard',
  ice2027DashboardGame: '/ice2027/dashboard/game',
  ice2027Progress: '/ice2027/progress',
  scoutEvents: '/scout/events',
  productGamesList: '/products/games-list',
  productGamesDocsPackage: '/products/games-list/docs-package',
  releaseInformationSheet: '/products/release-sheet',
  games: '/tables/games',
  gameConcepts: '/tables/game_concepts',
  features: '/tables/features',
} as const

type AppPathContextValue = {
  path: string
  search: string
  navigate: (to: string) => void
}

const AppPathContext = createContext<AppPathContextValue | null>(null)

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname || APP_PATHS.home
}

export function AppPathProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))
  const [search, setSearch] = useState(() => window.location.search)

  useEffect(() => {
    function onPopState() {
      setPath(normalizePath(window.location.pathname))
      setSearch(window.location.search)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin)
    const nextPath = normalizePath(url.pathname)
    const nextHref = `${nextPath}${url.search}${url.hash}`
    if (normalizePath(window.location.pathname) === nextPath && window.location.search === url.search && window.location.hash === url.hash) {
      return
    }

    window.history.pushState(null, '', nextHref)
    setPath(nextPath)
    setSearch(url.search)
  }, [])

  const value = useMemo<AppPathContextValue>(
    () => ({
      path,
      search,
      navigate,
    }),
    [path, search, navigate],
  )

  return <AppPathContext.Provider value={value}>{children}</AppPathContext.Provider>
}

export function useAppPath(): AppPathContextValue {
  const context = useContext(AppPathContext)

  if (!context) {
    throw new Error('useAppPath must be used within AppPathProvider')
  }

  return context
}

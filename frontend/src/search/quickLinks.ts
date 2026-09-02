import { APP_PATHS } from '@/routing'

export type FindQuickLink = {
  key: string
  label: string
  path: string
  listed: boolean
}

export const FIND_QUICK_LINKS: FindQuickLink[] = [
  { key: '#s', label: 'Start (Home Page)', path: APP_PATHS.home, listed: false },
  { key: '#h', label: 'Help & FAQ', path: APP_PATHS.help, listed: true },
  { key: '#m', label: 'People & Markets', path: APP_PATHS.peopleMarkets, listed: true },
  { key: '#p', label: 'Products', path: APP_PATHS.products, listed: true },
  { key: '#r', label: 'Roadmap', path: APP_PATHS.roadmapGames, listed: true },
  { key: '#c', label: 'Community', path: APP_PATHS.community, listed: true },
  { key: '#i', label: 'Installations (Report)', path: APP_PATHS.installationsReport, listed: true },
  { key: '#t', label: 'My Tasks', path: APP_PATHS.tasks, listed: true },
  { key: '#g', label: 'Games (by Name)', path: APP_PATHS.games, listed: true },
  { key: '#f', label: 'Features (by Version)', path: APP_PATHS.features, listed: true },
  { key: '#v', label: 'Versions (by Name)', path: '/tables/versions', listed: true },
  { key: '#b', label: 'Builds (by Name)', path: '/tables/builds', listed: true },
]

const QUICK_LINK_SPLIT = /^(#\w+)(\d*)$/u

export function matchQuickLink(query: string): FindQuickLink | undefined {
  const match = query.trim().match(QUICK_LINK_SPLIT)
  if (!match) {
    return undefined
  }

  return FIND_QUICK_LINKS.find((item) => item.key === match[1])
}

import { APP_PATHS } from '@/routing'

export type FindQuickLink = {
  key: string
  label: string
  labelKey: string
  path: string
  listed: boolean
}

export const FIND_QUICK_LINKS: FindQuickLink[] = [
  { key: '#s', label: 'Start (Home Page)', labelKey: 'quickLinks.home', path: APP_PATHS.home, listed: false },
  { key: '#h', label: 'Help & FAQ', labelKey: 'quickLinks.help', path: APP_PATHS.help, listed: true },
  { key: '#m', label: 'People & Markets', labelKey: 'quickLinks.peopleMarkets', path: APP_PATHS.peopleMarkets, listed: true },
  { key: '#p', label: 'Products', labelKey: 'quickLinks.products', path: APP_PATHS.products, listed: true },
  { key: '#r', label: 'Roadmap', labelKey: 'quickLinks.roadmap', path: APP_PATHS.roadmapGames, listed: true },
  { key: '#ft', label: 'Field Trials', labelKey: 'quickLinks.fieldTrials', path: APP_PATHS.fieldTrials, listed: true },
  { key: '#c', label: 'Community', labelKey: 'quickLinks.community', path: APP_PATHS.community, listed: true },
  { key: '#i', label: 'Installations (Report)', labelKey: 'quickLinks.installations', path: APP_PATHS.installationsReport, listed: true },
  { key: '#t', label: 'My Tasks', labelKey: 'quickLinks.tasks', path: APP_PATHS.tasks, listed: true },
  { key: '#g', label: 'Games (by Name)', labelKey: 'quickLinks.games', path: APP_PATHS.games, listed: true },
  { key: '#f', label: 'Features (by Version)', labelKey: 'quickLinks.features', path: APP_PATHS.features, listed: true },
  { key: '#v', label: 'Versions (by Name)', labelKey: 'quickLinks.versions', path: '/tables/versions', listed: true },
  { key: '#b', label: 'Builds (by Name)', labelKey: 'quickLinks.builds', path: '/tables/builds', listed: true },
]

const QUICK_LINK_SPLIT = /^(#\w+)(\d*)$/u

export function matchQuickLink(query: string): FindQuickLink | undefined {
  const match = query.trim().match(QUICK_LINK_SPLIT)
  if (!match) {
    return undefined
  }

  return FIND_QUICK_LINKS.find((item) => item.key === match[1])
}

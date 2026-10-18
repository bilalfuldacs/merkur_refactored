import type { SvgIconComponent } from '@mui/icons-material'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'
import type { AuthUser } from '@/api'
import type { ScoutMenuEvent } from '@/api/scout'
import type { Translate } from '@/i18n/translate'
import { APP_PATHS, ice2027HubPath } from '@/routing'

export const NAV_BREAKPOINTS = {
  desktop: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const

export type NavLabelBreakpoint = keyof Omit<typeof NAV_BREAKPOINTS, 'desktop'>
export type NavAction = 'logout'

export type NavLinkItem = {
  type?: 'item'
  id: string
  label: string
  description?: string
  icon?: SvgIconComponent
  emphasize?: boolean
  action?: NavAction
  path?: string
  children?: NavChild[]
}

export type NavDivider = {
  type: 'divider'
}

export type NavChild = NavLinkItem | NavDivider

export type NavItem = {
  id: string
  label: string
  icon: SvgIconComponent
  emphasize?: boolean
  /** Show the text label from this viewport width; icons stay visible below it. */
  labelFrom?: NavLabelBreakpoint
  path?: string
  children?: NavChild[]
}

const passthrough: Translate = (_key, fallback = '') => fallback

export function getMainNavigation(
  user: AuthUser | null,
  scoutEvents: ScoutMenuEvent[] = [],
  translate: Translate = passthrough,
): NavItem[] {
  const displayName =
    user?.name_COMBINED?.trim() ||
    [user?.firstname, user?.lastname].filter(Boolean).join(' ') ||
    user?.username ||
    translate('nav.profileFallback', 'Profile')
  const roleName = user?.role?.name ?? translate('nav.noRole', 'No role')
  const canManageWords = Boolean(user?.role?.['may_create-update_items'])
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])
  const exhibitionChildren: NavChild[] = scoutEvents.map((event) => ({
    id: `scout-${event.slug}`,
    label: event.active
      ? event.name
      : translate('nav.inactiveEvent', '{name} (inactive)', { name: event.name }),
    path: ice2027HubPath(event.slug),
  }))

  return [
    {
      id: 'people-markets',
      label: translate('nav.peopleMarkets', 'People & Markets'),
      icon: GroupsOutlinedIcon,
      emphasize: true,
      labelFrom: 'lg',
      path: APP_PATHS.peopleMarkets,
    },
    {
      id: 'products',
      label: translate('nav.products', 'Products'),
      icon: Inventory2OutlinedIcon,
      emphasize: true,
      labelFrom: 'lg',
      path: APP_PATHS.products,
    },
    {
      id: 'field-trials',
      label: translate('nav.fieldTrials', 'Field Trials'),
      icon: FlagOutlinedIcon,
      labelFrom: 'xl',
      path: APP_PATHS.fieldTrials,
    },
    {
      id: 'roadmap',
      label: translate('nav.roadmap', 'Roadmap'),
      icon: MapOutlinedIcon,
      labelFrom: 'xl',
      path: APP_PATHS.roadmap,
      children: [
        { id: 'roadmap-versions', label: translate('nav.roadmapVersions', '… by Versions'), path: APP_PATHS.roadmap },
        { id: 'roadmap-games', label: translate('nav.roadmapGames', '… by Games'), path: APP_PATHS.roadmapGames },
        { type: 'divider' },
        { id: 'roadmap-docs', label: translate('nav.roadmapDocs', 'Roadmap Docs'), path: APP_PATHS.roadmapDocs },
      ],
    },
    ...(exhibitionChildren.length > 0
      ? [
          {
            id: 'exhibition',
            label: translate('nav.exhibition', 'Exhibition'),
            icon: TravelExploreOutlinedIcon,
            emphasize: true,
            labelFrom: 'xl' as const,
            path: APP_PATHS.ice2027,
            children: exhibitionChildren,
          },
        ]
      : []),
    {
      id: 'community',
      label: translate('nav.community', 'Community'),
      icon: ChatOutlinedIcon,
      labelFrom: 'xl',
      path: APP_PATHS.community,
    },
    {
      id: 'reports',
      label: translate('nav.reports', 'Reports'),
      icon: ArticleOutlinedIcon,
      labelFrom: 'xxl',
      path: APP_PATHS.reports,
      children: [
        { id: 'reports-all', label: translate('nav.allReports', 'All Reports'), emphasize: true, path: APP_PATHS.reports },
        { type: 'divider' },
        { id: 'reports-installations', label: translate('nav.installations', 'Installations'), icon: RocketLaunchOutlinedIcon, path: APP_PATHS.installationsReport },
        { id: 'reports-focus-groups', label: translate('nav.focusGroups', 'Focus Groups'), icon: GroupsOutlinedIcon, path: APP_PATHS.focusGroupsReport },
        { id: 'reports-latest-changes', label: translate('nav.latestChanges', 'Latest Changes'), icon: SyncOutlinedIcon, path: APP_PATHS.latestChanges },
        { id: 'reports-issues', label: translate('nav.issues', 'Issues'), icon: ReportProblemOutlinedIcon, path: APP_PATHS.issuesReport },
      ],
    },
    {
      id: 'tables',
      label: translate('nav.tables', 'Tables'),
      icon: TableChartOutlinedIcon,
      labelFrom: 'xxl',
      children: [
        { id: 'tables-all', label: translate('nav.allTables', 'All Tables'), emphasize: true, path: '/tables' },
        { type: 'divider' },
        { id: 'tables-game-concepts', label: translate('nav.gameConcepts', 'Game Concepts'), icon: LightbulbOutlinedIcon, path: '/tables/game_concepts' },
        { id: 'tables-games', label: translate('nav.games', 'Games'), icon: CasinoOutlinedIcon, path: '/tables/games' },
        { id: 'tables-features', label: translate('nav.features', 'Features'), icon: WorkspacePremiumOutlinedIcon, path: '/tables/features' },
        { id: 'tables-versions', label: translate('nav.versions', 'Versions'), icon: Inventory2OutlinedIcon, path: '/tables/versions' },
        { id: 'tables-builds', label: translate('nav.builds', 'Builds'), icon: ConstructionOutlinedIcon, path: '/tables/builds' },
        { id: 'tables-dongles', label: translate('nav.dongles', 'Dongles'), icon: MemoryOutlinedIcon, path: '/tables/dongles' },
        { type: 'divider' },
        { id: 'tables-cabinets', label: translate('nav.cabinets', 'Cabinets'), icon: CropSquareOutlinedIcon, path: '/tables/cabinets' },
        { type: 'divider' },
        { id: 'tables-availabilities', label: translate('nav.availabilities', 'Availabilities'), icon: ChecklistOutlinedIcon, path: '/tables/availabilities' },
        { id: 'tables-installations', label: translate('nav.installations', 'Installations'), icon: RocketLaunchOutlinedIcon, path: '/tables/installations' },
        { id: 'tables-releases', label: translate('nav.releases', 'Releases'), icon: CelebrationOutlinedIcon, path: '/tables/releases' },
        { type: 'divider' },
        { id: 'tables-markets-landbased', label: translate('nav.marketsLandbased', 'Mkts Land-Based'), icon: TrendingUpOutlinedIcon, path: '/tables/markets_landbased' },
        { id: 'tables-markets-online', label: translate('nav.marketsOnline', 'Mkts Online'), icon: TrendingUpOutlinedIcon, path: '/tables/markets_online' },
      ],
    },
    {
      id: 'docs',
      label: translate('nav.docs', 'Docs'),
      icon: MenuBookOutlinedIcon,
      labelFrom: 'xxl',
      path: APP_PATHS.docs,
    },
    {
      id: 'tasks',
      label: translate('nav.tasks', 'My Tasks'),
      icon: CalendarMonthOutlinedIcon,
      emphasize: true,
      labelFrom: 'xl',
      path: APP_PATHS.tasks,
    },
    {
      id: 'more',
      label: translate('nav.more', 'More'),
      icon: MoreVertIcon,
      labelFrom: 'lg',
      children: [
        {
          id: 'profile',
          label: displayName,
          description: roleName,
          icon: PersonOutlinedIcon,
          path: APP_PATHS.profile,
        },
        { id: 'logout', label: translate('nav.logout', 'Log out'), icon: LogoutOutlinedIcon, action: 'logout' },
        { type: 'divider' },
        { id: 'feedback', label: translate('nav.feedback', 'Feedback'), icon: LightbulbOutlinedIcon, path: APP_PATHS.feedback },
        ...(isSuperuser
          ? [
              { id: 'admin', label: translate('nav.admin', 'Admin'), icon: AdminPanelSettingsOutlinedIcon, path: APP_PATHS.admin },
              { id: 'feedback-admin', label: translate('nav.feedbackAdmin', 'Feedback Admin'), icon: AdminPanelSettingsOutlinedIcon, path: APP_PATHS.feedbackAdmin },
            ]
          : []),
        { id: 'help', label: translate('nav.help', 'Help & FAQ'), icon: HelpOutlineOutlinedIcon, path: APP_PATHS.help },
        { type: 'divider' },
        {
          id: 'merkuriosity',
          label: translate('nav.merkuriosity', 'MERKURiosity Daily Quiz'),
          icon: EmojiEventsOutlinedIcon,
          path: APP_PATHS.merkuriosity,
        },
        ...(canManageWords
          ? [{ id: 'merkuriosity-words', label: translate('nav.merkuriosityWords', 'MERKURiosity Words'), icon: EmojiEventsOutlinedIcon, path: APP_PATHS.merkuriosityWords }]
          : []),
      ],
    },
  ]
}

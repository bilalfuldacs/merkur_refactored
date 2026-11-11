import type { SvgIconComponent } from '@mui/icons-material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'

import { APP_PATHS } from '@/routing'

export type LaunchpadVariant = 'featured' | 'secondary'

export type LaunchpadCardItem = {
  id: string
  label: string
  labelKey?: string
  shortLabel?: string
  shortLabelKey?: string
  icon: SvgIconComponent
  variant: LaunchpadVariant
  emphasize?: boolean
  sparkle?: boolean
  hideBelowLg?: boolean
  path?: string
}

export const homeLaunchpadGrid = {
  gap: 2,
  gridTemplateColumns: {
    xs: 'repeat(3, minmax(0, 1fr))',
    lg: '3fr 2fr 2fr 2fr 3fr',
  },
} as const

export const homeLaunchpadCards: LaunchpadCardItem[] = [
  {
    id: 'latest-changes',
    label: 'Latest Changes',
    labelKey: 'nav.latestChanges',
    icon: SyncOutlinedIcon,
    variant: 'secondary',
    hideBelowLg: true,
    path: APP_PATHS.latestChanges,
  },
  {
    id: 'people-markets',
    label: 'People & Markets',
    labelKey: 'nav.peopleMarkets',
    shortLabel: 'Ppl & Mkts',
    shortLabelKey: 'nav.peopleMarketsShort',
    icon: GroupsOutlinedIcon,
    variant: 'featured',
    emphasize: true,
    path: APP_PATHS.peopleMarkets,
  },
  {
    id: 'products',
    label: 'Products',
    labelKey: 'nav.products',
    icon: Inventory2OutlinedIcon,
    variant: 'featured',
    emphasize: true,
    sparkle: true,
    path: APP_PATHS.products,
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    labelKey: 'nav.roadmap',
    icon: MapOutlinedIcon,
    variant: 'featured',
    path: APP_PATHS.roadmap,
  },
  {
    id: 'community',
    label: 'Community',
    labelKey: 'nav.community',
    icon: ChatOutlinedIcon,
    variant: 'secondary',
    hideBelowLg: true,
    path: APP_PATHS.community,
  },
]

export const homeLaunchpadMoreGrid = {
  gap: 2,
  gridTemplateColumns: {
    xs: 'repeat(3, minmax(0, 1fr))',
    lg: 'repeat(6, minmax(0, 1fr))',
  },
} as const

/** Secondary shortcuts restored from the original home page (second row). */
export const homeLaunchpadMoreCards: LaunchpadCardItem[] = [
  {
    id: 'field-trials',
    label: 'Field Trials',
    labelKey: 'nav.fieldTrials',
    icon: ScienceOutlinedIcon,
    variant: 'secondary',
    path: APP_PATHS.fieldTrials,
  },
  {
    id: 'global-overview',
    label: 'Global Overview',
    labelKey: 'nav.globalOverview',
    icon: PublicOutlinedIcon,
    variant: 'secondary',
    path: APP_PATHS.businessDevelopment,
  },
  {
    id: 'all-reports',
    label: 'All Reports',
    labelKey: 'nav.allReports',
    icon: ArticleOutlinedIcon,
    variant: 'secondary',
    path: APP_PATHS.reports,
  },
  {
    id: 'all-tables',
    label: 'All Tables',
    labelKey: 'nav.allTables',
    icon: TableChartOutlinedIcon,
    variant: 'secondary',
    path: APP_PATHS.tables,
  },
  {
    id: 'docs',
    label: 'Docs',
    labelKey: 'nav.docs',
    icon: MenuBookOutlinedIcon,
    variant: 'secondary',
    path: APP_PATHS.docs,
  },
  {
    id: 'merkuriosity',
    label: 'MERKURiosity',
    icon: EmojiEventsOutlinedIcon,
    variant: 'secondary',
    path: APP_PATHS.merkuriosity,
  },
]

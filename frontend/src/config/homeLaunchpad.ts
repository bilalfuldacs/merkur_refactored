import type { SvgIconComponent } from '@mui/icons-material'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'

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

import type { SvgIconComponent } from '@mui/icons-material'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import ArchitectureOutlinedIcon from '@mui/icons-material/ArchitectureOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined'
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import RecyclingOutlinedIcon from '@mui/icons-material/RecyclingOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import ViewInArOutlinedIcon from '@mui/icons-material/ViewInArOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

const byFaName: Record<string, SvgIconComponent> = {
  'compass-drafting': ArchitectureOutlinedIcon,
  lemon: CasinoOutlinedIcon,
  recycle: RecyclingOutlinedIcon,
  certificate: WorkspacePremiumOutlinedIcon,
  box: Inventory2OutlinedIcon,
  hammer: ConstructionOutlinedIcon,
  microchip: MemoryOutlinedIcon,
  bug: BugReportOutlinedIcon,
  'bars-progress': FlagOutlinedIcon,
  square: CropSquareOutlinedIcon,
  shapes: CategoryOutlinedIcon,
  'cubes-stacked': ViewInArOutlinedIcon,
  'arrows-turn-to-dots': HubOutlinedIcon,
  'list-check': ChecklistOutlinedIcon,
  rocket: RocketLaunchOutlinedIcon,
  'users-viewfinder': GroupsOutlinedIcon,
  'champagne-glasses': CelebrationOutlinedIcon,
  section: AccountBalanceOutlinedIcon,
  'money-bill-trend-up': TrendingUpOutlinedIcon,
  building: BusinessOutlinedIcon,
  'house-flag': HomeOutlinedIcon,
  sitemap: AccountTreeOutlinedIcon,
  'chess-knight': CasinoOutlinedIcon,
  'circle-nodes': HubOutlinedIcon,
  lightbulb: LightbulbOutlinedIcon,
  'building-columns': AccountBalanceOutlinedIcon,
  'puzzle-piece': ExtensionOutlinedIcon,
  'layer-group': LayersOutlinedIcon,
  clipboard: AssignmentOutlinedIcon,
  'flask-vial': ScienceOutlinedIcon,
}

function faName(icon: string | null | undefined): string | null {
  if (!icon) {
    return null
  }

  const tokens = icon.split(/\s+/).filter((token) => token.startsWith('fa-') && token !== 'fa-solid' && token !== 'fa-regular')
  const name = tokens.at(-1)?.replace(/^fa-/, '')
  return name || null
}

export function iconForTable(icon: string | null | undefined): SvgIconComponent {
  const name = faName(icon)
  if (name && byFaName[name]) {
    return byFaName[name]
  }

  return TableChartOutlinedIcon
}

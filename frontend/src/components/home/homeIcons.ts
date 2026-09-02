import type { SvgIconComponent } from '@mui/icons-material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

const byKey: Record<string, SvgIconComponent> = {
  games: CasinoOutlinedIcon,
  game_concepts: LightbulbOutlinedIcon,
  features: WorkspacePremiumOutlinedIcon,
  versions: Inventory2OutlinedIcon,
  builds: ConstructionOutlinedIcon,
  dongles: MemoryOutlinedIcon,
  defects: BugReportOutlinedIcon,
  version_milestones: FlagOutlinedIcon,
  build_milestones: FlagOutlinedIcon,
  game_milestones: FlagOutlinedIcon,
  cabinets: CropSquareOutlinedIcon,
  availabilities: ChecklistOutlinedIcon,
  installations: RocketLaunchOutlinedIcon,
  reports_installations: RocketLaunchOutlinedIcon,
  'reports_latest-changes': SyncOutlinedIcon,
  latest_changes: SyncOutlinedIcon,
  releases: CelebrationOutlinedIcon,
  software_releases: CelebrationOutlinedIcon,
  markets_landbased: TrendingUpOutlinedIcon,
  markets_online: TrendingUpOutlinedIcon,
}

export function iconForHomeKey(key: string | null | undefined): SvgIconComponent {
  if (!key) {
    return TableChartOutlinedIcon
  }

  return byKey[key] ?? byKey[key.replace(/-/g, '_')] ?? ArticleOutlinedIcon
}

import type { SvgIconComponent } from '@mui/icons-material'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import type { SihRoadmapBoard, SihRoadmapMilestone, SihRoadmapStatus } from '@/api/sihRoadmap'

export const STATUS_COLOR: Record<SihRoadmapStatus, string> = {
  planned: '#7fd4f5',
  active: '#FFCC00',
  done: '#A2C617',
}

export function quarterLabel(year: number, quarter: number): string {
  return `Q${quarter} ${year}`
}

export function findMilestone(board: SihRoadmapBoard, id: number): SihRoadmapMilestone | null {
  for (const quarter of board.quarters) {
    const found = quarter.milestones.find((milestone) => milestone.id === id)
    if (found) {
      return found
    }
  }
  return null
}

export function currentWork(board: SihRoadmapBoard): SihRoadmapMilestone[] {
  const milestones = board.quarters.flatMap((quarter) => quarter.milestones)
  const active = milestones.filter((milestone) => milestone.status === 'active' && !milestone.is_hidden)
  if (active.length > 0) {
    return active
  }
  const now = board.quarters.find((quarter) => quarter.current)
  return (now?.milestones ?? []).filter((milestone) => milestone.status !== 'done' && !milestone.is_hidden)
}

export function milestoneIcon(title: string): SvgIconComponent {
  const value = title.toLowerCase()
  if (value.includes('catalogue') || value.includes('catalog')) return Inventory2OutlinedIcon
  if (value.includes('field trial')) return FlagOutlinedIcon
  if (value.includes('mars')) return HubOutlinedIcon
  if (value.includes('tracking') || value.includes('intelligence')) return VisibilityOutlinedIcon
  if (value.includes('responsible')) return HealthAndSafetyOutlinedIcon
  if (value.includes('market report')) return AssessmentOutlinedIcon
  if (value.includes('ios') || value.includes('android') || value.includes(' app')) return PhoneIphoneOutlinedIcon
  if (value.includes('exhibition') || value.includes('ice')) return TravelExploreOutlinedIcon
  if (value.includes('beta')) return ScienceOutlinedIcon
  if (value.includes('game')) return CasinoOutlinedIcon
  if (value.includes('ai')) return AutoAwesomeOutlinedIcon
  return FlagOutlinedIcon
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatStamp(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

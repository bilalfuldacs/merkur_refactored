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
  planned: '#009FE3',
  active: '#E83181',
  done: '#A2C617',
  paused: '#B2B2B2',
}

export const STATUS_LABEL_DEFAULT: Record<SihRoadmapStatus, string> = {
  planned: 'Planned',
  active: 'In progress',
  done: 'Done',
  paused: 'Paused',
}

type Translate = (key: string, fallback: string) => string

export function statusLabel(status: SihRoadmapStatus, translate?: Translate): string {
  const fallback = STATUS_LABEL_DEFAULT[status]
  return translate ? translate(`teamRoadmap.${status}`, fallback) : fallback
}

/** Counts exclude hidden milestones (matches the server payload). */
export function countByStatus(board: SihRoadmapBoard): Record<SihRoadmapStatus, number> {
  const counts: Record<SihRoadmapStatus, number> = { planned: 0, active: 0, done: 0, paused: 0 }
  for (const quarter of board.quarters) {
    for (const milestone of quarter.milestones) {
      if (!milestone.is_hidden) counts[milestone.status] += 1
    }
  }
  return counts
}

export function countLine(counts: Record<SihRoadmapStatus, number>, translate?: Translate): string {
  const tr: Translate = translate ?? ((_key, fallback) => fallback)
  const parts: string[] = []
  if (counts.active) parts.push(`${counts.active} ${tr('teamRoadmap.countActive', 'in progress')}`)
  if (counts.planned) parts.push(`${counts.planned} ${tr('teamRoadmap.countPlanned', 'planned')}`)
  if (counts.done) parts.push(`${counts.done} ${tr('teamRoadmap.countDone', 'done')}`)
  if (counts.paused) parts.push(`${counts.paused} ${tr('teamRoadmap.countPaused', 'paused')}`)
  return parts.length ? parts.join(' · ') : tr('teamRoadmap.nothingScheduled', 'Nothing is scheduled yet.')
}

export function nextQuarter(year: number, quarter: number): { year: number; quarter: number } {
  return quarter >= 4 ? { year: year + 1, quarter: 1 } : { year, quarter: quarter + 1 }
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

/** Server-provided focus (active items, or the current quarter when nothing is active). */
export function currentWork(board: SihRoadmapBoard): SihRoadmapMilestone[] {
  return board.focus
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

/** `YYYY-MM-DD` -> "5 Nov 2026" without timezone drift. */
export function formatTargetDate(value: string | null): string {
  if (!value) return ''
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return ''
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

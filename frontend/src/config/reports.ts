import type { SvgIconComponent } from '@mui/icons-material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import { APP_PATHS } from '@/routing'

export const REPORT_PATHS: Record<string, string> = {
  installations: APP_PATHS.installationsReport,
  'latest-changes': APP_PATHS.latestChanges,
  'field-trials': APP_PATHS.fieldTrials,
  'business-development': APP_PATHS.businessDevelopment,
  'focus-groups': APP_PATHS.focusGroupsReport,
  issues: APP_PATHS.issuesReport,
}

export function reportPath(name: string): string {
  return REPORT_PATHS[name] ?? APP_PATHS.reports
}

export function reportIcon(name: string): SvgIconComponent {
  switch (name) {
    case 'installations':
      return RocketLaunchOutlinedIcon
    case 'latest-changes':
      return SyncOutlinedIcon
    case 'field-trials':
      return ScienceOutlinedIcon
    case 'business-development':
      return PublicOutlinedIcon
    case 'focus-groups':
      return GroupsOutlinedIcon
    case 'issues':
      return ReportProblemOutlinedIcon
    default:
      return ArticleOutlinedIcon
  }
}

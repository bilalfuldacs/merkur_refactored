import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useAuth } from '@/auth'
import {
  APP_PATHS,
  ice2027AdminPath,
  ice2027DashboardPath,
  ice2027EvaluationPath,
  ice2027HubPath,
  ice2027ProgressPath,
  eventSlugFromSearch,
  useAppPath,
} from '@/routing'
import { icePillGroupSx, icePillSx } from './IceChrome'

export type IceTab = 'tasks' | 'questionnaire' | 'evaluation' | 'admin' | 'dashboard' | 'progress' | 'events'

export function IceTabs({
  current,
  attendant,
  admin,
  showTasks = false,
}: {
  current: IceTab
  attendant: boolean
  admin: boolean
  showTasks?: boolean
}) {
  const { navigate, search } = useAppPath()
  const eventSlug = eventSlugFromSearch(search)
  const { user } = useAuth()
  const superuser = Boolean(user?.role?.['may_create-update-delete_system-items'])

  return (
    <ToggleButtonGroup
      exclusive
      value={current}
      onChange={(_, next: IceTab | null) => {
        if (next === 'tasks' || next === 'questionnaire') {
          navigate(ice2027HubPath(eventSlug))
        } else if (next === 'evaluation') {
          navigate(ice2027EvaluationPath(undefined, eventSlug))
        } else if (next === 'admin') {
          navigate(ice2027AdminPath(eventSlug))
        } else if (next === 'dashboard') {
          navigate(ice2027DashboardPath(eventSlug))
        } else if (next === 'progress') {
          navigate(ice2027ProgressPath(eventSlug))
        } else if (next === 'events') {
          navigate(APP_PATHS.scoutEvents)
        }
      }}
      sx={icePillGroupSx}
    >
      {showTasks && attendant ? (
        <ToggleButton value="tasks" sx={icePillSx}>
          My tasks
        </ToggleButton>
      ) : null}
      {attendant ? (
        <ToggleButton value="questionnaire" sx={icePillSx}>
          Questionnaire
        </ToggleButton>
      ) : null}
      {attendant ? (
        <ToggleButton value="evaluation" sx={icePillSx}>
          Evaluation
        </ToggleButton>
      ) : null}
      {admin ? (
        <ToggleButton value="admin" sx={icePillSx}>
          Admin
        </ToggleButton>
      ) : null}
      {admin ? (
        <ToggleButton value="dashboard" sx={icePillSx}>
          Dashboard
        </ToggleButton>
      ) : null}
      {admin ? (
        <ToggleButton value="progress" sx={icePillSx}>
          Managers
        </ToggleButton>
      ) : null}
      {superuser ? (
        <ToggleButton value="events" sx={icePillSx}>
          All events
        </ToggleButton>
      ) : null}
    </ToggleButtonGroup>
  )
}

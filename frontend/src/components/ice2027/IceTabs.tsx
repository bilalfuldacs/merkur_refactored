import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { APP_PATHS, useAppPath } from '@/routing'
import { icePillGroupSx, icePillSx } from './IceChrome'

export type IceTab = 'tasks' | 'questionnaire' | 'evaluation' | 'admin'

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
  const { navigate } = useAppPath()

  return (
    <ToggleButtonGroup
      exclusive
      value={current}
      onChange={(_, next: IceTab | null) => {
        if (next === 'tasks' || next === 'questionnaire') {
          navigate(APP_PATHS.ice2027)
        } else if (next === 'evaluation') {
          navigate(APP_PATHS.ice2027Evaluation)
        } else if (next === 'admin') {
          navigate(APP_PATHS.ice2027Admin)
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
    </ToggleButtonGroup>
  )
}

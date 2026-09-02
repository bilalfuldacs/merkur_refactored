import HistoryIcon from '@mui/icons-material/History'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { APP_PATHS, useAppPath } from '@/routing'

export function TablesAboutCard() {
  const { navigate } = useAppPath()
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        p: 2.5,
        position: { md: 'sticky' },
        top: { md: 80 },
      }}
    >
      <Typography
        component="h2"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 800,
          fontSize: 18,
          mb: 1.5,
        }}
      >
        <InfoOutlinedIcon sx={{ color: 'info.main' }} />
        About Tables
      </Typography>
      <Typography sx={{ mb: 1.5 }}>
        This page contains <Box component="strong">all constituent data</Box> for MERKURflow,
        organized into tables.
      </Typography>
      <Typography sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <LockOpenIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
        <span>
          You may <Box component="strong">view and edit</Box> this table.
        </span>
      </Typography>
      <Typography sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <LockIcon sx={{ fontSize: 18, color: 'error.main', mt: '2px' }} />
        <span>
          You may <Box component="strong">view</Box> this table, but you{' '}
          <Box component="strong">cannot edit</Box>.
        </span>
      </Typography>
      <Typography sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <HistoryIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
        <span>
          This table preserves <Box component="strong">edit history</Box>.
        </span>
      </Typography>
      <Typography color="text.secondary">
        <Box component="em">See also:</Box>{' '}
        <Box
          component="button"
          type="button"
          onClick={() => navigate(APP_PATHS.latestChanges)}
          sx={{
            border: 0,
            p: 0,
            bgcolor: 'transparent',
            color: 'info.main',
            fontWeight: 700,
            font: 'inherit',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Latest Changes
        </Box>
      </Typography>
    </Box>
  )
}

import HistoryIcon from '@mui/icons-material/History'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useI18n } from '@/i18n'
import { APP_PATHS, useAppPath } from '@/routing'

export function TablesAboutCard() {
  const { navigate } = useAppPath()
  const { t } = useI18n()
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
        {t('common.aboutTables', 'About Tables')}
      </Typography>
      <Typography sx={{ mb: 1.5 }}>
        {t('common.allConstituent', 'This page contains all constituent data for MERKURflow, organized into tables.')}
      </Typography>
      <Typography sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <LockOpenIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
        <span>
          {t('common.mayViewEdit', 'You may view and edit this table.')}
        </span>
      </Typography>
      <Typography sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <LockIcon sx={{ fontSize: 18, color: 'error.main', mt: '2px' }} />
        <span>
          {t('common.mayViewOnly', 'You may view this table, but you cannot edit.')}
        </span>
      </Typography>
      <Typography sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <HistoryIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
        <span>
          {t('common.preservesHistory', 'This table preserves edit history.')}
        </span>
      </Typography>
      <Typography color="text.secondary">
        <Box component="em">{t('common.seeAlso', 'See also:')}</Box>{' '}
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
          {t('pages.latestChanges', 'Latest Changes')}
        </Box>
      </Typography>
    </Box>
  )
}

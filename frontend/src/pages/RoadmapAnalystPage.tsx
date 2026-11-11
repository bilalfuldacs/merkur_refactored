import { useEffect } from 'react'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { RoadmapAnalyst } from '@/components/roadmapAnalyst'
import { useI18n } from '@/i18n'
import { APP_PATHS, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

export default function RoadmapAnalystPage() {
  const { t } = useI18n()
  const { navigate } = useAppPath()
  const title = t('pages.roadmapAnalyst', 'Roadmap Analyst')

  useEffect(() => {
    document.title = `${title} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [title])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: 3, lg: 4 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        <Box sx={{ maxWidth: 1600, mx: 'auto', width: '100%' }}>
          <Box
            component="nav"
            aria-label={t('common.breadcrumb', 'Breadcrumb')}
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1,
              fontSize: 13,
            }}
          >
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              <CrumbHome />
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.roadmap)} sx={crumbSx}>
              {t('pages.roadmap', 'Roadmap')}
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">{title}</Box>
          </Box>

          <Typography
            component="h1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 800,
              fontSize: { xs: 24, md: 30 },
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            <MapOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
            {title}
            <Chip label="BETA" size="small" color="primary" sx={{ fontWeight: 800, ml: 0.5 }} />
          </Typography>

          <RoadmapAnalyst />
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

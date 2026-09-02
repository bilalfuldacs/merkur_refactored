import { useEffect } from 'react'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { TableRecordAssets } from '@/components/tableView'
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

const seeAlsoSx = {
  ...crumbSx,
  fontWeight: 700,
  display: 'block',
} as const

export default function RoadmapDocsPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()

  useEffect(() => {
    document.title = 'Roadmap Docs | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Roadmap Docs</Box>
          </Box>

          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15, mb: 3 }}
          >
            <MapOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
            Roadmap Docs
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 280px' },
              gap: 4,
              alignItems: 'start',
              mb: 4,
            }}
          >
            <Box>
              <Typography
                component="h2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 18, mb: 1 }}
              >
                <PushPinOutlinedIcon sx={{ color: 'info.main', fontSize: 22 }} />
                Official Snapshots and Planning Documents
              </Typography>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'common.white',
                  overflow: 'hidden',
                  mb: 4,
                }}
              >
                <TableRecordAssets table="roadmap" recordId={null} decolorize={Boolean(user?.decolorize_avatars)} />
              </Box>

              <Typography
                component="h2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 18, mb: 1 }}
              >
                <SyncOutlinedIcon sx={{ color: 'info.main', fontSize: 22 }} />
                Dynamic Roadmap
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                The Dynamic Roadmap contains the <Box component="strong" sx={{ fontWeight: 800, color: 'text.primary' }}>latest information</Box> from
                MERKURflow and may change at any time.
              </Typography>
              <Box component="button" type="button" onClick={() => navigate(APP_PATHS.roadmap)} sx={{ ...crumbSx, fontWeight: 700 }}>
                Open Dynamic Roadmap
              </Box>
            </Box>

            <Box>
              <Typography
                component="h2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 18, mb: 1.5 }}
              >
                <MapOutlinedIcon sx={{ color: 'info.main', fontSize: 22 }} />
                See Also
              </Typography>
              <Box component="button" type="button" onClick={() => navigate(APP_PATHS.roadmapGames)} sx={seeAlsoSx}>
                Roadmap by Games
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

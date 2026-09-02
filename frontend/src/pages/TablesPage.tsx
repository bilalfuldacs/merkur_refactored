import { useEffect } from 'react'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { APP_PATHS, useAppPath } from '@/routing'
import { TablesCatalogView } from '@/components/tables'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'

export default function TablesPage() {
  const { navigate } = useAppPath()

  useEffect(() => {
    document.title = 'All Tables | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: 4, lg: 6 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box
            component="nav"
            aria-label="Breadcrumb"
            sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => navigate(APP_PATHS.home)}
              sx={{
                border: 0,
                p: 0,
                bgcolor: 'transparent',
                color: 'info.main',
                cursor: 'pointer',
                font: 'inherit',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Tables</Box>
          </Box>

          <Typography
            component="h1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 800,
              fontSize: { xs: 32, md: 40 },
              mb: 3,
            }}
          >
            <TableChartOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            Tables
          </Typography>

          <TablesCatalogView />
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

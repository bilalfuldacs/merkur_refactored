import { useEffect } from 'react'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { reportIcon } from '@/config/reports'
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

export default function ReportPlaceholderPage({
  name,
  title,
}: {
  name: string
  title: string
}) {
  const { navigate } = useAppPath()
  const Icon = reportIcon(name)

  useEffect(() => {
    document.title = `${title} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [title])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 860, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.reports)} sx={crumbSx}>
              Reports
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">{title}</Box>
          </Box>
          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 }, mb: 2 }}
          >
            <Icon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArticleOutlinedIcon sx={{ fontSize: 20 }} />
            This report is not wired yet. Use Installations or Latest Changes from the Reports catalog.
          </Typography>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

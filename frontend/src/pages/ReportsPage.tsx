import { useEffect, useState } from 'react'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getReportsCatalog } from '@/api'
import type { ReportsCatalog } from '@/api'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { ReportCatalogCard, ReportsAboutCard } from '@/components/reports'
import { reportPath } from '@/config/reports'
import { APP_PATHS, useAppPath } from '@/routing'

const emptyCatalog: ReportsCatalog = { groups: [] }

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

export default function ReportsPage() {
  const { navigate } = useAppPath()
  const [catalog, setCatalog] = useState<ReportsCatalog | null>(null)

  useEffect(() => {
    document.title = 'All Reports | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getReportsCatalog()
      .then((payload) => {
        if (!cancelled) {
          setCatalog(payload)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCatalog(emptyCatalog)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (catalog === null) {
    return null
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Reports</Box>
          </Box>
          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 }, mb: 3 }}
          >
            <ArticleOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            Reports
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(280px, 1fr)' },
              gap: { xs: 3, md: 4 },
              alignItems: 'start',
            }}
          >
            <Box>
              {catalog.groups.length === 0 ? (
                <Typography color="text.secondary">No reports available.</Typography>
              ) : (
                catalog.groups.map((group) => (
                  <Box key={group.title} sx={{ mb: 3 }}>
                    <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: 22, md: 26 }, mb: 2 }}>
                      {group.title}
                    </Typography>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2,
                      }}
                    >
                      {group.reports.map((item) => (
                        <ReportCatalogCard key={item.id} item={item} onOpen={(report) => navigate(reportPath(report.name))} />
                      ))}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
            <ReportsAboutCard />
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

import { useEffect, useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { apiRequest } from '@/api/client'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'

type IssueGame = {
  ID: number
  name: string
  version: string | null
  resolution: string | null
  studio: string | null
  screenshot_1: boolean
  screenshot_2: boolean
  screenshot_3: boolean
  banner: boolean
}

type IssuesPayload = {
  generated_at: string
  total: number
  incomplete: number
  games: IssueGame[]
}

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

export default function IssuesReportPage() {
  const { navigate } = useAppPath()
  const [payload, setPayload] = useState<IssuesPayload | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    document.title = 'Issues | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void apiRequest<IssuesPayload>('/reports/issues')
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.reports)} sx={crumbSx}>
              Reports
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Issues</Box>
          </Box>
          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 }, mb: 1 }}>
            <ReportProblemOutlinedIcon sx={{ color: '#EB0000', fontSize: 36 }} />
            Issues
          </Typography>
          <Typography sx={{ mb: 2 }}>This report lists items that might need your attention as they are incomplete or outdated.</Typography>
          {failed ? <Typography color="text.secondary">The report could not be loaded.</Typography> : null}
          {payload ? (
            <>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 1.5 }}>
                Missing Game Screenshots and Banners (<strong>{payload.incomplete}</strong>/{payload.total})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Game</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Screenshot 1</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Screenshot 2</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Screenshot 3</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Banner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payload.games.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        No incomplete game assets.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payload.games.map((game) => (
                      <TableRow key={game.ID} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`${tableBrowsePath('games')}?id=${game.ID}`)}>
                        <TableCell>
                          <strong>{game.name}</strong>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {[game.version, game.resolution, game.studio].filter(Boolean).join(' · ')}
                          </Typography>
                        </TableCell>
                        <FlagCell ok={game.screenshot_1} />
                        <FlagCell ok={game.screenshot_2} />
                        <FlagCell ok={game.screenshot_3} />
                        <FlagCell ok={game.banner} />
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

function FlagCell({ ok }: { ok: boolean }) {
  return (
    <TableCell align="center" sx={ok ? undefined : { bgcolor: 'warning.light' }}>
      {ok ? (
        <CheckCircleOutlinedIcon sx={{ color: 'success.main', fontSize: 20 }} />
      ) : (
        <HighlightOffOutlinedIcon sx={{ color: 'error.main', fontSize: 20 }} />
      )}
    </TableCell>
  )
}

import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { ApiError, getAdminTableHistory } from '@/api'
import type { AdminTableHistoryRow } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
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

export default function AdminTableHistoryPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])
  const [command, setCommand] = useState('php artisan merkur:enable-table-history')
  const [tables, setTables] = useState<AdminTableHistoryRow[] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    const payload = await getAdminTableHistory()
    setCommand(payload.command)
    setTables(payload.tables)
  }, [])

  useEffect(() => {
    document.title = 'Table history | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) {
      return
    }
    void load().catch(() => {
      setTables([])
      setError(true)
      setMessage('Could not load table history status.')
    })
  }, [isSuperuser, load])

  const enabledCount = tables?.filter((row) => row.has_history && row.history_table_exists).length ?? 0

  return (
    <PageBackground>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 2, fontSize: 14, flexWrap: 'wrap' }}>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
            Start
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.admin)} sx={crumbSx}>
            Admin
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="span">Table history</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          Table history
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 2 }}>
          Edit history is enabled per catalog table via Artisan. Run the command on the server to create history tables and
          triggers for every configured table.
        </Typography>

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'common.white',
            p: 2,
            mb: 3,
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Enable command</Typography>
          <Typography component="code" sx={{ display: 'block', fontFamily: 'monospace', fontSize: 14 }}>
            {command}
          </Typography>
        </Box>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required to list history status.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <AppButton variant="outlined" color="inherit" onClick={() => void load()}>
                Refresh
              </AppButton>
              {tables ? (
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {enabledCount} / {tables.length} tables have history configured and present
                </Typography>
              ) : null}
            </Box>

            {message ? (
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message}
              </Alert>
            ) : null}

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white', overflow: 'auto' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(160px, 1.6fr) 100px 120px',
                  gap: 1,
                  px: 2,
                  py: 1,
                  bgcolor: 'grey.50',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                <Box>Table</Box>
                <Box>Flag</Box>
                <Box>History DB</Box>
              </Box>
              {tables === null ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
              ) : tables.length === 0 ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>No catalog tables found.</Typography>
              ) : (
                tables.map((row) => (
                  <Box
                    key={row.table}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(160px, 1.6fr) 100px 120px',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      fontSize: 14,
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{row.title}</Typography>
                      <Typography component="code" sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {row.table}
                      </Typography>
                    </Box>
                    <Box>{row.has_history ? 'yes' : 'no'}</Box>
                    <Box>{row.history_table_exists ? 'present' : 'missing'}</Box>
                  </Box>
                ))
              )}
            </Box>
          </>
        )}
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

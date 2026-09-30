import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError, getAdminUserActivity } from '@/api'
import type { AdminUserActivityRow } from '@/api'
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

export default function AdminUserActivityPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])
  const [sort, setSort] = useState<'last_login' | 'logins'>('last_login')
  const [rows, setRows] = useState<AdminUserActivityRow[] | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setRows(await getAdminUserActivity(sort))
  }, [sort])

  useEffect(() => {
    document.title = 'User activity | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) {
      return
    }
    void load().catch(() => {
      setRows([])
      setError(true)
      setMessage('Could not load user activity.')
    })
  }, [isSuperuser, load])

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
          <Box component="span">User activity</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          User activity
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Login counts and last login from <code>dynamic__logins</code>.
        </Typography>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                size="small"
                label="Sort by"
                value={sort}
                onChange={(event) => setSort(event.target.value as 'last_login' | 'logins')}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="last_login">Last login</MenuItem>
                <MenuItem value="logins"># of logins</MenuItem>
              </TextField>
              <AppButton variant="outlined" color="inherit" onClick={() => void load()}>
                Refresh
              </AppButton>
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
                  gridTemplateColumns: 'minmax(140px, 1.4fr) 100px 180px',
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
                <Box>User</Box>
                <Box># Logins</Box>
                <Box>Last login</Box>
              </Box>
              {rows === null ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
              ) : rows.length === 0 ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>No login records found.</Typography>
              ) : (
                rows.map((row) => (
                  <Box
                    key={row.user_ID}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(140px, 1.4fr) 100px 180px',
                      gap: 1,
                      px: 2,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      fontSize: 14,
                      '&:last-child': { borderBottom: 0 },
                      opacity: row.active ? 1 : 0.55,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{row.username ?? `User #${row.user_ID}`}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {[row.firstname, row.lastname].filter(Boolean).join(' ') || '—'}
                        {!row.active ? ' · inactive' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ fontWeight: sort === 'logins' ? 800 : 400 }}>{row.num_logins}</Box>
                    <Box sx={{ fontWeight: sort === 'last_login' ? 800 : 400 }}>{row.last_login ?? '—'}</Box>
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

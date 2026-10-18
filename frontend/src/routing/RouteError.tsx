import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { isRouteErrorResponse, Link as RouterLink, useRouteError } from 'react-router-dom'
import { APP_PATHS } from './paths'

export function RouteFallback() {
  return (
    <Box sx={{ minHeight: '40vh', display: 'grid', placeItems: 'center', gap: 2 }}>
      <CircularProgress size={28} />
      <Typography color="text.secondary">Loading…</Typography>
    </Box>
  )
}

export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Something went wrong.'

  return (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center', gap: 2, p: 3, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        Page error
      </Typography>
      <Typography color="text.secondary">{message}</Typography>
      <Box
        component={RouterLink}
        to={APP_PATHS.home}
        sx={{ color: 'info.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
      >
        Back to homejgljglukglugutgouylgoutgoug
      </Box>
    </Box>
  )
}

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { useAuth } from '@/auth'
import { APP_PATHS, useAppPath } from '@/routing'
import { MerkurLogo } from '@/components/brand'
import { AppNav } from './AppNav'

export type AppHeaderProps = {
  variant?: 'light' | 'brand'
}

const safeTop = 'env(safe-area-inset-top, 0px)'
const safeLeft = 'env(safe-area-inset-left, 0px)'
const safeRight = 'env(safe-area-inset-right, 0px)'

export function AppHeader({ variant = 'light' }: AppHeaderProps) {
  const isBrand = variant === 'brand'
  const { user, signOut } = useAuth()
  const { navigate } = useAppPath()

  if (!isBrand) {
    return (
      <Box
        component="header"
        sx={{
          pl: `max(16px, ${safeLeft})`,
          pr: `max(16px, ${safeRight})`,
          pt: `max(10px, ${safeTop})`,
          pb: 1.25,
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'rgba(255, 255, 255, 0.78)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(12px)',
        }}
      >
        <MerkurLogo variant="positive" size="sm" alt="MERKURflow" />
      </Box>
    )
  }

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'secondary.main',
        borderBottom: '5px solid',
        borderColor: 'primary.main',
        pt: safeTop,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: 56,
          pl: { xs: `max(12px, ${safeLeft})`, md: `max(16px, ${safeLeft})` },
          pr: { xs: `max(12px, ${safeRight})`, md: `max(16px, ${safeRight})` },
        }}
      >
        <Box
          component="a"
          href={APP_PATHS.home}
          aria-label="MERKURflow home"
          onClick={(event) => {
            event.preventDefault()
            navigate(APP_PATHS.home)
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            mr: 0.5,
            lineHeight: 0,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <MerkurLogo variant="negative" size="sm" alt="" />
        </Box>
        <AppNav user={user} onLogout={signOut} />
      </Toolbar>
    </AppBar>
  )
}

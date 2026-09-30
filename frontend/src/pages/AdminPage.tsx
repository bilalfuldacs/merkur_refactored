import { useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
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

const linkCardSx = {
  display: 'block',
  width: '100%',
  textAlign: 'left' as const,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  bgcolor: 'common.white',
  px: 2,
  py: 1.5,
  cursor: 'pointer',
  '&:hover': { bgcolor: 'grey.50', borderColor: 'secondary.light' },
}

type AdminLink = {
  id: string
  label: string
  description: string
  path: string
}

const LINKS: AdminLink[] = [
  { id: 'users', label: 'Users', description: 'Create and manage accounts.', path: APP_PATHS.adminUsers },
  { id: 'roles', label: 'Roles', description: 'Entitlements and system permissions.', path: APP_PATHS.adminRoles },
  { id: 'feedback', label: 'Feedback Admin', description: 'Review submissions, filters, and CSV export.', path: APP_PATHS.feedbackAdmin },
  { id: 'words', label: 'Merkuriosity Words', description: 'Daily quiz word pool.', path: APP_PATHS.merkuriosityWords },
  { id: 'trash', label: 'Attachment trash', description: 'Find and permanently purge soft-deleted assets.', path: APP_PATHS.adminAttachmentsTrash },
  { id: 'activity', label: 'User activity', description: 'Login counts and last login timestamps.', path: APP_PATHS.adminUserActivity },
  { id: 'history', label: 'Table history', description: 'Status of edit-history tables and enable command.', path: APP_PATHS.adminTableHistory },
]

export default function AdminPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])

  useEffect(() => {
    document.title = 'Admin | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  return (
    <PageBackground>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3, maxWidth: 720, mx: 'auto', width: '100%' }}>
        <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 2, fontSize: 14, flexWrap: 'wrap' }}>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
            Start
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="span">Admin</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          Administration
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Superuser tools for accounts, feedback, attachments, and table history.
        </Typography>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required for the admin hub.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {LINKS.map((item) => (
              <Box key={item.id} component="button" type="button" onClick={() => navigate(item.path)} sx={linkCardSx}>
                <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{item.label}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{item.description}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

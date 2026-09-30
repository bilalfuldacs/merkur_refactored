import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import { ApiError, getAdminAttachmentsTrash, purgeAdminAttachmentsTrash } from '@/api'
import type { AdminTrashItem } from '@/api'
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

function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminAttachmentsTrashPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])
  const [items, setItems] = useState<AdminTrashItem[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const next = await getAdminAttachmentsTrash()
    setItems(next)
    setSelected(new Set())
  }, [])

  useEffect(() => {
    document.title = 'Attachment trash | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) {
      return
    }
    void load().catch(() => {
      setItems([])
      setError(true)
      setMessage('Could not load trashed attachments.')
    })
  }, [isSuperuser, load])

  function toggle(path: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  async function purge(all: boolean) {
    if (busy) {
      return
    }
    const label = all ? 'permanently delete ALL trashed attachments' : `permanently delete ${selected.size} selected file(s)`
    if (!window.confirm(`Really ${label}? This cannot be undone.`)) {
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const result = await purgeAdminAttachmentsTrash(all ? { all: true } : { paths: [...selected] })
      setError(false)
      setMessage(`Purged ${result.purged} file(s)${result.missing ? ` · ${result.missing} missing/skipped` : ''}.`)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not purge trash.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3, maxWidth: 960, mx: 'auto', width: '100%' }}>
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
          <Box component="span">Attachment trash</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          Attachment trash
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Soft-deleted assets (filename stamp with a deleted timestamp). Purge hard-deletes selected files.
        </Typography>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <AppButton variant="outlined" color="inherit" onClick={() => void load()} disabled={busy}>
                Refresh
              </AppButton>
              <AppButton
                variant="outlined"
                color="inherit"
                disabled={busy || selected.size === 0}
                onClick={() => void purge(false)}
              >
                Purge selected ({selected.size})
              </AppButton>
              <AppButton color="error" disabled={busy || !items?.length} onClick={() => void purge(true)}>
                Purge all trash
              </AppButton>
            </Box>

            {message ? (
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message}
              </Alert>
            ) : null}

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white' }}>
              {items === null ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
              ) : items.length === 0 ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>No trashed attachments found.</Typography>
              ) : (
                items.map((item) => (
                  <Box
                    key={item.path}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      alignItems: 'flex-start',
                      px: 1.5,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={selected.has(item.path)}
                      onChange={() => toggle(item.path)}
                      inputProps={{ 'aria-label': `Select ${item.name}` }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, wordBreak: 'break-all' }}>{item.name}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12, wordBreak: 'break-all' }}>
                        {item.relative}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                        Deleted {item.deleted_at ?? '—'} · {formatBytes(item.size)}
                      </Typography>
                    </Box>
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

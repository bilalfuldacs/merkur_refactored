import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError, createRole, deleteRole, getRoles, updateRole } from '@/api'
import type { AdminRole, RoleInput } from '@/api'
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

type EntitlementKey =
  | 'needs_subscriptions'
  | 'may_create-update_items'
  | 'may_delete_items'
  | 'may_create-update-delete_system-items'
  | 'may_use_tlp-red'
  | 'may_access_unsubscribed-markets'

const ENTITLEMENTS: { key: EntitlementKey; label: string }[] = [
  { key: 'needs_subscriptions', label: 'Needs subscriptions' },
  { key: 'may_create-update_items', label: 'Create / update items' },
  { key: 'may_delete_items', label: 'Delete items' },
  { key: 'may_create-update-delete_system-items', label: 'Create / update / delete system items' },
  { key: 'may_use_tlp-red', label: 'Use TLP red' },
  { key: 'may_access_unsubscribed-markets', label: 'Access unsubscribed markets' },
]

type RoleFormState = {
  name: string
  description: string
} & Record<EntitlementKey, boolean>

const emptyForm = (): RoleFormState => ({
  name: '',
  description: '',
  needs_subscriptions: false,
  'may_create-update_items': false,
  may_delete_items: false,
  'may_create-update-delete_system-items': false,
  'may_use_tlp-red': false,
  'may_access_unsubscribed-markets': false,
})

function formFromRole(role: AdminRole): RoleFormState {
  return {
    name: role.name ?? '',
    description: role.description ?? '',
    needs_subscriptions: Boolean(role.needs_subscriptions),
    'may_create-update_items': Boolean(role['may_create-update_items']),
    may_delete_items: Boolean(role.may_delete_items),
    'may_create-update-delete_system-items': Boolean(role['may_create-update-delete_system-items']),
    'may_use_tlp-red': Boolean(role['may_use_tlp-red']),
    'may_access_unsubscribed-markets': Boolean(role['may_access_unsubscribed-markets']),
  }
}

function entitlementSummary(role: AdminRole): string {
  return ENTITLEMENTS.filter((item) => Boolean(role[item.key]))
    .map((item) => item.label)
    .join(' · ')
}

export default function RolesAdminPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])
  const [roles, setRoles] = useState<AdminRole[] | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminRole | null>(null)
  const [form, setForm] = useState<RoleFormState>(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setRoles(await getRoles())
  }, [])

  useEffect(() => {
    document.title = 'Roles Admin | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) {
      return
    }
    void load().catch(() => {
      setRoles([])
      setError(true)
      setMessage('Could not load roles.')
    })
  }, [isSuperuser, load])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
    setMessage('')
  }

  function openEdit(role: AdminRole) {
    setEditing(role)
    setForm(formFromRole(role))
    setDialogOpen(true)
    setMessage('')
  }

  function closeDialog() {
    if (busy) {
      return
    }
    setDialogOpen(false)
    setEditing(null)
  }

  async function saveRole() {
    if (busy) {
      return
    }
    if (!form.name.trim() || !form.description.trim()) {
      setError(true)
      setMessage('Name and description are required.')
      return
    }

    const payload: RoleInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      needs_subscriptions: form.needs_subscriptions,
      'may_create-update_items': form['may_create-update_items'],
      may_delete_items: form.may_delete_items,
      'may_create-update-delete_system-items': form['may_create-update-delete_system-items'],
      'may_use_tlp-red': form['may_use_tlp-red'],
      'may_access_unsubscribed-markets': form['may_access_unsubscribed-markets'],
    }

    setBusy(true)
    setMessage('')
    try {
      if (editing) {
        await updateRole(editing.ID, payload)
        setError(false)
        setMessage(`Updated “${payload.name}”.`)
      } else {
        await createRole(payload)
        setError(false)
        setMessage(`Created “${payload.name}”.`)
      }
      setDialogOpen(false)
      setEditing(null)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not save role.')
    } finally {
      setBusy(false)
    }
  }

  async function removeRole(role: AdminRole) {
    if (busy) {
      return
    }
    if (!window.confirm(`Delete role “${role.name}”?`)) {
      return
    }
    setBusy(true)
    try {
      await deleteRole(role.ID)
      setError(false)
      setMessage(`Deleted “${role.name}”.`)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not delete role.')
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
          <Box component="span">Roles</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          Roles
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Define entitlements for system access and content permissions.
        </Typography>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required to manage roles.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <AppButton variant="outlined" color="inherit" onClick={() => void load()}>
                Refresh
              </AppButton>
              <AppButton onClick={openCreate}>New role</AppButton>
            </Box>

            {message ? (
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message}
              </Alert>
            ) : null}

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white' }}>
              {roles === null ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
              ) : roles.length === 0 ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>No roles found.</Typography>
              ) : (
                roles.map((role) => (
                  <Box
                    key={role.ID}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      flexWrap: 'wrap',
                      '&:last-of-type': { borderBottom: 0 },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{role.name}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 0.75 }}>{role.description}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {entitlementSummary(role) || 'No entitlements'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <AppButton size="small" variant="outlined" color="inherit" onClick={() => openEdit(role)}>
                        Edit
                      </AppButton>
                      <AppButton size="small" variant="outlined" color="inherit" disabled={busy} onClick={() => void removeRole(role)}>
                        Delete
                      </AppButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </>
        )}
      </Box>
      <AppFooter />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <TextField
            size="small"
            label="Name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
            sx={{ mt: 0.5 }}
          />
          <TextField
            size="small"
            label="Description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            required
            multiline
            minRows={2}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {ENTITLEMENTS.map((item) => (
              <FormControlLabel
                key={item.key}
                control={
                  <Checkbox
                    checked={form[item.key]}
                    onChange={(event) => setForm((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                  />
                }
                label={item.label}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton variant="outlined" color="inherit" disabled={busy} onClick={closeDialog}>
            Cancel
          </AppButton>
          <AppButton disabled={busy} onClick={() => void saveRole()}>
            {busy ? 'Saving…' : editing ? 'Save' : 'Create'}
          </AppButton>
        </DialogActions>
      </Dialog>
    </PageBackground>
  )
}

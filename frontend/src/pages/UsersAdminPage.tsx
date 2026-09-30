import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError, createUser, deleteUser, getRoles, getUsers, updateUser } from '@/api'
import type { AdminRole, AdminUser, UserCreateInput, UserUpdateInput } from '@/api'
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

type UserFormState = {
  firstname: string
  lastname: string
  username: string
  initials: string
  password: string
  role_ID: string
  active: boolean
  beta: boolean
  jobtitle: string
  iceattendent2027: boolean
}

const emptyForm = (): UserFormState => ({
  firstname: '',
  lastname: '',
  username: '',
  initials: '',
  password: '',
  role_ID: '',
  active: true,
  beta: false,
  jobtitle: '',
  iceattendent2027: false,
})

function formFromUser(user: AdminUser): UserFormState {
  return {
    firstname: user.firstname ?? '',
    lastname: user.lastname ?? '',
    username: user.username ?? '',
    initials: user.initials ?? '',
    password: '',
    role_ID: user.role_ID != null ? String(user.role_ID) : '',
    active: Boolean(user.active),
    beta: Boolean(user.beta),
    jobtitle: user.jobtitle ?? '',
    iceattendent2027: Boolean(user.iceattendent2027),
  }
}

export default function UsersAdminPage() {
  const { navigate } = useAppPath()
  const { user: me } = useAuth()
  const isSuperuser = Boolean(me?.role?.['may_create-update-delete_system-items'])
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const [nextUsers, nextRoles] = await Promise.all([getUsers(), getRoles()])
    setUsers(nextUsers)
    setRoles(nextRoles)
  }, [])

  useEffect(() => {
    document.title = 'Users Admin | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) {
      return
    }
    void load().catch(() => {
      setUsers([])
      setError(true)
      setMessage('Could not load users.')
    })
  }, [isSuperuser, load])

  const filtered = useMemo(() => {
    if (!users) {
      return []
    }
    const q = search.trim().toLowerCase()
    return users.filter((item) => {
      if (activeFilter === 'active' && !item.active) {
        return false
      }
      if (activeFilter === 'inactive' && item.active) {
        return false
      }
      if (roleFilter && String(item.role_ID) !== roleFilter) {
        return false
      }
      if (!q) {
        return true
      }
      const haystack = [
        item.firstname,
        item.lastname,
        item.username,
        item.initials,
        item.jobtitle,
        item.name_COMBINED,
        item.role?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [activeFilter, roleFilter, search, users])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
    setMessage('')
  }

  function openEdit(item: AdminUser) {
    setEditing(item)
    setForm(formFromUser(item))
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

  async function saveUser() {
    if (busy) {
      return
    }
    const roleId = Number(form.role_ID)
    if (!form.firstname.trim() || !form.lastname.trim() || !form.username.trim() || !form.initials.trim() || !form.jobtitle.trim() || !roleId) {
      setError(true)
      setMessage('Please fill all required fields.')
      return
    }
    if (!editing && form.password.length < 8) {
      setError(true)
      setMessage('Password must be at least 8 characters.')
      return
    }
    if (form.initials.trim().length !== 3) {
      setError(true)
      setMessage('Initials must be exactly 3 characters.')
      return
    }

    setBusy(true)
    setMessage('')
    try {
      if (editing) {
        const payload: UserUpdateInput = {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          username: form.username.trim(),
          initials: form.initials.trim().toUpperCase(),
          role_ID: roleId,
          active: form.active,
          beta: form.beta,
          jobtitle: form.jobtitle.trim(),
          iceattendent2027: form.iceattendent2027,
        }
        if (form.password.trim()) {
          payload.password = form.password
        }
        await updateUser(editing.ID, payload)
        setError(false)
        setMessage(`Updated ${form.username.trim()}.`)
      } else {
        const payload: UserCreateInput = {
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          username: form.username.trim(),
          initials: form.initials.trim().toUpperCase(),
          password: form.password,
          role_ID: roleId,
          active: form.active,
          beta: form.beta,
          jobtitle: form.jobtitle.trim(),
          iceattendent2027: form.iceattendent2027,
        }
        await createUser(payload)
        setError(false)
        setMessage(`Created ${form.username.trim()}.`)
      }
      setDialogOpen(false)
      setEditing(null)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not save user.')
    } finally {
      setBusy(false)
    }
  }

  async function deactivateUser(item: AdminUser) {
    if (busy || !item.active) {
      return
    }
    if (!window.confirm(`Deactivate “${item.username}”?`)) {
      return
    }
    setBusy(true)
    try {
      await updateUser(item.ID, { active: false })
      setError(false)
      setMessage(`Deactivated ${item.username}.`)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not deactivate user.')
    } finally {
      setBusy(false)
    }
  }

  async function removeUser(item: AdminUser) {
    if (busy || me?.ID === item.ID) {
      return
    }
    if (!window.confirm(`Permanently delete “${item.username}”?`)) {
      return
    }
    setBusy(true)
    try {
      await deleteUser(item.ID)
      setError(false)
      setMessage(`Deleted ${item.username}.`)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not delete user.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3, maxWidth: 1100, mx: 'auto', width: '100%' }}>
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
          <Box component="span">Users</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          Users
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Create and manage accounts, roles, and access flags.
        </Typography>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required to manage users.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                size="small"
                label="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: 200 }}
              />
              <TextField
                select
                size="small"
                label="Active"
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Role"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.ID} value={String(role.ID)}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
              <AppButton variant="outlined" color="inherit" onClick={() => void load()}>
                Refresh
              </AppButton>
              <AppButton onClick={openCreate}>New user</AppButton>
            </Box>

            {message ? (
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message}
              </Alert>
            ) : null}

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white', overflow: 'auto' }}>
              {users === null ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
              ) : filtered.length === 0 ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>No users found.</Typography>
              ) : (
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <Box component="thead" sx={{ bgcolor: 'grey.50', textAlign: 'left' }}>
                    <Box component="tr">
                      {['Name', 'Username', 'Role', 'Flags', 'Actions'].map((label) => (
                        <Box
                          component="th"
                          key={label}
                          sx={{ px: 2, py: 1.25, fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}
                        >
                          {label}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {filtered.map((item) => (
                      <Box component="tr" key={item.ID} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                        <Box component="td" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                            {item.name_COMBINED || `${item.firstname ?? ''} ${item.lastname ?? ''}`.trim() || '—'}
                          </Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                            {item.initials ?? '—'} · {item.jobtitle || 'No title'}
                          </Typography>
                        </Box>
                        <Box component="td" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                          {item.username}
                        </Box>
                        <Box component="td" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                          {item.role?.name ?? '—'}
                        </Box>
                        <Box component="td" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', color: 'text.secondary', fontSize: 12 }}>
                          {[
                            item.active ? 'active' : 'inactive',
                            item.beta ? 'beta' : null,
                            item.iceattendent2027 ? 'ICE attendee' : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Box>
                        <Box component="td" sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                          <AppButton size="small" variant="outlined" color="inherit" sx={{ mr: 0.5 }} onClick={() => openEdit(item)}>
                            Edit
                          </AppButton>
                          {item.active ? (
                            <AppButton size="small" variant="outlined" color="inherit" sx={{ mr: 0.5 }} disabled={busy} onClick={() => void deactivateUser(item)}>
                              Deactivate
                            </AppButton>
                          ) : null}
                          <AppButton
                            size="small"
                            variant="outlined"
                            color="inherit"
                            disabled={busy || me?.ID === item.ID}
                            onClick={() => void removeUser(item)}
                          >
                            Delete
                          </AppButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
      <AppFooter />

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit user' : 'New user'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 0.5 }}>
            <TextField
              size="small"
              label="First name"
              value={form.firstname}
              onChange={(event) => setForm((prev) => ({ ...prev, firstname: event.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Last name"
              value={form.lastname}
              onChange={(event) => setForm((prev) => ({ ...prev, lastname: event.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Username"
              value={form.username}
              onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Initials"
              value={form.initials}
              onChange={(event) => setForm((prev) => ({ ...prev, initials: event.target.value.slice(0, 3).toUpperCase() }))}
              slotProps={{ htmlInput: { maxLength: 3 } }}
              required
            />
            <TextField
              size="small"
              type="password"
              label={editing ? 'Password (optional)' : 'Password'}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required={!editing}
            />
            <TextField
              select
              size="small"
              label="Role"
              value={form.role_ID}
              onChange={(event) => setForm((prev) => ({ ...prev, role_ID: event.target.value }))}
              required
            >
              {roles.map((role) => (
                <MenuItem key={role.ID} value={String(role.ID)}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Job title"
              value={form.jobtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, jobtitle: event.target.value }))}
              required
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={form.active} onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))} />}
              label="Active"
            />
            <FormControlLabel
              control={<Checkbox checked={form.beta} onChange={(event) => setForm((prev) => ({ ...prev, beta: event.target.checked }))} />}
              label="Beta"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.iceattendent2027}
                  onChange={(event) => setForm((prev) => ({ ...prev, iceattendent2027: event.target.checked }))}
                />
              }
              label="ICE attendee 2027"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton variant="outlined" color="inherit" disabled={busy} onClick={closeDialog}>
            Cancel
          </AppButton>
          <AppButton disabled={busy} onClick={() => void saveUser()}>
            {busy ? 'Saving…' : editing ? 'Save' : 'Create'}
          </AppButton>
        </DialogActions>
      </Dialog>
    </PageBackground>
  )
}

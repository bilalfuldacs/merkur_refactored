import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import { ApiError, changeMyPassword } from '@/api'
import { AppButton, AppTextField } from '@/components/ui'

export const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])\S{10,}$/

type Hint = {
  kind: 'empty' | 'rules' | 'mismatch' | 'ready'
  text: string
}

function hintFor(current: string, next: string, confirm: string): Hint {
  if (!current) {
    return {
      kind: 'empty',
      text: '“Current Password” is empty. Please enter your current password.',
    }
  }
  if (!PASSWORD_PATTERN.test(next)) {
    return {
      kind: 'rules',
      text: '“New Password” does not comply. Please note the rules.',
    }
  }
  if (next !== confirm) {
    return {
      kind: 'mismatch',
      text: '“New Password” and “Validation” do not match. Please verify.',
    }
  }
  return { kind: 'ready', text: 'Ready to change your password.' }
}

export function ChangePasswordDialog({
  open,
  onClose,
  onChanged,
}: {
  open: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setCurrent('')
    setNext('')
    setConfirm('')
    setSaving(false)
    setError(null)
  }, [open])

  const hint = useMemo(() => hintFor(current, next, confirm), [current, next, confirm])
  const ready = hint.kind === 'ready'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!ready || saving) {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await changeMyPassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
      })
      onChanged()
      onClose()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The password could not be changed.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Change Password
        <IconButton aria-label="Close" onClick={onClose} disabled={saving}>
          <CloseOutlinedIcon />
        </IconButton>
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 0 }}>
          <AppTextField
            label="Current Password"
            type="password"
            name="current_password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
            <Box component="span" sx={{ color: 'info.main' }}>
              Rules:
            </Box>{' '}
            Your new password needs to have…
          </Typography>
          <Box component="ul" sx={{ mt: 0, mb: 2, pl: 3 }}>
            <li>At least 10 characters</li>
            <li>At least 1 lowercase letter</li>
            <li>At least 1 UPPERCASE letter</li>
            <li>At least 1 digit (0…9)</li>
          </Box>
          <AppTextField
            label="New Password"
            type="password"
            name="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            sx={{ mb: 2 }}
          />
          <AppTextField
            label="Validation"
            type="password"
            name="password_confirmation"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder="Enter your New Password again"
          />
          {error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : (
            <Typography
              sx={{
                mt: 2,
                color: ready ? 'success.main' : 'error.main',
                fontWeight: 700,
              }}
            >
              {hint.text}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton type="submit" disabled={!ready || saving} size="small">
            {saving ? 'Changing…' : 'Change Password'}
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

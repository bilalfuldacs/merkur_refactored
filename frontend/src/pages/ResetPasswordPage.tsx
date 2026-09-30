import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError, checkPasswordResetToken, completePasswordReset } from '@/api'
import { BrandWordmark, MerkurLogo } from '@/components/brand'
import { AuthShell } from '@/components/layout'
import { PASSWORD_PATTERN } from '@/components/profile/ChangePasswordDialog'
import { AppButton, AppCard, AppTextField } from '@/components/ui'
import { APP_PATHS, useAppPath } from '@/routing'

export default function ResetPasswordPage() {
  const { navigate, search } = useAppPath()
  const token = useMemo(() => new URLSearchParams(search).get('token') ?? '', [search])
  const [valid, setValid] = useState<boolean | null>(null)
  const [invalidMessage, setInvalidMessage] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setValid(false)
      setInvalidMessage('This reset link is invalid or has expired. Request a new one.')
      return
    }
    let cancelled = false
    void checkPasswordResetToken(token)
      .then((result) => {
        if (!cancelled) {
          setValid(result.valid)
          setInvalidMessage(result.message ?? 'This reset link is invalid or has expired. Request a new one.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValid(false)
          setInvalidMessage('This reset link is invalid or has expired. Request a new one.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const ready = PASSWORD_PATTERN.test(password) && password === confirm && password.length <= 50

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!ready) {
      setFormError('Please note the password rules and make sure both fields match.')
      return
    }
    setIsSubmitting(true)
    try {
      await completePasswordReset({ token, password, password_confirmation: confirm })
      setSaved(true)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'The password could not be saved.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell headerVariant="light">
      <Container maxWidth="lg" sx={{ width: '100%' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.15fr 0.85fr' },
            gap: { xs: 5, md: 8 },
            alignItems: 'center',
          }}
        >
          <Stack
            spacing={1.5}
            sx={{
              order: { xs: 2, md: 1 },
              textAlign: { xs: 'center', md: 'left' },
              alignItems: { xs: 'center', md: 'flex-start' },
              color: 'text.secondary',
            }}
          >
            <MerkurLogo size="lg" sx={{ maxWidth: { xs: 280, sm: 380, md: 460 } }} />
            <Typography variant="h4" component="p">
              The MERKUR Portal
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, lineHeight: 1.4 }}>
              People <Box component="span" sx={{ fontWeight: 800 }}>×</Box> Markets{' '}
              <Box component="span" sx={{ fontWeight: 800 }}>×</Box> Products
              <br />
              — it’s all in <BrandWordmark />.
            </Typography>
          </Stack>
          <Box sx={{ order: { xs: 1, md: 2 }, maxWidth: 440, mx: 'auto', width: '100%' }}>
            <AppCard accent>
              {saved ? (
                <Stack spacing={2.5}>
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    Password saved
                  </Typography>
                  <Alert severity="success">Your password has been saved. You can sign in now.</Alert>
                  <AppButton fullWidth onClick={() => navigate(APP_PATHS.home)}>
                    Sign in
                  </AppButton>
                </Stack>
              ) : valid === false ? (
                <Stack spacing={2.5}>
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    Reset password
                  </Typography>
                  <Alert severity="error">{invalidMessage}</Alert>
                  <AppButton fullWidth onClick={() => navigate(APP_PATHS.forgotPassword)}>
                    Request a new link
                  </AppButton>
                </Stack>
              ) : (
                <Stack component="form" onSubmit={handleSubmit} spacing={2.5} noValidate>
                  <Stack spacing={0.5} sx={{ mb: 1, textAlign: 'center' }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
                      Choose a new password
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your new password needs to have at least 10 characters, a lowercase letter, an uppercase letter, and a digit.
                    </Typography>
                  </Stack>
                  {formError ? (
                    <Alert severity="error" variant="outlined">
                      {formError}
                    </Alert>
                  ) : null}
                  <AppTextField
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    label="New password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting || valid !== true}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                  />
                  <AppTextField
                    type="password"
                    name="password_confirmation"
                    autoComplete="new-password"
                    label="Repeat password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    disabled={isSubmitting || valid !== true}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                  />
                  <AppButton type="submit" fullWidth loading={isSubmitting} disabled={!ready} endIcon={<ArrowForwardIcon />}>
                    Save password
                  </AppButton>
                </Stack>
              )}
            </AppCard>
          </Box>
        </Box>
      </Container>
    </AuthShell>
  )
}

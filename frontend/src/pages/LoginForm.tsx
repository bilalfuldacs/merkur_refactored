import { useState } from 'react'
import type { FormEvent } from 'react'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MailOutlinedIcon from '@mui/icons-material/MailOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import { useAuth } from '@/auth'
import { AppButton, AppCard, AppTextField } from '@/components/ui'
import { useI18n } from '@/i18n'
import { APP_PATHS, useAppPath } from '@/routing'

const credentialsMaxLength = 50

export function LoginForm() {
  const { navigate } = useAppPath()
  const { signIn } = useAuth()
  const { t } = useI18n()

  function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      return error.message
    }
    return t('login.networkError', 'Could not reach the server. Please try again.')
  }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const emailError = hasAttemptedSubmit && email.trim() === ''
  const passwordError = hasAttemptedSubmit && password.trim() === ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasAttemptedSubmit(true)
    setFormError(null)

    const username = email.trim()
    if (username === '' || password.trim() === '') {
      return
    }

    setIsSubmitting(true)

    try {
      await signIn({ username, password })
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppCard accent>
      <Stack component="form" onSubmit={handleSubmit} spacing={2.5} noValidate>
        <Stack spacing={0.5} sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            {t('login.title', 'Sign in to continue')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('login.subtitle', 'Access the full MERKUR ecosystem')}
          </Typography>
        </Stack>

        {formError ? (
          <Alert severity="error" variant="outlined">
            {formError}
          </Alert>
        ) : null}

        <AppTextField
          type="email"
          name="email"
          autoComplete="email"
          label={t('login.email', 'E-Mail Address')}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFormError(null)
          }}
          error={emailError}
          helperText={emailError ? t('login.emailRequired', 'Please enter your e-mail address.') : ' '}
          disabled={isSubmitting}
          startIcon={<MailOutlinedIcon fontSize="small" />}
          slotProps={{
            htmlInput: { maxLength: credentialsMaxLength },
          }}
        />

        <AppTextField
          type="password"
          name="password"
          autoComplete="current-password"
          label={t('login.password', 'MERKURflow Password')}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFormError(null)
          }}
          error={passwordError}
          helperText={passwordError ? t('login.passwordRequired', 'Please enter your password.') : ' '}
          disabled={isSubmitting}
          startIcon={<LockOutlinedIcon fontSize="small" />}
          slotProps={{
            htmlInput: { maxLength: credentialsMaxLength },
          }}
        />

        <AppButton
          type="submit"
          fullWidth
          loading={isSubmitting}
          endIcon={<ArrowForwardIcon />}
        >
          {t('login.submit', 'Sign in')}
        </AppButton>

        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          <Box
            component="button"
            type="button"
            onClick={() => navigate(APP_PATHS.forgotPassword)}
            sx={{ border: 0, p: 0, bgcolor: 'transparent', color: 'info.main', cursor: 'pointer', font: 'inherit', '&:hover': { textDecoration: 'underline' } }}
          >
            {t('login.forgot', 'Forgot password?')}
          </Box>
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('login.assistanceBefore', 'For assistance, contact')}{' '}
          <strong>{t('login.contacts', 'Bilal or Moritz')}</strong>{' '}
          {t('login.assistanceAfter', 'at the Strategic Intelligence Hub.')}
        </Typography>
      </Stack>
    </AppCard>
  )
}

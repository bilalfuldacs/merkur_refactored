import { useState } from 'react'
import type { FormEvent } from 'react'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MailOutlinedIcon from '@mui/icons-material/MailOutlined'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import { useAuth } from '@/auth'
import { AppButton, AppCard, AppTextField } from '@/components/ui'

const credentialsMaxLength = 50

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signIn } = useAuth()

  const emailError = submitted && email.trim() === ''
  const passwordError = submitted && password.trim() === ''

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setFormError('')

    const username = email.trim()
    if (username === '' || password.trim() === '') {
      return
    }

    setIsSubmitting(true)

    try {
      await signIn({ username, password })
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Could not reach the server. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppCard accent>
      <Stack component="form" onSubmit={handleSubmit} spacing={2.5} noValidate>
        <Stack spacing={0.5} sx={{ mb: 1, textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
            Sign in to continue
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access the full MERKUR ecosystem
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
          label="E-Mail Address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setFormError('')
          }}
          error={emailError}
          helperText={emailError ? 'Please enter your e-mail address.' : ' '}
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
          label="MERKURflow Password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFormError('')
          }}
          error={passwordError}
          helperText={passwordError ? 'Please enter your password.' : ' '}
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
          Sign in
        </AppButton>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          For assistance, contact <strong>Bilal or Moritz</strong> at the
          Strategic Intelligence Hub.
        </Typography>
      </Stack>
    </AppCard>
  )
}

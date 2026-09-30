import { useState } from 'react'
import type { FormEvent } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import MailOutlinedIcon from '@mui/icons-material/MailOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { ApiError, requestPasswordReset } from '@/api'
import { BrandWordmark, MerkurLogo } from '@/components/brand'
import { AuthShell } from '@/components/layout'
import { AppButton, AppCard, AppTextField } from '@/components/ui'
import { APP_PATHS, useAppPath } from '@/routing'

export default function ForgotPasswordPage() {
  const { navigate } = useAppPath()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    setFormError('')
    const value = email.trim()
    if (value === '') {
      return
    }
    setIsSubmitting(true)
    try {
      await requestPasswordReset(value)
      setSent(true)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'The reset email could not be sent. Please try again, or contact Bilal or Moritz.')
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
              {sent ? (
                <Stack spacing={2.5}>
                  <Typography variant="h5" component="h1" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    Forgot password
                  </Typography>
                  <Alert severity="success">
                    If that address belongs to an active account, a reset link is on its way. It expires in one hour.
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Nothing arrived? Check the spelling, then try again, or contact <strong>Bilal or Moritz</strong> at the Strategic Intelligence Hub.
                  </Typography>
                  <AppButton fullWidth onClick={() => navigate(APP_PATHS.home)}>
                    Back to sign in
                  </AppButton>
                </Stack>
              ) : (
                <Stack component="form" onSubmit={handleSubmit} spacing={2.5} noValidate>
                  <Stack spacing={0.5} sx={{ mb: 1, textAlign: 'center' }}>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
                      Forgot password
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      We will email you a link to choose a new one
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
                    error={submitted && email.trim() === ''}
                    helperText={submitted && email.trim() === '' ? 'Enter the e-mail address you use to sign in.' : ' '}
                    disabled={isSubmitting}
                    startIcon={<MailOutlinedIcon fontSize="small" />}
                    slotProps={{ htmlInput: { maxLength: 50 } }}
                  />
                  <AppButton type="submit" fullWidth loading={isSubmitting} endIcon={<ArrowForwardIcon />}>
                    Send reset link
                  </AppButton>
                  <AppButton variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(APP_PATHS.home)}>
                    Back to sign in
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

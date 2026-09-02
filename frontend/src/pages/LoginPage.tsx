import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { BrandWordmark, MerkurLogo } from '@/components/brand'
import { AuthShell } from '@/components/layout'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
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
            <Typography
              variant="h4"
              component="p"
             
            >
              The MERKUR Portal
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, lineHeight: 1.4 }}>
              People{' '}
              <Box component="span" sx={{ fontWeight: 800 }}>
                ×
              </Box>{' '}
              Markets{' '}
              <Box component="span" sx={{ fontWeight: 800 }}>
                ×
              </Box>{' '}
              Products
              <br />
              — it’s all in <BrandWordmark />.
            </Typography>
          </Stack>

          <Box sx={{ order: { xs: 1, md: 2 }, maxWidth: 440, mx: 'auto', width: '100%' }}>
            <LoginForm />
          </Box>
        </Box>
      </Container>
    </AuthShell>
  )
}

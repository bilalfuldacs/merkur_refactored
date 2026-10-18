import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import hubLogo from '@/assets/brand/strategic-intelligence-hub-light.svg'
import { useI18n } from '@/i18n'

export function AppFooter() {
  const { t } = useI18n()
  return (
    <Box
      component="footer"
      sx={{
        pl: { xs: 'max(16px, env(safe-area-inset-left, 0px))', md: 'max(32px, env(safe-area-inset-left, 0px))' },
        pr: { xs: 'max(16px, env(safe-area-inset-right, 0px))', md: 'max(32px, env(safe-area-inset-right, 0px))' },
        pt: 0.5,
        pb: 'max(8px, env(safe-area-inset-bottom, 0px))',
        flexShrink: 0,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 0.5, md: 1 },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
          {t('footer.madeWith', 'Made with')}{' '}
          <Box component="span" aria-hidden="true" sx={{ color: 'error.main' }}>
            ♥
          </Box>{' '}
          {t('footer.location', 'in Meckenheim & Lübbecke')}
        </Typography>

        <Box
          component="img"
          src={hubLogo}
          alt={t('footer.poweredBy', 'powered by Strategic Intelligence Hub')}
          sx={{ width: 120, height: 28, objectFit: 'contain', display: 'block' }}
        />

        <Typography variant="caption" color="text.secondary">
          {t('footer.copyright', '© 2022–2026, adp MERKUR GmbH • Authorized use only')}
        </Typography>
      </Box>
    </Box>
  )
}

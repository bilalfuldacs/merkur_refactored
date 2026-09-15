import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export const iceCrumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

export const icePillGroupSx = {
  gap: 1,
  flexWrap: 'wrap',
  mb: 3,
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
  },
} as const

export const icePillSx = {
  px: 1.5,
  py: 0.75,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  bgcolor: 'common.white',
  color: 'secondary.main',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

export const iceStickyBarSx = {
  position: 'sticky' as const,
  bottom: 0,
  zIndex: 20,
  pt: 2,
  pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
  mt: 2,
  display: 'flex',
  justifyContent: 'flex-end',
  bgcolor: 'rgba(255,255,255,0.94)',
  borderTop: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 -8px 24px rgba(0,0,0,.08)',
}

export function IceHero({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children?: ReactNode
}) {
  return (
    <Box
      sx={{
        bgcolor: 'secondary.main',
        color: 'common.white',
        borderRadius: '1rem',
        borderBottom: '5px solid',
        borderBottomColor: 'primary.main',
        px: { xs: 3, md: 5 },
        py: { xs: 3, md: 4.5 },
        mb: 3,
      }}
    >
      <Typography
        sx={{
          color: 'merkur.yellow',
          letterSpacing: '0.08em',
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          mb: 1,
        }}
      >
        {kicker}
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: 28, md: 36 }, lineHeight: 1.15, mb: 1 }}>
        {title}
      </Typography>
      {children ? (
        <Typography sx={{ opacity: 0.8, fontSize: 18, maxWidth: 720 }}>{children}</Typography>
      ) : null}
    </Box>
  )
}

export function IceSectionHead({ icon, title, action }: { icon?: ReactNode; title: string; action?: ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'secondary.main',
        color: 'common.white',
        borderRadius: '0.75rem 0.75rem 0 0',
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {icon}
      <Typography component="h2" sx={{ color: 'merkur.yellow', fontSize: 18, fontWeight: 800, m: 0, flex: 1 }}>
        {title}
      </Typography>
      {action}
    </Box>
  )
}

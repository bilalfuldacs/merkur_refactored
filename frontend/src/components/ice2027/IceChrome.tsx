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
  display: 'flex',
  width: '100%',
  gap: { xs: 0.75, sm: 1 },
  flexWrap: { xs: 'nowrap', sm: 'wrap' },
  overflowX: { xs: 'auto', sm: 'visible' },
  WebkitOverflowScrolling: 'touch',
  mb: { xs: 2, sm: 3 },
  pb: { xs: 0.25, sm: 0 },
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
} as const

export const icePillSx = {
  px: 1.5,
  py: 0.75,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
  flexShrink: 0,
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
  pt: { xs: 1.5, md: 2 },
  px: { xs: 0, md: 0 },
  pb: 'max(12px, env(safe-area-inset-bottom, 0px))',
  mt: 2,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: { xs: 'stretch', md: 'flex-end' },
  gap: 1,
  bgcolor: 'rgba(255,255,255,0.94)',
  borderTop: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 -8px 24px rgba(0,0,0,.08)',
  '& > .MuiButton-root': {
    width: { xs: '100%', md: 'auto' },
    minHeight: { xs: 48, md: undefined },
    borderRadius: { xs: '0.65rem', md: undefined },
  },
} as const

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
        px: { xs: 2, md: 5 },
        py: { xs: 2, md: 4.5 },
        mb: { xs: 2, md: 3 },
      }}
    >
      <Typography
        sx={{
          color: 'merkur.yellow',
          letterSpacing: '0.08em',
          fontSize: { xs: 12, md: 13 },
          fontWeight: 700,
          textTransform: 'uppercase',
          mb: { xs: 0.75, md: 1 },
        }}
      >
        {kicker}
      </Typography>
      <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: 23, md: 36 }, lineHeight: { xs: 1.2, md: 1.15 }, mb: 1 }}>
        {title}
      </Typography>
      {children ? (
        <Typography sx={{ opacity: 0.8, fontSize: { xs: 15, md: 18 }, maxWidth: 720 }}>{children}</Typography>
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
        px: { xs: 2, md: 3 },
        py: { xs: 1.25, md: 1.5 },
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
      }}
    >
      {icon}
      <Typography
        component="h2"
        sx={{ color: 'merkur.yellow', fontSize: { xs: 16, md: 18 }, fontWeight: 800, m: 0, flex: 1, minWidth: 0 }}
      >
        {title}
      </Typography>
      {action ? <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>{action}</Box> : null}
    </Box>
  )
}

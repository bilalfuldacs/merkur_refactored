import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function PanoramaPane({
  title,
  hint,
  count,
  toolbar,
  children,
}: {
  title: string
  hint: string
  count?: number
  toolbar?: ReactNode
  children: ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 280,
        height: { xs: 'min(62vh, 560px)', lg: 'min(68vh, 760px)' },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'rgba(255,255,255,0.92)',
        boxShadow: '0 10px 24px rgba(2, 32, 82, 0.06)',
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.25,
          bgcolor: 'rgba(0, 159, 227, 0.14)',
          borderBottom: '1px solid',
          borderColor: 'rgba(0, 159, 227, 0.28)',
        }}
      >
        <Typography
          component="h2"
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 1,
            fontWeight: 800,
            fontSize: 16,
            color: 'secondary.main',
            lineHeight: 1.2,
          }}
        >
          {title}
          {count != null ? (
            <Box component="span" sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary' }}>
              {count}
            </Box>
          ) : null}
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.25 }}>
          {hint}
        </Typography>
        {toolbar}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</Box>
    </Box>
  )
}

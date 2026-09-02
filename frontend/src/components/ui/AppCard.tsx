import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import type { PaperProps } from '@mui/material/Paper'
import type { SxProps, Theme } from '@mui/material/styles'

export type AppCardProps = PaperProps & {
  accent?: boolean
  contentSx?: SxProps<Theme>
}

export function AppCard({
  accent = false,
  children,
  contentSx,
  sx,
  ...props
}: AppCardProps) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          overflow: 'hidden',
          borderRadius: '1.25rem',
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow:
            '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          backdropFilter: 'blur(12px)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      {accent ? (
        <Box
          sx={{
            height: 5,
            background: (theme) =>
              `linear-gradient(to right, ${theme.palette.merkur.cyan}, ${theme.palette.merkur.green})`,
          }}
        />
      ) : null}
      <Box sx={[{ p: { xs: 4, md: 5 } }, ...(Array.isArray(contentSx) ? contentSx : contentSx ? [contentSx] : [])]}>
        {children}
      </Box>
    </Paper>
  )
}

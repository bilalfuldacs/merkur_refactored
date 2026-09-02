import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'

export const merkurPageBackground = {
  backgroundColor: '#fff',
  backgroundImage: `
    linear-gradient(rgba(255, 255, 255, 0.01), rgb(255, 255, 255) 85%),
    radial-gradient(at left top, rgba(13, 110, 253, 0.5), transparent 50%),
    radial-gradient(at right top, rgba(255, 228, 132, 0.5), transparent 50%),
    radial-gradient(at right center, rgba(113, 44, 249, 0.5), transparent 50%),
    radial-gradient(at left center, rgba(214, 51, 132, 0.5), transparent 50%)
  `,
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 500px',
} as const

export function PageBackground({ children, sx, ...props }: BoxProps) {
  return (
    <Box
      {...props}
      sx={[
        {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          ...merkurPageBackground,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}

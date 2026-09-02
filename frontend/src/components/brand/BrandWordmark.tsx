import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'

export type BrandWordmarkProps = BoxProps<'span'> & {
  variant?: 'positive' | 'negative'
}

export function BrandWordmark({
  variant = 'positive',
  sx,
  ...props
}: BrandWordmarkProps) {
  return (
    <Box
      component="span"
      sx={[
        { whiteSpace: 'nowrap', letterSpacing: 0 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      <Box
        component="strong"
        sx={{ fontWeight: 900, color: 'primary.main', fontStyle: 'normal' }}
      >
        MERKUR 
      </Box>
      <Box
        component="em"
        sx={{
          fontWeight: 300,
          fontStyle: 'italic',
          color: variant === 'negative' ? '#fff' : 'secondary.main',
        }}
      >
        flow
      </Box>
    </Box>
  )
}

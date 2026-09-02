import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'
import merkurSun from '@/assets/brand/merkur-sun.svg'

export type MerkurSunProps = Omit<BoxProps<'img'>, 'src' | 'alt' | 'component'> & {
  size?: number
  alt?: string
}

export function MerkurSun({ size = 128, alt = 'Merkur', sx, ...props }: MerkurSunProps) {
  return (
    <Box
      component="img"
      src={merkurSun}
      alt={alt}
      sx={[
        {
          width: size,
          height: size,
          display: 'block',
          objectFit: 'contain',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  )
}

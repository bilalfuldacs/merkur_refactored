import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'
import logoNegative from '@/assets/brand/merkurflow-neg.svg'
import logoPositive from '@/assets/brand/merkurflow-pos.svg'

const logoByVariant = {
  positive: logoPositive,
  negative: logoNegative,
} as const

const sizeHeights = {
  sm: 28,
  md: 56,
  lg: 80,
} as const

export type MerkurLogoProps = Omit<BoxProps<'img'>, 'src' | 'alt' | 'component'> & {
  variant?: keyof typeof logoByVariant
  size?: keyof typeof sizeHeights
  alt?: string
}

export function MerkurLogo({
  variant = 'positive',
  size = 'md',
  height,
  alt = 'MERKURflow',
  sx,
  ...props
}: MerkurLogoProps) {
  const resolvedHeight = height ?? sizeHeights[size]

  return (
    <Box
      component="img"
      src={logoByVariant[variant]}
      alt={alt}
      sx={[
        {
          height: resolvedHeight,
          width: 'auto',
          maxWidth: '100%',
          display: 'block',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    />
  )
}

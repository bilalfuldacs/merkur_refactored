import Chip from '@mui/material/Chip'
import type { ProductStatus } from '@/api'
import { badgeTextColor, statusLabel } from './format'

export function StatusBadge({
  status,
  size = 'small',
}: {
  status: Pick<ProductStatus, 'name' | 'color' | 'text_color'>
  size?: 'small' | 'medium'
}) {
  return (
    <Chip
      size={size}
      label={statusLabel(status.name)}
      sx={{
        height: size === 'small' ? 22 : 26,
        fontWeight: 700,
        bgcolor: status.color || 'grey.300',
        color: badgeTextColor(status),
        '& .MuiChip-label': { px: 1 },
      }}
    />
  )
}

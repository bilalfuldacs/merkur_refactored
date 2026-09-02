import type { ReactNode } from 'react'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined'
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'

const sharedSx = {
  borderRadius: 999,
  fontWeight: 800,
  textTransform: 'none' as const,
  letterSpacing: 0.2,
  transition: 'transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease',
} as const

const filledSx = {
  ...sharedSx,
  px: 2,
  py: 1,
  color: '#fff',
  background: 'linear-gradient(135deg, #009FE3 0%, #022052 100%)',
  boxShadow: '0 10px 22px rgba(0, 159, 227, 0.32)',
  '&:hover': {
    background: 'linear-gradient(135deg, #33B2E9 0%, #03306f 100%)',
    boxShadow: '0 14px 28px rgba(0, 159, 227, 0.42)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '& .MuiButton-startIcon, & .MuiButton-endIcon': { color: '#fff' },
} as const

const outlineSx = {
  ...sharedSx,
  px: 1.75,
  py: 0.75,
  color: '#022052',
  bgcolor: '#fff',
  border: '2px solid #009FE3',
  boxShadow: '0 6px 16px rgba(2, 32, 82, 0.06)',
  '&:hover': {
    bgcolor: 'rgba(0, 159, 227, 0.1)',
    borderColor: '#009FE3',
    transform: 'translateY(-1px)',
    boxShadow: '0 10px 20px rgba(0, 159, 227, 0.18)',
  },
  '& .MuiButton-startIcon, & .MuiButton-endIcon': { color: '#009FE3' },
} as const

export function MarketActionButton({
  appearance = 'filled',
  chevron = true,
  children,
  sx,
  ...props
}: ButtonProps & { appearance?: 'filled' | 'outline'; chevron?: boolean }) {
  return (
    <Button
      size="small"
      disableElevation
      variant={appearance === 'outline' ? 'outlined' : 'contained'}
      endIcon={chevron ? <ChevronRightOutlinedIcon sx={{ fontSize: 18 }} /> : undefined}
      {...props}
      sx={[appearance === 'filled' ? filledSx : outlineSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {children as ReactNode}
    </Button>
  )
}

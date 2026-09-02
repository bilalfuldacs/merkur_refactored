import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import type { SortDirection } from './sort'

export function DirectoryList({
  title,
  totalLabel,
  shown,
  sortDirection,
  onToggleSort,
  sx,
  children,
}: {
  title: string
  totalLabel: string
  shown: number
  sortDirection?: SortDirection
  onToggleSort?: () => void
  sx?: SxProps<Theme>
  children: ReactNode
}) {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 360,
          height: { xs: 'min(56vh, 520px)', md: 'min(72vh, 820px)' },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'common.white',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'secondary.main' }}>{title}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{totalLabel}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip size="small" label={`${shown} shown`} sx={{ bgcolor: 'rgba(0, 159, 227, 0.14)', color: 'secondary.main', fontWeight: 700 }} />
          {onToggleSort && sortDirection ? (
            <IconButton size="small" onClick={onToggleSort} aria-label={sortDirection === 'asc' ? 'Sort Z to A' : 'Sort A to Z'}>
              {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
            </IconButton>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</Box>
    </Box>
  )
}

export function DirectoryListItem({
  selected,
  onClick,
  leading,
  title,
  meta,
}: {
  selected: boolean
  onClick: () => void
  leading?: ReactNode
  title: string
  meta: string
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        width: '100%',
        textAlign: 'left',
        border: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 2,
        py: 1.35,
        cursor: 'pointer',
        bgcolor: selected ? 'secondary.main' : 'transparent',
        color: selected ? 'common.white' : 'text.primary',
        font: 'inherit',
        '&:hover': {
          bgcolor: selected ? 'secondary.main' : 'rgba(2, 32, 82, 0.04)',
        },
      }}
    >
      {leading ? <Box sx={{ flexShrink: 0, fontSize: 20, lineHeight: 1 }}>{leading}</Box> : null}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'inherit', lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: selected ? 'rgba(255,255,255,0.78)' : 'text.secondary', mt: 0.15 }}>
          {meta}
        </Typography>
      </Box>
    </Box>
  )
}

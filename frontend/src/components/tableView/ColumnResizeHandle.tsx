import Box from '@mui/material/Box'
import type { KeyboardEvent, PointerEvent } from 'react'
import { COLUMN_MAX_WIDTH, COLUMN_MIN_WIDTH } from '@/tableView/useColumnWidths'

export function ColumnResizeHandle({
  label,
  width,
  active,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
  onKeyDown,
}: {
  label: string
  width: number
  active: boolean
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onPointerMove: (event: PointerEvent<HTMLElement>) => void
  onPointerUp: (event: PointerEvent<HTMLElement>) => void
  onDoubleClick: () => void
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void
}) {
  return (
    <Box
      component="span"
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${label} column`}
      aria-valuemin={COLUMN_MIN_WIDTH}
      aria-valuemax={COLUMN_MAX_WIDTH}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: '100%',
        cursor: 'col-resize',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 1,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 6,
          bottom: 6,
          right: 3,
          width: 2,
          borderRadius: 1,
          bgcolor: active ? 'info.main' : 'grey.400',
        },
        '&:hover::after, &:focus-visible::after': {
          bgcolor: 'info.main',
        },
      }}
      title="Drag to resize. Double-click to reset."
    />
  )
}

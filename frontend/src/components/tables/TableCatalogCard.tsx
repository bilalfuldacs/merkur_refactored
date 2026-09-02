import HistoryIcon from '@mui/icons-material/History'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { TablesCatalogTable } from '@/api'
import { iconForTable } from './tableIcons'

function itemLabel(count: number): string {
  return count === 1 ? '1 item' : `${count} items`
}

export function TableCatalogCard({
  item,
  onOpen,
}: {
  item: TablesCatalogTable
  onOpen?: (item: TablesCatalogTable) => void
}) {
  const Icon = iconForTable(item.icon)
  const clickable = Boolean(onOpen)

  return (
    <Box
      component={clickable ? 'button' : 'div'}
      type={clickable ? 'button' : undefined}
      onClick={clickable ? () => onOpen?.(item) : undefined}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.800',
        borderRadius: 1,
        opacity: item.faded ? 0.5 : 1,
        textAlign: 'left',
        p: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: clickable ? 'pointer' : 'default',
        width: '100%',
      }}
    >
      <Box sx={{ height: 8, bgcolor: item.color || 'merkur.pink', flexShrink: 0 }} />
      <Box sx={{ p: 2, pb: 1.5, flex: 1 }}>
        <Typography
          component="h3"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            fontWeight: 800,
            fontSize: 18,
            color: 'info.main',
            lineHeight: 1.3,
            mb: 0.75,
          }}
        >
          <Icon sx={{ color: item.color || 'merkur.pink', fontSize: 22, mt: '2px' }} />
          {item.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {item.description}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: 'grey.100',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{itemLabel(item.item_count)}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
          {item.is_system ? <SettingsIcon sx={{ fontSize: 18, color: 'info.main' }} /> : null}
          {item.has_history ? (
            <HistoryIcon sx={{ fontSize: 18, color: 'success.main', ml: 0.75 }} />
          ) : null}
          {item.can_edit ? (
            <LockOpenIcon sx={{ fontSize: 18, color: 'success.main', ml: 0.75 }} />
          ) : (
            <LockIcon sx={{ fontSize: 18, color: 'error.main', ml: 0.75 }} />
          )}
        </Box>
      </Box>
    </Box>
  )
}

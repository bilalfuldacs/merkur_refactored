import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReportsCatalogReport } from '@/api'
import { reportIcon } from '@/config/reports'

export function ReportCatalogCard({
  item,
  onOpen,
}: {
  item: ReportsCatalogReport
  onOpen: (item: ReportsCatalogReport) => void
}) {
  const Icon = reportIcon(item.name)

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(item)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.800',
        borderRadius: 1,
        textAlign: 'left',
        p: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <Box sx={{ height: 8, bgcolor: item.color || 'merkur.pink', flexShrink: 0 }} />
      <Box sx={{ p: 2 }}>
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
    </Box>
  )
}

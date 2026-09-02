import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import type { FeedbackStatus, FeedbackSubmission } from '@/api'
import { AppTextField } from '@/components/ui'
import { formatSubmittedAt, STATUS_LABELS } from './constants'

const STATUS_COLOR: Record<FeedbackStatus, 'default' | 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
  new: 'secondary',
  under_review: 'warning',
  planned: 'info',
  in_progress: 'info',
  completed: 'success',
  declined: 'error',
}

export function FeedbackList({
  items,
  query,
  status,
  onQueryChange,
  onStatusChange,
  onSelect,
}: {
  items: FeedbackSubmission[]
  query: string
  status: string
  onQueryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onSelect: (item: FeedbackSubmission) => void
}) {
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 1fr) 200px' },
          gap: 1.5,
          mb: 2,
        }}
      >
        <AppTextField
          size="small"
          label="Search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search title or description"
        />
        <AppTextField select size="small" label="Status" value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <MenuItem value="">All statuses</MenuItem>
          {(Object.keys(STATUS_LABELS) as FeedbackStatus[]).map((key) => (
            <MenuItem key={key} value={key}>
              {STATUS_LABELS[key]}
            </MenuItem>
          ))}
        </AppTextField>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'common.white' }}>
        {items.length === 0 ? (
          <Typography sx={{ p: 4, color: 'text.secondary', textAlign: 'center' }}>No feedback matches these filters.</Typography>
        ) : (
          items.map((item, index) => (
            <Box
              key={item.id}
              component="button"
              type="button"
              onClick={() => onSelect(item)}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 140px 160px 120px' },
                gap: 1,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                border: 0,
                borderBottom: index === items.length - 1 ? 0 : '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
                px: 2,
                py: 1.75,
                cursor: 'pointer',
                font: 'inherit',
                '&:hover': { bgcolor: 'grey.50' },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 800, color: 'secondary.main', fontSize: 15 }}>{item.subject}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                  {item.reference}
                  {item.related_area ? ` · ${item.related_area}` : ''}
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{item.type_label}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{formatSubmittedAt(item.submitted_at)}</Typography>
              <Box>
                <Chip
                  size="small"
                  label={STATUS_LABELS[item.status] ?? item.status}
                  color={STATUS_COLOR[item.status] ?? 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Box>
  )
}

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { FeedbackSubmission } from '@/api'
import { openFeedbackScreenshot } from '@/api'
import { AppButton } from '@/components/ui'
import { formatSubmittedAt, STATUS_LABELS } from './constants'

export function FeedbackDetailDialog({
  item,
  onClose,
}: {
  item: FeedbackSubmission | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(item)} onClose={onClose} fullWidth maxWidth="sm">
      {item ? (
        <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box>
              <Typography sx={{ color: 'info.main', fontSize: 12, fontWeight: 800, letterSpacing: 0.4, mb: 0.75 }}>
                {item.reference} · {item.type_label}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main', lineHeight: 1.25 }}>
                {item.subject}
              </Typography>
            </Box>
            <IconButton aria-label="Close" onClick={onClose}>
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
          <Chip size="small" label={STATUS_LABELS[item.status] ?? item.status} sx={{ fontWeight: 700, mb: 2 }} />
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <DetailRow label="Area" value={item.related_area || 'General'} />
            <DetailRow label="Submitted" value={formatSubmittedAt(item.submitted_at)} />
            <DetailRow label="Description" value={item.description} />
          </Box>
          {item.has_screenshot ? (
            <AppButton variant="outlined" color="secondary" size="small" sx={{ mt: 2.5 }} onClick={() => void openFeedbackScreenshot(item.id)}>
              Open screenshot
            </AppButton>
          ) : null}
        </Box>
      ) : null}
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ pb: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700, mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ color: 'secondary.main', fontSize: 15, whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </Box>
  )
}

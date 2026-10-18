import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppButton } from '@/components/ui'
import { useI18n } from '@/i18n'

const lifecycle = [
  { n: 1, label: 'feedback.stepSubmitted', detail: 'feedback.stepSubmittedDetail' },
  { n: 2, label: 'feedback.stepReviewed', detail: 'feedback.stepReviewedDetail' },
  { n: 3, label: 'feedback.stepUpdated', detail: 'feedback.stepUpdatedDetail' },
]

export function FeedbackEmptyState({ onSubmit }: { onSubmit: () => void }) {
  const { t } = useI18n()
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' },
        gap: { xs: 3, md: 4 },
        alignItems: 'center',
        p: { xs: 3, md: 4 },
        borderRadius: 3,
        bgcolor: 'rgba(237, 237, 237, 0.65)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box>
        <AddBoxOutlinedIcon sx={{ color: 'secondary.main', fontSize: 36, mb: 1 }} />
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: 'secondary.main', mb: 1 }}>{t('feedback.emptyTitle', 'Share your first idea')}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 15, mb: 2.5, maxWidth: 520 }}>
          {t('feedback.emptyBody', 'Tell the MERKURflow team what would make your work easier. A focused submission normally takes about two minutes.')}
        </Typography>
        <AppButton color="secondary" onClick={onSubmit}>
          {t('feedback.submit', 'Submit feedback')}
        </AppButton>
      </Box>
      <Box component="ol" sx={{ m: 0, pl: 0, listStyle: 'none', display: 'grid', gap: 2 }}>
        {lifecycle.map((step) => (
          <Box key={step.n} component="li" sx={{ display: 'flex', gap: 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'secondary.main',
                color: 'common.white',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {step.n}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: 'secondary.main' }}>{t(step.label)}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{t(step.detail)}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

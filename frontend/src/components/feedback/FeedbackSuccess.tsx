import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppButton } from '@/components/ui'
import { useI18n } from '@/i18n'

export function FeedbackSuccess({ onView, onSubmitAnother }: { onView: () => void; onSubmitAnother: () => void }) {
  const { t } = useI18n()
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2,
        p: 2.5,
        mb: 3,
        borderRadius: 2,
        bgcolor: 'rgba(237, 237, 237, 0.8)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CheckCircleOutlineOutlinedIcon sx={{ color: 'success.main', fontSize: 36 }} />
      <Box sx={{ flex: 1, minWidth: 220 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'secondary.main' }}>{t('feedback.successTitle', 'Feedback submitted')}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
          {t('feedback.successBody', 'Your feedback has been recorded as {status}. You can follow its progress from {mine}.', {
            status: t('feedback.statusUnderReview', 'Under review'),
            mine: t('feedback.mine', 'My feedback'),
          })}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <AppButton color="secondary" size="small" onClick={onView}>
          {t('feedback.viewMine', 'View my feedback')}
        </AppButton>
        <AppButton variant="text" color="inherit" size="small" onClick={onSubmitAnother} sx={{ color: 'info.main' }}>
          {t('feedback.submitAnother', 'Submit another')}
        </AppButton>
      </Box>
    </Box>
  )
}

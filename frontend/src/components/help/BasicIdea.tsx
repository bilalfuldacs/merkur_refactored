import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import { useI18n } from '@/i18n'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const steps = [
  { n: 1, labelKey: 'help.data', label: 'Data', detailKey: 'help.dataDetail', detail: 'The basic building block.' },
  { n: 2, labelKey: 'help.information', label: 'Information', detailKey: 'help.informationDetail', detail: 'Collated, structured data.' },
  { n: 3, labelKey: 'help.knowledge', label: 'Knowledge', detailKey: 'help.knowledgeDetail', detail: 'Meaningful information.' },
  { n: 4, labelKey: 'help.consistency', label: 'Consistency', detailKey: 'help.consistencyDetail', detail: 'Everything fits.' },
]

export function BasicIdea({ onFeedback }: { onFeedback: () => void }) {
  const { t } = useI18n()
  return (
    <Box
      sx={{
        mt: 6,
        pt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 2.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main' }}>{t('help.basicIdea', 'The basic idea')}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, textAlign: 'right' }}>
          {t('help.basicSource', 'One trusted source for People, Markets and Products')}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 1.5, md: 2 },
          py: 1,
        }}
      >
        {steps.map((step, index) => (
          <Box key={step.n} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
            <Box sx={{ textAlign: 'center', minWidth: 88 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 18, color: step.n === 4 ? 'merkur.gold' : 'merkur.pink' }}>
                {step.n} {t(step.labelKey, step.label)}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>{t(step.detailKey, step.detail)}</Typography>
            </Box>
            {index < steps.length - 1 ? (
              <ArrowForwardOutlinedIcon sx={{ color: 'text.disabled', display: { xs: 'none', sm: 'block' } }} />
            ) : null}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
        <Box
          component="button"
          type="button"
          onClick={onFeedback}
          sx={{
            border: 0,
            p: 0,
            bgcolor: 'transparent',
            color: 'info.main',
            cursor: 'pointer',
            font: 'inherit',
            fontSize: 13,
            fontWeight: 700,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {t('help.giveFeedback', 'Give feedback')}
        </Box>
      </Box>
    </Box>
  )
}

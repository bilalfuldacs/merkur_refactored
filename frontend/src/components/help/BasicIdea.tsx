import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const steps = [
  { n: 1, label: 'Data', detail: 'The basic building block.' },
  { n: 2, label: 'Information', detail: 'Collated, structured data.' },
  { n: 3, label: 'Knowledge', detail: 'Meaningful information.' },
  { n: 4, label: 'Consistency', detail: 'Everything fits.' },
]

export function BasicIdea({ onFeedback }: { onFeedback: () => void }) {
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
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main' }}>The basic idea</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, textAlign: 'right' }}>
          One trusted source for People, Markets and Products
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
                {step.n} {step.label}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>{step.detail}</Typography>
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
          Give feedback
        </Box>
      </Box>
    </Box>
  )
}

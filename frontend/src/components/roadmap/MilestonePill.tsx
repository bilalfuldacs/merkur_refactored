import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { RoadmapMilestone } from '@/api'

export function MilestonePill({ milestone }: { milestone: RoadmapMilestone }) {
  const done = milestone.done
  const code = milestone.jurisdiction?.iso3166?.replace(/[()]/g, '') ?? ''
  const status = (milestone.status?.name ?? '').replace(/\s+/g, ' ').trim()
  const extra = milestone.comment?.trim()
  const statusColor = milestone.status?.color || (done ? '#a2c617' : '#009fe3')

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        mb: 0.75,
        borderRadius: 1,
        bgcolor: done ? 'common.white' : 'grey.100',
        border: '1px solid',
        borderColor: done ? 'success.main' : 'info.main',
        color: 'secondary.main',
        maxWidth: '100%',
      }}
    >
      {done ? (
        <CheckCircleOutlinedIcon sx={{ fontSize: 14, color: 'success.main' }} />
      ) : (
        <HourglassEmptyOutlinedIcon sx={{ fontSize: 14, color: 'info.main' }} />
      )}
      <Typography component="span" sx={{ fontWeight: 800, fontSize: 12, whiteSpace: 'nowrap' }}>
        {done ? milestone.date_label : `to be ${milestone.date_label}`}
      </Typography>
      {code ? (
        <Typography component="span" sx={{ fontWeight: 700, fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap' }}>
          {code}
        </Typography>
      ) : null}
      {status ? (
        <Box
          component="span"
          sx={{
            px: 0.6,
            py: 0.1,
            borderRadius: 999,
            bgcolor: statusColor,
            color: 'common.white',
            fontSize: 10,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
          {extra ? ` ${extra}` : ''}
        </Box>
      ) : extra ? (
        <Typography component="span" sx={{ fontSize: 11 }}>{extra}</Typography>
      ) : null}
    </Box>
  )
}

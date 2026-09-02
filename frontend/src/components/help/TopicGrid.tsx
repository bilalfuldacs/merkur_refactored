import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { HelpTopic, HelpTopicId } from './topics'

export function TopicGrid({
  topics,
  counts,
  selected,
  onSelect,
}: {
  topics: HelpTopic[]
  counts: Record<HelpTopicId, number>
  selected: HelpTopicId | null
  onSelect: (id: HelpTopicId | null) => void
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
        gap: 1.5,
      }}
    >
      {topics.map((topic) => {
        const Icon = topic.icon
        const count = counts[topic.id] ?? 0
        const active = selected === topic.id
        return (
          <Box
            key={topic.id}
            component="button"
            type="button"
            onClick={() => onSelect(active ? null : topic.id)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1.25,
              p: 2,
              minHeight: 128,
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 3,
              border: '1.5px solid',
              borderColor: active ? 'info.main' : 'divider',
              bgcolor: active ? 'rgba(0, 159, 227, 0.06)' : 'common.white',
              boxShadow: active ? '0 8px 24px rgba(0, 159, 227, 0.12)' : 'none',
              font: 'inherit',
              color: 'inherit',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
              '&:hover': {
                borderColor: 'info.main',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Icon sx={{ color: active ? 'info.main' : 'secondary.main', fontSize: 28 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'secondary.main', lineHeight: 1.3 }}>
                {topic.label}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.35 }}>
                {count} answer{count === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

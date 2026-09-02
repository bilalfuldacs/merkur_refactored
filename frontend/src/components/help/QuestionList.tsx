import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { FaqArticle } from '@/api'
import { displayFaqTitle, readingMinutes, topicForFaq } from './topics'

export function QuestionList({
  faqs,
  selectedId,
  onSelect,
}: {
  faqs: FaqArticle[]
  selectedId: number | null
  onSelect: (faq: FaqArticle) => void
}) {
  if (faqs.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        No answers match that search.
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        columnGap: 4,
      }}
    >
      {faqs.map((faq) => {
        const topic = topicForFaq(faq)
        const selected = selectedId === faq.ID
        return (
          <Box
            key={faq.ID}
            component="button"
            type="button"
            onClick={() => onSelect(faq)}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
              width: '100%',
              py: 1.75,
              px: 1.5,
              mx: -1.5,
              border: 0,
              borderBottom: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: selected ? 'grey.100' : 'transparent',
              textAlign: 'left',
              cursor: 'pointer',
              font: 'inherit',
              color: 'inherit',
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'secondary.main', lineHeight: 1.4 }}>
              {displayFaqTitle(faq.title)}
            </Typography>
            <Typography
              sx={{
                color: 'text.secondary',
                fontSize: 12,
                whiteSpace: 'nowrap',
                pt: 0.25,
                flexShrink: 0,
              }}
            >
              {topic.label} · {readingMinutes(faq.article)} min read
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { FaqArticle } from '@/api'
import { displayFaqTitle, readingMinutes, topicForFaq } from './topics'

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

export function FaqArticleDialog({
  faq,
  onClose,
}: {
  faq: FaqArticle | null
  onClose: () => void
}) {
  const topic = faq ? topicForFaq(faq) : null
  const html = faq ? looksLikeHtml(faq.article) : false
  const updated = faq?.mod_date
    ? new Date(faq.mod_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null
  const editor = faq?.editor?.firstname || faq?.editor?.lastname || faq?.editor?.username

  return (
    <Dialog open={Boolean(faq)} onClose={onClose} fullWidth maxWidth="md">
      {faq ? (
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box>
              <Typography sx={{ color: 'info.main', fontSize: 12, fontWeight: 800, letterSpacing: 0.4, mb: 0.75 }}>
                {topic?.label} · {readingMinutes(faq.article)} min read
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 22, md: 28 }, color: 'secondary.main', lineHeight: 1.25 }}>
                {displayFaqTitle(faq.title)}
              </Typography>
            </Box>
            <IconButton aria-label="Close" onClick={onClose}>
              <CloseOutlinedIcon />
            </IconButton>
          </Box>
          <Box
            sx={{
              pl: 2,
              borderLeft: '4px solid',
              borderColor: 'secondary.main',
              color: 'text.primary',
              fontSize: 16,
              lineHeight: 1.7,
              '& p': { mb: 1.5 },
              '& ul, & ol': { pl: 3, mb: 1.5 },
            }}
          >
            {html ? (
              <Box dangerouslySetInnerHTML={{ __html: faq.article }} />
            ) : (
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{faq.article}</Typography>
            )}
          </Box>
          {updated ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 3 }}>
              Last updated{editor ? ` by ${editor}` : ''} on {updated}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Dialog>
  )
}

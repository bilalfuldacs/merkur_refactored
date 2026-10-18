import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { FaqArticle } from '@/api'
import { useI18n } from '@/i18n'
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
  const { locale, t, faqCopy } = useI18n()
  const stored = faq ? faqCopy(faq.title) : null
  const topic = faq ? topicForFaq(faq) : null
  const html = faq ? looksLikeHtml(stored?.article || faq.article) : false
  const articleHtml = stored?.article || faq?.article || ''
  const updated = faq?.mod_date
    ? new Date(faq.mod_date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
    : null
  const editor = faq?.editor?.firstname || faq?.editor?.lastname || faq?.editor?.username

  return (
    <Dialog open={Boolean(faq)} onClose={onClose} fullWidth maxWidth="md">
      {faq ? (
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Box>
              <Typography sx={{ color: 'info.main', fontSize: 12, fontWeight: 800, letterSpacing: 0.4, mb: 0.75 }}>
                {topic ? t('help.minRead', '{topic} · {count} min read', { topic: t(topic.labelKey, topic.label), count: readingMinutes(faq.article) }) : null}
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 22, md: 28 }, color: 'secondary.main', lineHeight: 1.25 }}>
                {stored?.title || displayFaqTitle(faq.title)}
              </Typography>
            </Box>
            <IconButton aria-label={t('common.close', 'Close')} onClick={onClose}>
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
              '& a': { color: 'info.main', fontWeight: 700 },
            }}
          >
            {html ? (
              <Box dangerouslySetInnerHTML={{ __html: articleHtml }} />
            ) : (
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{articleHtml}</Typography>
            )}
          </Box>
          {updated ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 3 }}>
              {editor
                ? t('help.updatedBy', 'Last updated by {name} on {date}', { name: editor, date: updated })
                : t('help.updatedOn', 'Last updated on {date}', { date: updated })}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Dialog>
  )
}

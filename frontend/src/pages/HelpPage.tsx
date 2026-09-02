import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getHelpFaqs } from '@/api'
import type { FaqArticle } from '@/api'
import {
  BasicIdea,
  FaqArticleDialog,
  HELP_TOPICS,
  HelpSearch,
  QuestionList,
  TopicGrid,
  searchFaqs,
  topicForFaq,
} from '@/components/help'
import type { HelpTopicId } from '@/components/help'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { APP_PATHS, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

function faqIdFromSearch(): number | null {
  const id = Number(new URLSearchParams(window.location.search).get('id'))
  return Number.isInteger(id) && id > 0 ? id : null
}

export default function HelpPage() {
  const { navigate } = useAppPath()
  const [faqs, setFaqs] = useState<FaqArticle[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [topicId, setTopicId] = useState<HelpTopicId | null>(null)
  const [openFaq, setOpenFaq] = useState<FaqArticle | null>(null)

  useEffect(() => {
    document.title = 'Help & FAQ | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getHelpFaqs()
      .then((result) => {
        if (cancelled) {
          return
        }
        setFaqs(result)
        const wanted = faqIdFromSearch()
        if (wanted) {
          setOpenFaq(result.find((faq) => faq.ID === wanted) ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const searched = useMemo(() => searchFaqs(faqs ?? [], query), [faqs, query])
  const visible = useMemo(
    () => (topicId ? searched.filter((faq) => topicForFaq(faq).id === topicId) : searched),
    [searched, topicId],
  )
  const counts = useMemo(() => {
    const next = Object.fromEntries(HELP_TOPICS.map((topic) => [topic.id, 0])) as Record<HelpTopicId, number>
    for (const faq of searched) {
      next[topicForFaq(faq).id] += 1
    }
    return next
  }, [searched])
  const selectedTopic = HELP_TOPICS.find((topic) => topic.id === topicId)

  function openArticle(faq: FaqArticle) {
    setOpenFaq(faq)
    navigate(`${APP_PATHS.help}?id=${faq.ID}`)
  }

  function closeArticle() {
    setOpenFaq(null)
    navigate(APP_PATHS.help)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Help & FAQ</Box>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography sx={{ color: 'info.main', fontWeight: 800, fontSize: 13, letterSpacing: 0.6, mb: 1 }}>
              MERKURflow Help
            </Typography>
            <Typography
              component="h1"
              sx={{ fontWeight: 800, fontSize: { xs: 28, md: 40 }, color: 'secondary.main', lineHeight: 1.15, mb: 1 }}
            >
              What do you need help with?
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 16 }}>
              Search for an answer or browse one of the main help topics.
            </Typography>
          </Box>

          {failed ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              Help articles could not be loaded.
            </Typography>
          ) : faqs === null ? null : (
            <>
              <HelpSearch value={query} resultCount={visible.length} onChange={setQuery} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main' }}>Browse by topic</Typography>
                {topicId ? (
                  <Box
                    component="button"
                    type="button"
                    onClick={() => setTopicId(null)}
                    sx={{
                      border: 0,
                      p: 0,
                      bgcolor: 'transparent',
                      color: 'info.main',
                      cursor: 'pointer',
                      font: 'inherit',
                      fontSize: 14,
                      fontWeight: 700,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Show all
                  </Box>
                ) : null}
              </Box>
              <TopicGrid topics={HELP_TOPICS} counts={counts} selected={topicId} onSelect={setTopicId} />

              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mt: 5, mb: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main' }}>Popular questions</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {selectedTopic?.label ?? 'All topics'}
                </Typography>
              </Box>
              <QuestionList faqs={visible} selectedId={openFaq?.ID ?? null} onSelect={openArticle} />

              <BasicIdea onFeedback={() => navigate(`${APP_PATHS.feedback}?new=1`)} />
            </>
          )}
        </Box>
      </Box>
      <FaqArticleDialog faq={openFaq} onClose={closeArticle} />
      <AppFooter />
    </PageBackground>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { createFeedback, getMyFeedback } from '@/api'
import type { FeedbackInput, FeedbackSubmission } from '@/api'
import {
  FeedbackDetailDialog,
  FeedbackEmptyState,
  FeedbackList,
  FeedbackSuccess,
  SubmitFeedbackDialog,
} from '@/components/feedback'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
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

const pillGroupSx = {
  gap: 1,
  flexWrap: 'wrap',
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
  },
} as const

const pillSx = {
  px: 1.5,
  py: 0.75,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  bgcolor: 'common.white',
  color: 'secondary.main',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

function idFromSearch(): number | null {
  const id = Number(new URLSearchParams(window.location.search).get('id'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function wantsNew(): boolean {
  return new URLSearchParams(window.location.search).get('new') === '1'
}

export default function FeedbackPage() {
  const { navigate } = useAppPath()
  const [items, setItems] = useState<FeedbackSubmission[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState<FeedbackSubmission | null>(null)

  const load = useCallback(async () => {
    const result = await getMyFeedback({ per_page: 100 })
    setItems(result.data)
    setFailed(false)
    const wanted = idFromSearch()
    if (wanted) {
      setSelected(result.data.find((item) => item.id === wanted) ?? null)
    }
  }, [])

  useEffect(() => {
    document.title = 'Feedback | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void load().catch(() => {
      if (!cancelled) {
        setItems(null)
        setFailed(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [load])

  useEffect(() => {
    if (wantsNew()) {
      setDialogOpen(true)
    }
  }, [])

  function openSubmit() {
    setSubmitted(false)
    setDialogOpen(true)
    navigate(`${APP_PATHS.feedback}?new=1`)
  }

  function closeSubmit() {
    setDialogOpen(false)
    navigate(APP_PATHS.feedback)
  }

  async function handleSubmit(input: FeedbackInput) {
    setSaving(true)
    try {
      const created = await createFeedback(input)
      setItems((current) => [created, ...(current ?? [])])
      setDialogOpen(false)
      setSubmitted(true)
      navigate(APP_PATHS.feedback)
    } finally {
      setSaving(false)
    }
  }

  function openItem(item: FeedbackSubmission) {
    setSelected(item)
    setSubmitted(false)
    navigate(`${APP_PATHS.feedback}?id=${item.id}`)
  }

  function closeItem() {
    setSelected(null)
    navigate(APP_PATHS.feedback)
  }

  const visible = useMemo(() => {
    const list = items ?? []
    const needle = query.trim().toLowerCase()
    return list.filter((item) => {
      if (status && item.status !== status) {
        return false
      }
      if (!needle) {
        return true
      }
      return `${item.subject} ${item.description} ${item.reference}`.toLowerCase().includes(needle)
    })
  }, [items, query, status])

  const empty = (items?.length ?? 0) === 0

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Feedback</Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
            <Box>
              <Typography
                component="h1"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15 }}
              >
                <LightbulbOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
                Feedback
              </Typography>
              <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
                Share an idea, report a problem, and follow what happens next.
              </Typography>
            </Box>
            <AppButton size="small" color="secondary" onClick={openSubmit}>
              + New feedback
            </AppButton>
          </Box>

          <ToggleButtonGroup
            exclusive
            value={dialogOpen ? 'submit' : 'mine'}
            onChange={(_event, next) => {
              if (next === 'submit') {
                openSubmit()
              }
            }}
            sx={{ ...pillGroupSx, mb: 3 }}
          >
            <ToggleButton value="mine" sx={pillSx}>
              <DescriptionOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
              My feedback
            </ToggleButton>
            <ToggleButton value="submit" sx={pillSx}>
              <SendOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Submit feedback
            </ToggleButton>
          </ToggleButtonGroup>

          {submitted ? (
            <FeedbackSuccess
              onView={() => {
                setSubmitted(false)
                if (items?.[0]) {
                  openItem(items[0])
                }
              }}
              onSubmitAnother={openSubmit}
            />
          ) : null}

          {failed ? (
            <Typography color="text.secondary">Your feedback could not be loaded.</Typography>
          ) : items === null ? null : empty && !submitted ? (
            <FeedbackEmptyState onSubmit={openSubmit} />
          ) : (
            <FeedbackList
              items={visible}
              query={query}
              status={status}
              onQueryChange={setQuery}
              onStatusChange={setStatus}
              onSelect={openItem}
            />
          )}
        </Box>
      </Box>
      <SubmitFeedbackDialog open={dialogOpen} saving={saving} onClose={closeSubmit} onSubmit={handleSubmit} />
      <FeedbackDetailDialog item={selected} onClose={closeItem} />
      <AppFooter />
    </PageBackground>
  )
}

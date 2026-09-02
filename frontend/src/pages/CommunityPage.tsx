import { useEffect, useMemo, useState } from 'react'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import {
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPosts,
  getMentionablePeople,
  toggleCommunityBookmark,
  toggleCommunityLike,
  updateCommunityPost,
} from '@/api'
import type { CommunityFeedView, CommunityPost, MentionablePerson } from '@/api'
import { useAuth } from '@/auth'
import { CommunitySidebar, PostCard, PostComposer, postKind } from '@/components/community'
import type { FeedTab } from '@/components/community'
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

export default function CommunityPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const decolorize = Boolean(user?.decolorize_avatars)
  const [view, setView] = useState<CommunityFeedView>('timeline')
  const [tab, setTab] = useState<FeedTab>('all')
  const [posts, setPosts] = useState<CommunityPost[] | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [failed, setFailed] = useState(false)
  const [posting, setPosting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [people, setPeople] = useState<MentionablePerson[]>([])

  useEffect(() => {
    document.title = 'Community | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getMentionablePeople()
      .then((result) => {
        if (!cancelled) {
          setPeople(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPeople([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setPosts(null)
    setFailed(false)
    setPage(1)

    void getCommunityPosts({ view, page: 1 })
      .then((result) => {
        if (!cancelled) {
          setPosts(result.data)
          setLastPage(result.meta.last_page)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosts(null)
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [view])

  const visible = useMemo(() => {
    if (!posts) {
      return []
    }
    if (tab === 'all') {
      return posts
    }
    return posts.filter((post) => postKind(post) === tab)
  }, [posts, tab])

  async function loadMore() {
    const next = page + 1
    const result = await getCommunityPosts({ view, page: next })
    setPosts((current) => [...(current ?? []), ...result.data])
    setPage(next)
    setLastPage(result.meta.last_page)
  }

  async function handlePost(note: string, imagePreview?: string | null) {
    setPosting(true)
    try {
      const created = await createCommunityPost(note)
      setPosts((current) => [{ ...created, imagePreview: imagePreview ?? null, can_edit: true }, ...(current ?? [])])
      setView('timeline')
      setTab('all')
    } finally {
      setPosting(false)
    }
  }

  function replacePost(updated: CommunityPost) {
    setPosts(
      (current) =>
        current?.map((post) =>
          post.ID === updated.ID ? { ...post, ...updated, imagePreview: updated.imagePreview ?? post.imagePreview } : post,
        ) ?? null,
    )
  }

  async function handleEdit(post: CommunityPost, note: string) {
    setBusyId(post.ID)
    try {
      replacePost(await updateCommunityPost(post.ID, note))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(post: CommunityPost) {
    setBusyId(post.ID)
    try {
      await deleteCommunityPost(post.ID)
      setPosts((current) => current?.filter((item) => item.ID !== post.ID) ?? null)
    } finally {
      setBusyId(null)
    }
  }

  async function handleLike(post: CommunityPost) {
    setBusyId(post.ID)
    try {
      replacePost(await toggleCommunityLike(post.ID))
    } finally {
      setBusyId(null)
    }
  }

  async function handleBookmark(post: CommunityPost) {
    setBusyId(post.ID)
    try {
      replacePost(await toggleCommunityBookmark(post.ID))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Community</Box>
          </Box>

          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15, mb: 2 }}
          >
            <ChatOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
            Community
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={tab}
            onChange={(_event, value: FeedTab | null) => {
              if (value) {
                setTab(value)
                setView('timeline')
              }
            }}
            aria-label="Conversation type"
            sx={{ ...pillGroupSx, mb: 2 }}
          >
            <ToggleButton value="all" sx={pillSx}>
              All conversations
            </ToggleButton>
            <ToggleButton value="idea" sx={pillSx}>
              Ideas
            </ToggleButton>
            <ToggleButton value="question" sx={pillSx}>
              Questions
            </ToggleButton>
            <ToggleButton value="update" sx={pillSx}>
              Updates
            </ToggleButton>
          </ToggleButtonGroup>

          {failed ? (
            <Typography color="text.secondary">The community feed could not be loaded.</Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' },
                gap: 3,
                alignItems: 'start',
                mb: 4,
              }}
            >
              <Box>
                {view === 'timeline' ? (
                  <PostComposer user={user} people={people} decolorize={decolorize} posting={posting} onPost={handlePost} />
                ) : (
                  <Typography sx={{ fontWeight: 800, mb: 2 }}>
                    {view === 'mentions' ? `Mentions of @${user?.initials || 'you'}` : 'Saved bookmarks'}
                  </Typography>
                )}
                {posts === null ? (
                  null
                ) : visible.length === 0 ? (
                  <Typography color="text.secondary">
                    {view === 'mentions'
                      ? `No mentions yet. Others can tag you with @${user?.initials || 'your initials'}.`
                      : view === 'bookmarks'
                        ? 'No saved bookmarks yet.'
                        : 'No conversations in this view yet.'}
                  </Typography>
                ) : (
                  visible.map((post) => (
                    <PostCard
                      key={post.ID}
                      post={post}
                      people={people}
                      decolorize={decolorize}
                      busy={busyId === post.ID}
                      onLike={() => void handleLike(post)}
                      onBookmark={() => void handleBookmark(post)}
                      onEdit={(note) => handleEdit(post, note)}
                      onDelete={() => handleDelete(post)}
                    />
                  ))
                )}
                {posts && page < lastPage ? (
                  <AppButton variant="outlined" color="secondary" onClick={() => void loadMore()} sx={{ display: 'block', mx: 'auto', mt: 1 }}>
                    Load more
                  </AppButton>
                ) : null}
              </Box>
              <CommunitySidebar
                tab={tab}
                view={view}
                initials={user?.initials}
                onSelectTab={(next) => {
                  setTab(next)
                  setView('timeline')
                }}
                onShowBookmarks={() => {
                  setView('bookmarks')
                  setTab('all')
                }}
                onShowMentions={() => {
                  setView('mentions')
                  setTab('all')
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

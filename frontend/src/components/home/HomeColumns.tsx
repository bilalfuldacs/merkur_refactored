import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import { createCommunityPost, getHomeDashboard } from '@/api'
import type { HomeCatalogItem, HomeChange, HomeDashboard, HomePost } from '@/api'
import { useAuth } from '@/auth'
import { AppButton, AppTextField } from '@/components/ui'
import { UserAvatar } from '@/components/user'
import { tableBrowsePath } from '@/config/tablePages'
import { reportPath } from '@/config/reports'
import { APP_PATHS, useAppPath } from '@/routing'
import { displayName, excerptNote, formatAgo } from './format'
import { iconForHomeKey } from './homeIcons'

const emptyDashboard: HomeDashboard = {
  changes: [],
  reports: [],
  tables: [],
  posts: [],
}

const paneScrollSx = {
  height: '100%',
  minHeight: 0,
  overflow: 'scroll',
  scrollbarGutter: 'stable',
  '&::-webkit-scrollbar': { width: 10 },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'rgba(0,0,0,0.28)',
    borderRadius: 8,
  },
} as const

export function HomeColumns() {
  const { user } = useAuth()
  const { navigate } = useAppPath()
  const [dashboard, setDashboard] = useState<HomeDashboard>(emptyDashboard)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const decolorize = Boolean(user?.decolorize_avatars)
  const firstName = user?.firstname?.trim() || 'there'

  useEffect(() => {
    let cancelled = false

    void getHomeDashboard()
      .then((payload) => {
        if (!cancelled) {
          setDashboard(payload)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDashboard(emptyDashboard)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handleDraftSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const note = draft.trim()
    if (note === '' || posting) {
      return
    }
    setPosting(true)
    try {
      const post = await createCommunityPost(note)
      setDraft('')
      setDashboard((current) => ({
        ...current,
        posts: [
          {
            ID: post.ID,
            note: post.note,
            modified_at: post.mod_date,
            num_likes: post.num_likes,
            num_comments: post.num_comments,
            editor: post.editor,
          },
          ...current.posts,
        ],
      }))
    } finally {
      setPosting(false)
    }
  }

  return (
    <Box
      component="section"
      aria-label="Home feed"
      sx={{
        flex: 1,
        minHeight: { xs: 480, lg: 0 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)' },
        gridTemplateRows: { xs: 'repeat(3, minmax(50vh, auto))', lg: 'minmax(0, 1fr)' },
        gap: 2,
        width: '100%',
        py: 2,
      }}
    >
      <FeedPane>
        {dashboard.changes.length === 0 ? (
          <EmptyLabel>No recent changes</EmptyLabel>
        ) : (
          dashboard.changes.map((item) => (
            <ChangeRow
              key={item.id}
              item={item}
              decolorize={decolorize}
              onOpen={() => navigate(`${tableBrowsePath(item.table)}?id=${item.id.replace(`${item.table}-`, '')}`)}
            />
          ))
        )}
        <Box sx={{ px: 1.5, py: 1.5 }}>
          <AppButton
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<SyncOutlinedIcon />}
            endIcon={<ChevronRightIcon />}
            onClick={() => navigate(APP_PATHS.latestChanges)}
          >
            Latest Changes
          </AppButton>
        </Box>
      </FeedPane>

      <Box
        sx={{
          ...paneScrollSx,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 3,
          background: 'linear-gradient(187deg, #022052 0%, #009FE3 100%)',
          color: 'common.white',
          p: { xs: 2, md: 3 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.35)',
          },
        }}
      >
        <Typography
          component="h1"
          sx={{
            color: 'merkur.yellow',
            fontWeight: 800,
            fontSize: { xs: 32, md: 42 },
            textAlign: 'center',
            mb: 3,
            lineHeight: 1.15,
          }}
        >
          Welcome back, {firstName}.
        </Typography>

        <SectionLabel>Reports</SectionLabel>
        <MiniCardGrid>
          {dashboard.reports.map((item) => (
            <MiniAppCard
              key={item.ID}
              item={item}
              itemKey={item.name}
              onOpen={() => navigate(reportPath(item.name))}
            />
          ))}
        </MiniCardGrid>

        <SectionLabel>Tables</SectionLabel>
        <MiniCardGrid>
          {dashboard.tables.map((item) => (
            <MiniAppCard
              key={item.ID}
              item={item}
              itemKey={item.table}
              onOpen={() => item.table && navigate(tableBrowsePath(item.table))}
            />
          ))}
        </MiniCardGrid>
      </Box>

      <FeedPane>
        <Box
          component="form"
          onSubmit={handleDraftSubmit}
          sx={{ display: 'flex', gap: 1.25, p: 1.5, pb: 1 }}
        >
          <UserAvatar user={user} decolorize={decolorize} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <AppTextField
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What’s on your mind?"
              multiline
              minRows={2}
              slotProps={{ htmlInput: { maxLength: 280 } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <AppButton
                type="submit"
                size="medium"
                color="info"
                disabled={draft.trim() === '' || posting}
                startIcon={<SendOutlinedIcon />}
              >
                Post
              </AppButton>
            </Box>
          </Box>
        </Box>
        <Divider />
        {dashboard.posts.length === 0 ? (
          <EmptyLabel>No posts yet</EmptyLabel>
        ) : (
          dashboard.posts.map((item) => (
            <PostRow key={item.ID} item={item} decolorize={decolorize} />
          ))
        )}
      </FeedPane>
    </Box>
  )
}

function FeedPane({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        ...paneScrollSx,
        overflow: 'auto',
        scrollbarGutter: 'auto',
        bgcolor: 'transparent',
        border: 0,
        boxShadow: 'none',
      }}
    >
      {children}
    </Box>
  )
}

function EmptyLabel({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
      {children}
    </Typography>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.7)',
        borderRadius: 1,
        px: 1.25,
        py: 0.5,
        mb: 1.5,
        fontWeight: 700,
      }}
    >
      {children}
      <ChevronRightIcon sx={{ fontSize: 18, ml: 0.5 }} />
    </Box>
  )
}

function MiniCardGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(3, minmax(0, 1fr))',
          xl: 'repeat(4, minmax(0, 1fr))',
        },
        gap: 1.5,
        mb: 3,
      }}
    >
      {children}
    </Box>
  )
}

function MiniAppCard({
  item,
  itemKey,
  onOpen,
}: {
  item: HomeCatalogItem
  itemKey?: string
  onOpen?: () => void
}) {
  const Icon = iconForHomeKey(itemKey)

  return (
    <Box
      component={onOpen ? 'button' : 'div'}
      type={onOpen ? 'button' : undefined}
      onClick={onOpen}
      sx={{
        bgcolor: '#212529',
        color: 'common.white',
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.35)',
        textAlign: 'center',
        boxShadow: 3,
        p: 0,
        font: 'inherit',
        cursor: onOpen ? 'pointer' : 'default',
        width: '100%',
      }}
    >
      <Box sx={{ height: 8, bgcolor: item.color || 'merkur.pink' }} />
      <Box sx={{ pt: 1.5, pb: 0.5 }}>
        <Icon sx={{ fontSize: 32, color: item.color || 'merkur.pink' }} />
      </Box>
      <Typography sx={{ px: 0.75, pb: 1.25, fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>
        {item.title}
      </Typography>
    </Box>
  )
}

function ChangeRow({
  item,
  decolorize,
  onOpen,
}: {
  item: HomeChange
  decolorize: boolean
  onOpen: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
        px: 1.5,
        py: 1,
        bgcolor: 'transparent',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3, color: 'secondary.main' }}>
        <Box component="span" sx={{ color: item.color, mr: 1 }}>
          ●
        </Box>
        {item.title || item.table_title}
      </Typography>
      {item.subtitle ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, pl: 2.5 }}>
          {item.subtitle}
        </Typography>
      ) : null}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, pl: 2.5 }}>
        <UserAvatar user={item.editor} decolorize={decolorize} />
        <Typography variant="body2">
          {displayName(item.editor)}
          <Box component="span" sx={{ color: 'text.secondary', ml: 0.75 }}>
            • {formatAgo(item.modified_at)}
          </Box>
        </Typography>
      </Box>
      <Divider sx={{ mt: 1 }} />
    </Box>
  )
}

function PostRow({ item, decolorize }: { item: HomePost; decolorize: boolean }) {
  const note = excerptNote(item.note)

  return (
    <Box sx={{ px: 1.5, py: 1.25, '&:hover': { bgcolor: 'action.hover' } }}>
      <Box sx={{ display: 'flex', gap: 1.25 }}>
        <UserAvatar user={item.editor} decolorize={decolorize} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>{displayName(item.editor)}</Typography>
          {note ? (
            <Typography
              variant="body2"
              sx={{
                mt: 0.5,
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {note}
            </Typography>
          ) : null}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <FavoriteBorderIcon fontSize="small" color="error" />
              <Typography variant="caption">{item.num_likes || ''}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ChatBubbleOutlineOutlinedIcon fontSize="small" color="info" />
              <Typography variant="caption">{item.num_comments || ''}</Typography>
            </Box>
            <BookmarkBorderIcon fontSize="small" color="info" />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {formatAgo(item.modified_at)}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ mt: 1.25 }} />
    </Box>
  )
}

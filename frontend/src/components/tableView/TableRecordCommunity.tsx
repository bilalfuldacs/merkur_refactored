import { useEffect, useState } from 'react'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import CloseIcon from '@mui/icons-material/Close'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
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
import type { CommunityPost, MentionablePerson } from '@/api'
import { useAuth } from '@/auth'
import { PostCard } from '@/components/community'
import { MentionField } from '@/components/community/MentionField'
import { AppButton } from '@/components/ui'
import { UserAvatar } from '@/components/user'

const EMOJIS = ['😀', '😎', '🤔', '😕', '😡']

export function TableRecordCommunity({
  open,
  table,
  recordId,
  itemLabel,
  decolorize,
  onClose,
  onCountChange,
}: {
  open: boolean
  table: string
  recordId: number
  itemLabel: string
  decolorize: boolean
  onClose: () => void
  onCountChange?: (count: number) => void
}) {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[] | null>(null)
  const [people, setPeople] = useState<MentionablePerson[]>([])
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [posting, setPosting] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false
    setPosts(null)
    setError(null)
    void getCommunityPosts({ view: 'item', table, item_ID: recordId, per_page: 50 })
      .then((result) => {
        if (!cancelled) {
          setPosts(result.data)
          onCountChange?.(result.meta.total)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([])
          setError('Community posts could not be loaded.')
        }
      })
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
  }, [open, table, recordId])

  function replacePost(updated: CommunityPost) {
    setPosts(
      (current) =>
        current?.map((post) => (post.ID === updated.ID ? { ...post, ...updated } : post)) ?? null,
    )
  }

  async function handlePost() {
    const text = note.trim()
    if (!text || posting) {
      return
    }
    setPosting(true)
    setError(null)
    try {
      const created = await createCommunityPost(text, { table, item_ID: recordId })
      setPosts((current) => {
        const next = [{ ...created, can_edit: true }, ...(current ?? [])]
        onCountChange?.(next.length)
        return next
      })
      setNote('')
    } catch {
      setError('This post could not be published.')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(post: CommunityPost) {
    setBusyId(post.ID)
    try {
      await deleteCommunityPost(post.ID)
      setPosts((current) => {
        const next = current?.filter((item) => item.ID !== post.ID) ?? []
        onCountChange?.(next.length)
        return next
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'common.white',
        }}
      >
        <ChatOutlinedIcon sx={{ color: 'merkur.pink' }} />
        <Typography sx={{ fontWeight: 800, flex: 1 }}>Community</Typography>
        <IconButton aria-label="Close community" onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, overflow: 'auto', flex: 1, minHeight: 0 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1.5 }}>
          Posts about this {itemLabel.toLowerCase()}. They also appear on the Community page.
        </Typography>

        <Box
          sx={{
            mb: 2,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'common.white',
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <UserAvatar user={user} size="sm" decolorize={decolorize} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <MentionField
                people={people}
                decolorize={decolorize}
                value={note}
                onChange={(value) => setNote(value.slice(0, 280))}
                maxLength={280}
                minRows={2}
                placeholder="What’s on your mind?"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                {EMOJIS.map((emoji) => (
                  <IconButton
                    key={emoji}
                    size="small"
                    aria-label={`Insert ${emoji}`}
                    onClick={() => setNote((current) => `${current}${emoji}`.slice(0, 280))}
                    sx={{ fontSize: 16 }}
                  >
                    {emoji}
                  </IconButton>
                ))}
                <Box sx={{ flex: 1 }} />
                <AppButton
                  type="button"
                  size="small"
                  disabled={!note.trim() || posting}
                  onClick={() => void handlePost()}
                  startIcon={<SendOutlinedIcon />}
                >
                  {posting ? 'Posting…' : 'Post'}
                </AppButton>
              </Box>
            </Box>
          </Box>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {posts === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
            <ChatOutlinedIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
            <Typography sx={{ fontWeight: 800 }}>No posts yet</Typography>
            <Typography sx={{ fontSize: 14 }}>Be the first to post.</Typography>
          </Box>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.ID}
              post={post}
              people={people}
              decolorize={decolorize}
              busy={busyId === post.ID}
              onLike={() => {
                setBusyId(post.ID)
                void toggleCommunityLike(post.ID)
                  .then(replacePost)
                  .finally(() => setBusyId(null))
              }}
              onBookmark={() => {
                setBusyId(post.ID)
                void toggleCommunityBookmark(post.ID)
                  .then(replacePost)
                  .finally(() => setBusyId(null))
              }}
              onEdit={async (nextNote) => {
                setBusyId(post.ID)
                try {
                  replacePost(await updateCommunityPost(post.ID, nextNote))
                } finally {
                  setBusyId(null)
                }
              }}
              onDelete={() => handleDelete(post)}
            />
          ))
        )}
      </Box>
    </Drawer>
  )
}

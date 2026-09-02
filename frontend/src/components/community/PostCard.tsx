import { useEffect, useState } from 'react'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import BookmarkOutlinedIcon from '@mui/icons-material/BookmarkOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import type { CommunityComment, CommunityPost, MentionablePerson } from '@/api'
import { createCommunityComment, getCommunityComments } from '@/api'
import { AppButton } from '@/components/ui'
import { UserAvatar } from '@/components/user'
import { formatFeedAgo, kindLabel, personName, postBody, postKind, postTitle, stripPostHtml } from './format'
import { MentionField, MentionText } from './MentionField'

export function PostCard({
  post,
  people,
  decolorize,
  busy,
  onLike,
  onBookmark,
  onEdit,
  onDelete,
}: {
  post: CommunityPost
  people: MentionablePerson[]
  decolorize: boolean
  busy: boolean
  onLike: () => void
  onBookmark: () => void
  onEdit: (note: string) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(stripPostHtml(post.note))
  const [saving, setSaving] = useState(false)
  const [openReplies, setOpenReplies] = useState(false)
  const [comments, setComments] = useState<CommunityComment[] | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const kind = postKind(post)
  const title = postTitle(post.note)
  const body = postBody(post.note)

  useEffect(() => {
    setDraft(stripPostHtml(post.note))
    setEditing(false)
  }, [post.ID, post.note])

  useEffect(() => {
    if (!openReplies || comments !== null) {
      return
    }
    let cancelled = false
    void getCommunityComments(post.ID)
      .then((result) => {
        if (!cancelled) {
          setComments(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setComments([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [openReplies, comments, post.ID])

  async function sendReply() {
    const note = reply.trim()
    if (!note || sending) {
      return
    }
    setSending(true)
    try {
      const created = await createCommunityComment(post.ID, note)
      setComments((current) => [...(current ?? []), created])
      setReply('')
    } finally {
      setSending(false)
    }
  }

  async function saveEdit() {
    const note = draft.trim()
    if (!note || saving) {
      return
    }
    setSaving(true)
    try {
      await onEdit(note)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    setMenuAnchor(null)
    if (!window.confirm('Delete this post? This cannot be undone.')) {
      return
    }
    await onDelete()
  }

  return (
    <Box
      sx={{
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'common.white',
      }}
    >
      <Box sx={{ p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
          <UserAvatar user={post.editor} size="md" decolorize={decolorize} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{personName(post.editor)}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              {[post.editor?.jobtitle, formatFeedAgo(post.mod_date)].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          {kind === 'idea' || kind === 'question' ? (
            <Chip size="small" label={kindLabel(kind)} sx={{ fontWeight: 700 }} />
          ) : null}
          {post.can_edit ? (
            <>
              <IconButton size="small" aria-label="Post actions" onClick={(event) => setMenuAnchor(event.currentTarget)}>
                <MoreHorizOutlinedIcon />
              </IconButton>
              <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null)
                    setDraft(stripPostHtml(post.note))
                    setEditing(true)
                  }}
                >
                  <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
                <MenuItem onClick={() => void confirmDelete()} sx={{ color: 'error.main' }}>
                  <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              </Menu>
            </>
          ) : null}
        </Box>

        {editing ? (
          <Box sx={{ mt: 1.5 }}>
            <MentionField
              people={people}
              decolorize={decolorize}
              value={draft}
              onChange={setDraft}
              maxLength={10000}
              minRows={3}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <AppButton variant="text" color="secondary" size="small" onClick={() => setEditing(false)}>
                Cancel
              </AppButton>
              <AppButton size="small" disabled={!draft.trim() || saving} onClick={() => void saveEdit()}>
                {saving ? 'Saving…' : 'Save'}
              </AppButton>
            </Box>
          </Box>
        ) : (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: 18, mt: 1.5, color: 'secondary.main', lineHeight: 1.3 }}>
              <MentionText text={title} />
            </Typography>
            {body ? (
              <Typography sx={{ mt: 0.75, fontSize: 14, whiteSpace: 'pre-wrap', color: 'text.primary', lineHeight: 1.55 }}>
                <MentionText text={body} />
              </Typography>
            ) : null}
          </>
        )}

        {post.table ? (
          <Typography sx={{ mt: 1, fontSize: 12, color: 'info.main', fontWeight: 700 }}>
            Linked to {post.table}
            {post.item_ID ? ` #${post.item_ID}` : ''}
          </Typography>
        ) : null}
      </Box>

      {post.imagePreview ? (
        <Box
          component="img"
          src={post.imagePreview}
          alt=""
          sx={{ display: 'block', width: '100%', height: { xs: 160, md: 220 }, objectFit: 'cover', bgcolor: 'grey.100' }}
        />
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
        <IconButton size="small" aria-label="Like" disabled={busy} onClick={onLike} color={post.my_like ? 'error' : 'default'}>
          {post.my_like ? <FavoriteOutlinedIcon fontSize="small" /> : <FavoriteBorderOutlinedIcon fontSize="small" />}
        </IconButton>
        <Typography sx={{ fontSize: 13, minWidth: 16 }}>{post.num_likes || ''}</Typography>
        <IconButton size="small" aria-label="Replies" onClick={() => setOpenReplies((current) => !current)}>
          <ChatBubbleOutlineOutlinedIcon fontSize="small" color="info" />
        </IconButton>
        <Typography sx={{ fontSize: 13, minWidth: 16 }}>{post.num_comments || post.num_replies || ''}</Typography>
        <IconButton
          size="small"
          aria-label="Save"
          disabled={busy}
          onClick={onBookmark}
          sx={{ ml: 'auto' }}
          color={post.my_bookmark ? 'info' : 'default'}
        >
          {post.my_bookmark ? <BookmarkOutlinedIcon fontSize="small" /> : <BookmarkBorderOutlinedIcon fontSize="small" />}
        </IconButton>
      </Box>

      {openReplies ? (
        <Box sx={{ px: 2, pb: 2, bgcolor: 'grey.50' }}>
          {comments === null ? null : comments.length === 0 ? (
            <Typography sx={{ py: 1.5, color: 'text.secondary', fontSize: 13 }}>No replies yet.</Typography>
          ) : (
            comments.map((comment) => (
              <Box key={comment.ID} sx={{ display: 'flex', gap: 1, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <UserAvatar user={comment.editor} decolorize={decolorize} />
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                    {personName(comment.editor)}
                    <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, ml: 0.75 }}>
                      {formatFeedAgo(comment.mod_date)}
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
                    <MentionText text={stripPostHtml(comment.note)} />
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'stretch' }}>
            <MentionField
              people={people}
              decolorize={decolorize}
              value={reply}
              onChange={setReply}
              maxLength={1000}
              size="small"
              placeholder="Write a reply… use @ to mention"
              onSubmit={() => void sendReply()}
            />
            <Box
              component="button"
              type="button"
              disabled={!reply.trim() || sending}
              onClick={() => void sendReply()}
              sx={{
                border: 0,
                borderRadius: 2,
                px: 1.5,
                bgcolor: 'secondary.main',
                color: 'common.white',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: !reply.trim() || sending ? 0.5 : 1,
              }}
            >
              Reply
            </Box>
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

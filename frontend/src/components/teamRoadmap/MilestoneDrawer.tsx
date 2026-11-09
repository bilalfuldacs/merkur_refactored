import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { SihRoadmapMilestone, SihRoadmapPatch, SihRoadmapStatus } from '@/api/sihRoadmap'
import { UserAvatar } from '@/components/user'
import { useI18n } from '@/i18n'
import { STATUS_COLOR, formatFileSize, formatStamp, quarterLabel } from './format'

const STATUSES: SihRoadmapStatus[] = ['planned', 'active', 'done']

export type MilestoneDrawerProps = {
  milestone: SihRoadmapMilestone | null
  canEdit: boolean
  busy: boolean
  decolorize: boolean
  newTitle: string
  onClose: () => void
  onPatch: (patch: SihRoadmapPatch) => void
  onSave: (patch: SihRoadmapPatch) => void
  onDelete: () => void
  onAddLink: (label: string, url: string) => void
  onDeleteLink: (linkId: number) => void
  onAddComment: (body: string) => void
  onDeleteComment: (commentId: number) => void
  onUpload: (file: File) => void
  onDeleteFile: (fileId: number) => void
  onDownload: (fileId: number, name: string) => void
}

export function MilestoneDrawer({
  milestone,
  canEdit,
  busy,
  decolorize,
  newTitle,
  onClose,
  onPatch,
  onSave,
  onDelete,
  onAddLink,
  onDeleteLink,
  onAddComment,
  onDeleteComment,
  onUpload,
  onDeleteFile,
  onDownload,
}: MilestoneDrawerProps) {
  const { t } = useI18n()
  const titleRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(2026)
  const [quarter, setQuarter] = useState(4)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [comment, setComment] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!milestone) return
    setTitle(milestone.title)
    setDescription(milestone.description ?? '')
    setYear(milestone.year)
    setQuarter(milestone.quarter)
    setLinkLabel('')
    setLinkUrl('')
    setComment('')
    setConfirmRemove(false)
    setFormError('')
    if (milestone.title === newTitle) {
      const timer = window.setTimeout(() => titleRef.current?.select(), 60)
      return () => window.clearTimeout(timer)
    }
  }, [milestone?.id, newTitle])

  const years = yearChoices(year)

  function saveDetails(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (nextTitle === '') {
      setFormError(t('teamRoadmap.titleLabel', 'Title'))
      return
    }
    setFormError('')
    onSave({
      title: nextTitle,
      description: description.trim() === '' ? null : description.trim(),
      year,
      quarter,
    })
  }

  function submitLink(event: FormEvent) {
    event.preventDefault()
    const label = linkLabel.trim()
    const url = linkUrl.trim()
    if (label === '' || !/^https?:\/\/\S+$/i.test(url)) return
    onAddLink(label, url)
    setLinkLabel('')
    setLinkUrl('')
  }

  function submitComment(event: FormEvent) {
    event.preventDefault()
    const body = comment.trim()
    if (body === '') return
    onAddComment(body)
    setComment('')
  }

  return (
    <Drawer
      anchor="right"
      open={Boolean(milestone)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 440 },
            bgcolor: '#07142f',
            color: '#fff',
            backgroundImage: 'radial-gradient(circle at top right, rgba(0,159,227,0.18), transparent 42%)',
          },
        },
      }}
    >
      {milestone ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2.5, pt: 2, pb: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: STATUS_COLOR[milestone.status], fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {quarterLabel(milestone.year, milestone.quarter)}
              </Typography>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.15, mt: 0.5 }}>
                {milestone.title}
              </Typography>
            </Box>
            <IconButton aria-label={t('teamRoadmap.close', 'Close')} onClick={onClose} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pb: 3 }}>
            {canEdit ? (
              <ToggleButtonGroup
                exclusive
                value={milestone.status}
                onChange={(_event, value: SihRoadmapStatus | null) => {
                  if (value) onPatch({ status: value })
                }}
                aria-label={t('teamRoadmap.status', 'Status')}
                sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
              >
                {STATUSES.map((status) => (
                  <ToggleButton
                    key={status}
                    value={status}
                    disabled={busy}
                    sx={{
                      borderRadius: '999px !important',
                      border: '1px solid rgba(255,255,255,0.2) !important',
                      color: '#fff',
                      textTransform: 'none',
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: STATUS_COLOR[status],
                        color: '#041433',
                        fontWeight: 800,
                      },
                    }}
                  >
                    {t(`teamRoadmap.${status}`, status)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : (
              <Typography sx={{ mb: 2, color: STATUS_COLOR[milestone.status], fontWeight: 800 }}>
                {t(`teamRoadmap.${milestone.status}`, milestone.status)}
              </Typography>
            )}

            {canEdit ? (
              <Box component="form" onSubmit={saveDetails}>
                <TextField
                  inputRef={titleRef}
                  label={t('teamRoadmap.titleLabel', 'Title')}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  fullWidth
                  required
                  sx={fieldSx}
                />
                <TextField
                  label={t('teamRoadmap.description', 'Description')}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={{ ...fieldSx, mt: 1.5 }}
                />
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, alignItems: 'center' }}>
                  <TextField
                    select
                    label={t('teamRoadmap.year', 'Year')}
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    slotProps={{ select: { native: true } }}
                    sx={{ ...fieldSx, width: 120 }}
                  >
                    {years.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </TextField>
                  <ToggleButtonGroup
                    exclusive
                    value={quarter}
                    onChange={(_event, value: number | null) => {
                      if (value) setQuarter(value)
                    }}
                    aria-label={t('teamRoadmap.when', 'Quarter')}
                  >
                    {[1, 2, 3, 4].map((value) => (
                      <ToggleButton key={value} value={value} sx={quarterSx}>
                        Q{value}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
                {formError ? <Typography sx={{ mt: 1, color: '#FFCC00' }}>{formError}</Typography> : null}
                <Button type="submit" disabled={busy} sx={primarySx}>
                  {busy ? t('teamRoadmap.saving', 'Saving…') : t('teamRoadmap.save', 'Save details')}
                </Button>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography>{milestone.is_hidden ? t('teamRoadmap.show', 'Show to everyone') : t('teamRoadmap.hide', 'Hide from everyone')}</Typography>
                  <Switch
                    checked={milestone.is_hidden}
                    disabled={busy}
                    onChange={(_event, checked) => onPatch({ is_hidden: checked })}
                    slotProps={{ input: { 'aria-label': t('teamRoadmap.hide', 'Hide from everyone') } }}
                  />
                </Box>
              </Box>
            ) : (
              <Typography sx={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.86)', lineHeight: 1.55 }}>
                {milestone.description?.trim() || t('teamRoadmap.hoverEmpty', 'No description yet.')}
              </Typography>
            )}

            <Section title={t('teamRoadmap.links', 'Links')}>
              {milestone.links.length === 0 ? <Empty text={t('teamRoadmap.noLinks', 'No links yet.')} /> : null}
              {milestone.links.map((link) => (
                <Box key={link.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Box component="a" href={link.url} target="_blank" rel="noreferrer" sx={{ color: '#9adfff', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {link.label}
                  </Box>
                  {canEdit ? (
                    <IconButton aria-label={t('teamRoadmap.deleteLink', 'Remove link')} onClick={() => onDeleteLink(link.id)} sx={{ color: 'rgba(255,255,255,0.7)', ml: 'auto' }}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
              {canEdit ? (
                <Box component="form" onSubmit={submitLink} sx={{ display: 'grid', gap: 1, mt: 1 }}>
                  <TextField label={t('teamRoadmap.linkLabel', 'Link name')} value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} sx={fieldSx} />
                  <TextField label={t('teamRoadmap.linkUrl', 'https://')} value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" sx={fieldSx} />
                  <Button type="submit" disabled={busy} sx={ghostSx}>{t('teamRoadmap.addLink', 'Add link')}</Button>
                </Box>
              ) : null}
            </Section>

            <Section title={t('teamRoadmap.files', 'Files')}>
              {milestone.attachments.length === 0 ? <Empty text={t('teamRoadmap.noFiles', 'No files yet.')} /> : null}
              {milestone.attachments.map((file) => (
                <Box key={file.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => onDownload(file.id, file.name)}
                    sx={{ border: 0, p: 0, bgcolor: 'transparent', color: '#fff', cursor: 'pointer', font: 'inherit', textAlign: 'left', '&:hover': { color: '#9adfff' } }}
                  >
                    {file.name}
                    <Box component="span" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{formatFileSize(file.size)}</Box>
                  </Box>
                  {canEdit ? (
                    <IconButton aria-label={t('teamRoadmap.deleteFile', 'Remove file')} onClick={() => onDeleteFile(file.id)} sx={{ color: 'rgba(255,255,255,0.7)', ml: 'auto' }}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
              {canEdit ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) onUpload(file)
                    }}
                  />
                  <Button disabled={busy} onClick={() => fileRef.current?.click()} sx={ghostSx}>
                    {t('teamRoadmap.upload', 'Add file')}
                  </Button>
                </>
              ) : null}
            </Section>

            <Section title={t('teamRoadmap.comments', 'Comments')}>
              {milestone.comments.length === 0 ? <Empty text={t('teamRoadmap.noComments', 'No comments yet.')} /> : null}
              {milestone.comments.map((entry) => (
                <Box key={entry.id} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <UserAvatar user={entry.author} size="sm" decolorize={decolorize} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                      {entry.author?.name ?? 'SIH'}
                      <Box component="span" sx={{ ml: 1, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>{formatStamp(entry.created_at)}</Box>
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.86)' }}>{entry.body}</Typography>
                  </Box>
                  {canEdit ? (
                    <IconButton aria-label={t('teamRoadmap.deleteComment', 'Remove comment')} onClick={() => onDeleteComment(entry.id)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
              {canEdit ? (
                <Box component="form" onSubmit={submitComment} sx={{ display: 'grid', gap: 1 }}>
                  <TextField
                    label={t('teamRoadmap.commentPlaceholder', 'Write a comment')}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    multiline
                    minRows={2}
                    sx={fieldSx}
                  />
                  <Button type="submit" disabled={busy} sx={ghostSx}>{t('teamRoadmap.postComment', 'Post')}</Button>
                </Box>
              ) : null}
            </Section>

            {canEdit && milestone.can_delete ? (
              <Box sx={{ mt: 3 }}>
                {confirmRemove ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button color="error" variant="contained" disabled={busy} onClick={onDelete}>
                      {t('teamRoadmap.confirmRemove', 'Yes, remove it')}
                    </Button>
                    <Button onClick={() => setConfirmRemove(false)} sx={{ color: '#fff' }}>
                      {t('teamRoadmap.cancelRemove', 'Keep it')}
                    </Button>
                  </Box>
                ) : (
                  <Button onClick={() => setConfirmRemove(true)} sx={{ color: '#ffb4b4' }}>
                    {t('teamRoadmap.remove', 'Remove milestone')}
                  </Button>
                )}
                <Typography sx={{ mt: 0.5, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                  {t('teamRoadmap.removeConfirm', 'Remove this milestone? This cannot be undone.')}
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      ) : null}
    </Drawer>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mt: 3 }}>
      <Typography sx={{ fontWeight: 800, mb: 1, letterSpacing: '0.04em' }}>{title}</Typography>
      {children}
    </Box>
  )
}

function Empty({ text }: { text: string }) {
  return <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, mb: 1 }}>{text}</Typography>
}

function yearChoices(current: number): number[] {
  const years = new Set<number>()
  for (let year = 2026; year <= 2032; year += 1) years.add(year)
  years.add(current)
  return [...years].sort((a, b) => a - b)
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    bgcolor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.72)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#9adfff' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.28)' },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#009FE3' },
  '& .MuiOutlinedInput-input, & .MuiNativeSelect-select': { color: '#fff' },
} as const

const primarySx = {
  mt: 1.5,
  borderRadius: 999,
  bgcolor: '#FFCC00',
  color: '#022052',
  fontWeight: 800,
  '&:hover': { bgcolor: '#ffe14d' },
} as const

const ghostSx = {
  justifySelf: 'start',
  borderRadius: 999,
  color: '#041433',
  bgcolor: '#009FE3',
  fontWeight: 800,
  '&:hover': { bgcolor: '#3cb4ea' },
} as const

const quarterSx = {
  color: '#fff !important',
  borderColor: 'rgba(255,255,255,0.25) !important',
  '&.Mui-selected': {
    bgcolor: '#009FE3 !important',
    color: '#041433 !important',
  },
} as const

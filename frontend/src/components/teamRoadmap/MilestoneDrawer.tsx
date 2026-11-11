import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { SihRoadmapMilestone, SihRoadmapPatch, SihRoadmapQuarter, SihRoadmapStatus } from '@/api/sihRoadmap'
import { UserAvatar } from '@/components/user'
import { useI18n } from '@/i18n'
import { STATUS_COLOR, formatFileSize, formatStamp, formatTargetDate, quarterLabel, statusLabel } from './format'

const STATUSES: SihRoadmapStatus[] = ['planned', 'active', 'done', 'paused']

const MAX_LINKS = 8
const MAX_FILES = 8

const INK = '#142016'
const MUTED = '#5c6b62'
const LINE = 'rgba(20,48,24,0.16)'

export type MilestoneDrawerProps = {
  milestone: SihRoadmapMilestone | null
  quarters: SihRoadmapQuarter[]
  canEdit: boolean
  busy: boolean
  decolorize: boolean
  newTitle: string
  serverError?: string
  onClose: () => void
  onPatch: (patch: SihRoadmapPatch) => void
  onSave: (patch: SihRoadmapPatch) => void
  onMove: (direction: 'up' | 'down') => void
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
  quarters,
  canEdit,
  busy,
  decolorize,
  newTitle,
  serverError = '',
  onClose,
  onPatch,
  onSave,
  onMove,
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
  const [period, setPeriod] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [comment, setComment] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!milestone) return
    setTitle(milestone.title)
    setDescription(milestone.description ?? '')
    setPeriod(`${milestone.year}-${milestone.quarter}`)
    setTargetDate(milestone.target_date ?? '')
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

  const siblings = useMemo(() => {
    if (!milestone) return []
    return quarters.find((item) => item.year === milestone.year && item.quarter === milestone.quarter)?.milestones ?? []
  }, [milestone, quarters])
  const position = milestone ? siblings.findIndex((item) => item.id === milestone.id) : -1
  const selectedQuarter = quarters.find((item) => `${item.year}-${item.quarter}` === period) ?? null
  const periodOptions = useMemo(() => {
    const options = quarters.map((item) => ({ value: `${item.year}-${item.quarter}`, label: quarterLabel(item.year, item.quarter) }))
    if (milestone && !options.some((option) => option.value === `${milestone.year}-${milestone.quarter}`)) {
      options.push({ value: `${milestone.year}-${milestone.quarter}`, label: quarterLabel(milestone.year, milestone.quarter) })
    }
    return options
  }, [quarters, milestone])

  function saveDetails(event: FormEvent) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (nextTitle === '') {
      setFormError(t('teamRoadmap.titleRequired', 'Add a title.'))
      return
    }
    if (targetDate && selectedQuarter && (targetDate < selectedQuarter.starts_on || targetDate > selectedQuarter.ends_on)) {
      setFormError(
        t('teamRoadmap.dateOutside', 'That date is outside {quarter}. Change the quarter, or pick a date inside it.').replace(
          '{quarter}',
          selectedQuarter.label,
        ),
      )
      return
    }
    const [year, quarter] = period.split('-').map(Number)
    setFormError('')
    onSave({
      title: nextTitle,
      description: description.trim() === '' ? null : description.trim(),
      year,
      quarter,
      target_date: targetDate === '' ? null : targetDate,
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
            bgcolor: '#f4f7ec',
            color: INK,
            backgroundImage:
              'radial-gradient(circle at top right, rgba(0,159,227,0.14), transparent 40%), radial-gradient(rgba(2,32,82,0.07) 1.1px, transparent 1.1px)',
            backgroundSize: 'auto, 18px 18px',
          },
        },
      }}
    >
      {milestone ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2.5, pt: 2, pb: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: MUTED, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {[quarterLabel(milestone.year, milestone.quarter), formatTargetDate(milestone.target_date)].filter(Boolean).join(' · ')}
              </Typography>
              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 26, lineHeight: 1.15, mt: 0.5 }}>
                {milestone.title}
              </Typography>
            </Box>
            <IconButton aria-label={t('teamRoadmap.close', 'Close')} onClick={onClose} sx={{ color: INK }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pb: 3 }}>
            {serverError ? <Alert severity="warning" sx={{ mb: 2 }}>{serverError}</Alert> : null}

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
                      border: `1px solid ${LINE} !important`,
                      color: INK,
                      bgcolor: '#fff',
                      textTransform: 'none',
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: STATUS_COLOR[status],
                        color: status === 'planned' || status === 'active' ? '#fff' : INK,
                        fontWeight: 800,
                      },
                      '&.Mui-selected:hover': { bgcolor: STATUS_COLOR[status] },
                    }}
                  >
                    {statusLabel(status, t)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : (
              <Typography sx={{ mb: 2, color: STATUS_COLOR[milestone.status], fontWeight: 800 }}>
                {statusLabel(milestone.status, t)}
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
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <TextField
                    select
                    label={t('teamRoadmap.when', 'Quarter')}
                    value={period}
                    onChange={(event) => setPeriod(event.target.value)}
                    slotProps={{ select: { native: true } }}
                    sx={{ ...fieldSx, width: 150 }}
                  >
                    {periodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </TextField>
                  <TextField
                    type="date"
                    label={t('teamRoadmap.targetDate', 'Target date')}
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    slotProps={{
                      inputLabel: { shrink: true },
                      htmlInput: { min: selectedQuarter?.starts_on, max: selectedQuarter?.ends_on },
                    }}
                    sx={{ ...fieldSx, flex: 1, minWidth: 160 }}
                  />
                </Box>
                {formError ? <Typography sx={{ mt: 1, color: '#c1296c', fontWeight: 700 }}>{formError}</Typography> : null}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                  <Button type="submit" disabled={busy} sx={primarySx}>
                    {busy ? t('teamRoadmap.saving', 'Saving…') : t('teamRoadmap.save', 'Save details')}
                  </Button>
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                    <Button
                      disabled={busy || position <= 0}
                      onClick={() => onMove('up')}
                      startIcon={<ArrowUpwardIcon fontSize="small" />}
                      sx={outlineSx}
                    >
                      {t('teamRoadmap.moveUp', 'Move up')}
                    </Button>
                    <Button
                      disabled={busy || position < 0 || position >= siblings.length - 1}
                      onClick={() => onMove('down')}
                      startIcon={<ArrowDownwardIcon fontSize="small" />}
                      sx={outlineSx}
                    >
                      {t('teamRoadmap.moveDown', 'Move down')}
                    </Button>
                  </Box>
                </Box>
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
              <Typography sx={{ whiteSpace: 'pre-wrap', color: INK, lineHeight: 1.55 }}>
                {milestone.description?.trim() || t('teamRoadmap.hoverEmpty', 'No description yet.')}
              </Typography>
            )}

            <Section title={t('teamRoadmap.links', 'Links')}>
              {milestone.links.length === 0 ? <Empty text={t('teamRoadmap.noLinks', 'No links yet.')} /> : null}
              {milestone.links.map((link) => (
                <Box key={link.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <Box component="a" href={link.url} target="_blank" rel="noopener noreferrer" sx={{ color: '#0077aa', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {link.label}
                  </Box>
                  {canEdit ? (
                    <IconButton aria-label={t('teamRoadmap.deleteLink', 'Remove link')} onClick={() => onDeleteLink(link.id)} sx={{ color: MUTED, ml: 'auto' }}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
              {canEdit && milestone.links.length < MAX_LINKS ? (
                <Box component="form" onSubmit={submitLink} sx={{ display: 'grid', gap: 1, mt: 1 }}>
                  <TextField label={t('teamRoadmap.linkLabel', 'Link name')} value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} sx={fieldSx} />
                  <TextField label={t('teamRoadmap.linkUrl', 'https://')} value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" sx={fieldSx} />
                  <Button type="submit" disabled={busy} sx={ghostSx}>{t('teamRoadmap.addLink', 'Add link')}</Button>
                </Box>
              ) : null}
              {canEdit && milestone.links.length >= MAX_LINKS ? (
                <Empty text={t('teamRoadmap.linksFull', 'A milestone can have up to 8 links.')} />
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
                    sx={{ border: 0, p: 0, bgcolor: 'transparent', color: INK, cursor: 'pointer', font: 'inherit', textAlign: 'left', '&:hover': { color: '#0077aa' } }}
                  >
                    {file.name}
                    <Box component="span" sx={{ ml: 1, color: MUTED, fontSize: 12 }}>{formatFileSize(file.size)}</Box>
                  </Box>
                  {canEdit ? (
                    <IconButton aria-label={t('teamRoadmap.deleteFile', 'Remove file')} onClick={() => onDeleteFile(file.id)} sx={{ color: MUTED, ml: 'auto' }}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              ))}
              {canEdit && milestone.attachments.length < MAX_FILES ? (
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
                  <Typography sx={{ mt: 0.5, color: MUTED, fontSize: 12 }}>
                    {t('teamRoadmap.fileHint', 'Up to 12 MB each, 8 files per milestone.')}
                  </Typography>
                </>
              ) : null}
              {canEdit && milestone.attachments.length >= MAX_FILES ? (
                <Empty text={t('teamRoadmap.filesFull', 'A milestone can have up to 8 attachments.')} />
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
                      <Box component="span" sx={{ ml: 1, fontWeight: 500, color: MUTED }}>{formatStamp(entry.created_at)}</Box>
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', color: INK }}>{entry.body}</Typography>
                  </Box>
                  {canEdit ? (
                    <IconButton aria-label={t('teamRoadmap.deleteComment', 'Remove comment')} onClick={() => onDeleteComment(entry.id)} sx={{ color: MUTED }}>
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
                    <Button onClick={() => setConfirmRemove(false)} sx={{ color: INK }}>
                      {t('teamRoadmap.cancelRemove', 'Keep it')}
                    </Button>
                  </Box>
                ) : (
                  <Button onClick={() => setConfirmRemove(true)} sx={{ color: '#b3261e' }}>
                    {t('teamRoadmap.remove', 'Remove milestone')}
                  </Button>
                )}
                <Typography sx={{ mt: 0.5, color: MUTED, fontSize: 13 }}>
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
  return <Typography sx={{ color: MUTED, fontSize: 14, mb: 1 }}>{text}</Typography>
}

const fieldSx = {
  '& .MuiOutlinedInput-root': { bgcolor: '#fff' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: LINE },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#009FE3' },
} as const

const primarySx = {
  borderRadius: 999,
  bgcolor: '#FFCC00',
  color: '#022052',
  fontWeight: 800,
  px: 2,
  '&:hover': { bgcolor: '#ffe14d' },
} as const

const outlineSx = {
  borderRadius: 999,
  border: `1px solid ${LINE}`,
  color: INK,
  bgcolor: '#fff',
  fontWeight: 700,
  textTransform: 'none',
  '&:hover': { bgcolor: 'rgba(0,159,227,0.08)' },
} as const

const ghostSx = {
  justifySelf: 'start',
  borderRadius: 999,
  color: '#fff',
  bgcolor: '#022052',
  fontWeight: 800,
  px: 2,
  '&:hover': { bgcolor: '#0a3278' },
} as const

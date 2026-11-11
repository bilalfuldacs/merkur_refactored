import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import IconButton from '@mui/material/IconButton'
import AddIcon from '@mui/icons-material/Add'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError, downloadApiFile } from '@/api'
import {
  addSihRoadmapComment,
  addSihRoadmapEditor,
  addSihRoadmapLink,
  addSihRoadmapQuarter,
  createSihRoadmapMilestone,
  deleteSihRoadmapAttachment,
  deleteSihRoadmapComment,
  deleteSihRoadmapEditor,
  deleteSihRoadmapLink,
  deleteSihRoadmapMilestone,
  deleteSihRoadmapQuarter,
  getSihRoadmap,
  moveSihRoadmapMilestone,
  updateSihRoadmapMilestone,
  uploadSihRoadmapAttachment,
} from '@/api/sihRoadmap'
import type {
  SihRoadmapBoard,
  SihRoadmapEditorsResult,
  SihRoadmapMilestone,
  SihRoadmapMutation,
  SihRoadmapPatch,
  SihRoadmapQuarter,
} from '@/api/sihRoadmap'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { MilestoneDrawer } from '@/components/teamRoadmap/MilestoneDrawer'
import { RoadShell, RoadStage, RoadmapCard } from '@/components/teamRoadmap/RoadStage'
import { countByStatus, countLine, currentWork, findMilestone, quarterLabel } from '@/components/teamRoadmap/format'
import '@/components/teamRoadmap/teamRoadmap.css'
import { useAuth } from '@/auth'
import { useI18n } from '@/i18n'
import { APP_PATHS, useAppPath } from '@/routing'

const toolButtonSx = { borderRadius: '0.5rem', textTransform: 'none', fontWeight: 700, boxShadow: 'none' } as const

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'rgba(255,255,255,0.82)',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

export default function TeamRoadmapPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { navigate } = useAppPath()
  const [board, setBoard] = useState<SihRoadmapBoard | null>(null)
  const [failed, setFailed] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [editorsOpen, setEditorsOpen] = useState(false)
  const [editorEmail, setEditorEmail] = useState('')
  const [editorError, setEditorError] = useState('')
  const [editorBusy, setEditorBusy] = useState(false)
  const newTitle = t('teamRoadmap.newMilestone', 'New milestone')

  const load = useCallback(() => {
    let cancelled = false
    setFailed(false)
    getSihRoadmap()
      .then((next) => {
        if (!cancelled) setBoard(next)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => load(), [load])

  const selected = board && selectedId != null ? findMilestone(board, selectedId) : null
  const nowItems = board ? currentWork(board) : []
  const editors = board?.editors ?? []

  function apply(result: SihRoadmapMutation, nextSelected: number | null) {
    setBoard(result.board)
    setSelectedId(nextSelected != null && findMilestone(result.board, nextSelected) ? nextSelected : null)
  }

  async function run(action: () => Promise<SihRoadmapMutation>, nextSelected: number | null) {
    setBusy(true)
    setNotice('')
    try {
      apply(await action(), nextSelected)
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
    } finally {
      setBusy(false)
    }
  }

  async function addAndOpen(year: number, quarter: number) {
    if (!board) return
    setBusy(true)
    setNotice('')
    try {
      const result = await createSihRoadmapMilestone({ title: newTitle, year, quarter })
      apply(result, result.milestone_id)
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
    } finally {
      setBusy(false)
    }
  }

  async function addQuarter() {
    await run(() => addSihRoadmapQuarter(), selectedId)
  }

  async function removeQuarter(quarter: SihRoadmapQuarter) {
    await run(() => deleteSihRoadmapQuarter(quarter.id), selectedId)
  }

  async function runEditors(action: () => Promise<SihRoadmapEditorsResult>): Promise<boolean> {
    setEditorBusy(true)
    setEditorError('')
    try {
      const result = await action()
      setBoard(result.board)
      return true
    } catch (error) {
      setEditorError(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
      return false
    } finally {
      setEditorBusy(false)
    }
  }

  async function submitEditor(event: FormEvent) {
    event.preventDefault()
    const username = editorEmail.trim()
    if (username === '') return
    if (await runEditors(() => addSihRoadmapEditor(username))) setEditorEmail('')
  }

  function patch(milestone: SihRoadmapMilestone, body: SihRoadmapPatch) {
    return run(() => updateSihRoadmapMilestone(milestone.id, body), milestone.id)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, pt: { xs: 2, md: 3 }, pb: 4 }}>
        <Box sx={{ maxWidth: 1440, mx: 'auto' }}>
          <Box component="nav" aria-label={t('common.breadcrumb', 'Breadcrumb')} sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={{ ...crumbSx, color: 'info.main' }}>
              <CrumbHome />
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.roadmap)} sx={{ ...crumbSx, color: 'info.main' }}>
              {t('nav.roadmap', 'Roadmap')}
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">{t('teamRoadmap.crumb', 'SIH Roadmap')}</Box>
          </Box>

          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 42 }, lineHeight: 1.1, mb: 2 }}>
            <RouteOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            {t('pages.teamRoadmap', 'SIH Roadmap')}
          </Typography>

          {failed ? (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={<Button color="inherit" onClick={() => load()}>{t('teamRoadmap.retry', 'Try again')}</Button>}
            >
              {t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.')}
            </Alert>
          ) : null}
          {notice && !selected ? <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

          {!board && !failed ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {board ? (
            <RoadShell>
              <header className="tr-hero">
                <div>
                  <p className="tr-kicker">{t('teamRoadmap.kicker', 'Strategic Intelligence Hub')}</p>
                  <h2>{t('teamRoadmap.heroTitle', 'What we are up to')}</h2>
                  <p className="tr-lead">
                    {t(
                      'teamRoadmap.lead',
                      'The SIH plan for MERKURflow. Everyone with a login can see it. Hover a milestone, or tap it, for the description, comments, links, and files.',
                    )}
                  </p>
                  <p className="tr-counts">{countLine(countByStatus(board), t)}</p>
                </div>
                <div className="tr-now">
                  <p className="tr-kicker">{t('teamRoadmap.nowKicker', 'Now')}</p>
                  <strong>{quarterLabel(board.now.year, board.now.quarter)}</strong>
                </div>
              </header>

              <section className="tr-focus" aria-labelledby="tr-focus-title">
                <div className="tr-section-head">
                  <h3 id="tr-focus-title">{board.focus_label}</h3>
                </div>
                <div className="tr-focus-grid">
                  {nowItems.length === 0 ? (
                    <p className="tr-empty">{t('teamRoadmap.nowEmpty', 'Nothing is marked in progress.')}</p>
                  ) : (
                    nowItems.map((milestone) => (
                      <RoadmapCard
                        key={milestone.id}
                        milestone={milestone}
                        featured
                        canEdit={board.can_edit}
                        onOpen={(item) => setSelectedId(item.id)}
                      />
                    ))
                  )}
                </div>
              </section>

              <div className="tr-road-head">
                <h3>{t('teamRoadmap.roadAhead', 'The road ahead')}</h3>
                <ul className="tr-legend">
                  <li><i className="status-active" />{t('teamRoadmap.active', 'In progress')}</li>
                  <li><i className="status-planned" />{t('teamRoadmap.planned', 'Planned')}</li>
                  <li><i className="status-done" />{t('teamRoadmap.done', 'Done')}</li>
                  <li><i className="status-paused" />{t('teamRoadmap.paused', 'Paused')}</li>
                </ul>
                {board.can_edit ? (
                  <div className="tr-tools">
                    <Button
                      size="small"
                      variant="contained"
                      disabled={busy}
                      startIcon={<AddIcon />}
                      onClick={() => void addQuarter()}
                      sx={toolButtonSx}
                    >
                      {t('teamRoadmap.addQuarter', 'Add quarter')}
                    </Button>
                    {board.may_manage_editors ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                          setEditorError('')
                          setEditorsOpen(true)
                        }}
                        sx={{ ...toolButtonSx, color: '#5c6b62', borderColor: 'rgba(20,48,24,0.25)' }}
                      >
                        {t('teamRoadmap.whoCanEdit', 'Who can edit')}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <RoadStage
                quarters={board.quarters}
                canEdit={board.can_edit}
                busy={busy}
                onOpen={(milestone) => setSelectedId(milestone.id)}
                onAdd={addAndOpen}
                onRemoveQuarter={(quarter) => void removeQuarter(quarter)}
                onDownload={(milestone, file) => {
                  downloadApiFile(`/sih-roadmap/milestones/${milestone.id}/attachments/${file.id}`, file.name).catch((error: unknown) => {
                    setNotice(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
                  })
                }}
              />
            </RoadShell>
          ) : null}
        </Box>
      </Box>
      <MilestoneDrawer
        milestone={selected}
        quarters={board?.quarters ?? []}
        serverError={notice}
        canEdit={Boolean(board?.can_edit)}
        busy={busy}
        decolorize={Boolean(user?.decolorize_avatars)}
        newTitle={newTitle}
        onClose={() => setSelectedId(null)}
        onPatch={(body) => {
          if (selected) void patch(selected, body)
        }}
        onSave={(body) => {
          if (selected) void patch(selected, body)
        }}
        onMove={(direction) => {
          if (selected) void run(() => moveSihRoadmapMilestone(selected.id, direction), selected.id)
        }}
        onDelete={() => {
          if (!selected) return
          void run(() => deleteSihRoadmapMilestone(selected.id), null)
        }}
        onAddLink={(label, url) => {
          if (selected) void run(() => addSihRoadmapLink(selected.id, label, url), selected.id)
        }}
        onDeleteLink={(linkId) => {
          if (selected) void run(() => deleteSihRoadmapLink(selected.id, linkId), selected.id)
        }}
        onAddComment={(body) => {
          if (selected) void run(() => addSihRoadmapComment(selected.id, body), selected.id)
        }}
        onDeleteComment={(commentId) => {
          if (selected) void run(() => deleteSihRoadmapComment(selected.id, commentId), selected.id)
        }}
        onUpload={(file) => {
          if (selected) void run(() => uploadSihRoadmapAttachment(selected.id, file), selected.id)
        }}
        onDeleteFile={(fileId) => {
          if (selected) void run(() => deleteSihRoadmapAttachment(selected.id, fileId), selected.id)
        }}
        onDownload={(fileId, name) => {
          if (!selected) return
          downloadApiFile(`/sih-roadmap/milestones/${selected.id}/attachments/${fileId}`, name).catch((error: unknown) => {
            setNotice(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
          })
        }}
      />
      <Dialog open={editorsOpen && Boolean(board?.may_manage_editors)} onClose={() => setEditorsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('teamRoadmap.whoCanEdit', 'Who can edit')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t(
              'teamRoadmap.editorsInfo',
              'Everyone on the Strategic Intelligence Hub team can edit, and superusers always can. Add anyone else by their MERKURflow email.',
            )}
          </Typography>
          {editorError ? <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setEditorError('')}>{editorError}</Alert> : null}
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.5 }}>
            {editors.length === 0 ? (
              <Typography component="li" color="text.secondary">{t('teamRoadmap.noEditors', 'Nobody has been added yet.')}</Typography>
            ) : null}
            {editors.map((person) => (
              <Box
                component="li"
                key={person.user_id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderBottom: '1px solid rgba(20,48,24,0.08)' }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{person.name}</Typography>
                  <Typography sx={{ fontSize: 13 }} color="text.secondary">{person.jobtitle}</Typography>
                </Box>
                {person.removable ? (
                  <IconButton
                    size="small"
                    disabled={editorBusy}
                    aria-label={`${t('teamRoadmap.removeEditor', 'Remove')} ${person.name}`}
                    onClick={() => void runEditors(() => deleteSihRoadmapEditor(person.user_id))}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }} color="text.secondary">
                    {t('teamRoadmap.sihTeam', 'SIH team')}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
          <Box component="form" onSubmit={(event) => void submitEditor(event)} sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <TextField
              size="small"
              type="email"
              fullWidth
              label={t('teamRoadmap.editorEmail', 'MERKURflow email')}
              value={editorEmail}
              onChange={(event) => setEditorEmail(event.target.value)}
            />
            <Button type="submit" variant="contained" disabled={editorBusy || editorEmail.trim() === ''} sx={{ ...toolButtonSx, whiteSpace: 'nowrap' }}>
              {t('teamRoadmap.addEditor', 'Add')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorsOpen(false)}>{t('teamRoadmap.close', 'Close')}</Button>
        </DialogActions>
      </Dialog>
      <AppFooter />
    </PageBackground>
  )
}

import { useCallback, useEffect, useState } from 'react'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { ApiError, downloadApiFile } from '@/api'
import {
  addSihRoadmapComment,
  addSihRoadmapLink,
  createSihRoadmapMilestone,
  deleteSihRoadmapAttachment,
  deleteSihRoadmapComment,
  deleteSihRoadmapLink,
  deleteSihRoadmapMilestone,
  getSihRoadmap,
  updateSihRoadmapMilestone,
  uploadSihRoadmapAttachment,
} from '@/api/sihRoadmap'
import type { SihRoadmapBoard, SihRoadmapMilestone, SihRoadmapMutation, SihRoadmapPatch } from '@/api/sihRoadmap'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { MilestoneDrawer } from '@/components/teamRoadmap/MilestoneDrawer'
import { RoadStage } from '@/components/teamRoadmap/RoadStage'
import { STATUS_COLOR, currentWork, findMilestone, milestoneIcon, quarterLabel } from '@/components/teamRoadmap/format'
import { useAuth } from '@/auth'
import { useI18n } from '@/i18n'
import { APP_PATHS, useAppPath } from '@/routing'

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
      const current = board.quarters.some((item) => item.current && item.year === year && item.quarter === quarter)
      const result = await createSihRoadmapMilestone({
        title: newTitle,
        year,
        quarter,
        status: current ? 'active' : 'planned',
      })
      apply(result, result.milestone_id)
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
    } finally {
      setBusy(false)
    }
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
            <Box component="span">{t('teamRoadmap.crumb', 'Team Roadmap')}</Box>
          </Box>

          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 42 }, lineHeight: 1.1 }}>
            <TimelineOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            {t('pages.teamRoadmap', 'SIH Roadmap')}
          </Typography>
          <Typography sx={{ mt: 1, maxWidth: 720, color: 'text.secondary', fontSize: 18 }}>
            {t('teamRoadmap.subtitle', 'What the Strategic Intelligence Hub is building, quarter by quarter.')}
          </Typography>
          {board ? (
            <Typography sx={{ mt: 0.75, color: 'text.secondary' }}>
              {board.can_edit
                ? t('teamRoadmap.editorHint', 'You can add and update milestones. Everyone else can follow along.')
                : t('teamRoadmap.viewerHint', 'Hover a milestone to read the description, links, and files.')}
            </Typography>
          ) : null}

          {failed ? (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              action={<Button color="inherit" onClick={() => load()}>{t('teamRoadmap.retry', 'Try again')}</Button>}
            >
              {t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.')}
            </Alert>
          ) : null}
          {notice ? <Alert severity="warning" sx={{ mt: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

          {!board && !failed ? (
            <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}>
              <CircularProgress />
            </Box>
          ) : null}

          {board ? (
            <Box
              sx={{
                mt: 3,
                borderRadius: { xs: 3, md: '28px' },
                overflow: 'hidden',
                color: '#fff',
                background: `
                  radial-gradient(ellipse at 12% 80%, rgba(0,159,227,0.22), transparent 46%),
                  radial-gradient(ellipse at 88% 12%, rgba(255,204,0,0.1), transparent 32%),
                  linear-gradient(180deg, #03102b 0%, #022052 58%, #031433 100%)
                `,
                boxShadow: '0 28px 70px rgba(2,32,82,0.2)',
              }}
            >
              <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5 }}>
                <Typography sx={{ fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FFCC00', fontWeight: 800 }}>
                  {t('teamRoadmap.now', 'Right now')} · {quarterLabel(board.now.year, board.now.quarter)}
                </Typography>
                {nowItems.length === 0 ? (
                  <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>{t('teamRoadmap.nowEmpty', 'Nothing is marked in progress this quarter.')}</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
                    {nowItems.map((milestone) => {
                      const Icon = milestoneIcon(milestone.title)
                      return (
                        <Box
                          key={milestone.id}
                          component="button"
                          type="button"
                          onClick={() => setSelectedId(milestone.id)}
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            maxWidth: '100%',
                            px: 1.25,
                            py: 0.7,
                            borderRadius: 999,
                            border: '1px solid rgba(255,204,0,0.45)',
                            bgcolor: 'rgba(255,255,255,0.06)',
                            color: '#fff',
                            cursor: 'pointer',
                            font: 'inherit',
                            textAlign: 'left',
                            '&:hover': { bgcolor: 'rgba(255,204,0,0.14)' },
                          }}
                        >
                          <Icon sx={{ fontSize: 16, color: STATUS_COLOR[milestone.status] }} />
                          <Box component="span" sx={{ fontWeight: 700 }}>{milestone.title}</Box>
                        </Box>
                      )
                    })}
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, pb: 1.5, color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                  <Legend color={STATUS_COLOR.planned} label={t('teamRoadmap.planned', 'Planned')} />
                  <Legend color={STATUS_COLOR.active} label={t('teamRoadmap.active', 'In progress')} />
                  <Legend color={STATUS_COLOR.done} label={t('teamRoadmap.done', 'Done')} />
                  {board.can_edit ? <Legend color="transparent" dashed label={t('teamRoadmap.hidden', 'Hidden')} /> : null}
                </Box>
              </Box>
              <RoadStage
                quarters={board.quarters}
                canEdit={board.can_edit}
                busy={busy}
                onOpen={(milestone) => setSelectedId(milestone.id)}
                onAdd={addAndOpen}
                onDownload={(milestone, file) => {
                  downloadApiFile(`/sih-roadmap/milestones/${milestone.id}/attachments/${file.id}`, file.name).catch((error: unknown) => {
                    setNotice(error instanceof ApiError ? error.message : t('teamRoadmap.loadFailed', 'The roadmap could not be loaded.'))
                  })
                }}
              />
            </Box>
          ) : null}
        </Box>
      </Box>
      <MilestoneDrawer
        milestone={selected}
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
      <AppFooter />
    </PageBackground>
  )
}

function Legend({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: dashed ? 'transparent' : color,
          border: dashed ? '1px dashed rgba(255,255,255,0.7)' : 0,
        }}
      />
      {label}
    </Box>
  )
}

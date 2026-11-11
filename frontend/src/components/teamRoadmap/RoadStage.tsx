import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import AddIcon from '@mui/icons-material/Add'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import type { SihRoadmapAttachment, SihRoadmapMilestone, SihRoadmapQuarter } from '@/api/sihRoadmap'
import { useI18n } from '@/i18n'
import { formatTargetDate, quarterLabel, statusLabel } from './format'

const STATION_Y = [118, 52, 124, 58, 108, 64]

export type RoadStageProps = {
  quarters: SihRoadmapQuarter[]
  canEdit: boolean
  busy: boolean
  onOpen: (milestone: SihRoadmapMilestone) => void
  onAdd: (year: number, quarter: number) => void
  onRemoveQuarter: (quarter: SihRoadmapQuarter) => void
  onDownload: (milestone: SihRoadmapMilestone, file: SihRoadmapAttachment) => void
}

type HoverState = {
  milestone: SihRoadmapMilestone
  anchor: HTMLElement
}

function stationY(index: number): number {
  return STATION_Y[index % STATION_Y.length]
}

/** Winding road path in a 1000x180 viewBox (stretched to the board width). */
function roadPath(points: Array<[number, number]>): string {
  if (points.length === 0) return ''
  const first = points[0]
  const last = points[points.length - 1]
  let path = `M 0 ${first[1]}`
  path += ` C ${first[0] * 0.45} ${first[1]}, ${first[0] * 0.55} ${first[1]}, ${first[0]} ${first[1]}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    const mid = (from[0] + to[0]) / 2
    path += ` C ${mid} ${from[1]}, ${mid} ${to[1]}, ${to[0]} ${to[1]}`
  }
  const midEnd = (last[0] + 1000) / 2
  path += ` C ${midEnd} ${last[1]}, ${midEnd} ${last[1]}, 1000 ${last[1]}`
  return path
}

/**
 * Card used both in the "What we are doing now" grid and inside quarter columns.
 * Visual style mirrors the original light SIH Roadmap `.tr-card`.
 */
export function RoadmapCard({
  milestone,
  featured = false,
  canEdit,
  onOpen,
  onHover,
  onLeave,
}: {
  milestone: SihRoadmapMilestone
  featured?: boolean
  canEdit: boolean
  onOpen: (milestone: SihRoadmapMilestone) => void
  onHover?: (milestone: SihRoadmapMilestone, anchor: HTMLElement) => void
  onLeave?: () => void
}) {
  const { t } = useI18n()
  const hasDescription = Boolean(milestone.description?.trim())

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(milestone)
    }
  }

  function onEdit(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onOpen(milestone)
  }

  return (
    <article
      className={`tr-card status-${milestone.status}${milestone.is_hidden ? ' is-hidden' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${milestone.title}, ${quarterLabel(milestone.year, milestone.quarter)}`}
      onClick={() => onOpen(milestone)}
      onKeyDown={onKeyDown}
      onMouseEnter={onHover ? (event) => onHover(milestone, event.currentTarget) : undefined}
      onMouseLeave={onLeave}
      onFocus={onHover ? (event) => onHover(milestone, event.currentTarget) : undefined}
      onBlur={onLeave}
    >
      <div className="tr-card-top">
        <span className={`tr-pill status-${milestone.status}`}>{statusLabel(milestone.status, t)}</span>
        <span>
          {milestone.is_hidden ? <span className="tr-hidden-badge">{t('teamRoadmap.hidden', 'Hidden')}</span> : null}
          {canEdit ? (
            <button
              type="button"
              className="tr-icon-btn"
              aria-label={`${t('teamRoadmap.edit', 'Edit')} ${milestone.title}`}
              onClick={onEdit}
            >
              <EditOutlinedIcon />
            </button>
          ) : null}
        </span>
      </div>
      <h3 className="tr-card-title">{milestone.title}</h3>
      {milestone.target_date ? <p className="tr-card-date">{formatTargetDate(milestone.target_date)}</p> : null}
      {featured && hasDescription ? <p className="tr-card-summary tr-clamp">{milestone.description}</p> : null}
      {hasDescription || milestone.links.length > 0 || milestone.attachments.length > 0 || milestone.comments.length > 0 ? (
        <div className="tr-card-icons" aria-hidden="true">
          {hasDescription ? <NotesOutlinedIcon /> : null}
          {milestone.links.length > 0 ? <LinkOutlinedIcon /> : null}
          {milestone.attachments.length > 0 ? <AttachFileOutlinedIcon /> : null}
          {milestone.comments.length > 0 ? <ChatBubbleOutlineOutlinedIcon /> : null}
        </div>
      ) : null}
    </article>
  )
}

/** Board: winding road (desktop) + quarter columns; stacks vertically below 992px via CSS. */
export function RoadStage({ quarters, canEdit, busy, onOpen, onAdd, onRemoveQuarter, onDownload }: RoadStageProps) {
  const { t } = useI18n()
  const [hover, setHover] = useState<HoverState | null>(null)
  const closeTimer = useRef<number | null>(null)
  const canHover = useRef(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches,
  )

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const count = Math.max(quarters.length, 1)
  const path = useMemo(() => {
    const points = quarters.map((_, index): [number, number] => [((index + 0.5) / count) * 1000, stationY(index)])
    return roadPath(points)
  }, [quarters, count])

  function cancelClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }

  function scheduleClose() {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setHover(null), 160)
  }

  function showHover(milestone: SihRoadmapMilestone, anchor: HTMLElement) {
    if (!canHover.current) return
    cancelClose()
    setHover({ milestone, anchor })
  }

  function openMilestone(milestone: SihRoadmapMilestone) {
    cancelClose()
    setHover(null)
    onOpen(milestone)
  }

  return (
    <>
      <div className="tr-scroll">
        <div className="tr-board" style={{ ['--q' as string]: count }}>
          {path ? (
            <svg className="tr-road" viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true">
              <path className="tr-road-curb" d={path} />
              <path className="tr-road-base" d={path} />
              <path className="tr-road-dash" d={path} />
            </svg>
          ) : null}
          <div className="tr-quarters">
            {quarters.map((quarter, index) => {
              const total = quarter.milestones.length
              const kicker = quarter.current
                ? t('teamRoadmap.thisQuarter', 'This quarter')
                : quarter.is_past
                  ? t('teamRoadmap.earlierQuarter', 'Earlier')
                  : t('teamRoadmap.plannedQuarter', 'Planned')
              const noun = total === 1 ? t('teamRoadmap.milestone', 'milestone') : t('teamRoadmap.milestones', 'milestones')
              return (
                <section key={`${quarter.year}-${quarter.quarter}`} className={`tr-quarter${quarter.current ? ' is-current' : ''}${quarter.is_past ? ' is-past' : ''}`}>
                  <div className="tr-station-slot">
                    <div className="tr-station" style={{ ['--y' as string]: `${stationY(index)}px` }}>
                      {quarter.current ? <span className="tr-now-tag">{t('teamRoadmap.nowBadge', 'Now')}</span> : null}
                      <span className="tr-station-q">Q{quarter.quarter}</span>
                      <span className="tr-station-y">{quarter.year}</span>
                    </div>
                  </div>
                  <div className="tr-quarter-body">
                    <p className="tr-quarter-kicker">{kicker}</p>
                    <p className="tr-quarter-count">
                      {total} {noun}
                    </p>
                    <div className="tr-cards">
                      {total === 0 ? (
                        <p className="tr-empty">{t('teamRoadmap.emptyQuarter', 'Nothing scheduled in this quarter.')}</p>
                      ) : (
                        quarter.milestones.map((milestone) => (
                          <RoadmapCard
                            key={milestone.id}
                            milestone={milestone}
                            canEdit={canEdit}
                            onOpen={openMilestone}
                            onHover={showHover}
                            onLeave={scheduleClose}
                          />
                        ))
                      )}
                    </div>
                    {canEdit ? (
                      <button
                        type="button"
                        className="tr-add"
                        disabled={busy}
                        aria-label={`${t('teamRoadmap.add', 'Add milestone')} ${quarterLabel(quarter.year, quarter.quarter)}`}
                        onClick={() => onAdd(quarter.year, quarter.quarter)}
                      >
                        <AddIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                        {t('teamRoadmap.add', 'Add milestone')}
                      </button>
                    ) : null}
                    {canEdit && quarter.can_remove ? (
                      <button
                        type="button"
                        className="tr-text-btn"
                        disabled={busy}
                        onClick={() => onRemoveQuarter(quarter)}
                      >
                        {t('teamRoadmap.removeQuarter', 'Remove quarter')}
                      </button>
                    ) : null}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      </div>

      <Popper
        open={Boolean(hover)}
        anchorEl={hover?.anchor ?? null}
        placement="auto"
        modifiers={[{ name: 'offset', options: { offset: [0, 10] } }]}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        {hover ? (
          <MilestonePreview
            milestone={hover.milestone}
            onOpen={() => openMilestone(hover.milestone)}
            onDownload={(file) => onDownload(hover.milestone, file)}
            onEnter={cancelClose}
            onLeave={scheduleClose}
          />
        ) : null}
      </Popper>
    </>
  )
}

function MilestonePreview({
  milestone,
  onOpen,
  onDownload,
  onEnter,
  onLeave,
}: {
  milestone: SihRoadmapMilestone
  onOpen: () => void
  onDownload: (file: SihRoadmapAttachment) => void
  onEnter: () => void
  onLeave: () => void
}) {
  const { t } = useI18n()
  return (
    <div className={`tr-popover-card status-${milestone.status}`} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="tr-popover-head">
        <div>
          <div className={`tr-pill status-${milestone.status}`}>
            {[statusLabel(milestone.status, t), quarterLabel(milestone.year, milestone.quarter), formatTargetDate(milestone.target_date)]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <h3>{milestone.title}</h3>
        </div>
      </div>
      <div className="tr-popover-body">
        <p>{milestone.description?.trim() || t('teamRoadmap.hoverEmpty', 'No description yet.')}</p>
        {milestone.links.length > 0 ? (
          <>
            <h4>{t('teamRoadmap.links', 'Links')}</h4>
            <ul>
              {milestone.links.map((link) => (
                <li key={link.id}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {milestone.attachments.length > 0 ? (
          <>
            <h4>{t('teamRoadmap.attachments', 'Attachments')}</h4>
            <ul>
              {milestone.attachments.map((file) => (
                <li key={file.id}>
                  <button type="button" onClick={() => onDownload(file)}>
                    {file.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        {milestone.comments.length > 0 ? (
          <h4>
            {milestone.comments.length} {t('teamRoadmap.comments', 'Comments')}
          </h4>
        ) : null}
      </div>
      <div className="tr-popover-foot">
        <span>{t('teamRoadmap.popoverHint', 'Click the milestone to open it')}</span>
        <Button
          size="small"
          variant="contained"
          onClick={onOpen}
          sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, bgcolor: '#022052', '&:hover': { bgcolor: '#0a3278' } }}
        >
          {t('teamRoadmap.open', 'Open')}
        </Button>
      </div>
    </div>
  )
}

/** Wrapper so the page can mount the shell with the dotted cream background. */
export function RoadShell({ children }: { children: ReactNode }) {
  return (
    <Box className="tr-shell">
      <div className="tr-blob tr-blob-a" aria-hidden="true" />
      <div className="tr-blob tr-blob-b" aria-hidden="true" />
      {children}
    </Box>
  )
}

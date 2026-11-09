import { useEffect, useMemo, useRef, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { SihRoadmapAttachment, SihRoadmapMilestone, SihRoadmapQuarter } from '@/api/sihRoadmap'
import { useI18n } from '@/i18n'
import { STATUS_COLOR, milestoneIcon, quarterLabel } from './format'

const CARD_H = 78
const CARD_GAP = 8

type Side = 'above' | 'below'

type NodePoint = {
  x: number
  y: number
  side: Side
}

type RoadGeometry = {
  width: number
  height: number
  colW: number
  cardTop: number
  nodes: NodePoint[]
  stackH: number
}

type HoverState = {
  milestone: SihRoadmapMilestone
  anchor: HTMLElement
}

export type RoadStageProps = {
  quarters: SihRoadmapQuarter[]
  canEdit: boolean
  busy: boolean
  onOpen: (milestone: SihRoadmapMilestone) => void
  onAdd: (year: number, quarter: number) => void
  onDownload: (milestone: SihRoadmapMilestone, file: SihRoadmapAttachment) => void
}

export function RoadStage(props: RoadStageProps) {
  const compact = useMediaQuery('(max-width:899px)', { noSsr: true })
  if (compact) {
    return <CompactRoad {...props} />
  }
  return <WideRoad {...props} />
}

function WideRoad({ quarters, canEdit, busy, onOpen, onAdd, onDownload }: RoadStageProps) {
  const { t } = useI18n()
  const geometry = useMemo(() => buildGeometry(quarters), [quarters])
  const path = useMemo(() => roadPath(geometry), [geometry])
  const [hover, setHover] = useState<HoverState | null>(null)
  const closeTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  function cancelClose() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }

  function scheduleClose() {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setHover(null), 160)
  }

  function showHover(milestone: SihRoadmapMilestone, anchor: HTMLElement) {
    cancelClose()
    setHover({ milestone, anchor })
  }

  function openMilestone(milestone: SihRoadmapMilestone) {
    cancelClose()
    setHover(null)
    onOpen(milestone)
  }

  return (
    <Box>
      <Typography sx={{ px: { md: 3 }, pb: 1, color: 'rgba(255,255,255,0.62)', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {t('teamRoadmap.scrollHint', 'Scroll along the road')}
      </Typography>
      <Box sx={{ overflowX: 'auto', overflowY: 'hidden', pb: 2 }}>
        <Box sx={{ position: 'relative', width: geometry.width, height: geometry.height }}>
          <svg width={geometry.width} height={geometry.height} aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <filter id="sih-road-glow" x="-30%" y="-80%" width="160%" height="260%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>
            <path d={path} fill="none" stroke="rgba(0,159,227,0.45)" strokeWidth="70" strokeLinecap="round" filter="url(#sih-road-glow)" />
            <path d={path} fill="none" stroke="#071833" strokeWidth="52" strokeLinecap="round" />
            <path d={path} fill="none" stroke="#12356f" strokeWidth="48" strokeLinecap="round" />
            <path d={path} fill="none" stroke="rgba(186,232,255,0.9)" strokeWidth="2.5" strokeDasharray="16 18" strokeLinecap="round" />
          </svg>

          {quarters.map((quarter, index) => {
            const node = geometry.nodes[index]
            if (!node) return null
            return (
              <QuarterStop
                key={`${quarter.year}-${quarter.quarter}`}
                quarter={quarter}
                node={node}
                colW={geometry.colW}
                cardTop={geometry.cardTop}
                canEdit={canEdit}
                busy={busy}
                onOpen={openMilestone}
                onAdd={onAdd}
                onHover={showHover}
                onLeave={scheduleClose}
              />
            )
          })}
        </Box>
      </Box>

      <Popper
        open={Boolean(hover)}
        anchorEl={hover?.anchor ?? null}
        placement="auto"
        modifiers={[{ name: 'offset', options: { offset: [0, 12] } }]}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        {hover ? (
          <MilestonePreview
            milestone={hover.milestone}
            onOpen={() => {
              setHover(null)
              onOpen(hover.milestone)
            }}
            onDownload={(file) => onDownload(hover.milestone, file)}
            onEnter={cancelClose}
            onLeave={scheduleClose}
          />
        ) : null}
      </Popper>
    </Box>
  )
}

function QuarterStop({
  quarter,
  node,
  colW,
  cardTop,
  canEdit,
  busy,
  onOpen,
  onAdd,
  onHover,
  onLeave,
}: {
  quarter: SihRoadmapQuarter
  node: NodePoint
  colW: number
  cardTop: number
  canEdit: boolean
  busy: boolean
  onOpen: (milestone: SihRoadmapMilestone) => void
  onAdd: (year: number, quarter: number) => void
  onHover: (milestone: SihRoadmapMilestone, anchor: HTMLElement) => void
  onLeave: () => void
}) {
  const { t } = useI18n()
  const count = quarter.milestones.length
  const columns = count > 3 ? 2 : 1
  const cardW = columns === 1 ? Math.min(250, colW - 48) : (colW - 56) / 2
  const gridW = columns * cardW + (columns - 1) * 8
  const originX = node.x - gridW / 2

  return (
    <>
      {quarter.milestones.map((milestone, itemIndex) => {
        const column = itemIndex % columns
        const row = Math.floor(itemIndex / columns)
        const left = originX + column * (cardW + 8)
        const top = cardTop + row * (CARD_H + CARD_GAP)
        return (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            left={left}
            top={top}
            width={cardW}
            onOpen={onOpen}
            onHover={onHover}
            onLeave={onLeave}
          />
        )
      })}

      {count === 0 ? (
        <Typography
          sx={{
            position: 'absolute',
            left: node.x - 100,
            top: cardTop,
            width: 200,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 13,
          }}
        >
          {t('teamRoadmap.emptyQuarter', 'Nothing scheduled')}
        </Typography>
      ) : null}

      <StationNode
        quarter={quarter}
        x={node.x}
        y={node.y}
        canEdit={canEdit}
        busy={busy}
        onAdd={onAdd}
      />
    </>
  )
}

function StationNode({
  quarter,
  x,
  y,
  canEdit,
  busy,
  onAdd,
}: {
  quarter: SihRoadmapQuarter
  x: number
  y: number
  canEdit: boolean
  busy: boolean
  onAdd: (year: number, quarter: number) => void
}) {
  const { t } = useI18n()
  const ring = quarter.current ? '#FFCC00' : '#009FE3'
  return (
    <Box
      sx={{
        position: 'absolute',
        left: x - 58,
        top: y - 58,
        width: 116,
        height: 116,
        zIndex: 3,
      }}
    >
      {quarter.current ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            border: '2px solid #FFCC00',
            animation: 'sihNowPulse 2.6s ease-out infinite',
            '@keyframes sihNowPulse': {
              '0%': { transform: 'scale(0.92)', opacity: 0.85 },
              '100%': { transform: 'scale(1.28)', opacity: 0 },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none', opacity: 0.45 },
          }}
        />
      ) : null}
      <Box
        sx={{
          position: 'absolute',
          inset: 14,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          color: '#fff',
          background: 'radial-gradient(circle at 35% 30%, #12386f, #041433 68%)',
          border: `3px solid ${ring}`,
          boxShadow: quarter.current
            ? '0 0 0 6px rgba(255,204,0,0.16), 0 10px 24px rgba(0,0,0,0.35)'
            : '0 0 0 6px rgba(0,159,227,0.16), 0 10px 24px rgba(0,0,0,0.35)',
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1, letterSpacing: '0.04em' }}>
            Q{quarter.quarter}
          </Typography>
          <Typography sx={{ fontSize: 12, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.72)' }}>
            {quarter.year}
          </Typography>
        </Box>
      </Box>
      {quarter.current ? (
        <Box
          sx={{
            position: 'absolute',
            top: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            px: 1,
            py: 0.15,
            borderRadius: 999,
            bgcolor: '#FFCC00',
            color: '#022052',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {t('teamRoadmap.nowBadge', 'Now')}
        </Box>
      ) : null}
      {canEdit ? (
        <Box
          component="button"
          type="button"
          disabled={busy}
          aria-label={`${t('teamRoadmap.add', 'Add milestone')} ${quarterLabel(quarter.year, quarter.quarter)}`}
          onClick={() => onAdd(quarter.year, quarter.quarter)}
          sx={{
            position: 'absolute',
            right: 2,
            bottom: 8,
            width: 30,
            height: 30,
            border: 0,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#FFCC00',
            color: '#022052',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
            '&:hover': { bgcolor: '#ffe14d' },
            '&:disabled': { opacity: 0.6, cursor: 'default' },
          }}
        >
          <AddIcon sx={{ fontSize: 18 }} />
        </Box>
      ) : null}
    </Box>
  )
}

function MilestoneCard({
  milestone,
  left,
  top,
  width,
  onOpen,
  onHover,
  onLeave,
}: {
  milestone: SihRoadmapMilestone
  left: number
  top: number
  width: number
  onOpen: (milestone: SihRoadmapMilestone) => void
  onHover: (milestone: SihRoadmapMilestone, anchor: HTMLElement) => void
  onLeave: () => void
}) {
  const Icon = milestoneIcon(milestone.title)
  const color = STATUS_COLOR[milestone.status]
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(milestone)}
      onMouseEnter={(event) => onHover(milestone, event.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(event) => onHover(milestone, event.currentTarget)}
      onBlur={onLeave}
      aria-label={`${milestone.title}, ${quarterLabel(milestone.year, milestone.quarter)}`}
      sx={{
        position: 'absolute',
        left,
        top,
        width,
        height: CARD_H,
        zIndex: 2,
        display: 'flex',
        gap: 1,
        textAlign: 'left',
        p: 1,
        borderRadius: '16px',
        color: '#fff',
        cursor: 'pointer',
        background: milestone.is_hidden ? 'rgba(8, 20, 48, 0.55)' : 'rgba(6, 22, 52, 0.88)',
        border: '1px solid',
        borderColor: milestone.is_hidden ? 'rgba(255,255,255,0.28)' : `${color}88`,
        borderStyle: milestone.is_hidden ? 'dashed' : 'solid',
        boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
        backdropFilter: 'blur(8px)',
        '&:hover, &:focus-visible': {
          borderColor: color,
          transform: 'translateY(-2px)',
          outline: 'none',
        },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: `${color}22`,
          color,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 13.5,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {milestone.title}
        </Typography>
        <CardMeta milestone={milestone} />
      </Box>
    </Box>
  )
}

function CardMeta({ milestone }: { milestone: SihRoadmapMilestone }) {
  const { t } = useI18n()
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.4, color: 'rgba(255,255,255,0.62)' }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: STATUS_COLOR[milestone.status] }} />
      {milestone.is_hidden ? (
        <Typography sx={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {t('teamRoadmap.hidden', 'Hidden')}
        </Typography>
      ) : null}
      {milestone.links.length > 0 ? <LinkOutlinedIcon sx={{ fontSize: 14 }} /> : null}
      {milestone.attachments.length > 0 ? <AttachFileOutlinedIcon sx={{ fontSize: 14 }} /> : null}
      {milestone.comments.length > 0 ? <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 14 }} /> : null}
    </Box>
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
    <Box
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      sx={{
        width: 320,
        p: 1.75,
        borderRadius: '18px',
        color: '#fff',
        background: 'linear-gradient(180deg, rgba(10,28,66,0.98), rgba(4,16,40,0.98))',
        border: '1px solid rgba(0,159,227,0.45)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.4)',
      }}
    >
      <Typography sx={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: STATUS_COLOR[milestone.status] }}>
        {quarterLabel(milestone.year, milestone.quarter)} · {t(`teamRoadmap.${milestone.status}`, milestone.status)}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.25, mt: 0.5 }}>{milestone.title}</Typography>
      <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.82)', fontSize: 14, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {milestone.description?.trim() || t('teamRoadmap.hoverEmpty', 'No description yet.')}
      </Typography>
      {milestone.links.length > 0 ? (
        <Box sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {milestone.links.map((link) => (
            <Box
              key={link.id}
              component="a"
              href={link.url}
              target="_blank"
              rel="noreferrer"
              sx={{ color: '#9adfff', fontSize: 13, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {link.label}
            </Box>
          ))}
        </Box>
      ) : null}
      {milestone.attachments.length > 0 ? (
        <Box sx={{ mt: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {milestone.attachments.map((file) => (
            <Box
              key={file.id}
              component="button"
              type="button"
              onClick={() => onDownload(file)}
              sx={{
                p: 0,
                border: 0,
                bgcolor: 'transparent',
                color: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 13,
                '&:hover': { color: '#9adfff' },
              }}
            >
              {file.name}
            </Box>
          ))}
        </Box>
      ) : null}
      {milestone.comments.length > 0 ? (
        <Typography sx={{ mt: 1.25, fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
          {milestone.comments.length} {t('teamRoadmap.comments', 'Comments')}
        </Typography>
      ) : null}
      <Button
        onClick={onOpen}
        sx={{ mt: 1.5, borderRadius: 999, bgcolor: '#009FE3', color: '#041433', fontWeight: 800, '&:hover': { bgcolor: '#3cb4ea' } }}
      >
        {t('teamRoadmap.open', 'Open')}
      </Button>
    </Box>
  )
}

function CompactRoad({ quarters, canEdit, busy, onOpen, onAdd }: RoadStageProps) {
  const { t } = useI18n()
  return (
    <Box sx={{ position: 'relative', px: 2, pb: 3 }}>
      <Box aria-hidden sx={{ position: 'absolute', left: 46, top: 8, bottom: 24, width: 4, borderRadius: 99, background: 'linear-gradient(#009FE3, #071833)' }} />
      {quarters.map((quarter) => (
        <Box key={`${quarter.year}-${quarter.quarter}`} sx={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 1.5, mb: 2.5 }}>
          <Box sx={{ position: 'relative', height: 56 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                color: '#fff',
                background: '#041433',
                border: `3px solid ${quarter.current ? '#FFCC00' : '#009FE3'}`,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1 }}>Q{quarter.quarter}</Typography>
                <Typography sx={{ fontSize: 10 }}>{quarter.year}</Typography>
              </Box>
            </Box>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, minHeight: 56 }}>
              <Typography sx={{ fontWeight: 800 }}>{quarterLabel(quarter.year, quarter.quarter)}</Typography>
              {quarter.current ? (
                <Box sx={{ px: 1, py: 0.15, borderRadius: 999, bgcolor: '#FFCC00', color: '#022052', fontSize: 11, fontWeight: 800 }}>
                  {t('teamRoadmap.nowBadge', 'Now')}
                </Box>
              ) : null}
              {canEdit ? (
                <Box
                  component="button"
                  type="button"
                  disabled={busy}
                  aria-label={`${t('teamRoadmap.add', 'Add milestone')} ${quarterLabel(quarter.year, quarter.quarter)}`}
                  onClick={() => onAdd(quarter.year, quarter.quarter)}
                  sx={{
                    ml: 'auto',
                    width: 32,
                    height: 32,
                    border: 0,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: '#FFCC00',
                    color: '#022052',
                    cursor: 'pointer',
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                </Box>
              ) : null}
            </Box>
            {quarter.milestones.length === 0 ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>{t('teamRoadmap.emptyQuarter', 'Nothing scheduled')}</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {quarter.milestones.map((milestone) => (
                  <CompactCard key={milestone.id} milestone={milestone} onOpen={onOpen} />
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function CompactCard({ milestone, onOpen }: { milestone: SihRoadmapMilestone; onOpen: (milestone: SihRoadmapMilestone) => void }) {
  const Icon = milestoneIcon(milestone.title)
  const color = STATUS_COLOR[milestone.status]
  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(milestone)}
      sx={{
        display: 'flex',
        gap: 1.25,
        width: '100%',
        textAlign: 'left',
        p: 1.25,
        borderRadius: '16px',
        color: '#fff',
        cursor: 'pointer',
        background: 'rgba(6, 22, 52, 0.88)',
        border: '1px solid',
        borderColor: `${color}88`,
        borderStyle: milestone.is_hidden ? 'dashed' : 'solid',
      }}
    >
      <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: `${color}22`, color, flexShrink: 0 }}>
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, lineHeight: 1.3 }}>{milestone.title}</Typography>
        {milestone.description ? (
          <Typography sx={{ mt: 0.4, fontSize: 13, color: 'rgba(255,255,255,0.72)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {milestone.description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}

function buildGeometry(quarters: SihRoadmapQuarter[]): RoadGeometry {
  const counts = quarters.map((quarter) => quarter.milestones.length)
  const maxCount = Math.max(0, ...counts)
  const colW = maxCount > 3 ? 372 : 300
  const padX = 48
  const rowsFor = (count: number) => (count === 0 ? 0 : Math.ceil(count / (count > 3 ? 2 : 1)))
  const maxRows = Math.max(1, ...counts.map(rowsFor))
  const stackH = maxRows * CARD_H + Math.max(0, maxRows - 1) * CARD_GAP
  const cardTop = 176
  const height = cardTop + stackH + 40
  const width = padX * 2 + Math.max(quarters.length, 1) * colW
  const nodes = quarters.map((_, index) => ({
    x: padX + index * colW + colW / 2,
    y: 96 + (index % 2 === 0 ? 0 : 18),
    side: 'below' as Side,
  }))
  return { width, height, colW, cardTop, nodes, stackH }
}

function roadPath(geometry: RoadGeometry): string {
  const { nodes, width } = geometry
  if (nodes.length === 0) return ''
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  let path = `M ${Math.max(16, first.x - 120)} ${first.y} L ${first.x} ${first.y}`
  for (let index = 1; index < nodes.length; index += 1) {
    const previous = nodes[index - 1]
    const current = nodes[index]
    const mid = (previous.x + current.x) / 2
    path += ` C ${mid} ${previous.y}, ${mid} ${current.y}, ${current.x} ${current.y}`
  }
  path += ` L ${Math.min(width - 16, last.x + 130)} ${last.y}`
  return path
}

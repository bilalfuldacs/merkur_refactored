import { useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import type { RoadmapGame, RoadmapGameStatus, RoadmapGameStatusKey, RoadmapPerson } from '@/api'
import { UserAvatar } from '@/components/user/UserAvatar'
import { AppButton } from '@/components/ui'
import { useI18n } from '@/i18n'
import type { Translate } from '@/i18n'
import { GAME_STATUS_COLORS, GAME_STATUS_KEYS } from './format'

const STATUS_LABEL: Record<RoadmapGameStatusKey, string> = {
  req: 'roadmap.statusRequested',
  dev: 'roadmap.statusDev',
  tri: 'roadmap.statusTrial',
  rel: 'roadmap.statusReleased',
}

function yesNo(t: Translate, value: boolean | null | undefined): string {
  if (value === true) {
    return t('common.yes', 'Yes')
  }
  if (value === false) {
    return t('common.no', 'No')
  }
  return t('roadmap.unknown', 'Unknown')
}

function StatusDate({ status, target }: { status: RoadmapGameStatus | null; target: string }) {
  if (!status) {
    return <HelpOutlineOutlinedIcon sx={{ fontSize: 16, color: 'info.main', verticalAlign: 'middle' }} />
  }
  if (status.done && status.actual_label) {
    return (
      <Box component="span" sx={{ color: 'success.main', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />
        {status.actual_label}
      </Box>
    )
  }
  if (status.expected_label) {
    return (
      <Box component="span" sx={{ color: 'info.main', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        <Typography component="span" sx={{ color: 'text.secondary', fontSize: 11 }}>
          {target}
        </Typography>
        <HourglassEmptyOutlinedIcon sx={{ fontSize: 14 }} />
        {status.expected_label}
      </Box>
    )
  }
  return <HelpOutlineOutlinedIcon sx={{ fontSize: 16, color: 'info.main', verticalAlign: 'middle' }} />
}

function People({ people, decolorize }: { people: Array<RoadmapPerson | null>; decolorize: boolean }) {
  const visible = people.filter((person): person is RoadmapPerson => person != null)
  if (visible.length === 0) {
    return <HelpOutlineOutlinedIcon sx={{ fontSize: 16, color: 'info.main' }} />
  }
  return (
    <Box sx={{ display: 'inline-flex', gap: 0.5, verticalAlign: 'middle' }}>
      {visible.map((person) => (
        <UserAvatar key={person.ID} user={person} size="sm" decolorize={decolorize} />
      ))}
    </Box>
  )
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <Typography component="span" sx={{ mr: 2, fontSize: 13 }}>
      <Box component="em" sx={{ mr: 0.75, fontStyle: 'italic', color: 'text.secondary' }}>
        {label}
      </Box>
      <Box component="strong">{value == null || value === '' ? '—' : String(value)}</Box>
    </Typography>
  )
}

export function GameRoadmapCard({
  game,
  labels,
  activeStatus,
  expandAll,
  decolorize,
  onOpen,
}: {
  game: RoadmapGame
  labels: Partial<Record<RoadmapGameStatusKey, string>>
  activeStatus: RoadmapGameStatusKey | 'nam'
  expandAll: boolean
  decolorize: boolean
  onOpen: () => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const expanded = expandAll || open
  const trademarks = game.details.trademarks ?? []

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'common.white' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' },
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: 'repeating-linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 8px, transparent 8px, transparent 16px)',
        }}
      >
        {GAME_STATUS_KEYS.map((key) => {
          const colors = GAME_STATUS_COLORS[key]
          const active = activeStatus === key
          return (
            <Box
              key={key}
              sx={{
                p: 1,
                bgcolor: active ? `${colors.bg}33` : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Box
                component="span"
                sx={{
                  px: 0.75,
                  py: 0.15,
                  borderRadius: 999,
                  bgcolor: colors.bg,
                  color: colors.fg,
                  fontSize: 11,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                }}
              >
                {t(STATUS_LABEL[key], labels[key] ?? key)}
              </Box>
              <StatusDate status={game.statuses[key]} target={t('roadmap.tgt', 'tgt:')} />
            </Box>
          )
        })}
      </Box>

      <Box sx={{ p: 2 }}>
        <Box
          component="button"
          type="button"
          onClick={onOpen}
          sx={{
            border: 0,
            p: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
            textAlign: 'left',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 18, color: 'secondary.main' }}>{game.name}</Typography>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Field label={t('roadmap.studio', 'Studio')} value={game.studio} />
            <People people={[game.studio_owner]} decolorize={decolorize} />
          </Box>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <Typography component="span" sx={{ fontSize: 13 }}>
              <Box component="em" sx={{ mr: 0.75, fontStyle: 'italic', color: 'text.secondary' }}>
                {t('roadmap.pmOwner', 'PM Owner')}
              </Box>
            </Typography>
            <People people={game.pm_owners} decolorize={decolorize} />
          </Box>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Field label={t('roadmap.targetMarket', 'Pry Design Target Mkt')} value={game.target_market?.name} />
          <Field label={t('roadmap.portfolio', 'Portfolio Strategy')} value={game.portfolio_strategy} />
        </Box>

        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
          <Box>
            <Box>
              <Field label={t('roadmap.platform', 'Platform')} value={game.platform?.name} />
              <Field label={t('roadmap.resolution', 'Resolution')} value={game.resolution} />
              <Field label={t('roadmap.code', 'Code')} value={game.code} />
            </Box>
            <Box>
              <Field label={t('roadmap.versionFrom', 'Version ≥')} value={game.version_from} />
              <Field label={t('roadmap.signage', 'Supports Signage')} value={yesNo(t, game.supports_signage)} />
            </Box>
          </Box>
          <AppButton
            variant="outlined"
            color="secondary"
            size="small"
            endIcon={<ExpandMoreOutlinedIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />}
            onClick={() => setOpen((value) => !value)}
          >
            {t('roadmap.details', 'Details')}
          </AppButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.baseUsp', 'Base Game USP')} value={game.details.base_game_USP} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.featureUsp', 'Feature Game USP')} value={game.details.feature_game_USP} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.ipLicensed', 'IP Licensed')} value={yesNo(t, game.details.IP_licensed)} />
              <Typography component="span" sx={{ fontSize: 13 }}>
                <Box component="em" sx={{ mr: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                  {t('roadmap.trademarked', 'Trademarked')}
                </Box>
                {trademarks.map((item) => (
                  <Box component="span" key={item.region} sx={{ mr: 1.5 }}>
                    <Box component="strong">{item.region}</Box> {yesNo(t, item.value)}
                  </Box>
                ))}
              </Typography>
            </Box>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.theme', 'Theme')} value={game.details.theme} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.reels', 'Reels')} value={game.details.reels} />
              <Field label={t('roadmap.progressive', 'Progressive Type')} value={game.details.progressive_type} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.cashOnReels', 'Cash on Reels')} value={yesNo(t, game.details.cash_on_reels)} />
              <Field label={t('roadmap.holdAndSpin', 'Hold and Spin')} value={yesNo(t, game.details.hold_and_spin)} />
              <Field label={t('roadmap.featureInFeature', 'Feature in Feature')} value={yesNo(t, game.details.feature_in_feature)} />
            </Box>
            <Box sx={{ mb: 1 }}>
              <Field label={t('roadmap.numPots', 'Num PP Pots')} value={game.details.num_PP_pots} />
              <Field label={t('roadmap.truePersistence', 'True Persistence')} value={game.details.true_persistence} />
            </Box>
            <Field label={t('roadmap.effort', 'Estimated Effort')} value={game.details.estimated_effort} />
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}

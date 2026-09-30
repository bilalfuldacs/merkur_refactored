import { useState } from 'react'
import type { ReactNode } from 'react'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { ProductBuild, ProductCompatibilityGroup, ProductMarket, ProductVersion } from '@/api'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, productGamesListPath, releaseInformationSheetPath } from '@/routing'
import { countLabel, formatDate, jurisdictionLabel, statusLabel, versionTitle } from './format'
import { StatusBadge } from './StatusBadge'

const pillGroupSx = {
  gap: 0.75,
  flexWrap: 'wrap',
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
  },
} as const

const pillSx = {
  px: 1.25,
  py: 0.5,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  fontSize: 13,
  bgcolor: 'common.white',
  color: 'secondary.main',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

type DetailTab = 'overview' | 'games' | 'features' | 'builds'

export function VersionDetail({
  version,
  canEdit,
  onOpen,
}: {
  version: ProductVersion
  canEdit: boolean
  onOpen: (path: string) => void
}) {
  const [tab, setTab] = useState<DetailTab>('overview')
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const gamesCount = version.games_count ?? version.games.length
  const featuresCount = version.features_count ?? version.features.length
  const buildsCount = version.builds_count ?? version.builds.length

  function openTable(table: string, id?: number, creating = false) {
    setMenuAnchor(null)
    if (creating) {
      onOpen(`${tableBrowsePath(table)}?new=1`)
      return
    }
    onOpen(id ? `${tableBrowsePath(table)}?id=${id}` : tableBrowsePath(table))
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 320,
        height: { xs: 'auto', md: 'min(68vh, 760px)' },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'common.white',
      }}
    >
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 22, md: 28 }, color: 'secondary.main', lineHeight: 1.15 }}>
              {versionTitle(version)}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
              {version.status ? <StatusBadge status={version.status} /> : null}
              {version.platform ? (
                <Chip
                  size="small"
                  label={version.platform.name}
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    bgcolor: version.platform.color || 'grey.200',
                    color: 'secondary.main',
                  }}
                />
              ) : null}
            </Box>
            {version.subtitle ? (
              <Typography sx={{ color: 'text.secondary', mt: 1, fontSize: 14 }}>{version.subtitle}</Typography>
            ) : null}
          </Box>
          <IconButton aria-label="Actions" onClick={(event) => setMenuAnchor(event.currentTarget)} size="small">
            <MoreHorizOutlinedIcon />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => openTable('versions', version.ID)}>Open version</MenuItem>
            {canEdit ? <MenuItem onClick={() => openTable('availabilities', undefined, true)}>New availability</MenuItem> : null}
            {canEdit ? <MenuItem onClick={() => openTable('compatibilities', undefined, true)}>New compatibility</MenuItem> : null}
            {canEdit ? <MenuItem onClick={() => openTable('version_milestones', undefined, true)}>New version milestone</MenuItem> : null}
          </Menu>
        </Box>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={tab}
          onChange={(_event, value: DetailTab | null) => {
            if (value) {
              setTab(value)
            }
          }}
          aria-label="Version sections"
          sx={{ ...pillGroupSx, mt: 2 }}
        >
          <ToggleButton value="overview" sx={pillSx}>
            Overview
          </ToggleButton>
          <ToggleButton value="games" sx={pillSx}>
            Games {gamesCount}
          </ToggleButton>
          <ToggleButton value="features" sx={pillSx}>
            Features {featuresCount}
          </ToggleButton>
          <ToggleButton value="builds" sx={pillSx}>
            Builds {buildsCount}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: { xs: 2, md: 3 }, py: 2.5 }}>
        {tab === 'overview' ? <OverviewTab version={version} onOpen={onOpen} /> : null}
        {tab === 'games' ? <GamesTab version={version} onOpen={onOpen} canEdit={canEdit} /> : null}
        {tab === 'features' ? <FeaturesTab version={version} onOpen={onOpen} canEdit={canEdit} /> : null}
        {tab === 'builds' ? <BuildsTab version={version} onOpen={onOpen} canEdit={canEdit} /> : null}
      </Box>
    </Box>
  )
}

function OverviewTab({ version, onOpen }: { version: ProductVersion; onOpen: (path: string) => void }) {
  const available = version.markets.available
  const intended = version.markets.intended
  const notIntended = version.markets.not_intended

  return (
    <Box>
      {version.sales_suspended ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This product had been released before, but sales are currently suspended.
        </Alert>
      ) : null}
      {version.description ? (
        <Typography sx={{ mb: 2.5, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.55 }}>{version.description}</Typography>
      ) : null}

      <SectionTitle>
        Availability
        <Box component="span" sx={{ fontWeight: 600, fontSize: 13, color: 'text.secondary', ml: 1 }}>
          {countLabel(available.length, 'market', 'markets')}
        </Box>
      </SectionTitle>
      <MarketLinks markets={available} onOpen={onOpen} />

      {intended.length > 0 ? (
        <>
          <SectionTitle sx={{ mt: 2.5 }}>Also intended</SectionTitle>
          <MarketLinks markets={intended} onOpen={onOpen} />
        </>
      ) : null}

      {notIntended.length > 0 ? (
        <Box sx={{ opacity: 0.55 }}>
          <SectionTitle sx={{ mt: 2.5 }}>Not intended</SectionTitle>
          <MarketLinks markets={notIntended} onOpen={onOpen} />
        </Box>
      ) : null}

      {version.compatibilities.length > 0 ? (
        <>
          <SectionTitle sx={{ mt: 3 }}>Hardware compatibility</SectionTitle>
          {version.compatibilities.map((group) => (
            <HardwareGroup key={group.type} group={group} onOpen={onOpen} />
          ))}
        </>
      ) : null}

      <SectionTitle sx={{ mt: 3 }}>Version milestones</SectionTitle>
      {version.milestones.length === 0 ? (
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>
          No version milestones are recorded.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, pl: 0 }}>Target</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, pr: 0 }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {version.milestones.map((milestone) => (
              <TableRow
                key={milestone.ID}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onOpen(`${tableBrowsePath('version_milestones')}?id=${milestone.ID}`)}
              >
                <TableCell sx={{ pl: 0 }}>
                  {milestone.jurisdiction?.flag ? <Box component="span" sx={{ mr: 0.75 }}>{milestone.jurisdiction.flag}</Box> : null}
                  {jurisdictionLabel(milestone.jurisdiction)}
                </TableCell>
                <TableCell>
                  {milestone.expected_status ? (
                    <StatusBadge status={{ ...milestone.expected_status, text_color: null }} />
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell sx={{ pr: 0, color: milestone.actual_date ? 'success.main' : 'text.secondary', fontWeight: milestone.actual_date ? 700 : 500 }}>
                  {formatDate(milestone.actual_date || milestone.expected_date) ?? '—'}
                  {!milestone.actual_date && milestone.expected_date ? (
                    <Box component="span" sx={{ ml: 0.75, color: 'text.secondary', fontWeight: 500 }}>
                      expected
                    </Box>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {version.focus_groups_count > 0 || version.installations_count > 0 ? (
        <Typography sx={{ mt: 2.5, color: 'text.secondary', fontSize: 13 }}>
          {[
            version.focus_groups_count > 0 ? countLabel(version.focus_groups_count, 'focus group', 'focus groups') : null,
            version.installations_count > 0 ? countLabel(version.installations_count, 'installation', 'installations') : null,
          ]
            .filter(Boolean)
            .join(' · ')}
          {version.focus_groups_count > 0 ? (
            <Box
              component="button"
              type="button"
              onClick={() => onOpen(APP_PATHS.focusGroupsReport)}
              sx={{ ...linkButtonSx, ml: 1, color: 'info.main', fontWeight: 700 }}
            >
              Open report
            </Box>
          ) : null}
        </Typography>
      ) : null}
    </Box>
  )
}

function GamesTab({
  version,
  onOpen,
  canEdit,
}: {
  version: ProductVersion
  onOpen: (path: string) => void
  canEdit: boolean
}) {
  if (version.games.length === 0) {
    return (
      <Box>
        <EmptySection text="No games are linked to this version." />
        <AddLink onClick={() => onOpen(productGamesListPath(version.ID))}>All games in this version</AddLink>
      </Box>
    )
  }
  return (
    <Box>
      {version.games.map((game) => (
        <ListLink key={`${game.adopted ? 'a' : 'g'}-${game.ID}`} onClick={() => onOpen(`${tableBrowsePath('games')}?id=${game.ID}`)}>
          <Typography sx={{ fontWeight: 700 }}>{game.name || `Game ${game.ID}`}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
            {[game.ID_text, game.studio?.name, game.adopted ? 'adopted' : null].filter(Boolean).join(' · ')}
          </Typography>
        </ListLink>
      ))}
      <AddLink onClick={() => onOpen(productGamesListPath(version.ID))}>All games in this version</AddLink>
      {canEdit ? (
        <AddLink onClick={() => onOpen(`${tableBrowsePath('games')}?new=1`)}>New game</AddLink>
      ) : null}
    </Box>
  )
}

function FeaturesTab({
  version,
  onOpen,
  canEdit,
}: {
  version: ProductVersion
  onOpen: (path: string) => void
  canEdit: boolean
}) {
  if (version.features.length === 0) {
    return <EmptySection text="No features are linked to this version." />
  }
  return (
    <Box>
      {version.features.map((feature) => (
        <ListLink key={feature.ID} onClick={() => onOpen(`${tableBrowsePath('features')}?id=${feature.ID}`)}>
          <Typography sx={{ fontWeight: 700 }}>{feature.name || `Feature ${feature.ID}`}</Typography>
        </ListLink>
      ))}
      {canEdit ? (
        <AddLink onClick={() => onOpen(`${tableBrowsePath('features')}?new=1`)}>New feature</AddLink>
      ) : null}
    </Box>
  )
}

function BuildsTab({
  version,
  onOpen,
  canEdit,
}: {
  version: ProductVersion
  onOpen: (path: string) => void
  canEdit: boolean
}) {
  if (version.builds.length === 0) {
    return <EmptySection text="No builds are linked to this version." />
  }
  return (
    <Box>
      {version.builds.map((build) => (
        <BuildCard key={build.ID} build={build} onOpen={onOpen} />
      ))}
      {canEdit ? (
        <AddLink onClick={() => onOpen(`${tableBrowsePath('builds')}?new=1`)}>New build</AddLink>
      ) : null}
    </Box>
  )
}

function BuildCard({ build, onOpen }: { build: ProductBuild; onOpen: (path: string) => void }) {
  const releasedSheetId = build.release?.release_date ? build.release.ID : null

  return (
    <Box sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box
        component="button"
        type="button"
        onClick={() => onOpen(`${tableBrowsePath('builds')}?id=${build.ID}`)}
        sx={linkButtonSx}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, color: 'info.main' }}>{build.name || `Build ${build.ID}`}</Typography>
          {build.status ? <StatusBadge status={build.status} /> : null}
          {build.release ? (
            <Chip size="small" label="Release" sx={{ height: 22, fontWeight: 700 }} />
          ) : null}
        </Box>
        <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.35 }}>
          {[
            build.jurisdiction ? `${build.jurisdiction.flag ?? ''} ${jurisdictionLabel(build.jurisdiction)}`.trim() : null,
            build.comment,
            build.release?.release_date ? `released ${formatDate(build.release.release_date)}` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Typography>
      </Box>
      {releasedSheetId ? (
        <Box
          component="button"
          type="button"
          onClick={() => onOpen(releaseInformationSheetPath(releasedSheetId))}
          sx={{ ...linkButtonSx, display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.75, fontSize: 13, fontWeight: 700 }}
        >
          Release information sheet
        </Box>
      ) : null}
      {build.milestones.length > 0 ? (
        <Box sx={{ pl: 1.5, mt: 0.75 }}>
          {build.milestones.map((milestone) => (
            <Typography
              key={milestone.ID}
              component="button"
              type="button"
              onClick={() => onOpen(`${tableBrowsePath('build_milestones')}?id=${milestone.ID}`)}
              sx={{ ...linkButtonSx, display: 'block', fontSize: 13, color: 'text.secondary', py: 0.25 }}
            >
              {statusLabel(milestone.expected_status?.name) || 'Milestone'}{' '}
              {formatDate(milestone.actual_date || milestone.expected_date)}
              {!milestone.actual_date ? ' (expected)' : ''}
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

function MarketLinks({ markets, onOpen }: { markets: ProductMarket[]; onOpen: (path: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? markets : markets.slice(0, 8)
  const hidden = Math.max(0, markets.length - visible.length)

  if (markets.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 14 }}>
        No markets listed.
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {visible.map((market) => (
        <Box
          key={market.ID}
          component="button"
          type="button"
          onClick={() => onOpen(`${tableBrowsePath('availabilities')}?id=${market.ID}`)}
          sx={{
            ...linkButtonSx,
            color: 'info.main',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {market.jurisdiction?.flag ? <Box component="span" sx={{ mr: 0.5 }}>{market.jurisdiction.flag}</Box> : null}
          {jurisdictionLabel(market.jurisdiction)}
        </Box>
      ))}
      {hidden > 0 ? (
        <Box component="button" type="button" onClick={() => setExpanded(true)} sx={{ ...linkButtonSx, color: 'info.main', fontWeight: 700 }}>
          +{hidden} more
        </Box>
      ) : null}
    </Box>
  )
}

function HardwareGroup({ group, onOpen }: { group: ProductCompatibilityGroup; onOpen: (path: string) => void }) {
  return (
    <Box sx={{ mb: 1.25 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'text.secondary', mb: 0.5 }}>{group.type}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {group.components.map((component) => (
          <Box
            key={component.compatibility_ID}
            component="button"
            type="button"
            onClick={() => onOpen(`${tableBrowsePath('compatibilities')}?id=${component.compatibility_ID}`)}
            sx={{ ...linkButtonSx, color: 'info.main', fontWeight: 700, fontSize: 14 }}
          >
            {component.name || 'Component'}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

function SectionTitle({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Typography sx={{ fontWeight: 800, fontSize: 16, mb: 1, color: 'secondary.main', ...sx }}>{children}</Typography>
  )
}

function ListLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        ...linkButtonSx,
        display: 'block',
        width: '100%',
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover .MuiTypography-root:first-of-type': { textDecoration: 'underline' },
      }}
    >
      {children}
    </Box>
  )
}

function AddLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{ ...linkButtonSx, mt: 1.5, color: 'info.main', fontWeight: 700, fontSize: 14 }}
    >
      + {children}
    </Box>
  )
}

function EmptySection({ text }: { text: string }) {
  return (
    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
      {text}
    </Typography>
  )
}

const linkButtonSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left' as const,
  '&:hover': { textDecoration: 'underline' },
}

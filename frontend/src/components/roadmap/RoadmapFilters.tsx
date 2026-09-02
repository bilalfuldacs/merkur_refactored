import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { RoadmapGameStatusKey, RoadmapJurisdictionPreset, RoadmapJurisdictionPresetKey } from '@/api'
import { AppButton, AppTextField } from '@/components/ui'
import { MonthRangeSlider } from './MonthRangeSlider'
import type { RoadmapFilterState, RoadmapMonth, RoadmapStatusFilter } from './format'
import { emptyRoadmapFilters, filtersAreDefault } from './format'

const pillSx = {
  px: 1.25,
  py: 0.4,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  fontSize: 13,
  bgcolor: 'common.white',
  color: 'secondary.main',
  border: '1px solid',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

export function RoadmapFilters({
  view,
  filters,
  defaultRange,
  monthSpan,
  jurisdictionPresets,
  platforms,
  canShowDevelopment,
  statusLabels,
  rowCount,
  milestoneCount,
  itemLabel,
  onChange,
}: {
  view: 'versions' | 'games'
  filters: RoadmapFilterState
  defaultRange: { fromKey: string; toKey: string | null }
  monthSpan: RoadmapMonth[]
  jurisdictionPresets: RoadmapJurisdictionPreset[]
  platforms: { ID: number; name: string | null }[]
  canShowDevelopment: boolean
  statusLabels: Partial<Record<RoadmapGameStatusKey, string>>
  rowCount: number
  milestoneCount?: number
  itemLabel: string
  onChange: (next: RoadmapFilterState) => void
}) {
  const countLine =
    view === 'games'
      ? `${rowCount} ${itemLabel}${rowCount === 1 ? '' : 's'}`
      : `${rowCount} ${itemLabel}${rowCount === 1 ? '' : 's'} · ${milestoneCount} milestone${milestoneCount === 1 ? '' : 's'}`

  return (
    <Box sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'secondary.main' }}>
            {view === 'games' ? 'Scope & settings' : 'Focus the timeline'}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{countLine}</Typography>
        </Box>
        {!filtersAreDefault(filters, defaultRange, view) ? (
          <AppButton
            variant="text"
            color="secondary"
            size="small"
            onClick={() => onChange({ ...emptyRoadmapFilters, ...defaultRange })}
          >
            Clear filters
          </AppButton>
        ) : null}
      </Box>

      {view === 'versions' ? (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
            {jurisdictionPresets.length > 0 ? (
              <AppTextField
                select
                size="small"
                label="Filter by jurisdictions"
                value={filters.jurisdictionPreset}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    jurisdictionPreset: event.target.value as RoadmapJurisdictionPresetKey | 'all',
                  })
                }
              >
                {jurisdictionPresets.map((preset) => (
                  <MenuItem key={preset.key} value={preset.key} disabled={preset.key !== 'specific' && preset.ids.length === 0}>
                    {preset.label}
                  </MenuItem>
                ))}
                <MenuItem value="all">All jurisdictions</MenuItem>
              </AppTextField>
            ) : null}
            <AppTextField
              select
              size="small"
              label="Platform"
              value={filters.platformId === 'all' ? 'all' : String(filters.platformId)}
              onChange={(event) =>
                onChange({
                  ...filters,
                  platformId: event.target.value === 'all' ? 'all' : Number(event.target.value),
                })
              }
            >
              <MenuItem value="all">All platforms</MenuItem>
              {platforms.map((item) => (
                <MenuItem key={item.ID} value={String(item.ID)}>
                  {item.name}
                </MenuItem>
              ))}
            </AppTextField>
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.75 }}>Release status</Typography>
          <ToggleButtonGroup
            value={filters.statuses}
            onChange={(_event, value: RoadmapStatusFilter[]) => {
              if (value.length > 0) {
                onChange({ ...filters, statuses: value })
              }
            }}
            sx={{ gap: 1, mb: 1.25, flexWrap: 'wrap', '& .MuiToggleButtonGroup-grouped': { mx: 0 } }}
          >
            <ToggleButton value="released" sx={pillSx}>
              Released
            </ToggleButton>
            <ToggleButton value="planned" sx={pillSx}>
              Planned
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.showSubtitles}
                  onChange={(event) => onChange({ ...filters, showSubtitles: event.target.checked })}
                />
              }
              label="Show subtitles"
            />
            {canShowDevelopment ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.showDevelopment}
                    onChange={(event) => onChange({ ...filters, showDevelopment: event.target.checked })}
                  />
                }
                label="Show development statuses"
              />
            ) : null}
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 1.5, mb: 1.5 }}>
            <AppTextField
              select
              size="small"
              label="Sort by"
              value={filters.sortBy}
              onChange={(event) => onChange({ ...filters, sortBy: event.target.value as RoadmapFilterState['sortBy'] })}
            >
              <MenuItem value="nam">Name (period not considered)</MenuItem>
              <MenuItem value="req">{statusLabels.req ?? 'requested'}</MenuItem>
              <MenuItem value="dev">{statusLabels.dev ?? 'in R&D'}</MenuItem>
              <MenuItem value="tri">{statusLabels.tri ?? 'in field trial'}</MenuItem>
              <MenuItem value="rel">{statusLabels.rel ?? 'released'}</MenuItem>
            </AppTextField>
            <ToggleButtonGroup
              exclusive
              value={filters.sortAscending ? 'asc' : 'desc'}
              onChange={(_event, value: 'asc' | 'desc' | null) => {
                if (value) {
                  onChange({ ...filters, sortAscending: value === 'asc' })
                }
              }}
              sx={{ alignSelf: 'center' }}
            >
              <ToggleButton value="asc" sx={pillSx}>
                Oldest first
              </ToggleButton>
              <ToggleButton value="desc" sx={pillSx}>
                Newest first
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <AppTextField
            size="small"
            label="Search"
            placeholder="Name, studio, USP, theme, …"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            startIcon={<SearchOutlinedIcon fontSize="small" />}
            sx={{ mb: 1.5 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.includeUnknownDates}
                  onChange={(event) => onChange({ ...filters, includeUnknownDates: event.target.checked })}
                />
              }
              label="Include games with unknown target and actual dates"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={filters.expandAllDetails}
                  onChange={(event) => onChange({ ...filters, expandAllDetails: event.target.checked })}
                />
              }
              label="Expand all details"
            />
          </Box>
          {filters.sortBy === 'nam' ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 12, mb: 1 }}>
              Period is not applied while sorting by name.
            </Typography>
          ) : null}
        </>
      )}

      <MonthRangeSlider
        span={monthSpan}
        fromKey={filters.fromKey}
        toKey={filters.toKey}
        onChange={(range) => onChange({ ...filters, ...range })}
      />
    </Box>
  )
}

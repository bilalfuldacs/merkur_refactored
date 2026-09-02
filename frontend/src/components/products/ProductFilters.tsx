import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import type { ProductVersion } from '@/api'
import { AppButton } from '@/components/ui'
import {
  buttonPanelOptions,
  cpuModuleOptions,
  extraHardwareTypes,
  filtersAreActive,
  uniqueMarkets,
  uniquePlatforms,
  uniqueStatuses,
  type ProductFilterState,
} from './filter'
import { jurisdictionLabel, statusLabel, badgeTextColor } from './format'

export function ProductFilters({
  versions,
  filters,
  moreOpen,
  onMoreOpenChange,
  onChange,
  onClear,
}: {
  versions: ProductVersion[]
  filters: ProductFilterState
  moreOpen: boolean
  onMoreOpenChange: (open: boolean) => void
  onChange: (patch: Partial<ProductFilterState>) => void
  onClear: () => void
}) {
  const statuses = uniqueStatuses(versions)
  const platforms = uniquePlatforms(versions)
  const markets = uniqueMarkets(versions)
  const buttonPanels = buttonPanelOptions(versions)
  const cpuModules = cpuModuleOptions(versions)
  const extraHardware = extraHardwareTypes(versions)
  const active = filtersAreActive(filters)

  function toggleStatus(id: number) {
    const selected = filters.statusIds.includes(id)
    onChange({
      statusIds: selected ? filters.statusIds.filter((current) => current !== id) : [...filters.statusIds, id],
    })
  }

  return (
    <Box
      sx={{
        mb: 2,
        p: { xs: 1.5, md: 2 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'common.white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'secondary.main' }}>Filters</Typography>
        <AppButton
          variant="text"
          color="secondary"
          size="small"
          startIcon={<CloseOutlinedIcon />}
          disabled={!active}
          onClick={onClear}
          sx={{ fontWeight: 700, minWidth: 0 }}
        >
          Clear
        </AppButton>
      </Box>

      {statuses.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          {statuses.map((status) => {
            const selected = filters.statusIds.includes(status.ID)
            return (
              <Chip
                key={status.ID}
                clickable
                label={statusLabel(status.name)}
                onClick={() => toggleStatus(status.ID)}
                sx={{
                  fontWeight: 700,
                  bgcolor: selected ? status.color || 'secondary.main' : 'common.white',
                  color: selected ? badgeTextColor(status) : 'secondary.main',
                  border: '1px solid',
                  borderColor: selected ? status.color || 'secondary.main' : 'divider',
                }}
              />
            )
          })}
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ maxWidth: { sm: 360 } }}>
          <FilterSelect
            id="product-platform"
            label="Platform"
            value={filters.platformId}
            emptyLabel="All platforms"
            options={platforms.map((platform) => ({ id: platform.ID, label: platform.name }))}
            onChange={(platformId) => onChange({ platformId })}
          />
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 280px' }}>
            <FilterSelect
              id="product-market"
              label="Market"
              value={filters.marketId}
              emptyLabel="All markets"
              options={markets.map((market) => ({
                id: market.ID,
                label: `${market.flag ? `${market.flag} ` : ''}${jurisdictionLabel(market)}`,
              }))}
              onChange={(marketId) => onChange({ marketId })}
            />
          </Box>
          <AppButton
            variant="outlined"
            color="secondary"
            size="small"
            onClick={() => onMoreOpenChange(!moreOpen)}
            endIcon={moreOpen ? <KeyboardArrowUpOutlinedIcon /> : <KeyboardArrowDownOutlinedIcon />}
            sx={{ height: 40, whiteSpace: 'nowrap' }}
          >
            More filters
          </AppButton>
        </Box>
        {buttonPanels.length > 0 || cpuModules.length > 0 ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            {buttonPanels.length > 0 ? (
              <FilterSelect
                id="product-button-panel"
                label="Button panel"
                value={filters.buttonPanelId}
                emptyLabel="All button panels"
                options={buttonPanels.map((component) => ({ id: component.ID ?? 0, label: component.name ?? 'Unknown' }))}
                onChange={(buttonPanelId) => onChange({ buttonPanelId })}
              />
            ) : null}
            {cpuModules.length > 0 ? (
              <FilterSelect
                id="product-cpu-module"
                label="CPU module"
                value={filters.cpuModuleId}
                emptyLabel="All CPU modules"
                options={cpuModules.map((component) => ({ id: component.ID ?? 0, label: component.name ?? 'Unknown' }))}
                onChange={(cpuModuleId) => onChange({ cpuModuleId })}
              />
            ) : null}
          </Box>
        ) : null}
      </Box>

      <Collapse in={moreOpen}>
        {extraHardware.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1.5,
              mt: 1.5,
            }}
          >
            {extraHardware.map((group) => (
              <FilterSelect
                key={group.type}
                id={`product-hw-${group.type_ID ?? group.type}`}
                label={group.type}
                value={filters.extraComponentIds[group.type] ?? null}
                emptyLabel={`All ${group.type.toLowerCase()}s`}
                options={group.components.map((component) => ({
                  id: component.ID ?? 0,
                  label: component.name ?? 'Unknown',
                }))}
                onChange={(componentId) =>
                  onChange({
                    extraComponentIds: { ...filters.extraComponentIds, [group.type]: componentId },
                  })
                }
              />
            ))}
          </Box>
        ) : (
          <Typography sx={{ mt: 1.5, color: 'text.secondary', fontSize: 13 }}>
            No additional hardware filters for this list.
          </Typography>
        )}
      </Collapse>
    </Box>
  )
}

function FilterSelect({
  id,
  label,
  value,
  emptyLabel,
  options,
  onChange,
}: {
  id: string
  label: string
  value: number | null
  emptyLabel: string
  options: { id: number; label: string }[]
  onChange: (value: number | null) => void
}) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        label={label}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      >
        <MenuItem value="">{emptyLabel}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.id} value={option.id}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

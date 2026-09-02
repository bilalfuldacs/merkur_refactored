import type { FormEvent } from 'react'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import SouthIcon from '@mui/icons-material/South'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ViewStreamIcon from '@mui/icons-material/ViewStream'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Collapse from '@mui/material/Collapse'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Select from '@mui/material/Select'
import { AppButton } from '@/components/ui'
import type { SortDirection, TableColumn, TableViewSchema, TableViewState, WidthMode } from '@/tableView'
import { toggleVisibleColumn } from '@/tableView'

export function TableFilterCard({
  schema,
  draft,
  showMore,
  onShowMoreChange,
  onDraftChange,
  onApply,
}: {
  schema: TableViewSchema
  draft: TableViewState
  showMore: boolean
  onShowMoreChange: (open: boolean) => void
  onDraftChange: (patch: Partial<TableViewState>) => void
  onApply: () => void
}) {
  const primaryColumns = schema.columns.slice(0, schema.primaryColumnCount)
  const extraColumns = schema.columns.slice(schema.primaryColumnCount)
  const allKeys = schema.columns.map((column) => column.key)
  const allSelected = allKeys.length > 0 && allKeys.every((key) => draft.visibleColumns.includes(key))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply()
  }

  function selectAll() {
    onDraftChange({ visibleColumns: allKeys })
    if (extraColumns.length > 0) {
      onShowMoreChange(true)
    }
  }

  function clearAll() {
    onDraftChange({ visibleColumns: [] })
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 1.5,
        borderRadius: 1,
        bgcolor: 'grey.100',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <SortRow
        id={`${schema.table}-sort-by`}
        label="Sort by"
        value={draft.sortBy}
        direction={draft.sortDir}
        columns={schema.columns}
        includeBlank={false}
        onValueChange={(sortBy) => onDraftChange({ sortBy })}
        onDirectionChange={(sortDir) => onDraftChange({ sortDir })}
      />
      <SortRow
        id={`${schema.table}-sort-by-2`}
        label="… and then by"
        value={draft.sortBy2}
        direction={draft.sortDir2}
        columns={schema.columns}
        includeBlank
        onValueChange={(sortBy2) => onDraftChange({ sortBy2 })}
        onDirectionChange={(sortDir2) => onDraftChange({ sortDir2 })}
      />
      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, mb: 1.5 }}>
        <FormControl size="small" sx={{ flex: 1, bgcolor: 'background.paper' }}>
          <InputLabel id={`${schema.table}-page-size-label`}>Items per page</InputLabel>
          <Select
            labelId={`${schema.table}-page-size-label`}
            label="Items per page"
            value={draft.perPage}
            onChange={(event) => onDraftChange({ perPage: Number(event.target.value) })}
          >
            {schema.pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <ModeRadios
          value={draft.widthMode}
          onChange={(widthMode) => onDraftChange({ widthMode })}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
        <Box component="button" type="button" onClick={selectAll} disabled={allSelected} sx={linkButtonSx}>
          Select all
        </Box>
        <Box
          component="button"
          type="button"
          onClick={clearAll}
          disabled={draft.visibleColumns.length === 0}
          sx={linkButtonSx}
        >
          Clear
        </Box>
      </Box>

      <ColumnList
        columns={primaryColumns}
        visible={draft.visibleColumns}
        onToggle={(key) =>
          onDraftChange({ visibleColumns: toggleVisibleColumn(schema.columns, draft.visibleColumns, key) })
        }
      />
      {extraColumns.length > 0 ? (
        <>
          <Collapse in={showMore}>
            <ColumnList
              columns={extraColumns}
              visible={draft.visibleColumns}
              onToggle={(key) =>
                onDraftChange({
                  visibleColumns: toggleVisibleColumn(schema.columns, draft.visibleColumns, key),
                })
              }
            />
          </Collapse>
          <AppButton
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            fullWidth
            startIcon={<KeyboardDoubleArrowDownIcon />}
            onClick={() => onShowMoreChange(!showMore)}
            sx={{ mb: 1.25 }}
          >
            More Attributes
          </AppButton>
        </>
      ) : null}
      <AppButton
        type="submit"
        size="medium"
        fullWidth
        startIcon={<CheckCircleOutlineOutlinedIcon />}
        sx={{ bgcolor: 'grey.700', color: 'common.white', '&:hover': { bgcolor: 'grey.800' } }}
      >
        Apply
      </AppButton>
    </Box>
  )
}

const linkButtonSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 700,
  '&:hover': { textDecoration: 'underline' },
  '&:disabled': { color: 'text.disabled', cursor: 'default', textDecoration: 'none' },
} as const

function SortRow({
  id,
  label,
  value,
  direction,
  columns,
  includeBlank,
  onValueChange,
  onDirectionChange,
}: {
  id: string
  label: string
  value: string
  direction: SortDirection
  columns: TableColumn[]
  includeBlank: boolean
  onValueChange: (value: string) => void
  onDirectionChange: (value: SortDirection) => void
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.5, mb: 1 }}>
      <FormControl size="small" sx={{ flex: 1, bgcolor: 'background.paper' }}>
        <InputLabel id={`${id}-label`}>{label}</InputLabel>
        <Select
          labelId={`${id}-label`}
          label={label}
          value={value}
          onChange={(event) => onValueChange(String(event.target.value))}
        >
          {includeBlank ? <MenuItem value="">—</MenuItem> : null}
          {columns.map((column) => (
            <MenuItem key={column.key} value={column.key}>
              {column.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <RadioGroup
        row
        value={direction}
        onChange={(_event, next) => onDirectionChange(next as SortDirection)}
        sx={{
          flexShrink: 0,
          display: 'flex',
          flexWrap: 'nowrap',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          '& .MuiFormControlLabel-root': { mx: 0, px: 0.75, py: 0.25, mr: 0 },
          '& .MuiFormControlLabel-root + .MuiFormControlLabel-root': {
            borderLeft: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <FormControlLabel
          value="ASC"
          control={<Radio size="small" />}
          label={<SouthIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />}
        />
        <FormControlLabel value="DESC" control={<Radio size="small" />} label={<SouthIcon fontSize="small" />} />
      </RadioGroup>
    </Box>
  )
}

function ModeRadios({ value, onChange }: { value: WidthMode; onChange: (value: WidthMode) => void }) {
  return (
    <RadioGroup
      row
      value={value}
      onChange={(_event, next) => onChange(next as WidthMode)}
      sx={{
        flexShrink: 0,
        display: 'flex',
        flexWrap: 'nowrap',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        '& .MuiFormControlLabel-root': { mx: 0, px: 0.75, py: 0.25, mr: 0 },
        '& .MuiFormControlLabel-root + .MuiFormControlLabel-root': {
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <FormControlLabel value="s" control={<Radio size="small" />} label={<ViewStreamIcon fontSize="small" />} />
      <FormControlLabel value="w" control={<Radio size="small" />} label={<SwapHorizIcon fontSize="small" />} />
    </RadioGroup>
  )
}

function ColumnList({
  columns,
  visible,
  onToggle,
}: {
  columns: TableColumn[]
  visible: string[]
  onToggle: (key: string) => void
}) {
  return (
    <Box
      sx={{
        columnCount: 2,
        columnGap: 1.5,
        columnRule: '1px solid',
        columnRuleColor: 'divider',
        mb: 1,
      }}
    >
      {columns.map((column) => (
        <FormControlLabel
          key={column.key}
          sx={{
            display: 'flex',
            mr: 0,
            mb: 0.25,
            breakInside: 'avoid',
            alignItems: 'flex-start',
            '& .MuiFormControlLabel-label': { fontSize: 13, lineHeight: 1.3, pt: 0.9 },
          }}
          control={<Checkbox size="small" checked={visible.includes(column.key)} onChange={() => onToggle(column.key)} />}
          label={
            column.link || column.primary ? (
              <Box
                component="span"
                sx={{ fontWeight: 800, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                {column.label}
                {column.link ? <OpenInNewIcon sx={{ fontSize: 14 }} /> : <VpnKeyOutlinedIcon sx={{ fontSize: 14 }} />}
              </Box>
            ) : (
              column.label
            )
          }
        />
      ))}
    </Box>
  )
}

import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { AppTextField } from '@/components/ui'
import type { RelationLookupOption } from '@/api'
import type { TableColumn } from '@/tableView'
import { asText, isFilledBoolean, relationLabel } from '@/tableView'

const STATUS_OPTIONS = [
  { value: '1', label: 'A+' },
  { value: '2', label: 'A' },
  { value: '3', label: 'B' },
  { value: '4', label: 'C' },
  { value: '5', label: 'D' },
  { value: '6', label: 'D-' },
] as const

const TRAFFIC_OPTIONS = [
  { value: 'red', color: 'error.main' },
  { value: 'yellow', color: 'warning.main' },
  { value: 'green', color: 'success.main' },
] as const

export function TableRecordField({
  column,
  row,
  value,
  lookups,
  canEdit,
  creating = false,
  onChange,
  onOpenRelated,
}: {
  column: TableColumn
  row: Record<string, unknown>
  value: unknown
  lookups: RelationLookupOption[]
  canEdit: boolean
  creating?: boolean
  onChange: (key: string, value: unknown) => void
  onOpenRelated?: (table: string, id: number) => void
}) {
  const readOnly =
    !canEdit || column.disabled || (!creating && (column.primary || column.kind === 'id'))
  const relatedId = typeof value === 'number' ? value : Number(value)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(140px, 28%) minmax(0, 1fr)' },
        gap: { xs: 0.5, md: 2 },
        alignItems: 'start',
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography
        component="label"
        htmlFor={`field-${column.key}`}
        sx={{ fontWeight: 700, pt: { md: 1.1 }, color: column.link ? 'text.primary' : 'text.secondary' }}
      >
        {column.label}
        {creating && !column.nullable && !readOnly ? ' *' : ''}
      </Typography>
      <Box>
        {column.kind === 'boolean' ? (
          <FormControlLabel
            control={
              <Switch
                id={`field-${column.key}`}
                checked={isFilledBoolean(value)}
                disabled={readOnly}
                onChange={(event) => onChange(column.key, event.target.checked)}
              />
            }
            label={isFilledBoolean(value) ? 'Yes' : 'No'}
          />
        ) : column.kind === 'relation' ? (
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'stretch' }}>
            <AppTextField
              id={`field-${column.key}`}
              select
              size="small"
              value={Number.isFinite(relatedId) && relatedId > 0 ? String(relatedId) : ''}
              disabled={readOnly}
              onChange={(event) => onChange(column.key, event.target.value === '' ? null : Number(event.target.value))}
            >
              {column.nullable ? <MenuItem value="">—</MenuItem> : null}
              {relationOptions(lookups, value, row, column).map((option) => (
                <MenuItem key={option.id} value={String(option.id)}>
                  {option.label}
                </MenuItem>
              ))}
            </AppTextField>
            {column.openRelated && column.relatedTable && Number.isFinite(relatedId) && relatedId > 0 ? (
              <IconButton
                aria-label={`Open related ${column.label}`}
                onClick={() => onOpenRelated?.(column.relatedTable as string, relatedId)}
                sx={{ border: '1px solid', borderColor: 'success.main', borderRadius: 1, color: 'success.main' }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
        ) : column.kind === 'enum' ? (
          <AppTextField
            id={`field-${column.key}`}
            select
            size="small"
            value={asText(value) ?? ''}
            disabled={readOnly}
            onChange={(event) => onChange(column.key, event.target.value || null)}
          >
            {column.nullable ? <MenuItem value="">—</MenuItem> : null}
            {column.enumOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </AppTextField>
        ) : column.kind === 'traffic_light' ? (
          <RadioGroup
            row
            value={asText(value) ?? ''}
            onChange={(_event, next) => onChange(column.key, next)}
            sx={{ gap: 0.5 }}
          >
            {TRAFFIC_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                disabled={readOnly}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: option.color }} />
                }
              />
            ))}
          </RadioGroup>
        ) : column.kind === 'status_indicator' ? (
          <RadioGroup
            row
            value={asText(value) ?? ''}
            onChange={(_event, next) => onChange(column.key, next)}
          >
            {STATUS_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                disabled={readOnly}
                control={<Radio size="small" />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        ) : column.kind === 'color' ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="input"
              type="color"
              id={`field-${column.key}`}
              value={asText(value)?.startsWith('#') ? asText(value) : '#000000'}
              disabled={readOnly}
              onChange={(event) => onChange(column.key, event.currentTarget.value)}
              sx={{ width: 40, height: 36, p: 0, border: '1px solid', borderColor: 'divider', bgcolor: 'transparent' }}
            />
            <Typography variant="body2">{asText(value) || '—'}</Typography>
          </Box>
        ) : column.kind === 'url' ? (
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <AppTextField
              id={`field-${column.key}`}
              size="small"
              value={asText(value) ?? ''}
              disabled={readOnly}
              placeholder={column.placeholder ?? undefined}
              inputProps={{ maxLength: column.maxLength ?? undefined }}
              onChange={(event) => onChange(column.key, event.target.value)}
            />
            {asText(value)?.trim() ? (
              <IconButton
                aria-label="Open URL"
                component="a"
                href={asText(value) ?? undefined}
                target="_blank"
                rel="noreferrer"
                sx={{ border: '1px solid', borderColor: 'success.main', borderRadius: 1, color: 'success.main' }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            ) : null}
          </Box>
        ) : (
          <AppTextField
            id={`field-${column.key}`}
            size="small"
            multiline={column.multiline || column.kind === 'json'}
            minRows={column.multiline || column.kind === 'json' ? 4 : undefined}
            value={formatTextValue(value)}
            disabled={readOnly}
            placeholder={column.placeholder ?? undefined}
            inputProps={{ maxLength: column.maxLength ?? undefined }}
            onChange={(event) => onChange(column.key, event.target.value)}
            sx={column.kind === 'json' ? { '& textarea': { fontFamily: 'monospace', fontSize: 13 } } : undefined}
          />
        )}
        {column.nullable && !readOnly ? (
          <FormControlLabel
            sx={{ mt: 0.25 }}
            control={
              <Checkbox
                size="small"
                checked={value === null || value === undefined || value === ''}
                onChange={(event) => onChange(column.key, event.target.checked ? null : value ?? '')}
              />
            }
            label={<Typography variant="caption">Empty</Typography>}
          />
        ) : null}
        {column.help ? (
          <Typography variant="caption" color="info.main" sx={{ display: 'block', mt: 0.5 }}>
            {column.help}
          </Typography>
        ) : null}
      </Box>
    </Box>
  )
}

function formatTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function relationOptions(
  lookups: RelationLookupOption[],
  value: unknown,
  row: Record<string, unknown>,
  column: TableColumn,
): RelationLookupOption[] {
  if (lookups.length > 0) {
    return lookups
  }

  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(id) || id <= 0) {
    return []
  }

  const related = column.relationKey ? row[column.relationKey] : null
  return [{ id, label: relationLabel(related) || `#${id}` }]
}

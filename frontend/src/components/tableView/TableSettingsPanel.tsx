import type { ReactNode } from 'react'
import HistoryIcon from '@mui/icons-material/History'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import SettingsIcon from '@mui/icons-material/Settings'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import type { TableViewSchema, TableViewState } from '@/tableView'
import { TableFilterCard } from './TableFilterCard'

export function TableSettingsPanel({
  schema,
  draft,
  showMore,
  isDefaultDraft,
  canEdit,
  actions,
  onShowMoreChange,
  onDraftChange,
  onApply,
  onResetToDefault,
}: {
  schema: TableViewSchema
  draft: TableViewState
  showMore: boolean
  isDefaultDraft: boolean
  canEdit: boolean
  actions?: ReactNode
  onShowMoreChange: (open: boolean) => void
  onDraftChange: (patch: Partial<TableViewState>) => void
  onApply: () => void
  onResetToDefault: () => void
}) {
  const viewValue = isDefaultDraft ? 'default' : 'custom'

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {actions}
      <Box>
        <Typography
          component="h2"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 16, mb: 1.25 }}
        >
          <SettingsIcon sx={{ color: 'info.main', fontSize: 20 }} />
          “{schema.title}” Settings
        </Typography>
        <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
          <InputLabel id={`${schema.table}-view-label`}>View</InputLabel>
          <Select
            labelId={`${schema.table}-view-label`}
            label="View"
            value={viewValue}
            onChange={(event) => {
              if (event.target.value === 'default') {
                onResetToDefault()
              }
            }}
            sx={{ bgcolor: 'rgba(0, 159, 227, 0.08)' }}
          >
            {viewValue === 'custom' ? <MenuItem value="custom">Custom</MenuItem> : null}
            <MenuItem value="default">Default ({schema.defaultViewName})</MenuItem>
          </Select>
        </FormControl>
        <Typography sx={{ mb: 0.75, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {canEdit ? (
            <LockOpenIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
          ) : (
            <LockIcon sx={{ fontSize: 18, color: 'error.main', mt: '2px' }} />
          )}
          <span>
            {canEdit ? (
              <>
                You may <Box component="strong">view and edit</Box> this table.
              </>
            ) : (
              <>
                You may <Box component="strong">view</Box> this table, but you{' '}
                <Box component="strong">cannot edit</Box>.
              </>
            )}
          </span>
        </Typography>
        {schema.hasHistory ? (
          <Typography sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <HistoryIcon sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
            <span>
              This table preserves <Box component="strong">edit history</Box>.
            </span>
          </Typography>
        ) : null}

        <TableFilterCard
          schema={schema}
          draft={draft}
          showMore={showMore}
          onShowMoreChange={onShowMoreChange}
          onDraftChange={onDraftChange}
          onApply={onApply}
        />
      </Box>

      {schema.infobox.trim() ? (
        <Box>
          <Typography
            component="h2"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 16, mb: 1.25 }}
          >
            <InfoOutlinedIcon sx={{ color: 'info.main', fontSize: 20 }} />
            About “{schema.title}”
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'rgba(0, 159, 227, 0.1)',
              border: '1px solid',
              borderColor: 'rgba(0, 159, 227, 0.25)',
              '& a': { color: 'info.main', fontWeight: 800 },
            }}
            dangerouslySetInnerHTML={{ __html: schema.infobox }}
          />
        </Box>
      ) : null}
    </Box>
  )
}

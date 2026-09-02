import { useState } from 'react'
import type { MouseEvent } from 'react'
import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import type { TableExportFormat } from '@/api'
import { TableSettingsPanel } from '@/components/tableView/TableSettingsPanel'
import { AppButton } from '@/components/ui'
import type { TableViewSchema, TableViewState } from '@/tableView'

export function TableBrowseSidebar({
  schema,
  draft,
  isDefaultDraft,
  exporting = false,
  onDraftChange,
  onApply,
  onResetToDefault,
  onNew,
  onExport,
}: {
  schema: TableViewSchema
  draft: TableViewState
  isDefaultDraft: boolean
  exporting?: boolean
  onDraftChange: (patch: Partial<TableViewState>) => void
  onApply: () => void
  onResetToDefault: () => void
  onNew?: () => void
  onExport?: (format: TableExportFormat, preview?: Window | null) => void
}) {
  const [showMore, setShowMore] = useState(false)

  return (
    <TableSettingsPanel
      schema={schema}
      draft={draft}
      showMore={showMore}
      isDefaultDraft={isDefaultDraft}
      canEdit={schema.canEdit}
      onShowMoreChange={setShowMore}
      onDraftChange={onDraftChange}
      onApply={onApply}
      onResetToDefault={onResetToDefault}
      actions={
        <TableActions
          canEdit={schema.canEdit}
          itemName={schema.itemName}
          exporting={exporting}
          onNew={onNew}
          onExport={onExport}
        />
      }
    />
  )
}

function TableActions({
  canEdit,
  itemName,
  exporting,
  onNew,
  onExport,
}: {
  canEdit: boolean
  itemName: string
  exporting: boolean
  onNew?: () => void
  onExport?: (format: TableExportFormat, preview?: Window | null) => void
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    setAnchor(event.currentTarget)
  }

  function choose(format: TableExportFormat) {
    let preview: Window | null = null
    if (format === 'print') {
      preview = window.open('about:blank', '_blank')
      if (preview) {
        preview.document.write('<p style="font-family:sans-serif;padding:24px;color:#022052">Preparing PDF…</p>')
        preview.document.close()
      }
    }
    setAnchor(null)
    onExport?.(format, preview)
  }

  return (
    <Box>
      <Typography
        component="h2"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 16, mb: 1.25 }}
      >
        <BoltIcon sx={{ color: 'info.main', fontSize: 20 }} />
        Actions
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <AppButton
          size="medium"
          color="info"
          startIcon={<AddIcon />}
          disabled={!canEdit}
          onClick={onNew}
        >
          New {itemName}
        </AppButton>
        <AppButton
          size="medium"
          variant="outlined"
          color="inherit"
          endIcon={<KeyboardArrowDownIcon />}
          disabled={exporting || !onExport}
          onClick={openMenu}
        >
          <PrintOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
          {exporting ? 'Exporting…' : 'Print'}
        </AppButton>
        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <MenuItem onClick={() => choose('print')}>
            <PrintOutlinedIcon sx={{ mr: 1.25, fontSize: 18 }} />
            Print
          </MenuItem>
          <MenuItem onClick={() => choose('pdf')}>
            <PictureAsPdfOutlinedIcon sx={{ mr: 1.25, fontSize: 18 }} />
            Download PDF
          </MenuItem>
          <MenuItem onClick={() => choose('csv')}>
            <TableChartOutlinedIcon sx={{ mr: 1.25, fontSize: 18 }} />
            Download CSV
          </MenuItem>
          <MenuItem onClick={() => choose('xlsx')}>
            <GridOnOutlinedIcon sx={{ mr: 1.25, fontSize: 18 }} />
            Download Excel
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

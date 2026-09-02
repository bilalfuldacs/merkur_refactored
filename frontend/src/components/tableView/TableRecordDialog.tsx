import { useEffect, useMemo, useState } from 'react'
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined'
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import Alert from '@mui/material/Alert'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import {
  ApiError,
  createTableRow,
  deleteTableRow,
  getCommunityPosts,
  getTableLookups,
  getTableRow,
  getTableRowHistory,
  updateTableRow,
} from '@/api'
import type { RelationLookupOption, TableHistoryRevision, TableRow } from '@/api'
import { useAuth } from '@/auth'
import { AppButton } from '@/components/ui'
import { iconForTable } from '@/components/tables/tableIcons'
import { APP_PATHS, marketReportPath, useAppPath } from '@/routing'
import { relationLabel } from '@/tableView'
import type { TableColumn, TableViewSchema } from '@/tableView'
import { TableRecordAssets } from './TableRecordAssets'
import { TableRecordCommunity } from './TableRecordCommunity'
import { TableRecordField } from './TableRecordField'
import { TableRecordHistory } from './TableRecordHistory'

export function TableRecordDialog({
  open,
  table,
  schema,
  recordId,
  creating = false,
  onClose,
  onSaved,
  onCreated,
  onDeleted,
  onOpenRelated,
}: {
  open: boolean
  table: string
  schema: TableViewSchema
  recordId: number | null
  creating?: boolean
  onClose: () => void
  onSaved: () => void
  onCreated?: (id: number) => void
  onDeleted?: () => void
  onOpenRelated?: (table: string, id: number) => void
}) {
  const [record, setRecord] = useState<TableRow | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [lookups, setLookups] = useState<Record<string, RelationLookupOption[]>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [duplicateMode, setDuplicateMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)
  const [tab, setTab] = useState<'item' | 'history' | 'assets'>('item')
  const [history, setHistory] = useState<TableHistoryRevision[] | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [communityOpen, setCommunityOpen] = useState(false)
  const [communityCount, setCommunityCount] = useState(0)
  const { user } = useAuth()
  const { navigate } = useAppPath()
  const decolorize = Boolean(user?.decolorize_avatars)
  const HeadingIcon = iconForTable(schema.icon)
  const isNew = (creating && recordId === null) || duplicateMode
  const visibleColumns = useMemo(() => {
    if (!isNew || !schema.incrementing) {
      return schema.columns
    }

    return schema.columns.filter((column) => column.kind !== 'id' && column.key !== 'ID')
  }, [isNew, schema.columns, schema.incrementing])
  const { primary, extra } = useMemo(
    () => splitColumns(visibleColumns, schema.collapseItem, schema.primaryColumnCount),
    [visibleColumns, schema.collapseItem, schema.primaryColumnCount],
  )

  useEffect(() => {
    const creatingBlank = creating && recordId === null
    if (!open || (!creatingBlank && recordId === null)) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setShowMore(creatingBlank)
    setTab('item')
    setDuplicateMode(false)
    setConfirmDelete(false)
    setCommunityOpen(false)
    setCommunityCount(0)
    setHistory(null)
    setHistoryError(null)

    const requests: Promise<unknown>[] = []
    if (!creatingBlank && recordId !== null) {
      requests.push(getTableRow(table, recordId))
    }
    if (schema.canEdit) {
      requests.push(getTableLookups(table))
    }

    void Promise.all(requests)
      .then((results) => {
        if (cancelled) {
          return
        }

        if (creatingBlank) {
          setRecord({ ID: 0 })
          setDraft(emptyDraft(schema.columns))
          setLookups((results[0] as Record<string, RelationLookupOption[]>) ?? {})
          return
        }

        const nextRecord = results[0] as TableRow
        setRecord(nextRecord)
        setDraft(toDraft(schema.columns, nextRecord))
        if (schema.canEdit) {
          setLookups((results[1] as Record<string, RelationLookupOption[]>) ?? {})
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            apiErrorMessage(caught, creatingBlank ? 'Lookups could not be loaded.' : 'This record could not be loaded.'),
          )
          setRecord(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    if (!creatingBlank && recordId !== null) {
      void getTableRowHistory(table, recordId)
        .then((revisions) => {
          if (!cancelled) {
            setHistory(revisions)
          }
        })
        .catch((caught) => {
          if (!cancelled) {
            setHistory([])
            setHistoryError(apiErrorMessage(caught, 'Edit history could not be loaded.'))
          }
        })
    }

    return () => {
      cancelled = true
    }
  }, [creating, open, recordId, schema.canEdit, schema.columns, table])

  useEffect(() => {
    if (!open || creating || recordId === null) {
      return
    }

    let cancelled = false
    void getCommunityPosts({ view: 'item', table, item_ID: recordId, per_page: 1 })
      .then((result) => {
        if (!cancelled) {
          setCommunityCount(result.meta.total)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCommunityCount(0)
        }
      })

    return () => {
      cancelled = true
    }
  }, [creating, open, recordId, table])

  async function handleSave() {
    if (!schema.canEdit || (!isNew && recordId === null)) {
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const saved = await createTableRow(table, createPayload(draft))
        setDuplicateMode(false)
        onSaved()
        onCreated?.(saved.ID)
        return
      }

      const saved = await updateTableRow(table, recordId as number, draft)
      setRecord(saved)
      setDraft(toDraft(schema.columns, saved))
      onSaved()
      try {
        setHistory(await getTableRowHistory(table, recordId as number))
        setHistoryError(null)
      } catch (historyCaught) {
        setHistoryError(apiErrorMessage(historyCaught, 'Edit history could not be loaded.'))
      }
    } catch (caught) {
      setError(apiErrorMessage(caught, isNew ? 'This record could not be created.' : 'This record could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  function handleDuplicate() {
    if (!schema.canEdit || isNew) {
      return
    }

    setDuplicateMode(true)
    setConfirmDelete(false)
    setTab('item')
    setError(null)
    setDraft((current) => {
      const next = { ...current }
      if (schema.incrementing) {
        next.ID = null
      }
      return next
    })
  }

  async function handleDelete() {
    if (!schema.canDelete || recordId === null || isNew) {
      return
    }

    setDeleting(true)
    setError(null)
    try {
      await deleteTableRow(table, recordId)
      setConfirmDelete(false)
      onSaved()
      onDeleted?.()
      onClose()
    } catch (caught) {
      setConfirmDelete(false)
      setError(apiErrorMessage(caught, 'This record could not be deleted.'))
    } finally {
      setDeleting(false)
    }
  }

  function handleBacklink() {
    if (schema.hasBacklink === 'panorama') {
      navigate(APP_PATHS.products)
      return
    }
    if (schema.hasBacklink === 'market') {
      const fromJurisdiction = table === 'jurisdictions' ? Number(recordId ?? draft.ID) : null
      const jurisdictionId = fromJurisdiction || Number(draft.jurisdiction_ID ?? record?.jurisdiction_ID)
      navigate(
        Number.isInteger(jurisdictionId) && jurisdictionId > 0
          ? marketReportPath(jurisdictionId)
          : APP_PATHS.peopleMarkets,
      )
    }
  }

  const editorName = record && !isNew ? relationLabel(record.editor) : null
  const savedAt = record && !isNew ? formatSavedAt(record.mod_date) : null
  const heading = isNew
    ? `New ${schema.itemName || schema.title}`
    : `${schema.itemName || schema.title} #${recordId ?? '…'}`
  const itemLabel = schema.itemName || schema.title

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={tab === 'assets' && !isNew ? 'lg' : 'md'}
      scroll="paper"
      aria-labelledby="table-record-title"
    >
      <DialogTitle
        id="table-record-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 800,
          py: 1.25,
          pl: 2,
          pr: 1,
        }}
      >
        <HeadingIcon sx={{ color: schema.color, fontSize: 22, flexShrink: 0 }} />
        <Box component="span" sx={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
          {heading}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, ml: 1 }}>
          {!isNew && recordId !== null ? (
            <IconButton
              aria-label="Community"
              onClick={() => setCommunityOpen(true)}
              size="small"
              sx={{ width: 40, height: 40 }}
            >
              <Badge
                badgeContent={communityCount}
                color="error"
                invisible={communityCount < 1}
                max={99}
                overlap="circular"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: 10,
                    fontWeight: 800,
                    minWidth: 16,
                    height: 16,
                    px: 0.4,
                    top: 2,
                    right: 2,
                  },
                }}
              >
                <ChatOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 22 }} />
              </Badge>
            </IconButton>
          ) : null}
          <IconButton aria-label="Close" onClick={onClose} size="small" sx={{ width: 40, height: 40 }}>
            <CloseIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Box>
      </DialogTitle>
      {!isNew ? (
        <Tabs
          value={tab}
          onChange={(_event, value: 'item' | 'history' | 'assets') => setTab(value)}
          sx={{ px: 2, minHeight: 48, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab
            value="item"
            icon={<HeadingIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={schema.itemName || 'Item'}
            sx={{ minHeight: 48, fontWeight: 800 }}
          />
          <Tab
            value="assets"
            icon={<HubOutlinedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Assets"
            sx={{ minHeight: 48, fontWeight: 800 }}
          />
          <Tab
            value="history"
            icon={<HistoryOutlinedIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="History"
            sx={{ minHeight: 48, fontWeight: 800 }}
          />
        </Tabs>
      ) : null}
      <DialogContent dividers={!isNew ? false : true} sx={{ bgcolor: 'grey.50', p: tab === 'item' ? 3 : 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : error && !record ? (
          <Alert severity="error">{error}</Alert>
        ) : record && tab === 'assets' && recordId !== null ? (
          <TableRecordAssets table={table} recordId={recordId} decolorize={decolorize} />
        ) : record && tab === 'history' ? (
          historyError ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {historyError}
            </Alert>
          ) : history === null ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <TableRecordHistory revisions={history} decolorize={decolorize} />
          )
        ) : record ? (
          <Box>
            <Typography sx={{ textAlign: 'center', mb: 2, color: 'text.secondary' }}>
              {isNew ? (
                'Fill in the fields and save to add this record.'
              ) : (
                <>
                  {editorName ? <Box component="strong">{editorName}</Box> : 'Unknown'}
                  {' · Last saved '}
                  <Box component="strong">{savedAt ?? '—'}</Box>
                </>
              )}
            </Typography>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : null}
            {primary.map((column) => (
              <TableRecordField
                key={column.key}
                column={column}
                row={record}
                value={draft[column.key]}
                lookups={lookups[column.key] ?? []}
                canEdit={schema.canEdit}
                creating={isNew}
                onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
                onOpenRelated={onOpenRelated}
              />
            ))}
            {extra.length > 0 ? (
              <>
                <Collapse in={showMore}>
                  {extra.map((column) => (
                    <TableRecordField
                      key={column.key}
                      column={column}
                      row={record}
                      value={draft[column.key]}
                      lookups={lookups[column.key] ?? []}
                      canEdit={schema.canEdit}
                      creating={isNew}
                      onChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
                      onOpenRelated={onOpenRelated}
                    />
                  ))}
                </Collapse>
                <AppButton
                  type="button"
                  size="small"
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  startIcon={<KeyboardDoubleArrowDownIcon />}
                  onClick={() => setShowMore((current) => !current)}
                  sx={{ mt: 1.5 }}
                >
                  {showMore ? 'Less Attributes' : 'More Attributes'}
                </AppButton>
              </>
            ) : null}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        {schema.hasBacklink === 'panorama' && !isNew ? (
          <AppButton
            type="button"
            size="medium"
            onClick={handleBacklink}
            startIcon={<Inventory2OutlinedIcon />}
            endIcon={<ChevronRightOutlinedIcon />}
            sx={{
              borderRadius: 999,
              bgcolor: 'merkur.pink',
              color: 'common.white',
              px: 2,
              boxShadow: '0 8px 18px rgba(232, 49, 129, 0.28)',
              '&:hover': { bgcolor: 'merkur.darkPink', transform: 'translateY(-1px)' },
            }}
          >
            Show in Products
          </AppButton>
        ) : null}
        {schema.hasBacklink === 'market' && !isNew ? (
          <AppButton
            type="button"
            size="medium"
            onClick={handleBacklink}
            startIcon={<TrendingUpOutlinedIcon />}
            endIcon={<ChevronRightOutlinedIcon />}
            sx={{
              borderRadius: 999,
              background: 'linear-gradient(135deg, #009FE3 0%, #022052 100%)',
              color: 'common.white',
              px: 2,
              boxShadow: '0 10px 22px rgba(0, 159, 227, 0.32)',
              '&:hover': {
                background: 'linear-gradient(135deg, #33B2E9 0%, #03306f 100%)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            Show Market Report
          </AppButton>
        ) : null}
        <Box sx={{ flex: 1 }} />
        <AppButton type="button" size="medium" variant="outlined" color="inherit" onClick={onClose}>
          Close
        </AppButton>
        {schema.canDelete && !isNew && recordId !== null ? (
          <AppButton
            type="button"
            size="medium"
            color="error"
            onClick={() => setConfirmDelete(true)}
            disabled={saving || loading || deleting}
            startIcon={<DeleteOutlinedIcon />}
          >
            Delete
          </AppButton>
        ) : null}
        {schema.canEdit && !isNew ? (
          <AppButton
            type="button"
            size="medium"
            variant="contained"
            color="secondary"
            onClick={handleDuplicate}
            disabled={saving || loading}
            startIcon={<ContentCopyOutlinedIcon />}
          >
            Duplicate
          </AppButton>
        ) : null}
        {duplicateMode ? (
          <Typography sx={{ color: 'success.main', fontWeight: 700, alignSelf: 'center' }}>
            {itemLabel} has been duplicated.
          </Typography>
        ) : null}
        {schema.canEdit ? (
          <AppButton
            type="button"
            size="medium"
            onClick={() => void handleSave()}
            disabled={saving || loading || (!isNew && recordId === null)}
            startIcon={<CheckOutlinedIcon />}
          >
            {saving ? (isNew ? 'Creating…' : 'Saving…') : isNew ? 'Create' : 'Save'}
          </AppButton>
        ) : null}
      </DialogActions>
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} aria-labelledby="delete-record-title">
        <DialogTitle id="delete-record-title">Delete this {itemLabel.toLowerCase()}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes the {itemLabel.toLowerCase()} from the table. Files in Asset Hub stay on disk until they are
            deleted there. Other records that still point here will block deletion.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton type="button" size="medium" variant="outlined" color="inherit" onClick={() => setConfirmDelete(false)}>
            Cancel
          </AppButton>
          <AppButton type="button" size="medium" color="error" onClick={() => void handleDelete()} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </AppButton>
        </DialogActions>
      </Dialog>
    </Dialog>
    {!isNew && recordId !== null ? (
      <TableRecordCommunity
        open={communityOpen}
        table={table}
        recordId={recordId}
        itemLabel={itemLabel}
        decolorize={decolorize}
        onClose={() => setCommunityOpen(false)}
        onCountChange={setCommunityCount}
      />
    ) : null}
    </>
  )
}

function splitColumns(columns: TableColumn[], collapseItem: string | null, primaryCount: number) {
  const collapseAt = collapseItem ? columns.findIndex((column) => column.key === collapseItem) : -1
  const index = collapseAt >= 0 ? collapseAt : Math.min(primaryCount, columns.length)

  return {
    primary: columns.slice(0, index),
    extra: columns.slice(index),
  }
}

function toDraft(columns: TableColumn[], record: TableRow): Record<string, unknown> {
  const draft: Record<string, unknown> = {}
  for (const column of columns) {
    draft[column.key] = record[column.key] ?? null
  }
  return draft
}

function emptyDraft(columns: TableColumn[]): Record<string, unknown> {
  const draft: Record<string, unknown> = {}
  for (const column of columns) {
    if (column.kind === 'boolean') {
      draft[column.key] = false
      continue
    }
    draft[column.key] = null
  }
  return draft
}

function createPayload(draft: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(draft)) {
    if (key === 'ID' && (value === null || value === '' || value === 0)) {
      continue
    }
    if ((key === 'ID' || key.endsWith('_ID')) && typeof value === 'string' && /^\d+$/.test(value)) {
      payload[key] = Number(value)
      continue
    }
    payload[key] = value
  }
  return payload
}

function apiErrorMessage(caught: unknown, fallback: string): string {
  if (!(caught instanceof ApiError)) {
    return fallback
  }

  const fieldErrors = Object.values(caught.errors)
    .flat()
    .map((message) => message.trim())
    .filter(Boolean)

  if (fieldErrors.length > 0) {
    return fieldErrors.join(' ')
  }

  return caught.message.trim() || fallback
}

function formatSavedAt(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getTableRows, getTableView, exportTable } from '@/api'
import type { Paginated, TableExportFormat, TableRow } from '@/api'
import { TableBrowseSidebar } from '@/components/tableView/TableBrowseSidebar'
import { TableRecordDialog, TableRecords } from '@/components/tableView'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { iconForTable } from '@/components/tables/tableIcons'
import { AppButton, AppTextField } from '@/components/ui'
import { tablePageConfig } from '@/config/tablePages'
import { catalogTitle, useI18n } from '@/i18n'
import { APP_PATHS, useAppPath } from '@/routing'
import { toListQuery, useTableView } from '@/tableView'
import type { TableViewSchema } from '@/tableView'

const emptyPage: Paginated<TableRow> = {
  data: [],
  meta: {
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 25,
    to: null,
    total: 0,
  },
}

// Reads "?id=123" from browser URL to open that record on page load
function recordIdFromSearch(): number | null {
  const id = Number(new URLSearchParams(window.location.search).get('id'))
  return Number.isInteger(id) && id > 0 ? id : null
}

// Reads "?new=1" from browser URL to open the "Create New" popup on page load
function creatingFromSearch(): boolean {
  return new URLSearchParams(window.location.search).get('new') === '1'
}

export function TableBrowsePage({ table }: { table: string }) {
  // Routing paths (frontend URL and backend API route for this table)
  const config = tablePageConfig(table)

  // Router navigation helper to change URL/page
  const { navigate } = useAppPath()
  const { t } = useI18n()

  // -------------------------------------------------------------
  // STATES
  // -------------------------------------------------------------

  // Table blueprint: columns, permissions (canEdit), and default settings from backend
  const [schema, setSchema] = useState<TableViewSchema | null>(null)

  // True if table does not exist or user has no access (404 Not Found)
  const [missing, setMissing] = useState(false)

  // Text while typing in the search box (does not trigger API call yet)
  const [searchDraft, setSearchDraft] = useState('')

  // Active search query sent to the backend (set when pressing Enter or clicking Find)
  const [searchQuery, setSearchQuery] = useState('')

  // Current page number for pagination (starts at page 1)
  const [page, setPage] = useState(1)

  // Row data and pagination metadata (total rows, last_page) returned from backend
  const [payload, setPayload] = useState<Paginated<TableRow> | null>(null)

  // ID of the row currently open in the details/edit popup (null when closed)
  const [recordId, setRecordId] = useState<number | null>(() => recordIdFromSearch())

  // True when the "Create New Item" modal popup is open
  const [creating, setCreating] = useState(() => creatingFromSearch())

  // Mutation counter: increments by 1 whenever a record is saved/updated to reload the table
  const [listEpoch, setListEpoch] = useState(0)

  // True while generating a file download (CSV, Excel, PDF) to disable export buttons
  const [exporting, setExporting] = useState(false)

  // Custom hook: manages filter/sort changes in staging (draft) before user clicks Apply (applied)
  const { draft, applied, patchDraft, apply, resetToDefault, isDefaultDraft } = useTableView(schema)
console.log('draft', draft)
console.log('applied', applied)
console.log('patchDraft', patchDraft)
console.log('apply', apply)
console.log('resetToDefault', resetToDefault)
console.log('isDefaultDraft', isDefaultDraft)

  const title = catalogTitle(t, table, schema?.title ?? t('pages.tables', 'Tables'))
  const HeadingIcon = iconForTable(schema?.icon)

  // -------------------------------------------------------------
  // EFFECTS (LIFECYCLE HOOKS)
  // -------------------------------------------------------------

  // Effect 1: Updates browser tab title (e.g. "Games (Table) | MERKURflow")
  useEffect(() => {
    document.title = `${t('common.tableTab', '{title} (Table)', { title })} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [t, title])

  // Effect 2: Fetches the table schema (columns, permissions, defaults) when table changes
  useEffect(() => {
    let cancelled = false

    void getTableView(config.table)
      .then((result) => {
        if (!cancelled) {
          setMissing(false)
          setSchema(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSchema(null)
          setMissing(true) // Marks table as missing if 404 error occurs
        }
      })

    return () => {
      cancelled = true
    }
  }, [config.table])

  // Effect 3: Permission guard — if a read-only user opens "?new=1", bounce them back
  useEffect(() => {
    if (schema && creating && !schema.canEdit) {
      setCreating(false)
      navigate(config.path, { replace: true })
    }
  }, [schema, creating, config.path, navigate])

  // Effect 4: Fetches table rows whenever page, search query, filters, or listEpoch change
  useEffect(() => {
    if (!applied) {
      return
    }

    let cancelled = false
    const query = toListQuery(applied)

    void getTableRows(config.listPath, {
      page,
      q: searchQuery,
      ...query,
    })
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload(emptyPage)
        }
      })

    return () => {
      cancelled = true
    }
  }, [applied, config.listPath, page, searchQuery, listEpoch])

  // -------------------------------------------------------------
  // HANDLER FUNCTIONS
  // -------------------------------------------------------------

  // Triggers search when user submits the search form (Enter or click Find)
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearchQuery(searchDraft.trim())
  }

  // Applies filter and sort settings from the sidebar
  function handleApply() {
    const result = apply()
    if (result.serverChanged) {
      setPage(1) // Resets back to page 1 if sorting or page size changed
    }
  }

  // Resets filters and sorting back to table defaults
  function handleResetToDefault() {
    resetToDefault()
    setPage(1)
  }

  // Exports the table data into CSV, XLSX, PDF, or opens print preview
  async function handleExport(format: TableExportFormat, preview?: Window | null) {
    if (!applied) {
      preview?.close()
      return
    }

    setExporting(true)
    try {
      const query = toListQuery(applied)
      await exportTable(config.table, format, {
        sort_by: query.sort_by,
        sort_dir: query.sort_dir,
        sort_by2: query.sort_by2,
        sort_dir2: query.sort_dir2,
        columns: format === 'csv' || format === 'xlsx' ? undefined : applied.visibleColumns,
        preview,
      })
    } catch (caught) {
      preview?.close()
      const message = caught instanceof Error ? caught.message : t('common.exportFailed', 'The table could not be exported.')
      window.alert(message)
    } finally {
      setExporting(false)
    }
  }

  // Opens an existing row in the details popup dialog and updates URL (?id=...)
  function openRecord(id: number) {
    setCreating(false)
    setRecordId(id)
    navigate(`${config.path}?id=${id}`, { replace: true })
  }

  // Opens the blank "Create New Item" popup dialog (only if user has edit permission)
  function openNewRecord() {
    if (!schema?.canEdit) {
      return
    }

    setRecordId(null)
    setCreating(true)
    navigate(config.path, { replace: true })
  }

  // Closes the popup dialog and cleans up "?id=..." from the URL
  function closeRecord() {
    setRecordId(null)
    setCreating(false)
    navigate(config.path, { replace: true })
  }

  // Opens a linked relation (in same modal if same table, or navigates to the related table)
  function handleOpenRelated(relatedTable: string, id: number) {
    if (relatedTable === table) {
      openRecord(id)
      return
    }

    navigate(`/tables/${relatedTable}?id=${id}`)
  }

  const crumbSx = {
    border: 0,
    p: 0,
    bgcolor: 'transparent',
    color: 'info.main',
    cursor: 'pointer',
    font: 'inherit',
    '&:hover': { textDecoration: 'underline' },
  } as const

  const isWide = applied?.widthMode === 'w'

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: isWide ? 2 : 4, lg: isWide ? 2 : 6 },
          py: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ maxWidth: isWide ? 'none' : 1280, mx: 'auto', width: '100%' }}>
          <Box
            component="nav"
            aria-label={t('common.breadcrumb', 'Breadcrumb')}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, fontSize: 14 }}
          >
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              <CrumbHome />
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.tables)} sx={crumbSx}>
              {t('pages.tables', 'Tables')}
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">{missing ? table : title}</Box>
          </Box>

          {missing ? (
            <Typography color="text.secondary">{t('common.tableUnavailable', 'This table is not available.')}</Typography>
          ) : (
          <>
          <Typography
            component="h1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 800,
              fontSize: { xs: 32, md: 40 },
              mb: 3,
            }}
          >
            <HeadingIcon sx={{ color: schema?.color ?? '#ffcc00', fontSize: 36 }} />
            {title}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: isWide ? 'minmax(0, 1fr) 320px' : 'minmax(0, 2fr) minmax(280px, 1fr)',
              },
              gap: { xs: 3, md: 4 },
              alignItems: 'start',
            }}
          >
            <Box>
              <Box
                component="form"
                role="search"
                onSubmit={handleSearch}
                sx={{ display: 'flex', alignItems: 'stretch', mb: 2 }}
              >
                <AppTextField
                  name="q"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  autoComplete="off"
                  placeholder={t('common.findIn', 'Find anything in “{title}”', { title })}
                  aria-label={t('common.findInAria', 'Find in {title}', { title })}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      height: 48,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    },
                    '& .MuiOutlinedInput-notchedOutline': { borderRight: 0 },
                  }}
                />
                <AppButton
                  type="submit"
                  color="info"
                  aria-label={t('common.find', 'Find')}
                  startIcon={<SearchIcon />}
                  sx={{
                    height: 48,
                    minWidth: 56,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    boxShadow: 'none',
                  }}
                />
              </Box>
              <TableRecords
                table={schema?.table}
                payload={payload}
                page={page}
                visibleColumns={applied?.visibleColumns ?? []}
                columns={schema?.columns ?? []}
                onPageChange={setPage}
                onRowOpen={openRecord}
              />
            </Box>
            {schema && draft ? (
              <TableBrowseSidebar
                schema={schema}
                draft={draft}
                isDefaultDraft={isDefaultDraft}
                exporting={exporting}
                onDraftChange={patchDraft}
                onApply={handleApply}
                onResetToDefault={handleResetToDefault}
                onNew={openNewRecord}
                onExport={handleExport}
              />
            ) : null}
          </Box>
          </>
          )}
        </Box>
      </Box>
      {schema ? (
        <TableRecordDialog
          open={creating || recordId !== null}
          table={table}
          schema={schema}
          recordId={recordId}
          creating={creating}
          onClose={closeRecord}
          onSaved={() => setListEpoch((current) => current + 1)}
          onCreated={openRecord}
          onDeleted={closeRecord}
          onOpenRelated={handleOpenRelated}
        />
      ) : null}
      <AppFooter />
    </PageBackground>
  )
}

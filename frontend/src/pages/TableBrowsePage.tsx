import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getTableRows, getTableView, exportTable } from '@/api'
import type { Paginated, TableExportFormat, TableRow } from '@/api'
import { TableBrowseSidebar } from '@/components/tableView/TableBrowseSidebar'
import { TableRecordDialog, TableRecords } from '@/components/tableView'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { iconForTable } from '@/components/tables/tableIcons'
import { AppButton, AppTextField } from '@/components/ui'
import { tablePageConfig } from '@/config/tablePages'
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

function recordIdFromSearch(): number | null {
  const id = Number(new URLSearchParams(window.location.search).get('id'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function creatingFromSearch(): boolean {
  return new URLSearchParams(window.location.search).get('new') === '1'
}

export function TableBrowsePage({ table }: { table: string }) {
  const config = tablePageConfig(table)
  const { navigate } = useAppPath()
  const [schema, setSchema] = useState<TableViewSchema | null>(null)
  const [missing, setMissing] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [payload, setPayload] = useState<Paginated<TableRow> | null>(null)
  const [recordId, setRecordId] = useState<number | null>(() => recordIdFromSearch())
  const [creating, setCreating] = useState(() => creatingFromSearch())
  const [listEpoch, setListEpoch] = useState(0)
  const [exporting, setExporting] = useState(false)
  const { draft, applied, patchDraft, apply, resetToDefault, isDefaultDraft } = useTableView(schema)
  const title = schema?.title ?? 'Table'
  const HeadingIcon = iconForTable(schema?.icon)

  useEffect(() => {
    document.title = `${title} (Table) | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [title])

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
          setMissing(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [config.table])

  useEffect(() => {
    if (schema && creating && !schema.canEdit) {
      setCreating(false)
      window.history.replaceState(null, '', config.path)
    }
  }, [schema, creating, config.path])

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

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearchQuery(searchDraft.trim())
  }

  function handleApply() {
    const result = apply()
    if (result.serverChanged) {
      setPage(1)
    }
  }

  function handleResetToDefault() {
    resetToDefault()
    setPage(1)
  }

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
      const message = caught instanceof Error ? caught.message : 'The table could not be exported.'
      window.alert(message)
    } finally {
      setExporting(false)
    }
  }

  function openRecord(id: number) {
    setCreating(false)
    setRecordId(id)
    window.history.replaceState(null, '', `${config.path}?id=${id}`)
  }

  function openNewRecord() {
    if (!schema?.canEdit) {
      return
    }

    setRecordId(null)
    setCreating(true)
    window.history.replaceState(null, '', config.path)
  }

  function closeRecord() {
    setRecordId(null)
    setCreating(false)
    window.history.replaceState(null, '', config.path)
  }

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
            aria-label="Breadcrumb"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, fontSize: 14 }}
          >
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.tables)} sx={crumbSx}>
              Tables
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">{missing ? table : title}</Box>
          </Box>

          {missing ? (
            <Typography color="text.secondary">This table is not available.</Typography>
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
                  placeholder={`Find anything in “${title}”`}
                  aria-label={`Find in ${title}`}
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
                  aria-label="Find"
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

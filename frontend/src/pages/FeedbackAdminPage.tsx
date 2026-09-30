import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  ApiError,
  downloadFeedbackExport,
  getAdminFeedback,
  openFeedbackScreenshot,
  updateFeedback,
} from '@/api'
import type { FeedbackStatus, FeedbackSubmission } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { APP_PATHS, useAppPath } from '@/routing'

const STATUSES: FeedbackStatus[] = ['new', 'under_review', 'planned', 'in_progress', 'completed', 'declined']

const DEPARTMENTS = [
  'Product Management',
  'R&D',
  'Sales',
  'Market Research',
  'Data Analytics',
  'Support',
  'Operations',
  'C-Level Suite',
  'Other',
]

const FEEDBACK_TYPES = [
  'Improvement Suggestion',
  'New Feature Request',
  'Bug Report / Issue',
  'Usability Feedback',
  'Performance Suggestion',
  'General Comment',
]

const PRIORITIES = ['critical', 'high', 'medium', 'low']

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ')
}

export default function FeedbackAdminPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const isSuperuser = Boolean(user?.role?.['may_create-update-delete_system-items'])
  const [items, setItems] = useState<FeedbackSubmission[] | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<FeedbackSubmission | null>(null)
  const [draftStatus, setDraftStatus] = useState<FeedbackStatus>('under_review')
  const [draftNotes, setDraftNotes] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const filterQuery = useCallback(
    () => ({
      per_page: 100,
      status: statusFilter || undefined,
      department: departmentFilter || undefined,
      feedback_type: typeFilter || undefined,
      priority: priorityFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      q: query || undefined,
    }),
    [dateFrom, dateTo, departmentFilter, priorityFilter, query, statusFilter, typeFilter],
  )

  const load = useCallback(async () => {
    const result = await getAdminFeedback(filterQuery())
    setItems(result.data)
  }, [filterQuery])

  useEffect(() => {
    document.title = 'Feedback Admin | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) {
      return
    }
    void load().catch(() => {
      setItems([])
      setError(true)
      setMessage('Could not load feedback.')
    })
  }, [isSuperuser, load])

  function openItem(item: FeedbackSubmission) {
    setSelected(item)
    setDraftStatus(item.status)
    setDraftNotes(item.admin_notes ?? '')
    setMessage('')
  }

  function clearFilters() {
    setStatusFilter('')
    setDepartmentFilter('')
    setTypeFilter('')
    setPriorityFilter('')
    setDateFrom('')
    setDateTo('')
    setQuery('')
  }

  async function exportCsv() {
    if (busy) {
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await downloadFeedbackExport(filterQuery())
      setError(false)
      setMessage('CSV export downloaded.')
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not export CSV.')
    } finally {
      setBusy(false)
    }
  }

  async function saveReview() {
    if (!selected || busy) {
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const updated = await updateFeedback(selected.id, {
        status: draftStatus,
        admin_notes: draftNotes.trim() || null,
      })
      setSelected(updated)
      setError(false)
      setMessage('Saved.')
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3, maxWidth: 1100, mx: 'auto', width: '100%' }}>
        <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 2, fontSize: 14, flexWrap: 'wrap' }}>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
            Start
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.admin)} sx={crumbSx}>
            Admin
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.feedback)} sx={crumbSx}>
            Feedback
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="span">Admin</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          Feedback review
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Review submissions, update status, and keep internal notes.
        </Typography>

        {!isSuperuser ? (
          <Alert severity="warning">Superuser access is required for feedback review.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                sx={{ minWidth: 180 }}
              />
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All</MenuItem>
                {STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {statusLabel(status)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Department"
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All</MenuItem>
                {DEPARTMENTS.map((department) => (
                  <MenuItem key={department} value={department}>
                    {department}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">All</MenuItem>
                {FEEDBACK_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Priority"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="">All</MenuItem>
                {PRIORITIES.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="date"
                label="From"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ minWidth: 150 }}
              />
              <AppButton variant="outlined" color="inherit" onClick={() => void load()}>
                Refresh
              </AppButton>
              <AppButton variant="outlined" color="inherit" onClick={clearFilters}>
                Clear
              </AppButton>
              <AppButton variant="outlined" color="inherit" disabled={busy} onClick={() => void exportCsv()}>
                Export CSV
              </AppButton>
            </Box>

            {message ? (
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message}
              </Alert>
            ) : null}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white', maxHeight: 640, overflow: 'auto' }}>
                {items === null ? (
                  <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
                ) : items.length === 0 ? (
                  <Typography sx={{ p: 2, color: 'text.secondary' }}>No feedback found.</Typography>
                ) : (
                  items.map((item) => (
                    <Box
                      key={item.id}
                      component="button"
                      type="button"
                      onClick={() => openItem(item)}
                      sx={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        border: 0,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: selected?.id === item.id ? 'grey.100' : 'transparent',
                        px: 2,
                        py: 1.25,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                    >
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{item.subject}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                        {item.reference} · {item.submitter_name} · {item.department || '—'} · {item.priority} ·{' '}
                        {statusLabel(item.status)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>

              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white', p: 2 }}>
                {!selected ? (
                  <Typography color="text.secondary">Select a submission to review.</Typography>
                ) : (
                  <>
                    <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.5 }}>{selected.subject}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1.5 }}>
                      {selected.reference} · {selected.type_label} · {selected.department} · {selected.priority} ·{' '}
                      {selected.submitter_name} ({selected.submitter_email})
                    </Typography>
                    {selected.related_area ? (
                      <Typography sx={{ fontSize: 13, mb: 1 }}>Area: {selected.related_area}</Typography>
                    ) : null}
                    <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2, fontSize: 14 }}>{selected.description}</Typography>
                    {selected.has_screenshot ? (
                      <AppButton
                        size="small"
                        variant="outlined"
                        color="inherit"
                        sx={{ mb: 2 }}
                        onClick={() => void openFeedbackScreenshot(selected.id)}
                      >
                        Open screenshot
                      </AppButton>
                    ) : null}
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Status"
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value as FeedbackStatus)}
                      sx={{ mb: 1.5 }}
                    >
                      {STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {statusLabel(status)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Admin notes"
                      value={draftNotes}
                      onChange={(event) => setDraftNotes(event.target.value)}
                      sx={{ mb: 1.5 }}
                    />
                    <AppButton disabled={busy} onClick={() => void saveReview()}>
                      {busy ? 'Saving…' : 'Save review'}
                    </AppButton>
                  </>
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { ApiError, createScoutEvent, getScoutAdminEvents, updateScoutEvent } from '@/api'
import type { ScoutEventRecord } from '@/api'
import { IceHero, IceSectionHead, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppTextField } from '@/components/ui'
import { APP_PATHS, ice2027AdminPath, ice2027DashboardPath, ice2027ProgressPath, useAppPath } from '@/routing'

const ICONS = [
  ['fa-binoculars', 'Binoculars'],
  ['fa-igloo', 'Igloo'],
  ['fa-globe', 'Globe'],
  ['fa-landmark', 'Landmark'],
  ['fa-chess-rook', 'Rook'],
] as const

export default function ScoutEventsPage() {
  const { navigate } = useAppPath()
  const [events, setEvents] = useState<ScoutEventRecord[]>([])
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState({ name: '', slug: '', year: '', icon: 'fa-binoculars' })
  const [edits, setEdits] = useState<Record<number, { name: string; year: string; icon: string; active: boolean }>>({})

  useEffect(() => {
    document.title = 'Scouting events | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getScoutAdminEvents()
      .then((result) => {
        if (!cancelled) {
          applyEvents(result.events)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'Scouting events could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function applyEvents(next: ScoutEventRecord[], message?: string) {
    setEvents(next)
    setEdits(
      Object.fromEntries(
        next.map((event) => [
          event.ID,
          {
            name: event.name,
            year: event.year ? String(event.year) : '',
            icon: event.icon || 'fa-binoculars',
            active: event.active,
          },
        ]),
      ),
    )
    if (message) {
      setFlash(message)
      setFailed('')
    }
  }

  async function addEvent() {
    setSaving(true)
    try {
      const result = await createScoutEvent({
        name: draft.name,
        slug: draft.slug || undefined,
        year: draft.year === '' ? null : Number(draft.year),
        icon: draft.icon,
      })
      applyEvents(result.events, result.message)
      setDraft({ name: '', slug: '', year: '', icon: 'fa-binoculars' })
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Event could not be created.')
    } finally {
      setSaving(false)
    }
  }

  async function saveEvent(event: ScoutEventRecord) {
    const edit = edits[event.ID]
    if (!edit) {
      return
    }
    setSaving(true)
    try {
      const result = await updateScoutEvent(event.slug, {
        name: edit.name,
        year: edit.year === '' ? null : Number(edit.year),
        icon: edit.icon,
        active: edit.active,
      })
      applyEvents(result.events, result.message)
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Event could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Scouting events</Box>
          </Box>

          <IceHero kicker="Scouting" title="Events">
            G2E, ICE, and later shows all use the same scouting tools. Create an event, then mark attendants and add
            competitors for that show only.
          </IceHero>

          <IceTabs current="events" attendant admin />

          {failed ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {failed}
            </Alert>
          ) : null}
          {flash ? (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFlash('')}>
              {flash}
            </Alert>
          ) : null}

          <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <IceSectionHead title="Add event" />
            <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1.5fr 1fr 1.5fr auto' }, gap: 1.5, alignItems: 'end' }}>
              <AppTextField label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. ICE 2028" />
              <AppTextField label="Slug" value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} placeholder="e.g. ice2028" />
              <AppTextField label="Year" type="number" value={draft.year} onChange={(event) => setDraft((current) => ({ ...current, year: event.target.value }))} />
              <AppTextField select label="Icon" value={draft.icon} onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}>
                {ICONS.map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </AppTextField>
              <AppButton onClick={() => void addEvent()} disabled={saving || draft.name.trim() === ''}>
                Add
              </AppButton>
            </Box>
            <Typography sx={{ color: 'text.secondary', px: 2.5, pb: 2, fontSize: 13 }}>
              The slug is used in URLs: <code>?e=ice2028</code>. Teams are created automatically.
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <IceSectionHead title="Existing events" />
            <Box sx={{ p: 2.5, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Slug</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Menu</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event) => {
                    const edit = edits[event.ID] ?? { name: event.name, year: '', icon: event.icon, active: event.active }
                    return (
                      <TableRow key={event.ID}>
                        <TableCell sx={{ minWidth: 180 }}>
                          <AppTextField
                            size="small"
                            value={edit.name}
                            onChange={(change) =>
                              setEdits((current) => ({ ...current, [event.ID]: { ...edit, name: change.target.value } }))
                            }
                          />
                        </TableCell>
                        <TableCell>{event.slug}</TableCell>
                        <TableCell sx={{ width: 110 }}>
                          <AppTextField
                            size="small"
                            type="number"
                            value={edit.year}
                            onChange={(change) =>
                              setEdits((current) => ({ ...current, [event.ID]: { ...edit, year: change.target.value } }))
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ width: 140 }}>
                          <AppTextField
                            select
                            size="small"
                            value={edit.active ? '1' : '0'}
                            onChange={(change) =>
                              setEdits((current) => ({
                                ...current,
                                [event.ID]: { ...edit, active: change.target.value === '1' },
                              }))
                            }
                          >
                            <MenuItem value="1">In menu</MenuItem>
                            <MenuItem value="0">Hidden</MenuItem>
                          </AppTextField>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <AppButton size="small" variant="outlined" onClick={() => void saveEvent(event)} disabled={saving}>
                            Save
                          </AppButton>
                          <AppButton size="small" sx={{ ml: 1 }} onClick={() => navigate(ice2027AdminPath(event.slug))}>
                            Open admin
                          </AppButton>
                          <AppButton size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => navigate(ice2027DashboardPath(event.slug))}>
                            Dashboard
                          </AppButton>
                          <AppButton size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => navigate(ice2027ProgressPath(event.slug))}>
                            Managers
                          </AppButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

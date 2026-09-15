import { useCallback, useEffect, useMemo, useState } from 'react'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import ListSubheader from '@mui/material/ListSubheader'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import { ICE_EVAL_CATEGORIES } from '@/api/ice2027'
import type { IceEvalRow, IceEvaluationPayload, IceGame } from '@/api/ice2027'
import { IceHero, IceOfflineBar, IceSectionHead, IceTabs, iceCrumbSx, iceStickyBarSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppTextField } from '@/components/ui'
import { loadIceEval, persistIceEvaluation } from '@/offline/iceOffline'
import { APP_PATHS, eventSlugFromSearch, ice2027HubPath, useAppPath } from '@/routing'

const CRITERIA = [
  ['graphic', 'Graphic'],
  ['sound', 'Sound'],
  ['theme', 'Theme'],
  ['mechanics', 'Mechanics/Features'],
  ['entertainment', 'Entertainment'],
  ['innovation', 'Innovation'],
  ['potential', 'Potential'],
  ['general', 'General'],
] as const

const SCORE_FIELDS = CRITERIA.map(([field]) => field)
const REQUIRED = 5
const FIELD_LABELS: Record<string, string> = {
  competitor: 'Competitor',
  game: 'Game',
  ...Object.fromEntries(CRITERIA),
  would_play: 'Would you play this game',
}

function top5Row(top5: IceEvalRow[] | Record<string, IceEvalRow> | undefined, index: number): IceEvalRow {
  if (!top5) {
    return {}
  }
  if (Array.isArray(top5)) {
    return top5[index] ?? {}
  }
  return top5[index + 1] ?? top5[String(index + 1)] ?? top5[index] ?? {}
}

function competitorIdFromSearch(search: string): number | null {
  const id = Number(new URLSearchParams(search).get('c'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function emptyRow(): IceEvalRow {
  return {
    competitor_ID: null,
    game_ID: '',
    game_name: '',
    is_new_product: false,
    game_type: '',
    note: '',
    graphic: '',
    sound: '',
    theme: '',
    mechanics: '',
    entertainment: '',
    innovation: '',
    potential: '',
    general: '',
    would_play: '',
  }
}

function catalogGameId(row: IceEvalRow): number {
  if (row.game_ID === '__new__') {
    return 0
  }
  const id = Number(row.game_ID ?? 0)
  return Number.isInteger(id) && id > 0 ? id : 0
}

function gamePickValue(row: IceEvalRow): string {
  const id = catalogGameId(row)
  if (id > 0) {
    return String(id)
  }
  if ((row.game_name ?? '').trim() !== '' || row.game_ID === '__new__') {
    return '__new__'
  }
  return ''
}

function rowState(row: IceEvalRow): { started: boolean; complete: boolean; missing: string[] } {
  const missing: string[] = []
  const competitorOk = Number(row.competitor_ID ?? 0) > 0 || Boolean(row.competitor?.trim())
  const gameOk = catalogGameId(row) > 0 || (row.game_name ?? '').trim() !== ''
  if (!competitorOk) {
    missing.push('competitor')
  }
  if (!gameOk) {
    missing.push('game')
  }
  for (const field of SCORE_FIELDS) {
    const score = Number(row[field] ?? 0)
    if (score < 1 || score > 5) {
      missing.push(field)
    }
  }
  if (!['yes', 'no', 'unsure'].includes(row.would_play ?? '')) {
    missing.push('would_play')
  }
  const filled = 11 - missing.length
  return { started: filled > 0, complete: missing.length === 0, missing }
}

function usedCatalogIds(rows: IceEvalRow[], except: number): number[] {
  return rows.flatMap((row, index) => {
    if (index === except) {
      return []
    }
    const id = catalogGameId(row)
    return id > 0 ? [id] : []
  })
}

function gamesForRow(games: IceGame[], competitorId: number | null, rows: IceEvalRow[], index: number): IceGame[] {
  if (!competitorId) {
    return []
  }
  const keep = catalogGameId(rows[index] ?? {})
  const used = new Set(usedCatalogIds(rows, index))
  return games.filter((game) => game.competitor_ID === competitorId && (game.ID === keep || !used.has(game.ID)))
}

export default function Ice2027EvaluationPage() {
  const { navigate, search } = useAppPath()
  const focusId = useMemo(() => competitorIdFromSearch(search), [search])
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const [payload, setPayload] = useState<IceEvaluationPayload | null>(null)
  const [rows, setRows] = useState<IceEvalRow[]>(Array.from({ length: REQUIRED }, emptyRow))
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)
  const [invalid, setInvalid] = useState<Record<number, string[]>>({})

  const eventName = payload?.event?.name ?? 'Exhibition'
  const catalog = payload?.games ?? []
  const categories = payload?.eval_categories ?? ICE_EVAL_CATEGORIES
  const assigned = new Set(payload?.assigned_ids ?? [])
  const yours = (payload?.competitors ?? []).filter((item) => assigned.has(item.ID))
  const others = (payload?.competitors ?? []).filter((item) => !assigned.has(item.ID))
  const completeCount = rows.filter((row) => rowState(row).complete).length
  const startedCount = completeCount > 0
  const done = completeCount >= REQUIRED
  const isScout = Boolean(payload?.scout)

  const status = done
    ? {
        chip: 'success' as const,
        alert: 'success' as const,
        label: `Done · ${completeCount}/${REQUIRED}`,
        detail: `You have rated all ${REQUIRED} games. You can still edit your evaluation.`,
      }
    : startedCount
      ? {
          chip: 'warning' as const,
          alert: 'warning' as const,
          label: `${completeCount}/${REQUIRED} games rated`,
          detail: `You have rated ${completeCount} of ${REQUIRED} games. Fill all ${REQUIRED} rows to complete your evaluation.`,
        }
      : {
          chip: isScout ? ('error' as const) : ('default' as const),
          alert: isScout ? ('warning' as const) : ('info' as const),
          label: isScout ? 'Not started' : 'Optional',
          detail: isScout
            ? `Rate your Top ${REQUIRED} games. Evaluation is complete when all ${REQUIRED} rows are filled.`
            : `You are not on a scouting team, so this evaluation is optional. Fill all ${REQUIRED} rows if you want it to count as done.`,
        }

  useEffect(() => {
    document.title = `${eventName} Evaluation | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [eventName])

  const loadEval = useCallback(async () => {
    try {
      const result = await loadIceEval(focusId)
      setPayload(result.data)
      setRows(
        Array.from({ length: REQUIRED }, (_, index) => {
          const saved = top5Row(result.data.top5, index)
          return {
            ...emptyRow(),
            ...saved,
            is_new_product: Boolean(saved.is_new_product),
            game_ID: Number(saved.game_ID) > 0 ? Number(saved.game_ID) : (saved.game_name ?? '').trim() !== '' ? '__new__' : '',
          }
        }),
      )
      setInvalid({})
      setFailed('')
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Evaluation could not be loaded.')
    }
  }, [focusId, search])

  useEffect(() => {
    void loadEval()
  }, [loadEval])

  function patch(index: number, next: Partial<IceEvalRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...next } : row)))
  }

  function setCompetitor(index: number, competitorId: number | null) {
    const row = rows[index]
    const gameId = catalogGameId(row)
    const stillValid = gameId > 0 && catalog.some((game) => game.ID === gameId && game.competitor_ID === competitorId)
    patch(index, {
      competitor_ID: competitorId,
      game_ID: stillValid ? gameId : '',
      game_name: stillValid ? '' : '',
    })
  }

  function clearRow(index: number) {
    setRows((current) => current.map((row, i) => (i === index ? emptyRow() : row)))
    setInvalid((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
  }

  function setGamePick(index: number, value: string) {
    if (value === '__new__') {
      patch(index, { game_ID: '__new__' })
      return
    }
    if (value === '') {
      patch(index, { game_ID: '', game_name: '' })
      return
    }
    patch(index, { game_ID: Number(value), game_name: '' })
  }

  async function save() {
    setSaving(true)
    setFlash('')
    setFailed('')
    const messages: string[] = []
    const nextInvalid: Record<number, string[]> = {}
    rows.forEach((row, index) => {
      const state = rowState(row)
      if (state.complete) {
        return
      }
      if (!state.started) {
        return
      }
      nextInvalid[index] = state.missing
      messages.push(`Row ${index + 1}: please fill in ${state.missing.map((field) => FIELD_LABELS[field] ?? field).join(', ')}.`)
    })
    const seen: Record<string, number> = {}
    rows.forEach((row, index) => {
      const id = catalogGameId(row)
      if (id < 1) {
        return
      }
      if (seen[id] !== undefined) {
        nextInvalid[index] = [...(nextInvalid[index] ?? []), 'game']
        messages.push(`Row ${index + 1}: you already rated that game in row ${seen[id] + 1}. Pick a different game.`)
      } else {
        seen[id] = index
      }
    })
    if (messages.length > 0) {
      setInvalid(nextInvalid)
      setFailed(`Please complete the highlighted rows before saving. ${messages.join(' ')}`)
      setSaving(false)
      return
    }

    try {
      const result = await persistIceEvaluation(rows)
      setFlash(result.message)
      setInvalid({})
      await loadEval()
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Evaluation could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1480, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="button" type="button" onClick={() => navigate(ice2027HubPath(eventSlug))} sx={iceCrumbSx}>
              {eventName}
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Evaluation</Box>
          </Box>

          <IceHero kicker="Game evaluation" title={eventName}>
            {isScout
              ? 'Required. Rate your Top 5 games. Your assigned competitors are listed first; pick one of their games or type a new name.'
              : 'Optional. Rate your Top 5 games. Pick a competitor, then one of their games, or type a new name.'}
          </IceHero>

          <IceOfflineBar onUploaded={loadEval} />

          <IceTabs current="evaluation" attendant admin={Boolean(payload?.admin)} showTasks />

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

          {payload ? (
            <Alert severity={status.alert} sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip size="small" sx={{ fontWeight: 700 }} label={status.label} color={status.chip} />
              <Box component="span" sx={{ flex: 1 }}>
                {status.detail}
              </Box>
              {isScout ? (
                <AppButton size="small" variant="outlined" onClick={() => navigate(ice2027HubPath(eventSlug))}>
                  Back to my tasks
                </AppButton>
              ) : null}
            </Alert>
          ) : null}

          <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <IceSectionHead title={`Evaluation of your Top 5 games at ${eventName}`} />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ color: 'text.secondary', mb: 1.5, fontSize: 14 }}>
                <strong>5-point scale:</strong> 1 = very poor · 2 = poor · 3 = average · 4 = good · 5 = very good
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: 14, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <InfoOutlinedIcon sx={{ fontSize: 18, mt: '2px' }} />
                <span>
                  Every row you start has to be filled in completely: game, competitor, all eight ratings, and the casino question. New product, category, and note are optional. After you pick a competitor, choose one of their games or <strong>Type a new game…</strong>. A catalog game you already rated stays on that row and is hidden from the other rows. Use <strong>Clear</strong> on a row and save to remove that game’s Evaluated tick on Managers.
                </span>
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1480 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nr</TableCell>
                      <TableCell sx={{ minWidth: 176 }}>Competitor</TableCell>
                      <TableCell sx={{ minWidth: 220 }}>Game</TableCell>
                      <TableCell align="center" sx={{ minWidth: 88 }}>New product</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Category</TableCell>
                      {CRITERIA.map(([field, label]) => (
                        <TableCell key={field}>{label}</TableCell>
                      ))}
                      <TableCell sx={{ minWidth: 176 }}>Would you play this game when visiting a casino?</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>Note</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => {
                      const missing = invalid[index] ?? []
                      const competitorId = row.competitor_ID ? Number(row.competitor_ID) : null
                      const pick = gamePickValue(row)
                      const options = gamesForRow(catalog, competitorId, rows, index)
                      const fieldError = (field: string) => missing.includes(field)
                      return (
                        <TableRow
                          key={index}
                          sx={missing.length > 0 ? { bgcolor: 'rgba(211, 47, 47, 0.06)', '& > th': { color: 'error.main' } } : undefined}
                        >
                          <TableCell component="th" scope="row" sx={{ fontWeight: 800, textAlign: 'center' }}>
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <AppTextField
                              select
                              size="small"
                              error={fieldError('competitor')}
                              value={competitorId ? String(competitorId) : ''}
                              onChange={(event) => setCompetitor(index, event.target.value === '' ? null : Number(event.target.value))}
                            >
                              <MenuItem value="">Competitor…</MenuItem>
                              {yours.length > 0 ? <ListSubheader>Your competitors</ListSubheader> : null}
                              {yours.map((item) => (
                                <MenuItem key={item.ID} value={String(item.ID)}>
                                  {item.name}
                                </MenuItem>
                              ))}
                              {others.length > 0 ? (
                                <ListSubheader>{yours.length > 0 ? 'Other competitors' : 'Competitors'}</ListSubheader>
                              ) : null}
                              {others.map((item) => (
                                <MenuItem key={item.ID} value={String(item.ID)}>
                                  {item.name}
                                </MenuItem>
                              ))}
                            </AppTextField>
                          </TableCell>
                          <TableCell>
                            <AppTextField
                              select
                              size="small"
                              error={fieldError('game')}
                              value={pick}
                              onChange={(event) => setGamePick(index, event.target.value)}
                            >
                              <MenuItem value="">{competitorId ? 'Select a game…' : 'Select a competitor first'}</MenuItem>
                              <MenuItem value="__new__">Type a new game…</MenuItem>
                              {options.map((game) => (
                                <MenuItem key={game.ID} value={String(game.ID)}>
                                  {game.name}
                                </MenuItem>
                              ))}
                            </AppTextField>
                            {pick === '__new__' ? (
                              <AppTextField
                                size="small"
                                error={fieldError('game')}
                                value={row.game_name ?? ''}
                                placeholder="New game name"
                                onChange={(event) => patch(index, { game_name: event.target.value })}
                                sx={{ mt: 1 }}
                              />
                            ) : null}
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={Boolean(row.is_new_product)}
                              onChange={(event) => patch(index, { is_new_product: event.target.checked })}
                              inputProps={{ 'aria-label': 'New product' }}
                            />
                          </TableCell>
                          <TableCell>
                            <AppTextField
                              select
                              size="small"
                              value={row.game_type ?? ''}
                              onChange={(event) => patch(index, { game_type: event.target.value })}
                            >
                              <MenuItem value="">–</MenuItem>
                              {Object.entries(categories).map(([value, label]) => (
                                <MenuItem key={value} value={value}>
                                  {label}
                                </MenuItem>
                              ))}
                            </AppTextField>
                          </TableCell>
                          {SCORE_FIELDS.map((field) => (
                            <TableCell key={field}>
                              <AppTextField
                                select
                                size="small"
                                error={fieldError(field)}
                                value={row[field] != null && row[field] !== '' ? String(row[field]) : ''}
                                onChange={(event) => patch(index, { [field]: event.target.value })}
                              >
                                <MenuItem value="">–</MenuItem>
                                {[1, 2, 3, 4, 5].map((score) => (
                                  <MenuItem key={score} value={String(score)}>
                                    {score}
                                  </MenuItem>
                                ))}
                              </AppTextField>
                            </TableCell>
                          ))}
                          <TableCell>
                            <AppTextField
                              select
                              size="small"
                              error={fieldError('would_play')}
                              value={row.would_play ?? ''}
                              onChange={(event) => patch(index, { would_play: event.target.value })}
                            >
                              <MenuItem value="">–</MenuItem>
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                              <MenuItem value="unsure">Unsure</MenuItem>
                            </AppTextField>
                          </TableCell>
                          <TableCell>
                            <AppTextField
                              size="small"
                              value={row.note ?? ''}
                              placeholder="Optional"
                              onChange={(event) => patch(index, { note: event.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <AppButton size="small" variant="text" color="error" onClick={() => clearRow(index)}>
                              Clear
                            </AppButton>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Paper>

          <Box sx={iceStickyBarSx}>
            <AppButton startIcon={<SaveOutlinedIcon />} disabled={saving || !payload} onClick={() => void save()}>
              Save evaluation
            </AppButton>
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

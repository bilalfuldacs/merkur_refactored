import { useCallback, useEffect, useMemo, useState } from 'react'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
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
import type { IceEvalRow, IceEvaluationPayload } from '@/api/ice2027'
import { IceHero, IceOfflineBar, IceSectionHead, IceTabs, iceCrumbSx, iceStickyBarSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppTextField } from '@/components/ui'
import { loadIceEval, persistIceEvaluation } from '@/offline/iceOffline'
import { APP_PATHS, useAppPath } from '@/routing'

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

function competitorIdFromSearch(search: string): number | null {
  const id = Number(new URLSearchParams(search).get('c'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function emptyRow(): IceEvalRow {
  return {
    competitor_ID: null,
    game_type: '',
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

export default function Ice2027EvaluationPage() {
  const { navigate, search } = useAppPath()
  const focusId = useMemo(() => competitorIdFromSearch(search), [search])
  const [payload, setPayload] = useState<IceEvaluationPayload | null>(null)
  const [rows, setRows] = useState<IceEvalRow[]>(Array.from({ length: 5 }, emptyRow))
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    document.title = 'ICE 2027 Evaluation | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  const loadEval = useCallback(async () => {
    try {
      const result = await loadIceEval(focusId)
      setPayload(result.data)
      setRows(
        Array.from({ length: 5 }, (_, index) => ({
          ...emptyRow(),
          ...(result.data.top5[index] ?? {}),
        })),
      )
      setFailed('')
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Evaluation could not be loaded.')
    }
  }, [focusId])

  useEffect(() => {
    void loadEval()
  }, [loadEval])

  async function save() {
    setSaving(true)
    setFlash('')
    setFailed('')
    try {
      const result = await persistIceEvaluation(rows)
      setFlash(result.message)
      await loadEval()
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Evaluation could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  function patch(index: number, next: Partial<IceEvalRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...next } : row)))
  }

  const assigned = new Set(payload?.assigned_ids ?? [])
  const yours = (payload?.competitors ?? []).filter((item) => assigned.has(item.ID))
  const others = (payload?.competitors ?? []).filter((item) => !assigned.has(item.ID))

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">ICE 2027</Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Evaluation</Box>
          </Box>

          <IceHero kicker="Game evaluation" title="ICE 2027">
            {payload?.scout
              ? 'Required. Rate your Top 5 games. Your assigned competitors are listed first; other brands are optional extras.'
              : 'Optional. Rate your Top 5 games and pick any competitor from the list.'}
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
            <Alert
              severity={payload.scout ? (payload.evaluation_done ? 'success' : 'warning') : 'info'}
              sx={{ mb: 2, alignItems: 'center' }}
            >
              <Chip
                size="small"
                sx={{ mr: 1, fontWeight: 700 }}
                label={payload.scout ? (payload.evaluation_done ? 'Done' : 'Required') : 'Optional'}
                color={payload.scout ? (payload.evaluation_done ? 'success' : 'error') : 'default'}
              />
              {payload.scout
                ? payload.evaluation_done
                  ? 'You have saved this evaluation. You can still edit it or add other competitors.'
                  : 'Complete this Top 5 for your assigned competitors. You can also add games from other competitors.'
                : payload.evaluation_done
                  ? 'You have saved this evaluation. You can still edit it, or leave it as is.'
                  : 'You are not on a scouting team, so this evaluation is optional.'}
            </Alert>
          ) : null}

          <Paper elevation={0} sx={{ overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <IceSectionHead title="Evaluation of your Top 5 games at ICE 2027" />
            <Box sx={{ p: 2.5 }}>
              <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: 14 }}>
                <strong>5-point scale:</strong> 1 = very poor · 2 = poor · 3 = average · 4 = good · 5 = very good
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1100 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Competitor</TableCell>
                      <TableCell>Game Type</TableCell>
                      {CRITERIA.map(([field, label]) => (
                        <TableCell key={field}>{label}</TableCell>
                      ))}
                      <TableCell sx={{ minWidth: 160 }}>Would you play this game when visiting a casino?</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>{index + 1}</TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <AppTextField
                            select
                            size="small"
                            value={row.competitor_ID ? String(row.competitor_ID) : ''}
                            onChange={(event) =>
                              patch(index, { competitor_ID: event.target.value === '' ? null : Number(event.target.value) })
                            }
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
                            value={row.game_type ?? ''}
                            onChange={(event) => patch(index, { game_type: event.target.value })}
                          >
                            <MenuItem value="">Game type…</MenuItem>
                            {Object.entries(payload?.game_types ?? {}).map(([value, label]) => (
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
                              value={row[field] ?? ''}
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
                            value={row.would_play ?? ''}
                            onChange={(event) => patch(index, { would_play: event.target.value })}
                          >
                            <MenuItem value="">–</MenuItem>
                            <MenuItem value="yes">Yes</MenuItem>
                            <MenuItem value="no">No</MenuItem>
                            <MenuItem value="unsure">Unsure</MenuItem>
                          </AppTextField>
                        </TableCell>
                      </TableRow>
                    ))}
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

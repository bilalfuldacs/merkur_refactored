import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { ApiError, getIceProgress } from '@/api'
import type { IceProgressGameRow, IceProgressPayload, IceProgressPerson, IceProgressTeam } from '@/api/ice2027'
import { IceHero, IcePhotosButton, IceSectionHead, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { APP_PATHS, eventSlugFromSearch, ice2027HubPath, useAppPath } from '@/routing'

function evalLabel(person: IceProgressPerson): string {
  if (person.evaluation) {
    return `Done · ${person.eval_rows}/${person.eval_required}`
  }
  if (person.eval_started || person.eval_rows > 0) {
    return `${person.eval_rows}/${person.eval_required} games rated`
  }
  return 'Missing'
}

function memberChipLabel(person: IceProgressPerson): string {
  if (person.evaluation) {
    return `${person.name} · eval done`
  }
  if (person.eval_started || person.eval_rows > 0) {
    return `${person.name} · ${person.eval_rows}/${person.eval_required} rated`
  }
  return `${person.name} · eval missing`
}

function evalChipColor(person: IceProgressPerson): 'success' | 'warning' | 'error' {
  if (person.evaluation) {
    return 'success'
  }
  if (person.eval_started || person.eval_rows > 0) {
    return 'warning'
  }
  return 'error'
}

function barFill(percent: number): string {
  if (percent >= 100) {
    return 'primary.main'
  }
  if (percent >= 1) {
    return '#e8a317'
  }
  return 'secondary.main'
}

function GameCheck({ checked }: { checked: boolean }) {
  return (
    <Checkbox
      checked={Boolean(checked)}
      disabled
      size="small"
      sx={{ p: 0, color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
    />
  )
}

function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} sx={{ color: 'text.secondary', py: 2 }}>
        {message}
      </TableCell>
    </TableRow>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  const width = Math.max(0, Math.min(100, percent))
  return (
    <Box sx={{ height: 11, bgcolor: 'action.hover', borderRadius: 999, overflow: 'hidden' }}>
      <Box sx={{ height: '100%', width: `${width}%`, bgcolor: barFill(percent) }} />
    </Box>
  )
}

function TeamCard({ team }: { team: IceProgressTeam }) {
  const memberNames = team.members.map((member) => member.name).filter(Boolean)
  const evalComplete = team.eval_done >= team.member_count && team.member_count > 0
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        borderTop: '4px solid',
        borderTopColor: 'secondary.main',
        p: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mr: 'auto', lineHeight: 1.2 }}>
          {team.name}
        </Typography>
        <Chip size="small" color="primary" label={`${team.done}/${team.assigned} competitors done`} />
        <Chip size="small" color={evalComplete ? 'success' : 'warning'} label={`Eval ${team.eval_done}/${team.member_count}`} />
      </Box>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1.5 }}>
        {memberNames.length > 0 ? memberNames.join(' & ') : 'No members'}
        <Box component="span" sx={{ ml: 1 }}>
          Overall research {team.percent}%
        </Box>
      </Typography>
      <Box sx={{ mb: 2 }}>
        <ProgressBar percent={team.percent} />
      </Box>
      {team.members.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {team.members.map((member) => (
            <Chip key={member.user_ID} size="small" color={evalChipColor(member)} label={memberChipLabel(member)} />
          ))}
        </Box>
      ) : null}
      {team.competitors.length === 0 ? (
        <Typography sx={{ color: 'text.secondary' }}>No competitors assigned.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {team.competitors.map((competitor) => {
            const extra = competitor.new_products > 0
              ? ` · ${competitor.new_products} new product${competitor.new_products === 1 ? '' : 's'}`
              : ''
            const status = competitor.complete ? 'Done' : competitor.started ? 'In progress' : 'Not started'
            return (
              <Box key={competitor.ID}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, mr: 'auto' }}>{competitor.name}</Typography>
                  <Chip
                    size="small"
                    color={competitor.complete ? 'success' : competitor.started ? 'warning' : 'error'}
                    label={status}
                  />
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{competitor.percent}%</Typography>
                </Box>
                <Box sx={{ my: 0.75 }}>
                  <ProgressBar percent={competitor.percent} />
                </Box>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {competitor.covered}/{competitor.catalog} games{extra}
                  {competitor.updated_by ? (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      · last saved by <Box component="strong">{competitor.updated_by}</Box>
                      {competitor.updated_at ? ` on ${competitor.updated_at}` : ''}
                    </Box>
                  ) : null}
                </Typography>
                {competitor.games.length > 0 ? (
                  <Box sx={{ overflowX: 'auto', mt: 1 }}>
                    <Table size="small" sx={{ '& td, & th': { border: 0, py: 0.5 } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>Game</TableCell>
                          <TableCell align="center" sx={{ color: 'text.secondary', fontSize: 13 }}>Questionnaire</TableCell>
                          <TableCell align="center" sx={{ color: 'text.secondary', fontSize: 13 }}>Evaluated</TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>Pictures</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {competitor.games.map((game, index) => (
                          <TableRow key={game.key ?? `${competitor.ID}-${game.name}-${index}`}>
                            <TableCell>
                              {game.name}
                              {game.is_new ? <Chip size="small" label="New" sx={{ ml: 1 }} /> : null}
                            </TableCell>
                            <TableCell align="center">
                              <GameCheck checked={game.questionnaire} />
                            </TableCell>
                            <TableCell align="center">
                              <GameCheck checked={game.evaluated} />
                            </TableCell>
                            <TableCell>
                              <IcePhotosButton photos={game.photos} title={`${competitor.name} · ${game.name}`} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : null}
              </Box>
            )
          })}
        </Box>
      )}
    </Paper>
  )
}

function GameMatrixTable({ rows }: { rows: IceProgressGameRow[] }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Team</TableCell>
          <TableCell>Competitor</TableCell>
          <TableCell>Game</TableCell>
          <TableCell>Type</TableCell>
          <TableCell align="center">Questionnaire filled</TableCell>
          <TableCell align="center">Evaluated</TableCell>
          <TableCell>Pictures</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyRow columns={7} message="No catalog games or questionnaire products yet." />
        ) : (
          rows.map((row, index) => (
            <TableRow key={`${row.team}-${row.competitor}-${row.game}-${index}`}>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.competitor}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {row.game}
                {row.is_new ? <Chip size="small" label="New" sx={{ ml: 1 }} /> : null}
              </TableCell>
              <TableCell>{row.category_label}</TableCell>
              <TableCell align="center">
                <GameCheck checked={Boolean(row.questionnaire)} />
              </TableCell>
              <TableCell align="center">
                <GameCheck checked={row.evaluated} />
              </TableCell>
              <TableCell>
                <IcePhotosButton photos={row.photos} title={`${row.competitor} · ${row.game}`} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

export default function Ice2027ProgressPage() {
  const { navigate, search } = useAppPath()
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const [payload, setPayload] = useState<IceProgressPayload | null>(null)
  const [failed, setFailed] = useState('')
  const eventName = payload?.event?.name ?? 'Exhibition'

  useEffect(() => {
    document.title = `${eventName} Managers | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [eventName])

  useEffect(() => {
    let cancelled = false
    void getIceProgress()
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          setFailed('')
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'Progress could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [search])

  const stats = payload?.stats

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
            <Box component="button" type="button" onClick={() => navigate(ice2027HubPath(eventSlug))} sx={iceCrumbSx}>
              {eventName}
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Managers</Box>
          </Box>

          <IceHero kicker="Controlling" title={`${eventName} research status`}>
            Questionnaire and Evaluated ticks are per assigned team: a game is evaluated only when a member of that competitor’s team rated it, not when another team did.
          </IceHero>

          <IceTabs current="progress" attendant admin />

          {failed ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {failed}
            </Alert>
          ) : null}

          {payload && stats ? (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Research coverage</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{stats.research_pct}%</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                    {stats.catalog_covered}/{stats.catalog_games} catalog games
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Competitors done</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>
                    {stats.competitors_done}/{stats.competitors_total}
                  </Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Products collected</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{stats.products}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Evaluations complete</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>
                    {stats.evaluations_done}/{stats.evaluations_total}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>5/5 games rated</Typography>
                </Paper>
              </Box>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="Who has filled in" />
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Person</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Evaluation</TableCell>
                        <TableCell>Eval rows</TableCell>
                        <TableCell>Last evaluation</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payload.people.length === 0 ? (
                        <EmptyRow columns={5} message="No team members yet." />
                      ) : (
                        payload.people.map((person) => (
                          <TableRow key={person.user_ID}>
                            <TableCell sx={{ fontWeight: 700 }}>{person.name}</TableCell>
                            <TableCell>
                              {person.team || (
                                <Typography component="span" sx={{ color: 'text.secondary' }}>
                                  Not on a team
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={evalLabel(person)} color={evalChipColor(person)} />
                            </TableCell>
                            <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                              {person.eval_rows}/{person.eval_required}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>
                              {person.eval_started || person.eval_rows > 0 ? person.eval_at || '—' : '—'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>

              {payload.teams.length === 0 ? (
                <Alert severity="info" sx={{ mb: 3 }}>
                  No teams yet. Add teams in Admin first.
                </Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5 }}>
                  {payload.teams.map((team) => (
                    <TeamCard key={team.ID} team={team} />
                  ))}
                </Box>
              )}

              <Paper elevation={0} sx={{ mt: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="Questionnaire and evaluation by game" />
                <Box sx={{ overflowX: 'auto' }}>
                  <GameMatrixTable rows={payload.game_matrix ?? []} />
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mt: 3, mb: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="New games" />
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Team</TableCell>
                        <TableCell>Competitor</TableCell>
                        <TableCell>New game</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell align="center">Evaluated</TableCell>
                        <TableCell>Pictures</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(payload.new_games ?? []).length === 0 ? (
                        <EmptyRow columns={6} message="No new games have been added on questionnaires yet." />
                      ) : (
                        (payload.new_games ?? []).map((row, index) => (
                          <TableRow key={`${row.team}-${row.competitor}-${row.game}-${index}`}>
                            <TableCell>{row.team}</TableCell>
                            <TableCell>{row.competitor}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{row.game}</TableCell>
                            <TableCell>{row.category_label}</TableCell>
                            <TableCell align="center">
                              <GameCheck checked={row.evaluated} />
                            </TableCell>
                            <TableCell>
                              <IcePhotosButton photos={row.photos} title={`${row.competitor} · ${row.game}`} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

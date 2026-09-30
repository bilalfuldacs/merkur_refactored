import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { ApiError, downloadIceDashboardExport, getIceDashboard } from '@/api'
import type {
  IceDashboardFilters,
  IceDashboardGame,
  IceDashboardPayload,
  IceDashboardView,
  IceQuestionnaireDashItem,
} from '@/api/ice2027'
import { IceEventPicker, IceHero, IcePhotosButton, IceSectionHead, IceTabs, iceCrumbSx, icePillGroupSx, icePillSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppTextField } from '@/components/ui'
import { APP_PATHS, eventSlugFromSearch, ice2027DashboardGamePath, ice2027DashboardPath, ice2027HubPath, useAppPath } from '@/routing'

const emptyFilters: IceDashboardFilters = { team: '', competitor: '', type: '', play: '' }

function score(value: number): string {
  return value.toFixed(2)
}

function typeLabel(game: IceDashboardGame): string {
  return game.game_type_label || '—'
}

function playLabel(value: string): string {
  if (value === 'yes') {
    return 'Yes'
  }
  if (value === 'no') {
    return 'No'
  }
  if (value === 'unsure') {
    return 'Unsure'
  }
  return '—'
}

function votesLabel(game: IceDashboardGame): string {
  const votes = game.ratings
  const voters = game.voters ?? votes
  let label = votes === 1 ? '1 vote' : `${votes} votes`
  if (voters !== votes && voters > 0) {
    label += ` · ${voters} user${voters === 1 ? '' : 's'}`
  }
  return label
}

function questionnaireTypeLabel(type: string, gameTypes?: Record<string, string>): string {
  return gameTypes?.[type] ?? (type !== '' ? type : '—')
}

function matchesQuestionnaireQuery(row: IceQuestionnaireDashItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') {
    return true
  }
  const teams = (row.teams ?? []).join(' ')
  const filled = (row.filled_by ?? []).join(' ')
  return `${row.competitor} ${row.game} ${teams} ${filled}`.toLowerCase().includes(q)
}

function ChartRow({
  place,
  name,
  competitor,
  fill,
  width,
  value,
  hint,
}: {
  place: number
  name: string
  competitor: string
  fill: string
  width: number
  value: string
  hint?: string
}) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '7rem 1fr auto', md: 'minmax(8rem, 14rem) 1fr auto' }, gap: 1.5, alignItems: 'center' }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap title={name} sx={{ fontWeight: 700, fontSize: 13 }}>
          {place}. {name}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{competitor}</Typography>
      </Box>
      <Box sx={{ height: 14, bgcolor: 'action.hover', borderRadius: 999, overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: `${Math.max(0, Math.min(100, width))}%`, bgcolor: fill, borderRadius: 999 }} />
      </Box>
      <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontSize: 14, minWidth: 88, textAlign: 'right' }}>
        <Box component="strong">{value}</Box>
        {hint ? (
          <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
            {hint}
          </Box>
        ) : null}
      </Typography>
    </Box>
  )
}

function PodiumCard({ place, game }: { place: number; game: IceDashboardGame | undefined }) {
  const titles = ['1st game', '2nd game', '3rd game']
  const title = titles[place - 1]
  if (!game) {
    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          borderTop: place === 2 ? '5px solid #c0c0c0' : place === 3 ? '5px solid #cd7f32' : undefined,
        }}
      >
        <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>
          {title}
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>No game in this place yet.</Typography>
      </Paper>
    )
  }

  const type = `${typeLabel(game)}${game.is_new_product ? ' · New product' : ''}`
  const photos = <IcePhotosButton photos={game.photos} title={`${game.competitor} · ${game.game}`} />

  if (place === 1) {
    return (
      <Box
        sx={{
          height: '100%',
          bgcolor: 'secondary.main',
          color: 'common.white',
          borderRadius: '1rem',
          borderBottom: '5px solid',
          borderBottomColor: 'merkur.yellow',
          p: 3,
        }}
      >
        <Typography sx={{ color: 'merkur.yellow', letterSpacing: '.08em', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>
          1st game
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: 22, mb: 0.5 }}>{game.game}</Typography>
        <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{game.competitor}</Typography>
        <Typography sx={{ opacity: 0.75, fontSize: 13, mb: 2 }}>{type}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography sx={{ opacity: 0.75, fontSize: 13 }}>Average</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{score(game.average)}</Typography>
          </Box>
          <Box>
            <Typography sx={{ opacity: 0.75, fontSize: 13 }}>Votes</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{game.ratings}</Typography>
            <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{game.voters ?? game.ratings} users</Typography>
          </Box>
          <Box>
            <Typography sx={{ opacity: 0.75, fontSize: 13 }}>Would play</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{score(game.play_pct)}%</Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2, '& .MuiButton-root': { color: 'common.white', borderColor: 'rgba(255,255,255,0.5)' } }}>{photos}</Box>
      </Box>
    )
  }

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        borderTop: place === 2 ? '5px solid #c0c0c0' : '5px solid #cd7f32',
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.5 }}>{game.game}</Typography>
      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{game.competitor}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>{type}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Average</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{score(game.average)}</Typography>
        </Box>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Votes</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{game.ratings}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{votesLabel(game)}</Typography>
        </Box>
      </Box>
      <Box sx={{ mt: 2 }}>{photos}</Box>
    </Paper>
  )
}

function QuestionnaireProductsTable({
  title,
  rows,
  gameTypes,
  emptyLabel,
}: {
  title: string
  rows: IceQuestionnaireDashItem[]
  gameTypes?: Record<string, string>
  emptyLabel: string
}) {
  const [query, setQuery] = useState('')
  const filtered = rows.filter((row) => matchesQuestionnaireQuery(row, query))

  return (
    <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, bgcolor: 'secondary.main', px: 3, py: 1.5, borderRadius: '0.75rem 0.75rem 0 0' }}>
        <Typography component="h2" sx={{ color: 'merkur.yellow', fontSize: 18, fontWeight: 800, mr: 'auto', m: 0 }}>
          {title}
        </Typography>
        <AppTextField
          size="small"
          placeholder="Filter competitor, game, team or person…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ maxWidth: 280, bgcolor: 'common.white', borderRadius: 1 }}
        />
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 900 }}>
          <TableHead>
            <TableRow>
              <TableCell>Competitor</TableCell>
              <TableCell>Game</TableCell>
              <TableCell>New product</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Filled by</TableCell>
              <TableCell>Pictures</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ color: 'text.secondary', py: 2 }}>
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>{row.competitor}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{row.game}</TableCell>
                  <TableCell>{row.is_new_product ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{questionnaireTypeLabel(row.game_type, gameTypes)}</TableCell>
                  <TableCell>{(row.teams ?? []).join(', ') || '—'}</TableCell>
                  <TableCell>{(row.filled_by ?? []).join(', ') || '—'}</TableCell>
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
  )
}

export default function Ice2027DashboardPage() {
  const { navigate, search } = useAppPath()
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const [view, setView] = useState<IceDashboardView>('evaluation')
  const [payload, setPayload] = useState<IceDashboardPayload | null>(null)
  const [failed, setFailed] = useState('')
  const [draft, setDraft] = useState<IceDashboardFilters>(emptyFilters)
  const [applied, setApplied] = useState<IceDashboardFilters>(emptyFilters)
  const [ratingQuery, setRatingQuery] = useState('')
  const eventName = payload?.event?.name ?? 'Exhibition'
  const criteria = Object.entries(payload?.criteria ?? {})
  const games = payload?.games ?? []
  const rest = games.slice(3)
  const maxVotes = Math.max(1, ...games.map((game) => game.ratings ?? 0))
  const winner = payload?.winner
  const ratings = (payload?.ratings ?? []).filter((row) => {
    const q = ratingQuery.trim().toLowerCase()
    if (q === '') {
      return true
    }
    return `${row.rater} ${row.team} ${row.competitor} ${row.game}`.toLowerCase().includes(q)
  })
  const assigned = payload?.assigned ?? []
  const newProducts = payload?.new_products ?? []
  const isQuestionnaire = view === 'questionnaire'

  useEffect(() => {
    document.title = `${eventName} Ranking dashboard | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [eventName])

  useEffect(() => {
    if (!eventSlug) {
      return
    }
    let cancelled = false
    void getIceDashboard({ ...applied, view })
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          setFailed('')
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'Dashboard could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [eventSlug, search, applied, view])

  if (!eventSlug) {
    return <IceEventPicker buildPath={(slug) => ice2027DashboardPath(slug)} />
  }

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
            <Box component="span">Dashboard</Box>
          </Box>

          <IceHero
            kicker="Ranking report"
            title={`${eventName} dashboard`}
          >
            {isQuestionnaire
              ? 'Assigned competitor games and new products from questionnaires. Pictures are listed in the table at the bottom.'
              : `Official ranking uses scouting-team average and overall voted % after ${payload?.stats.threshold_pct ?? 50}% turnout. Attendant scores are floor opinion and never mix into place.`}
          </IceHero>

          <IceTabs current="dashboard" attendant admin />

          <ToggleButtonGroup
            exclusive
            value={view}
            onChange={(_event, next: IceDashboardView | null) => {
              if (!next) {
                return
              }
              setView(next)
              setPayload(null)
              setDraft(emptyFilters)
              setApplied(emptyFilters)
            }}
            sx={icePillGroupSx}
          >
            <ToggleButton value="evaluation" sx={icePillSx}>
              Evaluation
            </ToggleButton>
            <ToggleButton value="questionnaire" sx={icePillSx}>
              Questionnaire
            </ToggleButton>
          </ToggleButtonGroup>

          {failed ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {failed}
            </Alert>
          ) : null}

          {payload ? (
            <>
              <Paper elevation={0} sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main', borderRadius: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: isQuestionnaire
                      ? { xs: '1fr', md: '1.2fr 1fr auto' }
                      : { xs: '1fr', md: '1.2fr 1.2fr 1fr 1fr auto' },
                    gap: 1.5,
                    alignItems: 'end',
                  }}
                >
                  {!isQuestionnaire ? (
                    <AppTextField
                      select
                      size="small"
                      label="Rater team"
                      value={draft.team === '' ? '' : String(draft.team)}
                      onChange={(event) => setDraft((current) => ({ ...current, team: event.target.value === '' ? '' : Number(event.target.value) }))}
                    >
                      <MenuItem value="">All teams</MenuItem>
                      {(payload.teams ?? []).map((team) => (
                        <MenuItem key={team.ID} value={String(team.ID)}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </AppTextField>
                  ) : null}
                  <AppTextField
                    select
                    size="small"
                    label="Competitor"
                    value={draft.competitor === '' ? '' : String(draft.competitor)}
                    onChange={(event) => setDraft((current) => ({ ...current, competitor: event.target.value === '' ? '' : Number(event.target.value) }))}
                  >
                    <MenuItem value="">All competitors</MenuItem>
                    {(payload.competitors ?? []).map((competitor) => (
                      <MenuItem key={competitor.ID} value={String(competitor.ID)}>
                        {competitor.name}
                      </MenuItem>
                    ))}
                  </AppTextField>
                  <AppTextField
                    select
                    size="small"
                    label="Game type"
                    value={draft.type ?? ''}
                    onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
                  >
                    <MenuItem value="">All types</MenuItem>
                    {Object.entries(payload.game_types ?? {}).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </AppTextField>
                  {!isQuestionnaire ? (
                    <AppTextField
                      select
                      size="small"
                      label="Would play"
                      value={draft.play ?? ''}
                      onChange={(event) => setDraft((current) => ({ ...current, play: event.target.value }))}
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                      <MenuItem value="unsure">Unsure</MenuItem>
                    </AppTextField>
                  ) : null}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <AppButton size="small" onClick={() => setApplied(draft)}>
                      Apply
                    </AppButton>
                    <AppButton
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => {
                        setDraft(emptyFilters)
                        setApplied(emptyFilters)
                      }}
                    >
                      Reset
                    </AppButton>
                    <AppButton
                      size="small"
                      variant="outlined"
                      onClick={() => void downloadIceDashboardExport(isQuestionnaire ? 'questionnaire' : 'all')}
                    >
                      {isQuestionnaire ? 'Download questionnaires' : 'Download all ratings'}
                    </AppButton>
                  </Box>
                </Box>
              </Paper>

              {isQuestionnaire ? (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 1.5, mb: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Assigned competitors</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{payload.stats.assigned ?? assigned.length}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>New products</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{payload.stats.new_products ?? newProducts.length}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Pictures</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{payload.stats.photos ?? (payload.photo_games ?? []).length}</Typography>
                    </Paper>
                  </Box>

                  <QuestionnaireProductsTable
                    title="Assigned competitors"
                    rows={assigned}
                    gameTypes={payload.game_types}
                    emptyLabel="No assigned competitor games in questionnaires yet."
                  />
                  <QuestionnaireProductsTable
                    title="New products"
                    rows={newProducts}
                    gameTypes={payload.game_types}
                    emptyLabel="No new products in questionnaires yet."
                  />

                  <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <IceSectionHead title="Pictures" />
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Competitor</TableCell>
                            <TableCell>Game</TableCell>
                            <TableCell>Pictures</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(payload.photo_games ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} sx={{ color: 'text.secondary', py: 2 }}>
                                No questionnaire pictures yet. They appear here after scouts save photos on a product.
                              </TableCell>
                            </TableRow>
                          ) : (
                            (payload.photo_games ?? []).map((row, index) => (
                              <TableRow key={`${row.competitor}-${row.game}-${index}`}>
                                <TableCell>{row.competitor}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  {row.game}
                                  {row.is_new ? <Chip size="small" label="New" sx={{ ml: 1 }} /> : null}
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
              ) : (
                <>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Evaluations submitted</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{payload.stats.submissions ?? 0}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Complete ratings</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{payload.stats.ratings ?? 0}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Games ranked</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{payload.stats.games ?? 0}</Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Would play</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{score(payload.stats.play_pct ?? 0)}%</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{payload.stats.play_yes ?? 0} yes</Typography>
                    </Paper>
                  </Box>

                  {winner == null ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      No complete evaluation rows yet. Rankings appear here as soon as scouts save a full Top 5 row.
                    </Alert>
                  ) : (
                    <>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 1.5, mb: 3 }}>
                        <PodiumCard place={1} game={games[0]} />
                        <PodiumCard place={2} game={games[1]} />
                        <PodiumCard place={3} game={games[2]} />
                      </Box>

                      {rest.length > 0 ? (
                        <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <IceSectionHead title="All other games" />
                          {rest.map((game) => (
                            <Box
                              key={game.key}
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 2,
                                py: 2,
                                px: 2.5,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                borderLeft: '4px solid',
                                borderLeftColor: 'primary.main',
                              }}
                            >
                              <Typography sx={{ fontWeight: 800, color: 'text.secondary', minWidth: 40 }}>#{game.place}</Typography>
                              <Box sx={{ mr: 'auto' }}>
                                <Typography sx={{ fontWeight: 800 }}>{game.game}</Typography>
                                <Typography sx={{ fontWeight: 700 }}>{game.competitor}</Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                  {typeLabel(game)}
                                  {game.is_new_product ? ' · New product' : ''}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{score(game.average)}</Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{votesLabel(game)}</Typography>
                                <Box sx={{ mt: 1 }}>
                                  <IcePhotosButton photos={game.photos} title={`${game.competitor} · ${game.game}`} />
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Paper>
                      ) : null}

                      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <IceSectionHead title="Graphs" />
                        <Box sx={{ p: 2.5 }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4, mb: 4 }}>
                            <Box>
                              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Average score by game</Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>
                                User average of the eight evaluation scores (scale 1–5).
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {games.map((game) => (
                                  <ChartRow
                                    key={`avg-${game.key}`}
                                    place={game.place}
                                    name={game.game}
                                    competitor={game.competitor}
                                    fill={game.place === 1 ? 'primary.main' : 'secondary.main'}
                                    width={(game.average / 5) * 100}
                                    value={score(game.average)}
                                  />
                                ))}
                              </Box>
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Votes per game</Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>
                                How many complete evaluation rows users submitted for each game.
                              </Typography>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {games.map((game) => (
                                  <ChartRow
                                    key={`votes-${game.key}`}
                                    place={game.place}
                                    name={game.game}
                                    competitor={game.competitor}
                                    fill={game.place === 1 ? 'primary.main' : 'merkur.yellow'}
                                    width={(game.ratings / maxVotes) * 100}
                                    value={`${game.ratings}`}
                                    hint={`${game.voters ?? game.ratings} users`}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                          {winner ? (
                            <Box>
                              <Typography sx={{ fontWeight: 800, mb: 0.5 }}>1st game — scores by criterion</Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 2 }}>
                                <Box component="strong">{winner.game}</Box> · competitor <Box component="strong">{winner.competitor}</Box>
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, minHeight: 224, pt: 3 }}>
                                {criteria.map(([field, label]) => {
                                  const value = winner.averages[field] ?? 0
                                  return (
                                    <Box key={field} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                      <Typography sx={{ fontWeight: 800, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{score(value)}</Typography>
                                      <Box
                                        sx={{
                                          width: '100%',
                                          maxWidth: 44,
                                          height: Math.max(8, (value / 5) * 180),
                                          borderRadius: '6px 6px 0 0',
                                          bgcolor: value >= 4 ? 'primary.main' : 'secondary.main',
                                        }}
                                      />
                                      <Typography sx={{ fontSize: 11, textAlign: 'center', color: 'text.secondary', lineHeight: 1.2, wordBreak: 'break-word' }}>
                                        {label}
                                      </Typography>
                                    </Box>
                                  )
                                })}
                              </Box>
                            </Box>
                          ) : null}
                        </Box>
                      </Paper>

                      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <IceSectionHead title="Best by criterion" />
                        <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                          {criteria.map(([field, label]) => {
                            const best = payload.by_criterion?.[field]
                            if (!best) {
                              return null
                            }
                            return (
                              <Paper key={field} variant="outlined" sx={{ p: 2, height: '100%' }}>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
                                <Typography sx={{ fontWeight: 800 }}>{best.game}</Typography>
                                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{best.competitor}</Typography>
                                <Typography sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>{score(best.averages[field] ?? 0)}</Typography>
                              </Paper>
                            )
                          })}
                        </Box>
                      </Paper>

                      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <IceSectionHead title="By game type" />
                        <Box sx={{ p: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                          {(payload.by_type ?? []).map((type) => (
                            <Paper key={type.type} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{type.label}</Typography>
                              <Typography sx={{ fontWeight: 800, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{score(type.average)}</Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                                {type.count} games · {type.ratings} ratings
                              </Typography>
                            </Paper>
                          ))}
                        </Box>
                      </Paper>

                      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <IceSectionHead title="Game ranking" />
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table size="small" sx={{ minWidth: 1100 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>#</TableCell>
                                <TableCell>Game</TableCell>
                                <TableCell>Competitor</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Votes</TableCell>
                                <TableCell>Voted %</TableCell>
                                <TableCell>Avg</TableCell>
                                <TableCell>Would play</TableCell>
                                <TableCell>Pictures</TableCell>
                                {criteria.map(([field, label]) => (
                                  <TableCell key={field}>{label}</TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {games.map((game) => (
                                <TableRow key={game.key}>
                                  <TableCell sx={{ fontWeight: 800 }}>{game.place}</TableCell>
                                  <TableCell>
                                    <Box
                                      component="button"
                                      type="button"
                                      onClick={() => navigate(ice2027DashboardGamePath(game.key, eventSlug))}
                                      sx={{ ...iceCrumbSx, fontWeight: 700, textAlign: 'left' }}
                                    >
                                      {game.game}
                                    </Box>
                                    {game.is_new_product ? <Chip size="small" label="New" sx={{ ml: 0.5 }} /> : null}
                                    {game.below_threshold ? <Chip size="small" label="Below 50%" color="warning" sx={{ ml: 0.5 }} /> : null}
                                  </TableCell>
                                  <TableCell>{game.competitor}</TableCell>
                                  <TableCell>{typeLabel(game)}</TableCell>
                                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {game.ratings}{' '}
                                    <Box component="span" sx={{ color: 'text.secondary' }}>
                                      ({game.voters ?? game.ratings} team)
                                    </Box>
                                    {(game.floor_ratings ?? 0) > 0 ? (
                                      <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                                        Floor {game.floor_ratings} · {score(game.floor_average ?? 0)}
                                      </Typography>
                                    ) : null}
                                  </TableCell>
                                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {score(game.vote_pct ?? 0)}%
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{score(game.average)}</TableCell>
                                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                    {score(game.play_pct)}%{' '}
                                    <Box component="span" sx={{ color: 'text.secondary' }}>
                                      ({game.play_yes})
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <IcePhotosButton photos={game.photos} title={`${game.competitor} · ${game.game}`} />
                                  </TableCell>
                                  {criteria.map(([field]) => (
                                    <TableCell key={field} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                      {score(game.averages[field] ?? 0)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Paper>

                      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, bgcolor: 'secondary.main', px: 3, py: 1.5, borderRadius: '0.75rem 0.75rem 0 0' }}>
                          <Typography component="h2" sx={{ color: 'merkur.yellow', fontSize: 18, fontWeight: 800, mr: 'auto', m: 0 }}>
                            All ratings
                          </Typography>
                          <AppTextField
                            size="small"
                            placeholder="Filter rater, game, competitor…"
                            value={ratingQuery}
                            onChange={(event) => setRatingQuery(event.target.value)}
                            sx={{ maxWidth: 280, bgcolor: 'common.white', borderRadius: 1 }}
                          />
                        </Box>
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table size="small" sx={{ minWidth: 1100 }}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Rater</TableCell>
                                <TableCell>Team</TableCell>
                                <TableCell>Competitor</TableCell>
                                <TableCell>Game</TableCell>
                                <TableCell>Type</TableCell>
                                {criteria.map(([field, label]) => (
                                  <TableCell key={field}>{label}</TableCell>
                                ))}
                                <TableCell>Avg</TableCell>
                                <TableCell>Would play</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ratings.map((row, index) => (
                                <TableRow key={`${row.user_ID}-${row.game}-${index}`}>
                                  <TableCell>{row.rater}</TableCell>
                                  <TableCell>{row.team}</TableCell>
                                  <TableCell>{row.competitor}</TableCell>
                                  <TableCell>{row.game}</TableCell>
                                  <TableCell>{payload.game_types?.[row.game_type] ?? (row.game_type || '—')}</TableCell>
                                  {criteria.map(([field]) => (
                                    <TableCell key={field} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                      {row.scores[field] ?? 0}
                                    </TableCell>
                                  ))}
                                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{score(row.average)}</TableCell>
                                  <TableCell>{playLabel(row.would_play)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Paper>
                    </>
                  )}

                  <Paper elevation={0} sx={{ mb: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <IceSectionHead title="Pictures by competitor and game" />
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Competitor</TableCell>
                            <TableCell>Game</TableCell>
                            <TableCell>Pictures</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(payload.photo_games ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} sx={{ color: 'text.secondary', py: 2 }}>
                                No questionnaire pictures yet. They appear here after scouts save photos on a product.
                              </TableCell>
                            </TableRow>
                          ) : (
                            (payload.photo_games ?? []).map((row, index) => (
                              <TableRow key={`${row.competitor}-${row.game}-${index}`}>
                                <TableCell>{row.competitor}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  {row.game}
                                  {row.is_new ? <Chip size="small" label="New" sx={{ ml: 1 }} /> : null}
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
              )}
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

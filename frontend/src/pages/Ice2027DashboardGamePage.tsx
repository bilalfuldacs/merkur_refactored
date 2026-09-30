import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { ApiError, getIceDashboardGame } from '@/api'
import type { IceDashboardGameDetail, IceDashboardRating } from '@/api/ice2027'
import { IceEventPicker, IceHero, IcePhotosButton, IceSectionHead, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { APP_PATHS, eventSlugFromSearch, ice2027DashboardGamePath, ice2027DashboardPath, ice2027HubPath, useAppPath } from '@/routing'

function score(value: number): string {
  return value.toFixed(2)
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

function typeLabel(game: { game_type_label?: string; game_type?: string }): string {
  return game.game_type_label || game.game_type || '—'
}

function floorLabel(game: { floor_ratings?: number; floor_average?: number }): string {
  const n = game.floor_ratings ?? 0
  if (n < 1) {
    return '—'
  }
  return `${score(game.floor_average ?? 0)} (${n})`
}

function RatingsTable({
  rows,
  criteria,
  showVote,
}: {
  rows: IceDashboardRating[]
  criteria: [string, string][]
  showVote?: boolean
}) {
  if (rows.length === 0) {
    return <Typography sx={{ color: 'text.secondary' }}>No ratings in this group.</Typography>
  }
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Rater</TableCell>
            <TableCell>Team</TableCell>
            {criteria.map(([field, label]) => (
              <TableCell key={field}>{label}</TableCell>
            ))}
            <TableCell>Avg</TableCell>
            <TableCell>Would play</TableCell>
            {showVote ? <TableCell>Voted %</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.user_ID}-${index}`}>
              <TableCell>{row.rater}</TableCell>
              <TableCell>{row.team || '—'}</TableCell>
              {criteria.map(([field]) => (
                <TableCell key={field} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {row.scores[field] ?? '—'}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{score(row.average)}</TableCell>
              <TableCell>{playLabel(row.would_play)}</TableCell>
              {showVote ? (
                <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {score(row.vote_pct ?? 0)}%{' '}
                  <Box component="span" sx={{ color: 'text.secondary' }}>
                    ({row.team_voters ?? 0}/{row.team_pool ?? 0})
                  </Box>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default function Ice2027DashboardGamePage() {
  const { navigate, search } = useAppPath()
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const gameKey = useMemo(() => new URLSearchParams(search).get('game') ?? '', [search])
  const [payload, setPayload] = useState<IceDashboardGameDetail | null>(null)
  const [failed, setFailed] = useState('')

  const eventName = payload?.event?.name ?? 'Exhibition'
  const game = payload?.game
  const criteria = Object.entries(payload?.criteria ?? {})
  const hasTeamRatings = (game?.ratings ?? 0) > 0
  const floorN = game?.floor_voters ?? game?.floor_ratings ?? 0
  const photoCount = game?.photo_count ?? game?.photos?.length ?? 0

  useEffect(() => {
    document.title = game ? `${game.game} | ${eventName} ranking` : `${eventName} ranking`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [eventName, game])

  useEffect(() => {
    if (!eventSlug || !gameKey) {
      if (!gameKey && eventSlug) {
        setFailed('That game was not found in the ranking.')
      }
      return
    }
    let cancelled = false
    void getIceDashboardGame(gameKey)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          setFailed('')
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'That game was not found in the ranking.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [eventSlug, gameKey, search])

  if (!eventSlug) {
    return (
      <IceEventPicker
        buildPath={(slug) => (gameKey ? ice2027DashboardGamePath(gameKey, slug) : ice2027DashboardPath(slug))}
      />
    )
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
            <Box component="button" type="button" onClick={() => navigate(ice2027DashboardPath(eventSlug))} sx={iceCrumbSx}>
              Dashboard
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">{game?.game ?? 'Game'}</Box>
          </Box>

          <IceHero kicker="Game ranking" title={game?.game ?? eventName}>
            {game ? `${game.competitor} · official place ${game.place}` : 'One ranked game and every complete rater row.'}
          </IceHero>

          <IceTabs current="dashboard" attendant admin />

          {failed ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {failed}{' '}
              <Box component="button" type="button" onClick={() => navigate(ice2027DashboardPath(eventSlug))} sx={{ ...iceCrumbSx, display: 'inline' }}>
                Back to dashboard
              </Box>
            </Alert>
          ) : null}

          {game ? (
            <>
              {game.below_threshold ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This game is below {payload?.threshold_pct ?? 0}% team turnout (needs votes from the scouting team). It still has a place; the row stays greyed on the ranking table.
                </Alert>
              ) : null}

              <Paper elevation={0} sx={{ mb: 3, p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 220 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{game.game}</Typography>
                    <Typography sx={{ fontWeight: 700, mb: 1 }}>{game.competitor}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {game.is_new_product ? <Chip size="small" label="New product" /> : null}
                      {game.below_threshold ? <Chip size="small" color="warning" label="Below turnout threshold" /> : null}
                      {game.has_official ? <Chip size="small" color="success" label="Official" /> : <Chip size="small" label="Unofficial" />}
                    </Box>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Place</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 28 }}>#{game.place}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Team average</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>
                      {hasTeamRatings ? score(game.average) : '—'}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {game.ratings} team rating{game.ratings === 1 ? '' : 's'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Voted %</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>{score(game.vote_pct ?? 0)}%</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {game.team_voters ?? game.voters}/{game.team_pool ?? payload?.team_pool ?? 0} members
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Floor opinion</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>
                      {floorN > 0 ? score(game.floor_average ?? 0) : '—'}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {floorN > 0 ? `${floorN} attendant${floorN === 1 ? '' : 's'}` : 'No floor opinion'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Would play (team)</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 28, fontVariantNumeric: 'tabular-nums' }}>
                      {hasTeamRatings ? `${score(game.play_pct)}%` : '—'}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {game.play_yes} yes · {game.play_no} no · {game.play_unsure} unsure
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Pictures</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 28 }}>{photoCount}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <IcePhotosButton photos={game.photos} title={`${game.competitor} · ${game.game}`} />
                    </Box>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="Ranking data" />
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Game</TableCell>
                        <TableCell>Competitor</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Voted %</TableCell>
                        <TableCell>Team avg</TableCell>
                        <TableCell>Floor opinion</TableCell>
                        <TableCell>Would play</TableCell>
                        <TableCell>Pictures</TableCell>
                        {criteria.map(([field, label]) => (
                          <TableCell key={field}>{label}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={game.below_threshold ? { opacity: 0.55 } : undefined}>
                        <TableCell sx={{ fontWeight: 800 }}>{game.place}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {game.game}
                          {game.is_new_product ? (
                            <Chip size="small" label="New" sx={{ ml: 1 }} />
                          ) : null}
                        </TableCell>
                        <TableCell>{game.competitor}</TableCell>
                        <TableCell>{typeLabel(game)}</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {score(game.vote_pct ?? 0)}%
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                          {hasTeamRatings ? score(game.average) : '—'}
                        </TableCell>
                        <TableCell>{floorLabel(game)}</TableCell>
                        <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {hasTeamRatings ? (
                            <>
                              {score(game.play_pct)}%{' '}
                              <Box component="span" sx={{ color: 'text.secondary' }}>
                                ({game.play_yes})
                              </Box>
                            </>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{photoCount}</TableCell>
                        {criteria.map(([field]) => (
                          <TableCell key={field} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {hasTeamRatings ? score(game.averages?.[field] ?? 0) : '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="Criteria — team vs floor" />
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Criterion</TableCell>
                        <TableCell>Team avg</TableCell>
                        <TableCell>Floor avg</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {criteria.map(([field, label]) => (
                        <TableRow key={field}>
                          <TableCell>{label}</TableCell>
                          <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {hasTeamRatings ? score(game.averages?.[field] ?? 0) : '—'}
                          </TableCell>
                          <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {floorN > 0 ? score(game.floor_averages?.[field] ?? 0) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title={`Scouting team ratings (${payload?.team_ratings?.length ?? 0})`} />
                <Box sx={{ p: 2.5 }}>
                  <RatingsTable rows={payload?.team_ratings ?? []} criteria={criteria} showVote />
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title={`Attendant floor opinion (${payload?.floor_ratings?.length ?? 0})`} />
                <Box sx={{ p: 2.5 }}>
                  <RatingsTable rows={payload?.floor_ratings ?? []} criteria={criteria} />
                </Box>
              </Paper>

              <AppButton variant="outlined" color="secondary" onClick={() => navigate(ice2027DashboardPath(eventSlug))}>
                Back to dashboard
              </AppButton>
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

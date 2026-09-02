import { useEffect, useMemo, useState } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
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
import { ApiError } from '@/api'
import {
  addIceCompetitor,
  addIceGame,
  deleteIceCompetitor,
  deleteIceGame,
  getIceAdmin,
  renameIceTeam,
  setIceAttendant,
  setIceTeamMembers,
  updateIceCompetitor,
  updateIceGame,
} from '@/api/ice2027'
import type { IceAdminPayload, IceCompetitor, IceGame, IceTeam } from '@/api/ice2027'
import { useAuth } from '@/auth'
import { IceHero, IceSectionHead, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppTextField } from '@/components/ui'
import { APP_PATHS, useAppPath } from '@/routing'

function personLabel(person: { name?: string | null; firstname?: string | null; lastname?: string | null; username?: string | null }): string {
  const name = person.name?.trim() || [person.firstname, person.lastname].filter(Boolean).join(' ')
  return name ? `${name} (${person.username ?? ''})` : (person.username ?? '')
}

export default function Ice2027AdminPage() {
  const { navigate } = useAppPath()
  const { user, applyUser } = useAuth()
  const [payload, setPayload] = useState<IceAdminPayload | null>(null)
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [filter, setFilter] = useState('')
  const [newCompetitor, setNewCompetitor] = useState({ name: '', team_ID: '' })
  const [newGame, setNewGame] = useState({ name: '', competitor_ID: '', game_type: '' })
  const [teamNames, setTeamNames] = useState<Record<number, string>>({})
  const [teamMembers, setTeamMembers] = useState<Record<number, { member_1: string; member_2: string }>>({})
  const [competitorEdits, setCompetitorEdits] = useState<Record<number, { name: string; team_ID: string }>>({})
  const [gameEdits, setGameEdits] = useState<Record<number, { name: string; competitor_ID: string; game_type: string }>>({})

  useEffect(() => {
    document.title = 'ICE 2027 Admin | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getIceAdmin()
      .then((result) => {
        if (!cancelled) {
          applyAdmin(result)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'ICE 2027 admin could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function applyAdmin(next: IceAdminPayload, message?: string) {
    setPayload(next)
    setTeamNames(Object.fromEntries(next.teams.map((team) => [team.ID, team.name])))
    setTeamMembers(
      Object.fromEntries(
        next.teams.map((team) => [
          team.ID,
          {
            member_1: String(team.members[0]?.user_ID ?? ''),
            member_2: String(team.members[1]?.user_ID ?? ''),
          },
        ]),
      ),
    )
    setCompetitorEdits(
      Object.fromEntries(
        next.competitors.map((item) => [item.ID, { name: item.name, team_ID: item.team_ID ? String(item.team_ID) : '' }]),
      ),
    )
    setGameEdits(
      Object.fromEntries(
        next.games.map((item) => [
          item.ID,
          { name: item.name, competitor_ID: String(item.competitor_ID), game_type: item.game_type ?? '' },
        ]),
      ),
    )
    if (message || next.message) {
      setFlash(message ?? next.message ?? '')
      setFailed('')
    }
  }

  async function run(action: () => Promise<IceAdminPayload>) {
    try {
      applyAdmin(await action())
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'That change could not be saved.')
    }
  }

  const filteredUsers = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const users = payload?.users ?? []
    if (!q) {
      return users
    }
    return users.filter((person) => personLabel(person).toLowerCase().includes(q) || (person.username ?? '').toLowerCase().includes(q))
  }, [filter, payload])

  const attendants = (payload?.users ?? []).filter((person) => person.iceattendent2027)
  const takenByTeam = (team: IceTeam) => {
    const taken = new Set<number>()
    for (const other of payload?.teams ?? []) {
      if (other.ID === team.ID) {
        continue
      }
      for (const member of other.members) {
        taken.add(member.user_ID)
      }
    }
    return taken
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">ICE 2027</Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Admin</Box>
          </Box>

          <IceHero kicker="Administration" title="ICE 2027">
            Mark ICE attendants, assign them to scouting teams, then add competitors and games.
          </IceHero>

          <IceTabs
            current="admin"
            attendant={Boolean(user?.iceattendent2027)}
            admin
            showTasks={Boolean(user?.iceattendent2027)}
          />

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
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(5, 1fr)' }, gap: 1.5, mb: 3 }}>
                {[
                  ['ICE attendants', String(payload.stats.attendants)],
                  ['Teams', `${payload.stats.teams} / ${payload.stats.max_teams}`],
                  ['Members', `${payload.stats.members} / ${payload.stats.max_members}`],
                  ['Competitors', `${payload.stats.competitors} / ${payload.stats.max_competitors}`],
                  ['Competitor games', String(payload.stats.games)],
                ].map(([label, value]) => (
                  <Paper
                    key={label}
                    elevation={0}
                    sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}
                  >
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{label}</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: 28, color: 'secondary.main' }}>{value}</Typography>
                  </Paper>
                ))}
              </Box>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="1. ICE 2027 attendants" />
                <Box sx={{ p: 2.5 }}>
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                    Only users with this flag can see the ICE 2027 menu and use the forms. Team members must be attendants.
                  </Typography>
                  <AppTextField size="small" label="Filter users…" value={filter} onChange={(event) => setFilter(event.target.value)} sx={{ mb: 2 }} />
                  <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>E-mail</TableCell>
                          <TableCell>ICE 2027</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredUsers.map((person) => (
                          <TableRow key={person.ID}>
                            <TableCell>{person.name || [person.firstname, person.lastname].filter(Boolean).join(' ')}</TableCell>
                            <TableCell>{person.username}</TableCell>
                            <TableCell>
                              <AppButton
                                size="small"
                                variant={person.iceattendent2027 ? 'contained' : 'outlined'}
                                color={person.iceattendent2027 ? 'success' : 'secondary'}
                                onClick={() =>
                                  void run(async () => {
                                    const next = await setIceAttendant(person.ID, !person.iceattendent2027)
                                    if (user && user.ID === person.ID) {
                                      applyUser({ ...user, iceattendent2027: !person.iceattendent2027 })
                                    }
                                    return next
                                  })
                                }
                              >
                                {person.iceattendent2027 ? 'On' : 'Off'}
                              </AppButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="2. Scouting teams" />
                <Box sx={{ p: 2.5 }}>
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                    Five teams, two members each. Members must be ICE 2027 attendants. A person can only be on one team.
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {payload.teams.map((team) => {
                      const taken = takenByTeam(team)
                      const allowed = attendants.filter((person) => !taken.has(person.ID))
                      const members = teamMembers[team.ID] ?? { member_1: '', member_2: '' }
                      return (
                        <Paper
                          key={team.ID}
                          elevation={0}
                          sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderTop: '4px solid', borderTopColor: 'secondary.main' }}
                        >
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <AppTextField
                              size="small"
                              value={teamNames[team.ID] ?? team.name}
                              onChange={(event) => setTeamNames((current) => ({ ...current, [team.ID]: event.target.value }))}
                            />
                            <AppButton
                              size="small"
                              variant="outlined"
                              onClick={() => void run(() => renameIceTeam(team.ID, teamNames[team.ID] ?? team.name))}
                            >
                              Rename
                            </AppButton>
                          </Box>
                          <AppTextField
                            select
                            size="small"
                            label="Member 1"
                            sx={{ mb: 1.5 }}
                            value={members.member_1}
                            onChange={(event) =>
                              setTeamMembers((current) => ({
                                ...current,
                                [team.ID]: { ...members, member_1: event.target.value },
                              }))
                            }
                          >
                            <MenuItem value="">—</MenuItem>
                            {allowed.map((person) => (
                              <MenuItem key={person.ID} value={String(person.ID)}>
                                {personLabel(person)}
                              </MenuItem>
                            ))}
                          </AppTextField>
                          <AppTextField
                            select
                            size="small"
                            label="Member 2"
                            sx={{ mb: 1.5 }}
                            value={members.member_2}
                            onChange={(event) =>
                              setTeamMembers((current) => ({
                                ...current,
                                [team.ID]: { ...members, member_2: event.target.value },
                              }))
                            }
                          >
                            <MenuItem value="">—</MenuItem>
                            {allowed.map((person) => (
                              <MenuItem key={person.ID} value={String(person.ID)}>
                                {personLabel(person)}
                              </MenuItem>
                            ))}
                          </AppTextField>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <AppButton
                              size="small"
                              onClick={() =>
                                void run(() =>
                                  setIceTeamMembers(
                                    team.ID,
                                    members.member_1 ? Number(members.member_1) : null,
                                    members.member_2 ? Number(members.member_2) : null,
                                  ),
                                )
                              }
                            >
                              Save members
                            </AppButton>
                            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                              {team.members.length} / 2
                            </Typography>
                          </Box>
                          <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 0.5 }}>
                            Competitors {team.competitors.length} / 3
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                            {team.competitors.length === 0 ? <li>None assigned</li> : null}
                            {team.competitors.map((competitor) => {
                              const games = team.games.filter((game) => game.competitor_ID === competitor.ID).map((game) => game.name)
                              return (
                                <li key={competitor.ID}>
                                  {competitor.name}
                                  {games.length > 0 ? ` — ${games.join(', ')}` : ''}
                                </li>
                              )
                            })}
                          </Box>
                        </Paper>
                      )
                    })}
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="3. Competitors" />
                <Box sx={{ p: 2.5 }}>
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>Each competitor belongs to one team. Max 3 per team.</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 4fr 3fr' }, gap: 1.5, mb: 2, alignItems: 'end' }}>
                    <AppTextField
                      size="small"
                      label="Name"
                      placeholder="e.g. Zitro"
                      value={newCompetitor.name}
                      onChange={(event) => setNewCompetitor((current) => ({ ...current, name: event.target.value }))}
                    />
                    <AppTextField
                      select
                      size="small"
                      label="Assign to team"
                      value={newCompetitor.team_ID}
                      onChange={(event) => setNewCompetitor((current) => ({ ...current, team_ID: event.target.value }))}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {payload.teams.map((team) => (
                        <MenuItem key={team.ID} value={String(team.ID)} disabled={team.competitors.length >= 3}>
                          {team.name} ({team.competitors.length}/3)
                        </MenuItem>
                      ))}
                    </AppTextField>
                    <AppButton
                      startIcon={<AddOutlinedIcon />}
                      onClick={() =>
                        void run(async () => {
                          const next = await addIceCompetitor(newCompetitor.name, newCompetitor.team_ID ? Number(newCompetitor.team_ID) : null)
                          setNewCompetitor({ name: '', team_ID: '' })
                          return next
                        })
                      }
                    >
                      Add competitor
                    </AppButton>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Competitor</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell>Games</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payload.competitors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ color: 'text.secondary' }}>
                            No competitors yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {payload.competitors.map((competitor) => {
                        const edit = competitorEdits[competitor.ID] ?? { name: competitor.name, team_ID: competitor.team_ID ? String(competitor.team_ID) : '' }
                        return (
                          <TableRow key={competitor.ID}>
                            <TableCell>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 2fr auto' }, gap: 1 }}>
                                <AppTextField
                                  size="small"
                                  value={edit.name}
                                  onChange={(event) =>
                                    setCompetitorEdits((current) => ({
                                      ...current,
                                      [competitor.ID]: { ...edit, name: event.target.value },
                                    }))
                                  }
                                />
                                <AppTextField
                                  select
                                  size="small"
                                  value={edit.team_ID}
                                  onChange={(event) =>
                                    setCompetitorEdits((current) => ({
                                      ...current,
                                      [competitor.ID]: { ...edit, team_ID: event.target.value },
                                    }))
                                  }
                                >
                                  <MenuItem value="">Unassigned</MenuItem>
                                  {payload.teams.map((team) => {
                                    const wouldExceed =
                                      (competitor.team_ID ?? 0) !== team.ID && team.competitors.length >= 3
                                    return (
                                      <MenuItem key={team.ID} value={String(team.ID)} disabled={wouldExceed}>
                                        {team.name}
                                      </MenuItem>
                                    )
                                  })}
                                </AppTextField>
                                <AppButton
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    void run(() =>
                                      updateIceCompetitor(competitor.ID, edit.name, edit.team_ID ? Number(edit.team_ID) : null),
                                    )
                                  }
                                >
                                  Save
                                </AppButton>
                              </Box>
                            </TableCell>
                            <TableCell>{competitor.team_name || '—'}</TableCell>
                            <TableCell>{competitor.game_count}</TableCell>
                            <TableCell align="right">
                              <AppButton
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => {
                                  if (window.confirm('Delete this competitor and all their games?')) {
                                    void run(() => deleteIceCompetitor(competitor.ID))
                                  }
                                }}
                              >
                                Delete
                              </AppButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <IceSectionHead title="4. Competitor games" />
                <Box sx={{ p: 2.5 }}>
                  <Typography sx={{ color: 'text.secondary', mb: 2 }}>These are games shown by competitors at ICE — not Merkur games.</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '4fr 3fr 3fr 2fr' }, gap: 1.5, mb: 2, alignItems: 'end' }}>
                    <AppTextField
                      size="small"
                      label="Game name"
                      value={newGame.name}
                      onChange={(event) => setNewGame((current) => ({ ...current, name: event.target.value }))}
                    />
                    <AppTextField
                      select
                      size="small"
                      label="Competitor"
                      value={newGame.competitor_ID}
                      onChange={(event) => setNewGame((current) => ({ ...current, competitor_ID: event.target.value }))}
                    >
                      <MenuItem value="">Select…</MenuItem>
                      {payload.competitors.map((competitor: IceCompetitor) => (
                        <MenuItem key={competitor.ID} value={String(competitor.ID)}>
                          {competitor.name}
                        </MenuItem>
                      ))}
                    </AppTextField>
                    <AppTextField
                      select
                      size="small"
                      label="Type"
                      value={newGame.game_type}
                      onChange={(event) => setNewGame((current) => ({ ...current, game_type: event.target.value }))}
                    >
                      <MenuItem value="">Optional…</MenuItem>
                      {Object.entries(payload.game_types).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </AppTextField>
                    <AppButton
                      startIcon={<AddOutlinedIcon />}
                      onClick={() =>
                        void run(async () => {
                          const next = await addIceGame(newGame.name, Number(newGame.competitor_ID), newGame.game_type)
                          setNewGame({ name: '', competitor_ID: '', game_type: '' })
                          return next
                        })
                      }
                    >
                      Add game
                    </AppButton>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Game</TableCell>
                        <TableCell>Team</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payload.games.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} sx={{ color: 'text.secondary' }}>
                            No competitor games yet.
                          </TableCell>
                        </TableRow>
                      ) : null}
                      {payload.games.map((game: IceGame) => {
                        const edit = gameEdits[game.ID] ?? {
                          name: game.name,
                          competitor_ID: String(game.competitor_ID),
                          game_type: game.game_type ?? '',
                        }
                        return (
                          <TableRow key={game.ID}>
                            <TableCell>
                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 2fr 2fr auto' }, gap: 1 }}>
                                <AppTextField
                                  size="small"
                                  value={edit.name}
                                  onChange={(event) =>
                                    setGameEdits((current) => ({ ...current, [game.ID]: { ...edit, name: event.target.value } }))
                                  }
                                />
                                <AppTextField
                                  select
                                  size="small"
                                  value={edit.competitor_ID}
                                  onChange={(event) =>
                                    setGameEdits((current) => ({
                                      ...current,
                                      [game.ID]: { ...edit, competitor_ID: event.target.value },
                                    }))
                                  }
                                >
                                  {payload.competitors.map((competitor) => (
                                    <MenuItem key={competitor.ID} value={String(competitor.ID)}>
                                      {competitor.name}
                                    </MenuItem>
                                  ))}
                                </AppTextField>
                                <AppTextField
                                  select
                                  size="small"
                                  value={edit.game_type}
                                  onChange={(event) =>
                                    setGameEdits((current) => ({ ...current, [game.ID]: { ...edit, game_type: event.target.value } }))
                                  }
                                >
                                  <MenuItem value="">—</MenuItem>
                                  {Object.entries(payload.game_types).map(([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                      {label}
                                    </MenuItem>
                                  ))}
                                </AppTextField>
                                <AppButton
                                  size="small"
                                  variant="outlined"
                                  onClick={() =>
                                    void run(() =>
                                      updateIceGame(game.ID, edit.name, Number(edit.competitor_ID), edit.game_type),
                                    )
                                  }
                                >
                                  Save
                                </AppButton>
                              </Box>
                            </TableCell>
                            <TableCell>{game.team_name || 'Unassigned'}</TableCell>
                            <TableCell align="right">
                              <AppButton
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => {
                                  if (window.confirm('Delete this game?')) {
                                    void run(() => deleteIceGame(game.ID))
                                  }
                                }}
                              >
                                Delete
                              </AppButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
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

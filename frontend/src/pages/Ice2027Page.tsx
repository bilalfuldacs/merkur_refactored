import { useCallback, useEffect, useMemo, useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import type { IceBootstrap, IceCompetitor, IceGame, IceQuestionnaireHistory, IceScoutProduct } from '@/api/ice2027'
import { IceHero, IceOfflineBar, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { IceQuestionnaireForm, emptyProducts } from '@/components/ice2027/IceQuestionnaireForm'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { loadIceHub, loadIceQuestionnaire, persistIceQuestionnaire } from '@/offline/iceOffline'
import { APP_PATHS, eventSlugFromSearch, ice2027EvaluationPath, ice2027HubPath, ice2027QuestionnairePath, useAppPath } from '@/routing'

function competitorIdFromSearch(search: string): number | null {
  const id = Number(new URLSearchParams(search).get('c'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function gameLabel(count: number): string {
  return count === 1 ? '1 game' : `${count} games`
}

function statusChip(kind: 'done' | 'started' | 'todo', label: string) {
  const color = kind === 'done' ? 'success' : kind === 'started' ? 'warning' : 'error'
  return <Chip size="small" label={label} color={color} sx={{ fontWeight: 700 }} />
}

export default function Ice2027Page() {
  const { navigate, search } = useAppPath()
  const competitorId = useMemo(() => competitorIdFromSearch(search), [search])
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const [bootstrap, setBootstrap] = useState<IceBootstrap | null>(null)
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [competitor, setCompetitor] = useState<IceCompetitor | null>(null)
  const [products, setProducts] = useState<IceScoutProduct[]>([])
  const [games, setGames] = useState<IceGame[]>([])
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [updatedBy, setUpdatedBy] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [history, setHistory] = useState<IceQuestionnaireHistory[]>([])

  const loadHub = useCallback(async () => {
    try {
      setFailed('')
      const result = await loadIceHub()
      setBootstrap(result.data)
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Scouting could not be loaded.')
    }
  }, [search])

  const eventName = bootstrap?.event?.name ?? 'Exhibition'

  useEffect(() => {
    document.title = competitorId ? `${eventName} Questionnaire | MERKURflow` : `${eventName} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [competitorId, eventName])

  useEffect(() => {
    void loadHub()
  }, [loadHub])

  useEffect(() => {
    if (!competitorId) {
      setCompetitor(null)
      setProducts([])
      setGames([])
      setHistory([])
      return
    }
    let cancelled = false
    void loadIceQuestionnaire(competitorId)
      .then((result) => {
        if (cancelled) {
          return
        }
        setCompetitor(result.data.competitor)
        setProducts(emptyProducts(result.data.products))
        setGames(result.data.games ?? [])
        setTeamMembers(result.data.team_members ?? [])
        setUpdatedBy(result.data.updated_by ?? null)
        setUpdatedAt(result.data.updated_at ?? null)
        setHistory(result.data.history ?? [])
        setFailed('')
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'Questionnaire could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [competitorId, search])

  async function save(next = products, silent = false) {
    if (!competitorId) {
      return
    }
    if (!silent) {
      setFlash('')
    }
    try {
      const result = await persistIceQuestionnaire(competitorId, next)
      const loaded = await loadIceQuestionnaire(competitorId)
      setCompetitor(loaded.data.competitor)
      setProducts(emptyProducts(loaded.data.products))
      setGames(loaded.data.games ?? [])
      setTeamMembers(loaded.data.team_members ?? [])
      setUpdatedBy(loaded.data.updated_by ?? null)
      setUpdatedAt(loaded.data.updated_at ?? null)
      setHistory(loaded.data.history ?? [])
      if (!silent) {
        setFlash(result.message)
      }
      await loadHub()
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Questionnaire could not be saved.')
      throw error
    }
  }

  const me = bootstrap?.me
  const evalProgress = me?.evaluation_progress
  const evalKind = evalProgress?.complete ? 'done' : evalProgress?.started ? 'started' : 'todo'
  const evalLabel = evalProgress?.complete
    ? `Done · ${evalProgress.rows}/${evalProgress.required}`
    : evalProgress?.started
      ? evalProgress.label
      : 'Not started'
  const evalButton = evalProgress?.complete ? 'Edit' : evalProgress?.started ? 'Continue' : 'Start'

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
            {competitor ? (
              <>
                <Box component="button" type="button" onClick={() => navigate(ice2027HubPath(eventSlug))} sx={iceCrumbSx}>
                  {eventName}
                </Box>
                <Box component="span" color="text.secondary">/</Box>
                <Box component="button" type="button" onClick={() => navigate(ice2027HubPath(eventSlug))} sx={iceCrumbSx}>
                  Questionnaire
                </Box>
                <Box component="span" color="text.secondary">/</Box>
                <Box component="span">{competitor.name}</Box>
              </>
            ) : (
              <>
                <Box component="span">{eventName}</Box>
                <Box component="span" color="text.secondary">/</Box>
                <Box component="span">Questionnaire</Box>
              </>
            )}
          </Box>

          <IceHero
            kicker={competitor ? 'Scouting questionnaire' : `My ${eventName} tasks`}
            title={competitor ? competitor.name : eventName}
          >
            {competitor
              ? 'Add each product in a dialog. New products get a name; existing ones are chosen from this competitor’s games.'
              : me?.scout
                ? 'Open your assigned competitor to fill the questionnaire and the evaluation.'
                : 'Evaluation is optional. Questionnaires are only for scouting team members.'}
          </IceHero>

          <IceOfflineBar onUploaded={loadHub} />

          {me ? (
            <IceTabs
              current="questionnaire"
              attendant={me.attendant}
              admin={me.admin}
              showTasks={Boolean(competitorId)}
            />
          ) : null}

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

          {!competitorId && bootstrap && me && !me.attendant ? (
            <Alert severity="info">
              {eventName} questionnaires and evaluation are only available to attendants. Use Admin to mark attendants.
            </Alert>
          ) : null}

          {!competitorId && bootstrap && me?.attendant && me.scout ? (
            <>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                Your team: <Box component="strong" sx={{ color: 'secondary.main' }}>{me.team?.name}</Box>
                {me.team_members && me.team_members.length > 0 ? (
                  <Box component="span" sx={{ ml: 1.5, color: 'text.secondary', fontSize: 13 }}>
                    {me.team_members.join(' & ')}
                  </Box>
                ) : null}
                <Box component="span" sx={{ mx: 1.5 }}>
                  Questionnaires <strong>{me.questionnaires_started ?? me.questionnaires_done}/{me.questionnaires_total}</strong> started
                  {me.questionnaires_done ? ` · ${me.questionnaires_done} done` : ''}
                </Box>
                Evaluation {statusChip(evalKind, evalLabel)}
              </Typography>
              {evalProgress?.started && !evalProgress.complete ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {evalProgress.detail}{' '}
                  <Box component="button" type="button" onClick={() => navigate(ice2027EvaluationPath(undefined, eventSlug))} sx={{ ...iceCrumbSx, display: 'inline' }}>
                    Continue evaluation
                  </Box>
                </Alert>
              ) : null}
              {bootstrap.competitors.length === 0 ? (
                <Alert severity="info">No competitors are assigned to your team yet.</Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                  {bootstrap.competitors.map((item) => {
                    const qKind = item.questionnaire_done ? 'done' : item.questionnaire_started ? 'started' : 'todo'
                    const qLabel = item.questionnaire_done ? 'Done' : item.questionnaire_started ? 'Started' : 'Not started'
                    const qButton = item.questionnaire_done ? 'Edit' : item.questionnaire_started ? 'Continue' : 'Start'
                    return (
                      <Paper
                        key={item.ID}
                        elevation={0}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
                          borderRadius: 2,
                          p: 2.5,
                        }}
                      >
                        <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 0.5 }}>
                          {item.name}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{gameLabel(item.game_count)}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>
                              Questionnaire{' '}
                              <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400, fontSize: 13 }}>
                                (shared)
                              </Box>
                            </Typography>
                            {statusChip(qKind, qLabel)}
                          </Box>
                          <AppButton
                            size="small"
                            variant={item.questionnaire_done ? 'outlined' : 'contained'}
                            onClick={() => navigate(ice2027QuestionnairePath(item.ID, eventSlug))}
                          >
                            {qButton}
                          </AppButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1.5, mt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>Evaluation</Typography>
                            {statusChip(evalKind, evalLabel)}
                          </Box>
                          <AppButton
                            size="small"
                            variant={evalProgress?.complete ? 'outlined' : 'contained'}
                            onClick={() => navigate(ice2027EvaluationPath(item.ID, eventSlug))}
                          >
                            {evalButton}
                          </AppButton>
                        </Box>
                      </Paper>
                    )
                  })}
                </Box>
              )}
            </>
          ) : null}

          {!competitorId && bootstrap && me?.attendant && !me.scout ? (
            <Alert severity="info">
              You are not on a scouting team, so you have no questionnaires. Use Evaluation if you want to rate games.
            </Alert>
          ) : null}

          {competitorId && competitor ? (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
                <AppButton size="small" variant="outlined" color="secondary" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(ice2027HubPath(eventSlug))}>
                  My tasks
                </AppButton>
                {statusChip(
                  competitor.questionnaire_done ? 'done' : competitor.questionnaire_started || products.length > 0 ? 'started' : 'todo',
                  competitor.questionnaire_done ? 'Done' : competitor.questionnaire_started || products.length > 0 ? 'Started' : 'Not started',
                )}
                {(competitor.questionnaire_started || products.length > 0) && !competitor.questionnaire_done ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Your teammate can see this questionnaire as started too.</Typography>
                ) : null}
              </Box>
              <IceQuestionnaireForm
                products={products}
                games={games}
                competitorId={competitor.ID}
                teamMembers={teamMembers}
                updatedBy={updatedBy}
                updatedAt={updatedAt}
                history={history}
                onChange={setProducts}
                onPersist={(next) => save(next, true)}
              />
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

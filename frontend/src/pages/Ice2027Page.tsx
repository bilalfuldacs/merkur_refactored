import { useCallback, useEffect, useMemo, useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import type { IceBootstrap, IceCompetitor, IceGame, IceQuestionnaireHistory, IceScoutProduct } from '@/api/ice2027'
import { IceEventPicker, IceHero, IceOfflineBar, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { IceQuestionnaireForm, emptyProducts } from '@/components/ice2027/IceQuestionnaireForm'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { loadIceHub, loadIceOpenQuestionnaire, loadIceQuestionnaire, persistIceOpenQuestionnaire, persistIceQuestionnaire, getIcePendingQuestionnaire, discardIcePendingQuestionnaire, syncIcePending } from '@/offline/iceOffline'
import { APP_PATHS, eventSlugFromSearch, ice2027EvaluationPath, ice2027HubPath, ice2027OpenQuestionnairePath, ice2027QuestionnairePath, useAppPath } from '@/routing'

function competitorIdFromSearch(search: string): number | null {
  const id = Number(new URLSearchParams(search).get('c'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function openFromSearch(search: string): boolean {
  return new URLSearchParams(search).get('open') === '1'
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
  const extraOpen = useMemo(() => openFromSearch(search), [search])
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
  const [openMode, setOpenMode] = useState(false)
  const [forceNewProduct, setForceNewProduct] = useState(false)
  const [allCompetitors, setAllCompetitors] = useState<IceCompetitor[]>([])
  const [themeWorlds, setThemeWorlds] = useState<string[]>([])
  const [pendingFail, setPendingFail] = useState('')
  const [pendingBusy, setPendingBusy] = useState(false)

  const loadHub = useCallback(async () => {
    if (!eventSlug) {
      setBootstrap(null)
      return
    }
    try {
      setFailed('')
      const result = await loadIceHub()
      setBootstrap(result.data)
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Scouting could not be loaded.')
    }
  }, [eventSlug, search])

  const eventName = bootstrap?.event?.name ?? 'Exhibition'

  useEffect(() => {
    document.title = competitorId || extraOpen ? `${eventName} Questionnaire | MERKURflow` : `${eventName} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [competitorId, extraOpen, eventName])

  useEffect(() => {
    void loadHub()
  }, [loadHub])

  useEffect(() => {
    if (!eventSlug) {
      setCompetitor(null)
      setProducts([])
      setGames([])
      setHistory([])
      setOpenMode(false)
      return
    }
    const loadOpen = extraOpen || Boolean(bootstrap?.me?.attendant && bootstrap.competitors.length === 0)
    if (!competitorId && !loadOpen) {
      setCompetitor(null)
      setProducts([])
      setGames([])
      setHistory([])
      setOpenMode(false)
      return
    }
    let cancelled = false
    const loader = competitorId && !extraOpen ? loadIceQuestionnaire(competitorId) : loadIceOpenQuestionnaire()
    const pendingId = competitorId && !extraOpen ? competitorId : 0
    void loader
      .then(async (result) => {
        if (cancelled) {
          return
        }
        setCompetitor(result.data.competitor)
        setProducts(emptyProducts(result.data.products))
        setGames(result.data.games ?? result.data.all_games ?? [])
        setTeamMembers(result.data.team_members ?? [])
        setUpdatedBy(result.data.updated_by ?? null)
        setUpdatedAt(result.data.updated_at ?? null)
        setHistory(result.data.history ?? [])
        setOpenMode(Boolean(result.data.open || extraOpen || !competitorId))
        setForceNewProduct(Boolean(result.data.force_new_product))
        setAllCompetitors(result.data.all_competitors ?? bootstrap?.all_competitors ?? [])
        setThemeWorlds(result.data.theme_worlds ?? bootstrap?.theme_worlds ?? [])
        setFailed('')
        const pending = await getIcePendingQuestionnaire(pendingId)
        if (!cancelled) {
          setPendingFail(
            pending || result.pending
              ? 'This device has a questionnaire that was not saved to the server. Tap Save now to send it, or discard the local copy.'
              : '',
          )
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'Questionnaire could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [competitorId, eventSlug, extraOpen, search, bootstrap])

  if (!eventSlug) {
    return <IceEventPicker buildPath={(slug) => ice2027HubPath(slug)} />
  }

  async function save(next = products, silent = false) {
    const useOpen = openMode || extraOpen || !competitorId
    if (!useOpen && !competitorId) {
      return
    }
    if (!silent) {
      setFlash('')
    }
    try {
      const result = useOpen ? await persistIceOpenQuestionnaire(next) : await persistIceQuestionnaire(competitorId as number, next)
      const loaded = useOpen ? await loadIceOpenQuestionnaire() : await loadIceQuestionnaire(competitorId as number)
      setCompetitor(loaded.data.competitor)
      setProducts(emptyProducts(loaded.data.products))
      setGames(loaded.data.games ?? loaded.data.all_games ?? [])
      setTeamMembers(loaded.data.team_members ?? [])
      setUpdatedBy(loaded.data.updated_by ?? null)
      setUpdatedAt(loaded.data.updated_at ?? null)
      setHistory(loaded.data.history ?? [])
      setOpenMode(Boolean(loaded.data.open || useOpen))
      setForceNewProduct(Boolean(loaded.data.force_new_product))
      setAllCompetitors(loaded.data.all_competitors ?? [])
      setThemeWorlds(loaded.data.theme_worlds ?? [])
      if (!result.synced) {
        setPendingFail(
          'Could not save to the server. This questionnaire is stored on this device. Check your connection and tap Save now.',
        )
        if (!silent) {
          setFlash('')
        }
      } else {
        setPendingFail('')
        if (!silent) {
          setFlash(result.message)
        }
      }
      await loadHub()
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Questionnaire could not be saved.')
      throw error
    }
  }

  async function retryPendingSave() {
    setPendingBusy(true)
    setFailed('')
    try {
      const sync = await syncIcePending()
      if (sync.uploaded > 0) {
        setPendingFail('')
        setFlash(sync.uploaded === 1 ? 'Uploaded 1 saved form to the server.' : `Uploaded ${sync.uploaded} saved forms to the server.`)
        await save(products, true)
        return
      }
      await save(products, true)
      const pendingId = competitorId && !extraOpen ? competitorId : 0
      const stillPending = await getIcePendingQuestionnaire(pendingId)
      if (!stillPending) {
        setPendingFail('')
        setFlash('Saved to server.')
      }
    } catch (error) {
      setPendingFail(
        error instanceof ApiError
          ? error.message
          : 'Could not save to the server. This questionnaire is stored on this device. Check your connection and tap Save now.',
      )
    } finally {
      setPendingBusy(false)
    }
  }

  async function discardPendingLocal() {
    setPendingBusy(true)
    try {
      const pendingId = competitorId && !extraOpen ? competitorId : 0
      await discardIcePendingQuestionnaire(pendingId)
      const loaded =
        pendingId > 0
          ? await loadIceQuestionnaire(pendingId, { preferServer: true })
          : await loadIceOpenQuestionnaire({ preferServer: true })
      setCompetitor(loaded.data.competitor)
      setProducts(emptyProducts(loaded.data.products))
      setGames(loaded.data.games ?? loaded.data.all_games ?? [])
      setTeamMembers(loaded.data.team_members ?? [])
      setUpdatedBy(loaded.data.updated_by ?? null)
      setUpdatedAt(loaded.data.updated_at ?? null)
      setHistory(loaded.data.history ?? [])
      setPendingFail('')
      setFlash('')
      await loadHub()
    } finally {
      setPendingBusy(false)
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
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: { xs: 2, md: 3 }, fontSize: 13 }}>
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
          {pendingFail ? (
            <Alert
              severity="error"
              sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
              action={
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <AppButton size="small" color="error" variant="contained" disabled={pendingBusy} onClick={() => void retryPendingSave()}>
                    Save now
                  </AppButton>
                  <AppButton size="small" variant="outlined" color="secondary" disabled={pendingBusy} onClick={() => void discardPendingLocal()}>
                    Discard local copy
                  </AppButton>
                </Box>
              }
            >
              {pendingFail}
            </Alert>
          ) : null}

          {!competitorId && bootstrap && me && !me.attendant ? (
            <Alert severity="info">
              {eventName} questionnaires and evaluation are only available to attendants. Use Admin to mark attendants.
            </Alert>
          ) : null}

          {!competitorId && !extraOpen && !openMode && bootstrap && me?.attendant && me.scout ? (
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

          {!competitorId && !extraOpen && bootstrap && me?.attendant && me.scout && bootstrap.competitors.length > 0 ? (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderLeft: '4px solid',
                borderLeftColor: 'merkur.yellow',
                borderRadius: 2,
                p: 2.5,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 0.5 }}>
                    Extra competitors
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', mb: 1 }}>
                    Optional. Scout any other competitor or a new product beyond your assigned list.
                  </Typography>
                  {statusChip(
                    me.extra_questionnaire?.complete ? 'done' : me.extra_questionnaire?.started ? 'started' : 'todo',
                    me.extra_questionnaire?.complete ? 'Done' : me.extra_questionnaire?.started ? 'Started' : 'Optional',
                  )}
                </Box>
                <AppButton
                  size="small"
                  variant={me.extra_questionnaire?.complete ? 'outlined' : 'contained'}
                  onClick={() => navigate(ice2027OpenQuestionnairePath(eventSlug))}
                >
                  {me.extra_questionnaire?.complete ? 'Edit' : me.extra_questionnaire?.started ? 'Continue' : 'Start'}
                </AppButton>
              </Box>
            </Paper>
          ) : null}

          {!competitorId && !extraOpen && bootstrap && me?.attendant && !me.scout ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              You are not on a scouting team. You can still add products for any competitor, and evaluation is optional.
            </Alert>
          ) : null}

          {(competitorId || extraOpen || openMode) && competitor ? (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
                <AppButton size="small" variant="outlined" color="secondary" startIcon={<ArrowBackOutlinedIcon />} onClick={() => navigate(ice2027HubPath(eventSlug))}>
                  My tasks
                </AppButton>
                {statusChip(
                  competitor.questionnaire_done || (openMode && products.length > 0 && extraOpen && me?.extra_questionnaire?.complete)
                    ? 'done'
                    : competitor.questionnaire_started || products.length > 0
                      ? 'started'
                      : 'todo',
                  competitor.questionnaire_done || me?.extra_questionnaire?.complete
                    ? 'Done'
                    : competitor.questionnaire_started || products.length > 0
                      ? 'Started'
                      : 'Not started',
                )}
                {openMode ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                    {me?.scout
                      ? 'This is extra to your assigned competitors. Pick any competitor, then a catalog game or New product.'
                      : 'You are not on a scouting team. Use Add product for each game and select the competitor.'}
                  </Typography>
                ) : (competitor.questionnaire_started || products.length > 0) && !competitor.questionnaire_done ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Your teammate can see this questionnaire as started too.</Typography>
                ) : null}
              </Box>
              <IceQuestionnaireForm
                products={products}
                games={games}
                competitorId={competitor.ID}
                teamMembers={openMode ? [] : teamMembers}
                updatedBy={updatedBy}
                updatedAt={updatedAt}
                history={history}
                allCompetitors={allCompetitors}
                themeWorlds={themeWorlds}
                openMode={openMode}
                forceNewProduct={forceNewProduct}
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

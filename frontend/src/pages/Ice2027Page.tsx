import { useCallback, useEffect, useMemo, useState } from 'react'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import type { IceBootstrap, IceCompetitor, IceQuestionnaireProducts } from '@/api/ice2027'
import { IceHero, IceOfflineBar, IceTabs, iceCrumbSx, iceStickyBarSx } from '@/components/ice2027'
import { IceQuestionnaireForm, emptyProducts } from '@/components/ice2027/IceQuestionnaireForm'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { loadIceHub, loadIceQuestionnaire, persistIceQuestionnaire } from '@/offline/iceOffline'
import { APP_PATHS, ice2027EvaluationPath, ice2027QuestionnairePath, useAppPath } from '@/routing'

function competitorIdFromSearch(search: string): number | null {
  const id = Number(new URLSearchParams(search).get('c'))
  return Number.isInteger(id) && id > 0 ? id : null
}

function gameLabel(count: number): string {
  return count === 1 ? '1 game' : `${count} games`
}

export default function Ice2027Page() {
  const { navigate, search } = useAppPath()
  const competitorId = useMemo(() => competitorIdFromSearch(search), [search])
  const [bootstrap, setBootstrap] = useState<IceBootstrap | null>(null)
  const [failed, setFailed] = useState('')
  const [flash, setFlash] = useState('')
  const [competitor, setCompetitor] = useState<IceCompetitor | null>(null)
  const [products, setProducts] = useState<IceQuestionnaireProducts>(emptyProducts())
  const [saving, setSaving] = useState(false)

  const loadHub = useCallback(async () => {
    try {
      setFailed('')
      const result = await loadIceHub()
      setBootstrap(result.data)
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'ICE 2027 could not be loaded.')
    }
  }, [])

  useEffect(() => {
    document.title = competitorId ? 'ICE 2027 Questionnaire | MERKURflow' : 'ICE 2027 | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [competitorId])

  useEffect(() => {
    void loadHub()
  }, [loadHub])

  useEffect(() => {
    if (!competitorId) {
      setCompetitor(null)
      setProducts(emptyProducts())
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
  }, [competitorId])

  async function save() {
    if (!competitorId) {
      return
    }
    setSaving(true)
    setFlash('')
    try {
      const result = await persistIceQuestionnaire(competitorId, products)
      setFlash(result.message)
      await loadHub()
    } catch (error) {
      setFailed(error instanceof ApiError ? error.message : 'Questionnaire could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const me = bootstrap?.me

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: competitorId ? 1100 : 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            {competitor ? (
              <>
                <Box component="button" type="button" onClick={() => navigate(APP_PATHS.ice2027)} sx={iceCrumbSx}>
                  ICE 2027
                </Box>
                <Box component="span" color="text.secondary">/</Box>
                <Box component="button" type="button" onClick={() => navigate(APP_PATHS.ice2027)} sx={iceCrumbSx}>
                  Questionnaire
                </Box>
                <Box component="span" color="text.secondary">/</Box>
                <Box component="span">{competitor.name}</Box>
              </>
            ) : (
              <>
                <Box component="span">ICE 2027</Box>
                <Box component="span" color="text.secondary">/</Box>
                <Box component="span">Questionnaire</Box>
              </>
            )}
          </Box>

          <IceHero
            kicker={competitor ? 'Scouting questionnaire' : 'My ICE 2027 tasks'}
            title={competitor ? competitor.name : 'ICE 2027'}
          >
            {competitor
              ? 'Fill in new products and highlights for this competitor.'
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
              ICE 2027 questionnaires and evaluation are only available to attendants. Use Admin to mark ICE 2027 attendants.
            </Alert>
          ) : null}

          {!competitorId && bootstrap && me?.attendant && me.scout ? (
            <>
              <Typography sx={{ color: 'text.secondary', mb: 2 }}>
                Your team: <Box component="strong" sx={{ color: 'secondary.main' }}>{me.team?.name}</Box>
                <Box component="span" sx={{ mx: 1.5 }}>
                  Questionnaires <strong>{me.questionnaires_done}/{me.questionnaires_total}</strong>
                </Box>
                Evaluation{' '}
                <Chip
                  size="small"
                  label={me.evaluation_done ? 'Done' : 'Required'}
                  color={me.evaluation_done ? 'success' : 'error'}
                  sx={{ fontWeight: 700 }}
                />
              </Typography>
              {bootstrap.competitors.length === 0 ? (
                <Alert severity="info">No competitors are assigned to your team yet.</Alert>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
                  {bootstrap.competitors.map((item) => (
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
                          <Typography sx={{ fontWeight: 700 }}>Questionnaire</Typography>
                          <Chip size="small" label={item.questionnaire_done ? 'Done' : 'Required'} color={item.questionnaire_done ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
                        </Box>
                        <AppButton
                          size="small"
                          variant={item.questionnaire_done ? 'outlined' : 'contained'}
                          onClick={() => navigate(ice2027QuestionnairePath(item.ID))}
                        >
                          {item.questionnaire_done ? 'Edit' : 'Start'}
                        </AppButton>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1.5, mt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>Evaluation</Typography>
                          <Chip size="small" label={item.evaluation_done ? 'Done' : 'Required'} color={item.evaluation_done ? 'success' : 'error'} sx={{ fontWeight: 700 }} />
                        </Box>
                        <AppButton
                          size="small"
                          variant={item.evaluation_done ? 'outlined' : 'contained'}
                          onClick={() => navigate(ice2027EvaluationPath(item.ID))}
                        >
                          {item.evaluation_done ? 'Edit' : 'Start'}
                        </AppButton>
                      </Box>
                    </Paper>
                  ))}
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
              <IceQuestionnaireForm products={products} onChange={setProducts} />
              <Box sx={iceStickyBarSx}>
                <AppButton startIcon={<SaveOutlinedIcon />} disabled={saving} onClick={() => void save()}>
                  Save questionnaire
                </AppButton>
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

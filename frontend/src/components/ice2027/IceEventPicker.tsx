import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { ApiError, getScoutMenu } from '@/api'
import type { ScoutMenuEvent } from '@/api/scout'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { APP_PATHS, useAppPath } from '@/routing'
import { IceHero, iceCrumbSx } from './IceChrome'

export function IceEventPicker({
  buildPath,
  kicker = 'Exhibition scouting',
}: {
  buildPath: (slug: string) => string
  kicker?: string
}) {
  const { navigate } = useAppPath()
  const [events, setEvents] = useState<ScoutMenuEvent[] | null>(null)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    document.title = 'Scouting events | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getScoutMenu()
      .then((result) => {
        if (!cancelled) {
          setEvents(result.events)
          setFailed('')
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setEvents([])
          setFailed(error instanceof ApiError ? error.message : 'Scouting events could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Scouting</Box>
          </Box>

          <IceHero kicker={kicker} title="Scouting events">
            Choose an exhibition to open questionnaires, evaluation, and the rest of the scouting tools.
          </IceHero>

          {failed ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {failed}
            </Alert>
          ) : null}

          {events === null ? (
            <Typography sx={{ color: 'text.secondary' }}>Loading events…</Typography>
          ) : events.length === 0 ? (
            <Alert severity="info">No scouting event is available for your account.</Alert>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
              {events.map((event) => (
                <Paper
                  key={event.ID}
                  component="button"
                  type="button"
                  elevation={0}
                  onClick={() => navigate(buildPath(event.slug))}
                  sx={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                    borderRadius: 2,
                    p: 2.5,
                    bgcolor: 'background.paper',
                    transition: 'border-color 120ms ease, box-shadow 120ms ease',
                    '&:hover': {
                      borderColor: 'secondary.main',
                      boxShadow: '0 8px 24px rgba(0,0,0,.08)',
                    },
                  }}
                >
                  <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mb: 0.5 }}>
                    {event.name}
                  </Typography>
                  {event.year ? (
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{event.year}</Typography>
                  ) : null}
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import { getIce2027, getIceMedia } from '@/api/ice2027'
import type { IceBootstrap, IceMediaLibrary, IceProgressPhoto } from '@/api/ice2027'
import { IceEventPicker, IceHero, IceTabs, iceCrumbSx } from '@/components/ice2027'
import { IcePhotosButton } from '@/components/ice2027/IcePhotosButton'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { useI18n } from '@/i18n'
import { APP_PATHS, eventSlugFromSearch, ice2027HubPath, useAppPath } from '@/routing'

export default function Ice2027MediaPage() {
  const { t } = useI18n()
  const { navigate, search } = useAppPath()
  const eventSlug = useMemo(() => eventSlugFromSearch(search), [search])
  const [bootstrap, setBootstrap] = useState<IceBootstrap | null>(null)
  const [media, setMedia] = useState<IceMediaLibrary | null>(null)
  const [filter, setFilter] = useState('')
  const [failed, setFailed] = useState('')

  useEffect(() => {
    document.title = `${bootstrap?.event?.name ?? 'Exhibition'} Pictures | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [bootstrap?.event?.name])

  useEffect(() => {
    if (!eventSlug) {
      setBootstrap(null)
      setMedia(null)
      return
    }
    let cancelled = false
    void Promise.all([getIce2027(), getIceMedia()])
      .then(([hub, library]) => {
        if (cancelled) return
        setBootstrap(hub)
        setMedia(library)
        setFailed('')
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setFailed(error instanceof ApiError ? error.message : 'Pictures could not be loaded.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [eventSlug, search])

  const competitors = Object.keys(media?.by_competitor ?? {}).sort((a, b) => a.localeCompare(b))
  const shown = filter && media?.by_competitor[filter]
    ? { [filter]: media.by_competitor[filter] }
    : (media?.by_competitor ?? {})

  let fileCount = 0
  Object.values(shown).forEach((games) => {
    Object.values(games).forEach((photos) => {
      fileCount += photos.length
    })
  })

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label={t('common.breadcrumb', 'Breadcrumb')} sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14, flexWrap: 'wrap' }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={iceCrumbSx}>
              <CrumbHome />
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="button" type="button" onClick={() => navigate(ice2027HubPath(eventSlug))} sx={iceCrumbSx}>
              {bootstrap?.event?.name ?? 'Exhibition'}
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Pictures</Box>
          </Box>

          <IceEventPicker />
          <IceHero kicker="Pictures and video" title={bootstrap?.event?.name ?? 'Exhibition'}>
            <Typography sx={{ opacity: 0.8, mt: 1 }}>
              Every picture and video saved on a questionnaire for this show, grouped by competitor. Attendants can open files uploaded by every team.
            </Typography>
          </IceHero>
          <IceTabs current="media" attendant={Boolean(bootstrap?.scout)} admin={Boolean(bootstrap?.admin)} />

          {failed ? <Alert severity="error" sx={{ mt: 2 }}>{failed}</Alert> : null}

          {media ? (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Competitor"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value="">All competitors</MenuItem>
                  {competitors.map((name) => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </TextField>
                <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                  {fileCount} {fileCount === 1 ? 'file' : 'files'}
                </Typography>
              </Box>

              {Object.keys(shown).length === 0 ? (
                <Typography color="text.secondary">No questionnaire pictures yet.</Typography>
              ) : (
                Object.entries(shown).map(([competitor, games]) => (
                  <Box key={competitor} sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>{competitor}</Typography>
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      {Object.entries(games).map(([gameName, photos]) => (
                        <Box
                          key={`${competitor}-${gameName}`}
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1.5,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                          }}
                        >
                          <Typography sx={{ fontWeight: 700 }}>{gameName}</Typography>
                          <IcePhotosButton photos={photos as IceProgressPhoto[]} title={`${competitor} · ${gameName}`} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

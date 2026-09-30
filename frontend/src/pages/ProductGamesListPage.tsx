import { useEffect, useState } from 'react'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import { getProductGamesList } from '@/api/products'
import type { ProductGamesListPayload } from '@/api/products'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, productGamesDocsPackagePath, useAppPath } from '@/routing'
import { AppButton } from '@/components/ui'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

function versionFromSearch(): number | null {
  const value = Number(new URLSearchParams(window.location.search).get('v'))
  return Number.isInteger(value) && value > 0 ? value : null
}

export default function ProductGamesListPage() {
  const { navigate, search } = useAppPath()
  const versionId = versionFromSearch()
  const [payload, setPayload] = useState<ProductGamesListPayload | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    document.title = 'All Games | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!versionId) {
      setPayload(null)
      return
    }
    let cancelled = false
    setFailed(false)
    void getProductGamesList(versionId)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          document.title = `All Games in “${result.version.name}” | MERKURflow`
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [versionId, search])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14, flexWrap: 'wrap' }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.products)} sx={crumbSx}>
              Products
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">All Games{payload?.version.name ? ` in “${payload.version.name}”` : ''}</Box>
          </Box>
          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 28, md: 36 }, mb: 2 }}>
            <CasinoOutlinedIcon sx={{ color: '#FFCC00', fontSize: 34 }} />
            All Games{payload?.version.name ? ` in “${payload.version.name}”` : ''}
          </Typography>
          {!versionId ? <Typography color="text.secondary">Choose a version from Products to see its full game list.</Typography> : null}
          {failed ? <Typography color="text.secondary">The games list could not be loaded.</Typography> : null}
          {payload ? (
            <>
              <Typography sx={{ mb: 2 }}>
                Inheritance: {payload.inheritance.map((node) => node.name).filter(Boolean).join(' ⇠ ')}
              </Typography>
              <Typography sx={{ mb: 3 }}>
                <strong>{payload.new_games}</strong> new in this version · <strong>{payload.total_games}</strong> games in the chain
              </Typography>
              {payload.defects.length > 0 ? (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Known Defects in {payload.version.name}</Typography>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    {payload.defects.map((defect) => (
                      <li key={defect.ID}>
                        {defect.scope}:{' '}
                        <Box
                          component="button"
                          type="button"
                          onClick={() => defect.game_ID && navigate(`${tableBrowsePath('games')}?id=${defect.game_ID}`)}
                          sx={{ ...crumbSx, fontWeight: 700 }}
                        >
                          {defect.game_name || 'Game'}
                        </Box>
                        : {defect.name} ·{' '}
                        <Box component="button" type="button" onClick={() => navigate(`${tableBrowsePath('defects')}?id=${defect.ID}`)} sx={crumbSx}>
                          Details
                        </Box>
                      </li>
                    ))}
                  </Box>
                </Alert>
              ) : null}
              {payload.sections.map((section) => (
                <Box key={section.version_ID} sx={{ mb: 4 }}>
                  <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22 }}>
                    Version <strong>{section.name}</strong> {section.name2}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }}>
                    Contains <strong>{section.games.length}</strong> game{section.games.length === 1 ? '' : 's'}
                    {section.description ? <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>{section.description}</Box> : null}
                  </Typography>
                  <AppButton
                    type="button"
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate(productGamesDocsPackagePath(section.version_ID))}
                    sx={{ mb: 1.5 }}
                  >
                    Docs Package
                  </AppButton>
                  <Box component="ol" sx={{ pl: 3 }}>
                    {section.games.map((game) => (
                      <Box
                        component="li"
                        key={`${section.version_ID}-${game.ID}-${game.adopted ? 'a' : 'g'}`}
                        sx={{ mb: 0.75, textDecoration: game.removed ? 'line-through' : 'none', color: game.removed ? 'text.secondary' : 'inherit' }}
                      >
                        <Box
                          component="button"
                          type="button"
                          onClick={() => navigate(`${tableBrowsePath('games')}?id=${game.ID}`)}
                          sx={{ ...crumbSx, fontWeight: 800, color: game.removed ? 'text.secondary' : 'info.main' }}
                        >
                          {game.name}
                        </Box>
                        {game.ID_text ? <Box component="code" sx={{ mx: 0.75 }}>{game.ID_text}</Box> : null}
                        {section.is_current ? <Chip size="small" label="new" sx={{ ml: 0.5, height: 20 }} /> : null}
                        {game.adopted ? <Chip size="small" label="adopted" sx={{ ml: 0.5, height: 20 }} /> : null}
                        {game.studio ? ` · ${game.studio}` : ''}
                        {game.removed && game.removed_in ? (
                          <Typography component="small" sx={{ color: 'error.main', ml: 1 }}>
                            Removed in {game.removed_in}
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

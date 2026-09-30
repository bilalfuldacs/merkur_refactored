import { useEffect, useMemo, useState } from 'react'
import FolderZipOutlinedIcon from '@mui/icons-material/FolderZipOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import {
  downloadProductGamesDocsPackage,
  getProductGamesDocsPackage,
} from '@/api/products'
import type { ProductGamesDocsPackagePayload, ProductGamesDocsPackageSelection } from '@/api/products'
import { downloadTableAsset } from '@/api/tableAssets'
import type { TableAssetFile } from '@/api/tableAssets'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, productGamesListPath, useAppPath } from '@/routing'

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

function fileKey(gameId: number, tlp: string, filename: string): string {
  return `${gameId}*${tlp}*${filename}`
}

function errorMessage(caught: unknown, fallback: string): string {
  return caught instanceof ApiError ? caught.message : fallback
}

function asAssetFile(file: ProductGamesDocsPackagePayload['games'][number]['files'][number]): TableAssetFile {
  return {
    filename: file.filename,
    name: file.name,
    tlp: file.tlp,
    tlp_label: file.tlp_label,
    asset_class: '',
    folder: null,
    size: file.size,
    size_label: file.size_label,
    uploaded_at: null,
    description: null,
    draft: false,
    featured: false,
    is_image: false,
    uploader: null,
  }
}

export default function ProductGamesDocsPackagePage() {
  const { navigate, search } = useAppPath()
  const versionId = versionFromSearch()
  const [payload, setPayload] = useState<ProductGamesDocsPackagePayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Docs Package | MERKURflow'
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
    setError(null)
    void getProductGamesDocsPackage(versionId)
      .then((result) => {
        if (cancelled) {
          return
        }
        setPayload(result)
        document.title = `Docs Package · ${result.version.name ?? `Version #${versionId}`} | MERKURflow`
        const next: Record<string, boolean> = {}
        for (const game of result.games) {
          for (const file of game.files) {
            next[fileKey(game.ID, file.tlp, file.filename)] = true
          }
        }
        setSelected(next)
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

  const selectionList = useMemo((): ProductGamesDocsPackageSelection[] => {
    if (!payload) {
      return []
    }
    const files: ProductGamesDocsPackageSelection[] = []
    for (const game of payload.games) {
      for (const file of game.files) {
        const key = fileKey(game.ID, file.tlp, file.filename)
        if (selected[key]) {
          files.push({ game_ID: game.ID, tlp: file.tlp, filename: file.filename })
        }
      }
    }
    return files
  }, [payload, selected])

  async function handleDownloadZip() {
    if (!versionId || selectionList.length === 0) {
      setError('Select at least one file.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await downloadProductGamesDocsPackage(versionId, selectionList)
    } catch (caught) {
      setError(errorMessage(caught, 'The ZIP could not be downloaded.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14, flexWrap: 'wrap' }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.products)} sx={crumbSx}>
              Products
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            {versionId ? (
              <>
                <Box component="button" type="button" onClick={() => navigate(productGamesListPath(versionId))} sx={crumbSx}>
                  All Games
                </Box>
                <Box component="span" color="text.secondary">
                  /
                </Box>
              </>
            ) : null}
            <Box component="span">Docs Package</Box>
          </Box>

          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 28, md: 36 }, mb: 1 }}>
            <FolderZipOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 34 }} />
            Docs Package{payload?.version.name ? ` · ${payload.version.name}` : versionId ? ` · Version #${versionId}` : ''}
          </Typography>

          <Box component="ul" sx={{ pl: 3, mb: 2, color: 'text.secondary' }}>
            <li>Use links to download directly, or (un)check files to build a custom ZIP</li>
            <li>Does not include TLP:RED files</li>
            <li>Does not include files in subfolders</li>
          </Box>

          {!versionId ? <Typography color="text.secondary">Choose a version from the games list.</Typography> : null}
          {failed ? <Typography color="text.secondary">The docs package could not be loaded.</Typography> : null}
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {payload ? (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <AppButton type="button" disabled={busy || selectionList.length === 0} onClick={() => void handleDownloadZip()}>
                  Download ZIP ({selectionList.length})
                </AppButton>
                <AppButton
                  type="button"
                  variant="outlined"
                  color="inherit"
                  disabled={busy || payload.file_count === 0}
                  onClick={() =>
                    setSelected((current) => {
                      const next = { ...current }
                      for (const key of Object.keys(next)) {
                        next[key] = false
                      }
                      return next
                    })
                  }
                >
                  Uncheck all
                </AppButton>
              </Box>

              {payload.file_count === 0 ? (
                <Typography color="text.secondary">No eligible attachment files were found for this version’s games.</Typography>
              ) : null}

              {payload.games.map((game) => (
                <Box key={game.ID} sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 0.5 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate(`${tableBrowsePath('games')}?id=${game.ID}`)}
                      sx={{ ...crumbSx, fontWeight: 800 }}
                    >
                      {game.name}
                    </Box>
                  </Typography>
                  {game.files.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                      No flat docs for this game.
                    </Typography>
                  ) : (
                    <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      {game.files.map((file) => {
                        const key = fileKey(game.ID, file.tlp, file.filename)
                        return (
                          <ListItem
                            key={key}
                            secondaryAction={
                              <AppButton
                                type="button"
                                size="small"
                                variant="text"
                                onClick={() =>
                                  void downloadTableAsset('games', game.ID, asAssetFile(file)).catch((caught) =>
                                    setError(errorMessage(caught, 'File could not be downloaded.')),
                                  )
                                }
                              >
                                Download
                              </AppButton>
                            }
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={Boolean(selected[key])}
                                  onChange={(_event, checked) => setSelected((current) => ({ ...current, [key]: checked }))}
                                />
                              }
                              label={
                                <ListItemText
                                  primary={file.name}
                                  secondary={`${file.tlp_label} · ${file.size_label}`}
                                  sx={{ my: 0 }}
                                />
                              }
                              sx={{ mr: 0, flex: 1, alignItems: 'flex-start' }}
                            />
                          </ListItem>
                        )
                      })}
                    </List>
                  )}
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

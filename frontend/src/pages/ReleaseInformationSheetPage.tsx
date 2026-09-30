import { useEffect, useState } from 'react'
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { getReleaseInformationSheet } from '@/api/products'
import type { ReleaseInformationSheetPayload } from '@/api/products'
import { MerkurLogo } from '@/components/brand'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

function releaseIdFromSearch(): number | null {
  const value = Number(new URLSearchParams(window.location.search).get('id'))
  return Number.isInteger(value) && value > 0 ? value : null
}

function multiline(text: string | null | undefined): string {
  return text?.trim() ? text : '—'
}

export default function ReleaseInformationSheetPage() {
  const { navigate, search } = useAppPath()
  const releaseId = releaseIdFromSearch()
  const [payload, setPayload] = useState<ReleaseInformationSheetPayload | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    document.title = 'Release Information | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!releaseId) {
      setPayload(null)
      return
    }
    let cancelled = false
    setFailed(false)
    void getReleaseInformationSheet(releaseId)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          document.title = `Release Information ${result.build.name ?? ''} | MERKURflow`
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
  }, [releaseId, search])

  const notesLong = (payload?.notes?.length ?? 0) >= 1000

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: 4, lg: 6 },
          py: { xs: 2, md: 3 },
          '@media print': {
            px: 0,
            py: 0,
            bgcolor: 'common.white',
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 960,
            mx: 'auto',
            width: '100%',
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: { xs: 2, md: 4 },
            boxShadow: 1,
            '@media print': {
              maxWidth: 'none',
              boxShadow: 'none',
              borderRadius: 0,
              p: 0,
            },
          }}
        >
          <Box
            component="nav"
            aria-label="Breadcrumb"
            sx={{ display: 'flex', gap: 1, mb: 2, fontSize: 14, flexWrap: 'wrap', '@media print': { display: 'none' } }}
          >
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
            <Box component="span">Release Information</Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <MerkurLogo variant="positive" size="md" />
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {releaseId ? (
                <Box
                  component="img"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=96x96&margin=0&data=${encodeURIComponent(
                    `${window.location.origin}${APP_PATHS.releaseInformationSheet}?id=${releaseId}`,
                  )}`}
                  alt="QR code linking to this release sheet"
                  title={`${window.location.origin}${APP_PATHS.releaseInformationSheet}?id=${releaseId}`}
                  sx={{
                    width: 96,
                    height: 96,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'common.white',
                    '@media print': { border: 0 },
                  }}
                />
              ) : null}
              <Typography
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1,
                  color: 'warning.dark',
                  border: '2px solid',
                  borderColor: 'warning.main',
                  px: 1.5,
                  py: 0.5,
                  fontSize: 13,
                }}
              >
                TLP:AMBER
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: 26, md: 34 }, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CelebrationOutlinedIcon sx={{ color: '#FFCC00' }} />
              Release Information {payload?.build.name ?? ''}
            </Typography>
            <AppButton
              type="button"
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<PrintOutlinedIcon />}
              onClick={() => window.print()}
              sx={{ '@media print': { display: 'none' } }}
            >
              Print Page
            </AppButton>
          </Box>

          {!releaseId ? <Typography color="text.secondary">Choose a release from Products or the Releases table.</Typography> : null}
          {failed ? <Typography color="text.secondary">The release information sheet could not be loaded.</Typography> : null}

          {payload ? (
            <>
              <Typography sx={{ mb: 1.5 }}>
                Release Date:{' '}
                <Box component="strong">{payload.release_date ?? 'Pre-Release Information (No Release Yet)'}</Box>
                <br />
                Release by: <Box component="strong">{payload.released_by ?? '—'}</Box>
              </Typography>

              {payload.is_pre_release ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 800 }}>NOT YET RELEASED</Typography>
                  Product Management is currently preparing this release. This document contains preliminary data and does
                  not imply a product has been released.
                </Alert>
              ) : null}

              <Table size="small" sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell sx={{ fontWeight: 800, width: '32%' }}>Property</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ['Build', payload.build.name],
                    ['“P” Label', payload.build.p_label],
                    ['Checksum — System', payload.build.checksum_system, true],
                    ['Checksum — Verify', payload.build.checksum_verify, true],
                    ['Checksum — Application', payload.build.checksum_app, true],
                    ['GLI Approval Status', payload.GLI_approval_status],
                    ['Approval with Base Dongle', payload.dongle],
                    ['Suitable for Cabinets', payload.suitable_for_cabinets],
                    ['Suitable for Markets', payload.suitable_for_markets],
                  ].map(([label, value, code]) => (
                    <TableRow key={String(label)}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 700, verticalAlign: 'top' }}>
                        {label}
                      </TableCell>
                      <TableCell>
                        {code ? <Box component="code">{value || '—'}</Box> : (value as string | null) || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {payload.solved_issues ? (
                <Box sx={{ mb: 2 }}>
                  <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>
                    Solved Issues
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{multiline(payload.solved_issues)}</Typography>
                </Box>
              ) : null}

              <Box sx={{ mb: 3 }}>
                <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>
                  Special Notes
                </Typography>
                <Typography
                  sx={{
                    whiteSpace: 'pre-wrap',
                    ...(notesLong
                      ? {
                          columnCount: { xs: 1, md: 2 },
                          columnGap: 3,
                        }
                      : {}),
                  }}
                >
                  {multiline(payload.notes)}
                </Typography>
              </Box>

              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>
                New Features
              </Typography>
              {payload.features.length === 0 ? (
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  No features listed for this version.
                </Typography>
              ) : (
                <Box component="ul" sx={{ pl: 3, mb: 3 }}>
                  {payload.features.map((feature) => (
                    <Box component="li" key={feature.ID} sx={{ mb: 0.5 }}>
                      <Box
                        component="button"
                        type="button"
                        onClick={() => navigate(`${tableBrowsePath('features')}?id=${feature.ID}`)}
                        sx={{ ...crumbSx, fontWeight: 700, '@media print': { color: 'inherit', cursor: 'default' } }}
                      >
                        {feature.name || `Feature #${feature.ID}`}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <Typography component="h2" sx={{ fontWeight: 800, fontSize: 20, mb: 1 }}>
                Games ({payload.games.total} total, of which {payload.games.new} new)
              </Typography>
              <Box
                component="ul"
                sx={{
                  pl: 3,
                  mb: 3,
                  columnCount: { xs: 1, md: 2 },
                  columnGap: 3,
                }}
              >
                {payload.games.items.map((game) => (
                  <Box component="li" key={game.ID} sx={{ mb: 0.75, breakInside: 'avoid' }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate(`${tableBrowsePath('games')}?id=${game.ID}`)}
                      sx={{ ...crumbSx, fontWeight: 800, '@media print': { color: 'inherit', cursor: 'default' } }}
                    >
                      {game.name}
                    </Box>
                    {game.ID_text ? (
                      <Box component="code" sx={{ mx: 0.75 }}>
                        {game.ID_text}
                      </Box>
                    ) : null}
                    {!game.gli11 ? <Chip size="small" label="no GLI" sx={{ ml: 0.5, height: 20 }} /> : null}
                    {game.is_new ? <Chip size="small" label="new" sx={{ ml: 0.5, height: 20 }} /> : null}
                    {game.adopted ? <Chip size="small" label="adopted" sx={{ ml: 0.5, height: 20 }} /> : null}
                  </Box>
                ))}
              </Box>

              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                Generated on {payload.generated_at} for {payload.generated_for}
              </Typography>
            </>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ '@media print': { display: 'none' } }}>
        <AppFooter />
      </Box>
    </PageBackground>
  )
}

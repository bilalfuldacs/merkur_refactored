import { useEffect, useMemo, useState } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { getProductPanorama } from '@/api'
import type { ProductScope, ProductVersion } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { ProductFilters, VersionDetail, VersionList, emptyProductFilters, filterVersions } from '@/components/products'
import type { ProductFilterState } from '@/components/products'
import { AppButton, AppTextField } from '@/components/ui'
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

const pillGroupSx = {
  gap: 1,
  flexWrap: 'wrap',
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
  },
} as const

const pillSx = {
  px: 1.5,
  py: 0.75,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  bgcolor: 'common.white',
  color: 'secondary.main',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

const SCOPES: { id: ProductScope; number: string | null; label: string }[] = [
  { id: 'preparing', number: '1', label: 'Preparing' },
  { id: 'available', number: '2', label: 'Available' },
  { id: 'discontinued', number: '3', label: 'Discontinued' },
  { id: 'inactive', number: null, label: 'Inactive' },
]

const SCOPE_TITLES: Record<ProductScope, string> = {
  preparing: 'Preparing versions',
  available: 'Available versions',
  discontinued: 'Discontinued versions',
  inactive: 'Inactive versions',
}

function readProductsSearch(): { scope: ProductScope; id: number | null } {
  const params = new URLSearchParams(window.location.search)
  const scopeParam = params.get('scope')
  const scope: ProductScope =
    scopeParam === 'preparing' || scopeParam === 'available' || scopeParam === 'discontinued' || scopeParam === 'inactive'
      ? scopeParam
      : 'available'
  const id = Number(params.get('id'))
  return { scope, id: Number.isInteger(id) && id > 0 ? id : null }
}

function writeProductsSearch(scope: ProductScope, id: number | null) {
  const params = new URLSearchParams()
  if (scope !== 'available') {
    params.set('scope', scope)
  }
  if (id) {
    params.set('id', String(id))
  }
  const query = params.toString()
  const href = query ? `${APP_PATHS.products}?${query}` : APP_PATHS.products
  if (`${window.location.pathname}${window.location.search}` !== href) {
    window.history.replaceState(null, '', href)
  }
}

export default function ProductsPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const initial = readProductsSearch()
  const [scope, setScope] = useState<ProductScope>(initial.scope)
  const [versions, setVersions] = useState<ProductVersion[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [filters, setFilters] = useState<ProductFilterState>(emptyProductFilters)
  const [moreOpen, setMoreOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(initial.id)
  const canEdit = Boolean(user?.role?.['may_create-update_items'])

  useEffect(() => {
    document.title = 'Products Panorama | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setVersions(null)
    setFailed(false)

    void getProductPanorama(scope)
      .then((result) => {
        if (!cancelled) {
          setVersions(result.data)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVersions(null)
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [scope])

  const filtered = useMemo(() => filterVersions(versions ?? [], filters), [versions, filters])
  const selected = filtered.find((version) => version.ID === selectedId) ?? filtered[0] ?? null

  useEffect(() => {
    if (!versions) {
      return
    }
    if (!filtered.length) {
      writeProductsSearch(scope, null)
      return
    }
    const nextId = selected?.ID ?? filtered[0].ID
    if (selectedId !== nextId) {
      setSelectedId(nextId)
    }
    writeProductsSearch(scope, nextId)
  }, [versions, filtered, scope, selected, selectedId])

  function changeScope(next: ProductScope) {
    setScope(next)
    setFilters(emptyProductFilters)
    setMoreOpen(false)
    setSelectedId(null)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1680, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Products</Box>
          </Box>

          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15, mb: 2 }}
          >
            <Inventory2OutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
            Products
            <Box component="span" sx={{ fontWeight: 600, fontSize: 16, color: 'text.secondary' }}>
              Panorama
            </Box>
          </Typography>

          {failed ? (
            <Typography color="text.secondary">This panorama could not be loaded.</Typography>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ToggleButtonGroup
                  exclusive
                  value={scope}
                  onChange={(_event, value: ProductScope | null) => {
                    if (value) {
                      changeScope(value)
                    }
                  }}
                  aria-label="Version status"
                  sx={pillGroupSx}
                >
                  {SCOPES.map((item) => (
                    <ToggleButton key={item.id} value={item.id} sx={pillSx}>
                      {item.number ? (
                        <Box component="span" sx={{ mr: 0.75, opacity: 0.72 }}>
                          {item.number}
                        </Box>
                      ) : null}
                      {item.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <AppTextField
                  value={filters.query}
                  onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                  placeholder="Search by version name"
                  size="small"
                  startIcon={<SearchIcon />}
                  aria-label="Search by version name"
                  sx={{ flex: '1 1 220px', minWidth: 200, maxWidth: 420 }}
                  slotProps={{
                    input: {
                      endAdornment: filters.query ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Clear search"
                            onClick={() => setFilters((current) => ({ ...current, query: '' }))}
                          >
                            <CloseOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                />
                {canEdit ? (
                  <AppButton
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => navigate(`${tableBrowsePath('versions')}?new=1`)}
                    sx={{ fontWeight: 700, ml: { md: 'auto' } }}
                  >
                    New version
                  </AppButton>
                ) : null}
              </Box>

              {!versions ? (
                null
              ) : (
                <>
                  <ProductFilters
                    versions={versions}
                    filters={filters}
                    moreOpen={moreOpen}
                    onMoreOpenChange={setMoreOpen}
                    onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
                    onClear={() => setFilters(emptyProductFilters)}
                  />
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 420px) minmax(0, 1fr)' },
                      gap: 2,
                      alignItems: 'stretch',
                      mb: 4,
                    }}
                  >
                    <VersionList
                      title={SCOPE_TITLES[scope]}
                      total={versions.length}
                      versions={filtered}
                      selectedId={selected?.ID ?? null}
                      onSelect={setSelectedId}
                    />
                    {selected ? (
                      <VersionDetail key={selected.ID} version={selected} canEdit={canEdit} onOpen={navigate} />
                    ) : (
                      <Box
                        sx={{
                          borderRadius: 3,
                          bgcolor: 'rgba(237, 237, 237, 0.72)',
                          px: 4,
                          py: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography color="text.secondary">No versions match this view.</Typography>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

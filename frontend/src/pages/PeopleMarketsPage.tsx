import { useEffect, useMemo, useState } from 'react'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import HouseOutlinedIcon from '@mui/icons-material/HouseOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { getPeopleMarkets } from '@/api'
import type { PeopleMarketsPayload } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { MarketDetailPanel, PersonDetailPanel } from '@/components/peopleMarkets/DetailPanels'
import { DirectoryList, DirectoryListItem } from '@/components/peopleMarkets/DirectoryList'
import {
  filterMarketRows,
  filterPersonRows,
  marketMatches,
  segmentMatches,
  sortMarketRows,
  sortPersonRows,
  sortUnassignedMarkets,
} from '@/components/peopleMarkets'
import type { SegmentView, SortDirection } from '@/components/peopleMarkets'
import { marketCountLabel, marketTitle, peopleCountLabel, personLabel } from '@/components/peopleMarkets/format'
import { UserAvatar } from '@/components/user'
import { AppTextField } from '@/components/ui'
import { APP_PATHS, marketReportPath, useAppPath } from '@/routing'

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

type BrowseMode = 'market' | 'person'

export default function PeopleMarketsPage() {
  const { navigate } = useAppPath()
  const { user, setDecolorizeAvatars } = useAuth()
  const [payload, setPayload] = useState<PeopleMarketsPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [browse, setBrowse] = useState<BrowseMode>('market')
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState<SegmentView>('both')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [showDeputies, setShowDeputies] = useState(false)
  const [selectedMarketId, setSelectedMarketId] = useState<number | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

  const decolorize = Boolean(user?.decolorize_avatars)

  useEffect(() => {
    document.title = 'People & Markets Panorama | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void getPeopleMarkets()
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload(null)
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const markets = useMemo(() => {
    if (!payload) {
      return []
    }
    return sortMarketRows(filterMarketRows(payload.markets_to_people, query, segment), 'market', sortDirection)
  }, [payload, query, segment, sortDirection])

  const people = useMemo(() => {
    if (!payload) {
      return []
    }
    return sortPersonRows(filterPersonRows(payload.people_to_markets, query, segment), 'stakeholder', sortDirection)
  }, [payload, query, segment, sortDirection])

  const unassigned = useMemo(() => {
    if (!payload) {
      return []
    }
    return sortUnassignedMarkets(
      payload.unassigned_markets.filter((market) => segmentMatches(market.segment, segment) && marketMatches(market, query)),
      'market',
      sortDirection,
    )
  }, [payload, query, segment, sortDirection])

  const selectedMarket = useMemo(() => {
    const assigned = markets.find((row) => row.id === selectedMarketId)
    if (assigned) {
      return assigned
    }

    const lone = unassigned.find((market) => market.id === selectedMarketId)
    if (lone) {
      return { ...lone, people: [], deputies: [] }
    }

    return markets[0] ?? (unassigned[0] ? { ...unassigned[0], people: [], deputies: [] } : null)
  }, [markets, unassigned, selectedMarketId])

  const selectedPerson = people.find((row) => row.person.ID === selectedPersonId) ?? people[0] ?? null

  useEffect(() => {
    if (browse === 'market') {
      const exists =
        markets.some((row) => row.id === selectedMarketId) || unassigned.some((market) => market.id === selectedMarketId)
      if (!exists) {
        setSelectedMarketId(markets[0]?.id ?? unassigned[0]?.id ?? null)
      }
    }
    if (browse === 'person' && selectedPerson && selectedPerson.person.ID !== selectedPersonId) {
      setSelectedPersonId(selectedPerson.person.ID)
    }
  }, [browse, markets, unassigned, selectedMarketId, selectedPerson, selectedPersonId])

  const myMarketCount = payload?.people_to_markets.find((row) => row.person.ID === user?.ID)?.markets.length ?? 0

  function openMarket(marketId: number) {
    navigate(marketReportPath(marketId))
  }

  function browsePerson(personId: number) {
    setBrowse('person')
    setSelectedPersonId(personId)
  }

  function browseMarket(marketId: number) {
    setBrowse('market')
    setSelectedMarketId(marketId)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1840, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">People & Markets</Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Typography
              component="h1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15 }}
            >
              <GroupsOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
              People & Markets
            </Typography>
            {myMarketCount > 0 ? (
              <Chip size="small" color="success" variant="outlined" label={`Your markets: ${myMarketCount}`} />
            ) : null}
          </Box>

          {failed ? (
            <Typography color="text.secondary">This panorama could not be loaded.</Typography>
          ) : !payload ? (
            null
          ) : (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ToggleButtonGroup
                  exclusive
                  value={browse}
                  onChange={(_event, value: BrowseMode | null) => {
                    if (value) {
                      setBrowse(value)
                    }
                  }}
                  aria-label="Browse mode"
                  sx={pillGroupSx}
                >
                  <ToggleButton value="market" sx={pillSx}>
                    <PublicOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                    Browse by market
                  </ToggleButton>
                  <ToggleButton value="person" sx={pillSx}>
                    <PersonOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                    Browse by person
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AppTextField
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search markets or people"
                  size="small"
                  startIcon={<SearchIcon />}
                  sx={{ flex: '1 1 280px', minWidth: 220 }}
                />
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={segment}
                  onChange={(_event, value: SegmentView | null) => {
                    if (value) {
                      setSegment(value)
                    }
                  }}
                  aria-label="Market segment"
                  sx={pillGroupSx}
                >
                  <ToggleButton value="land-based" sx={pillSx}>
                    <HouseOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Land-based
                  </ToggleButton>
                  <ToggleButton value="online" sx={pillSx}>
                    <PhoneIphoneOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Online
                  </ToggleButton>
                  <ToggleButton value="both" sx={pillSx}>
                    <LayersOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    Both
                  </ToggleButton>
                </ToggleButtonGroup>
                {payload.can_show_deputies ? (
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={
                      <Switch size="small" checked={showDeputies} onChange={(event) => setShowDeputies(event.target.checked)} color="error" />
                    }
                    label={<Box component="span" sx={{ fontSize: 13, color: 'error.main' }}>Deputies</Box>}
                  />
                ) : null}
                <FormControlLabel
                  sx={{ mr: 0 }}
                  control={
                    <Switch size="small" checked={decolorize} onChange={(event) => void setDecolorizeAvatars(event.target.checked)} />
                  }
                  label={<Box component="span" sx={{ fontSize: 13 }}>Softer avatars</Box>}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'minmax(280px, 360px) minmax(0, 1fr)',
                    lg: 'minmax(320px, 400px) minmax(0, 1fr) minmax(320px, 400px)',
                  },
                  gap: 2.5,
                  alignItems: 'stretch',
                  mb: 4,
                }}
              >
                {browse === 'market' ? (
                  <>
                    <DirectoryList
                      title="Markets"
                      totalLabel={`${markets.length} total · ${sortDirection === 'asc' ? 'alphabetical' : 'Z–A'}`}
                      shown={markets.length}
                      sortDirection={sortDirection}
                      onToggleSort={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
                    >
                      {markets.length === 0 ? (
                        <Typography sx={{ px: 2, py: 2, color: 'text.secondary' }}>No assigned markets match this view.</Typography>
                      ) : (
                        markets.map((row) => (
                          <DirectoryListItem
                            key={row.id}
                            selected={selectedMarket?.id === row.id}
                            onClick={() => setSelectedMarketId(row.id)}
                            leading={row.flag}
                            title={marketTitle(row)}
                            meta={peopleCountLabel(row.people.length + (showDeputies ? row.deputies.length : 0))}
                          />
                        ))
                      )}
                    </DirectoryList>
                    {selectedMarket ? (
                      <MarketDetailPanel
                        market={selectedMarket}
                        showDeputies={showDeputies}
                        decolorize={decolorize}
                        onOpenMarket={openMarket}
                        onSelectPerson={browsePerson}
                      />
                    ) : (
                      <EmptyDetail text="No markets match this view." />
                    )}
                  </>
                ) : (
                  <>
                    <DirectoryList
                      title="People"
                      totalLabel={`${people.length} total · ${sortDirection === 'asc' ? 'alphabetical' : 'Z–A'}`}
                      shown={people.length}
                      sortDirection={sortDirection}
                      onToggleSort={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}
                    >
                      {people.map((row) => (
                        <DirectoryListItem
                          key={row.person.ID}
                          selected={selectedPerson?.person.ID === row.person.ID}
                          onClick={() => setSelectedPersonId(row.person.ID)}
                          leading={<UserAvatar user={row.person} size="sm" decolorize={decolorize} />}
                          title={personLabel(row.person)}
                          meta={marketCountLabel(row.markets.length)}
                        />
                      ))}
                    </DirectoryList>
                    {selectedPerson ? (
                      <PersonDetailPanel
                        person={selectedPerson.person}
                        markets={selectedPerson.markets}
                        decolorize={decolorize}
                        onSelectMarket={browseMarket}
                      />
                    ) : (
                      <EmptyDetail text="No people match this view." />
                    )}
                  </>
                )}
                <DirectoryList
                  title="Unassigned"
                  totalLabel={`${unassigned.length} markets with no people`}
                  shown={unassigned.length}
                  sx={{
                    gridColumn: { xs: 'auto', md: '1 / -1', lg: 'auto' },
                    height: { xs: 'min(56vh, 520px)', md: 'min(50vh, 520px)', lg: 'min(72vh, 820px)' },
                  }}
                >
                  {unassigned.length === 0 ? (
                    <Typography sx={{ px: 2, py: 2, color: 'text.secondary' }}>
                      There are no unassigned markets in this view.
                    </Typography>
                  ) : (
                    unassigned.map((market) => (
                      <DirectoryListItem
                        key={`u-${market.id}`}
                        selected={browse === 'market' && selectedMarket?.id === market.id}
                        onClick={() => {
                          setBrowse('market')
                          setSelectedMarketId(market.id)
                        }}
                        leading={market.flag}
                        title={marketTitle(market)}
                        meta={market.segment === 'online' ? 'Online · no people' : 'Land-based · no people'}
                      />
                    ))
                  )}
                </DirectoryList>
              </Box>
            </>
          )}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

function EmptyDetail({ text }: { text: string }) {
  return (
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
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  )
}

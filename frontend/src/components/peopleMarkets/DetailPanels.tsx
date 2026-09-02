import type { ReactNode } from 'react'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PeopleMarketsMarket, PeopleMarketsMarketRow, PeopleMarketsPerson } from '@/api'
import { MarketActionButton } from '@/components/marketReport'
import { UserAvatar } from '@/components/user'
import { marketReportPath, useAppPath } from '@/routing'
import { formatUpdated, marketTitle, personLabel, segmentLabel } from './format'

export function MarketDetailPanel({
  market,
  showDeputies,
  decolorize,
  onOpenMarket,
  onSelectPerson,
}: {
  market: PeopleMarketsMarketRow
  showDeputies: boolean
  decolorize: boolean
  onOpenMarket: (id: number) => void
  onSelectPerson: (id: number) => void
}) {
  const title = marketTitle(market)
  const native = market.name && market.name !== title ? market.name : null
  const contacts = showDeputies ? [...market.people, ...market.deputies] : market.people
  const updated = formatUpdated(market.market_updated_at)
  const deputyIds = new Set(market.deputies.map((person) => person.ID))

  return (
    <DetailShell>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 28, md: 34 }, color: 'secondary.main', lineHeight: 1.15 }}>
            <Box component="span" sx={{ mr: 1 }}>
              {market.flag}
            </Box>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.75, color: 'info.main', fontSize: 14, fontWeight: 600 }}>
            <span>{segmentLabel(market.segment)}</span>
            {native ? <span>{native}</span> : null}
          </Box>
        </Box>
        <MarketActionButton
          startIcon={<TrendingUpOutlinedIcon />}
          onClick={() => onOpenMarket(market.id)}
          sx={{ flexShrink: 0, alignSelf: 'center' }}
        >
          Open market report
        </MarketActionButton>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1.5 }}>Responsible contacts</Typography>
      {contacts.length === 0 ? (
        <Typography color="text.secondary">No people are assigned to this market.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {contacts.map((person) => (
            <ContactCard
              key={`${deputyIds.has(person.ID) ? 'd' : 'p'}-${person.ID}`}
              person={person}
              roleLine={`${person.role || 'Team'}${deputyIds.has(person.ID) ? ' · deputy' : ' · primary contact'}`}
              updated={updated}
              decolorize={decolorize}
              onClick={() => onSelectPerson(person.ID)}
            />
          ))}
        </Box>
      )}
    </DetailShell>
  )
}

export function PersonDetailPanel({
  person,
  markets,
  decolorize,
  onSelectMarket,
}: {
  person: PeopleMarketsPerson
  markets: PeopleMarketsMarket[]
  decolorize: boolean
  onSelectMarket: (id: number) => void
}) {
  const { navigate } = useAppPath()

  return (
    <DetailShell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <UserAvatar user={person} size="lg" decolorize={decolorize} />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 }, color: 'secondary.main', lineHeight: 1.15 }}>
            {personLabel(person)}
          </Typography>
          <Typography sx={{ color: 'info.main', fontWeight: 600, mt: 0.5 }}>{person.role || person.jobtitle}</Typography>
        </Box>
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: 18, mb: 1.5 }}>Assigned markets</Typography>
      {markets.length === 0 ? (
        <Typography color="text.secondary">This person has no assigned markets in this view.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {markets.map((market) => (
            <Box
              key={market.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                width: '100%',
                textAlign: 'left',
                borderRadius: 3,
                px: 2,
                py: 1.5,
                bgcolor: 'common.white',
                boxShadow: '0 8px 20px rgba(2, 32, 82, 0.06)',
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => onSelectMarket(market.id)}
                sx={{
                  minWidth: 0,
                  flex: 1,
                  textAlign: 'left',
                  border: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  font: 'inherit',
                  p: 0,
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: 16 }}>
                  <Box component="span" sx={{ mr: 0.75 }}>
                    {market.flag}
                  </Box>
                  {marketTitle(market)}
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.25 }}>
                  {segmentLabel(market.segment)}
                  {market.name && market.name !== marketTitle(market) ? ` · ${market.name}` : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 0.75 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {formatUpdated(market.market_updated_at) ?? ''}
                </Typography>
                <MarketActionButton
                  appearance="outline"
                  startIcon={<TrendingUpOutlinedIcon />}
                  onClick={() => navigate(marketReportPath(market.id))}
                  sx={{ py: 0.35, px: 1.25, fontSize: 12 }}
                >
                  Report
                </MarketActionButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </DetailShell>
  )
}

function DetailShell({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: 320,
        height: { xs: 'auto', md: 'min(68vh, 760px)' },
        borderRadius: 3,
        bgcolor: 'rgba(237, 237, 237, 0.72)',
        px: { xs: 2.5, md: 4 },
        py: { xs: 2.5, md: 3.5 },
        overflow: 'auto',
      }}
    >
      {children}
    </Box>
  )
}

function ContactCard({
  person,
  roleLine,
  updated,
  decolorize,
  onClick,
}: {
  person: PeopleMarketsPerson
  roleLine: string
  updated: string | null
  decolorize: boolean
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        width: '100%',
        textAlign: 'left',
        border: 0,
        borderRadius: 3,
        px: 2,
        py: 1.5,
        bgcolor: 'common.white',
        boxShadow: '0 8px 20px rgba(2, 32, 82, 0.06)',
        cursor: 'pointer',
        font: 'inherit',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
      }}
    >
      <UserAvatar user={person} size="md" decolorize={decolorize} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{personLabel(person)}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{roleLine}</Typography>
      </Box>
      {updated ? (
        <Typography sx={{ color: 'text.secondary', fontSize: 13, flexShrink: 0 }}>{updated}</Typography>
      ) : null}
    </Box>
  )
}

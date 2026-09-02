import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PeopleMarketsPersonRow } from '@/api'
import { UserAvatar } from '@/components/user'
import { MarketLabel } from './MarketLabel'
import { PanoramaPane } from './PanoramaPane'

export function PeopleMarketColumn({
  rows,
  hint,
  toolbar,
  groupByRole,
  currentUserId,
  selectedPersonId,
  selectedMarketId,
  decolorize,
  onSelectPerson,
  onSelectMarket,
  onOpenMarket,
}: {
  rows: PeopleMarketsPersonRow[]
  hint: string
  toolbar?: ReactNode
  groupByRole: boolean
  currentUserId: number | null
  selectedPersonId: number | null
  selectedMarketId: number | null
  decolorize: boolean
  onSelectPerson: (personId: number) => void
  onSelectMarket: (marketId: number) => void
  onOpenMarket: (marketId: number) => void
}) {
  return (
    <PanoramaPane title="People → Markets" hint={hint} count={rows.length} toolbar={toolbar}>
      {rows.length === 0 ? (
        <Typography sx={{ px: 2, py: 2, color: 'text.secondary' }}>No people match this view.</Typography>
      ) : (
        rows.map((row, index) => {
          const previousRole = rows[index - 1]?.person.role_ID
          const roleChanged = groupByRole && row.person.role && (index === 0 || previousRole !== row.person.role_ID)
          const mine = row.person.ID === currentUserId
          const selected =
            selectedPersonId === row.person.ID || row.markets.some((market) => market.id === selectedMarketId)

          return (
            <Box key={row.person.ID}>
                {roleChanged ? (
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    px: 1.5,
                    py: 0.6,
                    color: 'text.secondary',
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(237, 237, 237, 0.94)',
                  }}
                >
                  {row.person.role}
                </Box>
              ) : null}
              <Box
                id={`person-${row.person.ID}`}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.25,
                  px: 1.5,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: mine ? 'rgba(162, 198, 23, 0.16)' : selected ? 'rgba(0, 159, 227, 0.1)' : 'transparent',
                  '&:hover': {
                    bgcolor: mine
                      ? 'rgba(162, 198, 23, 0.24)'
                      : selected
                        ? 'rgba(0, 159, 227, 0.16)'
                        : 'rgba(2, 32, 82, 0.03)',
                  },
                }}
              >
                <Box sx={{ pt: 0.25, width: 56, flexShrink: 0, textAlign: 'center' }}>
                  <UserAvatar
                    user={row.person}
                    size="md"
                    decolorize={decolorize}
                    selected={selectedPersonId === row.person.ID}
                    onClick={() => onSelectPerson(row.person.ID)}
                  />
                  <Box
                    sx={{
                      mt: 0.5,
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {row.person.lastname || row.person.initials}
                  </Box>
                  {!groupByRole && row.person.role ? (
                    <Box sx={{ mt: 0.15, fontSize: 10, color: 'text.secondary', lineHeight: 1.2 }}>
                      {row.person.role}
                    </Box>
                  ) : null}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  {row.markets.map((market) => (
                    <Box
                      key={market.id}
                      sx={{
                        py: 0.45,
                        borderRadius: 1,
                        px: 0.5,
                        cursor: 'pointer',
                        bgcolor: selectedMarketId === market.id ? 'rgba(0, 159, 227, 0.12)' : 'transparent',
                        '&:hover': { bgcolor: 'rgba(0, 159, 227, 0.08)' },
                      }}
                      onClick={() => onSelectMarket(market.id)}
                    >
                      <MarketLabel market={market} onOpen={() => onOpenMarket(market.id)} />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )
        })
      )}
    </PanoramaPane>
  )
}

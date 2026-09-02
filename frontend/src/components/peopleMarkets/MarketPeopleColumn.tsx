import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PeopleMarketsMarketRow } from '@/api'
import { UserAvatar } from '@/components/user'
import { MarketLabel } from './MarketLabel'
import { PanoramaPane } from './PanoramaPane'

export function MarketPeopleColumn({
  rows,
  hint,
  toolbar,
  currentUserId,
  selectedPersonId,
  selectedMarketId,
  decolorize,
  showDeputies,
  onSelectPerson,
  onSelectMarket,
  onOpenMarket,
}: {
  rows: PeopleMarketsMarketRow[]
  hint: string
  toolbar?: ReactNode
  currentUserId: number | null
  selectedPersonId: number | null
  selectedMarketId: number | null
  decolorize: boolean
  showDeputies: boolean
  onSelectPerson: (personId: number) => void
  onSelectMarket: (marketId: number) => void
  onOpenMarket: (marketId: number) => void
}) {
  return (
    <PanoramaPane title="Markets → People" hint={hint} count={rows.length} toolbar={toolbar}>
      {rows.length === 0 ? (
        <Typography sx={{ px: 2, py: 2, color: 'text.secondary' }}>No markets match this view.</Typography>
      ) : (
        rows.map((row) => {
          const mine = row.people.some((person) => person.ID === currentUserId)
          const selected =
            selectedMarketId === row.id || row.people.some((person) => person.ID === selectedPersonId)

          return (
            <Box
              key={row.id}
              id={`market-${row.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.85,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: mine ? 'rgba(162, 198, 23, 0.16)' : selected ? 'rgba(0, 159, 227, 0.1)' : 'transparent',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: mine
                    ? 'rgba(162, 198, 23, 0.24)'
                    : selected
                      ? 'rgba(0, 159, 227, 0.16)'
                      : 'rgba(2, 32, 82, 0.03)',
                },
              }}
              onClick={() => onSelectMarket(row.id)}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <MarketLabel market={row} onOpen={() => onOpenMarket(row.id)} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  flexShrink: 0,
                  pl: 0.5,
                }}
              >
                {showDeputies
                  ? row.deputies.map((person, index) => (
                      <Box
                        key={`d-${person.ID}`}
                        sx={{ ml: index === 0 ? 0 : -0.6, position: 'relative' }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <UserAvatar
                          user={person}
                          decolorize={decolorize}
                          deputy
                          selected={selectedPersonId === person.ID}
                          onClick={() => onSelectPerson(person.ID)}
                        />
                      </Box>
                    ))
                  : null}
                {row.people.map((person, index) => (
                  <Box
                    key={person.ID}
                    sx={{
                      ml: index === 0 && (!showDeputies || row.deputies.length === 0) ? 0 : -0.6,
                      position: 'relative',
                      zIndex: index + 1,
                    }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <UserAvatar
                      user={person}
                      decolorize={decolorize}
                      selected={selectedPersonId === person.ID}
                      onClick={() => onSelectPerson(person.ID)}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )
        })
      )}
    </PanoramaPane>
  )
}

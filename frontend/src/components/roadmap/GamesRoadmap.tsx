import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { RoadmapGame, RoadmapGameStatusKey } from '@/api'
import { GameRoadmapCard } from './GameRoadmapCard'
import { groupRoadmapGames } from './format'
import type { RoadmapFilterState } from './format'

export function GamesRoadmap({
  games,
  labels,
  filters,
  decolorize,
  onOpen,
}: {
  games: RoadmapGame[]
  labels: Partial<Record<RoadmapGameStatusKey, string>>
  filters: RoadmapFilterState
  decolorize: boolean
  onOpen: (game: RoadmapGame) => void
}) {
  if (games.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        No games match these filters in this period.
      </Typography>
    )
  }

  const groups = groupRoadmapGames(games, filters)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {groups.map((group) => (
        <Box key={group.key}>
          {filters.sortBy !== 'nam' ? (
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'merkur.pink', mb: 1 }}>{group.label}</Typography>
          ) : null}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {group.games.map((game) => (
              <GameRoadmapCard
                key={game.ID}
                game={game}
                labels={labels}
                activeStatus={filters.sortBy}
                expandAll={filters.expandAllDetails}
                decolorize={decolorize}
                onOpen={() => onOpen(game)}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

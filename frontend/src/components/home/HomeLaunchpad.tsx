import Box from '@mui/material/Box'
import { homeLaunchpadCards, homeLaunchpadGrid } from '@/config/homeLaunchpad'
import { LaunchpadCard } from './LaunchpadCard'

export function HomeLaunchpad() {
  return (
    <Box
      component="section"
      aria-label="Shortcuts"
      sx={{
        mt: 2,
        mb: 1,
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          ...homeLaunchpadGrid,
          alignItems: 'stretch',
        }}
      >
        {homeLaunchpadCards.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: item.hideBelowLg ? { xs: 'none', lg: 'block' } : 'block',
              minWidth: 0,
            }}
          >
            <LaunchpadCard item={item} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { LaunchpadCardItem } from '@/config/homeLaunchpad'
import { useAppPath } from '@/routing'

function Sparkle() {
  return (
    <>
      {[
        { top: '18%', left: '22%', delay: '0s' },
        { top: '28%', left: '72%', delay: '0.45s' },
        { top: '62%', left: '58%', delay: '0.9s' },
      ].map((point) => (
        <Box
          key={`${point.top}-${point.left}`}
          sx={{
            position: 'absolute',
            top: point.top,
            left: point.left,
            width: 0,
            height: 0,
            boxShadow: '0 0 7px 3px rgba(255,255,255,0.35)',
            animation: 'homeLaunchpadSparkle 1.5s infinite',
            animationDelay: point.delay,
            '@keyframes homeLaunchpadSparkle': {
              '0%, 100%': { opacity: 0, transform: 'scale(0)' },
              '50%': { opacity: 1, transform: 'scale(1)' },
            },
          }}
        />
      ))}
    </>
  )
}

export function LaunchpadCard({ item }: { item: LaunchpadCardItem }) {
  const Icon = item.icon
  const featured = item.variant === 'featured'
  const { navigate } = useAppPath()
  const clickable = Boolean(item.path)

  return (
    <Paper
      elevation={0}
      component={clickable ? 'button' : 'div'}
      type={clickable ? 'button' : undefined}
      onClick={clickable ? () => navigate(item.path as string) : undefined}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 3,
        p: 0,
        font: 'inherit',
        appearance: 'none',
        WebkitAppearance: 'none',
        cursor: clickable ? 'pointer' : 'default',
        bgcolor: featured ? 'merkur.pink' : 'grey.100',
        color: featured ? 'common.white' : 'text.secondary',
        transition: 'transform .2s, background-color .2s',
        '&:hover': {
          transform: 'scale(1.08) translateY(3px)',
          bgcolor: featured ? '#ea478e' : 'common.white',
        },
      }}
    >
      {item.sparkle ? <Sparkle /> : null}
      <Box
        sx={{
          height: 8,
          bgcolor: featured ? 'grey.100' : 'merkur.pink',
        }}
      />
      <Box sx={{ pt: 2, pb: 0.5, display: 'flex', justifyContent: 'center' }}>
        <Icon
          sx={{
            fontSize: { xs: 36, md: 44 },
            color: featured ? 'common.white' : 'merkur.pink',
          }}
        />
      </Box>
      <Typography
        component="p"
        sx={{
          px: 1,
          pb: 2,
          pt: 0.5,
          fontWeight: item.emphasize ? 800 : 600,
          fontSize: { xs: 13, md: 15 },
          lineHeight: 1.25,
        }}
      >
        {item.shortLabel ? (
          <>
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
              {item.label}
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', md: 'none' } }}>
              {item.shortLabel}
            </Box>
          </>
        ) : (
          item.label
        )}
      </Typography>
    </Paper>
  )
}

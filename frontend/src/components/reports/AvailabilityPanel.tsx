import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { AvailabilityMarket } from '@/api'
import { tableBrowsePath } from '@/config/tablePages'
import { useAppPath } from '@/routing'

export function AvailabilityPanel({
  available,
  intent,
  noIntent,
}: {
  available: AvailabilityMarket[]
  intent: AvailabilityMarket[]
  noIntent: AvailabilityMarket[]
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <MarketGroup title="Available in" color="#A2C617" items={available} />
      <MarketGroup title="Also intended for" color="#009FE3" items={intent} />
      <MarketGroup title="Not intended for" color="#EB0000" items={noIntent} />
    </Box>
  )
}

function MarketGroup({
  title,
  color,
  items,
}: {
  title: string
  color: string
  items: AvailabilityMarket[]
}) {
  const { navigate } = useAppPath()

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        p: 2.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18, color }}>{title}</Typography>
        <Chip size="small" label={`${items.length} ${items.length === 1 ? 'jurisdiction' : 'jurisdictions'}`} />
      </Box>
      {items.length === 0 ? (
        <Typography color="text.secondary">None listed.</Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1.25,
          }}
        >
          {items.map((item) => (
            <Box
              key={item.ID}
              component="button"
              type="button"
              onClick={() => navigate(`${tableBrowsePath('availabilities')}?id=${item.ID}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                textAlign: 'left',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                bgcolor: 'background.paper',
                p: 1.25,
                cursor: 'pointer',
                font: 'inherit',
                color: 'inherit',
                '&:hover': { borderColor: 'info.main', bgcolor: 'grey.50' },
              }}
            >
              <Typography sx={{ fontSize: 22, lineHeight: 1 }}>{item.flag || '🏳️'}</Typography>
              <Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {item.code}
                  {item.priority === '‼️ high' ? ' ‼️' : item.priority === '⬇️ low' ? ' ⬇️' : ''}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                  {item.name}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

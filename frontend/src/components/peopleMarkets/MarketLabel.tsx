import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import StarIcon from '@mui/icons-material/Star'
import Box from '@mui/material/Box'
import type { PeopleMarketsMarket } from '@/api'

export function MarketLabel({
  market,
  onOpen,
}: {
  market: PeopleMarketsMarket
  onOpen?: () => void
}) {
  const title = market.name_english || market.name || `Market ${market.id}`
  const subtitle = market.name && market.name !== title ? market.name : null

  return (
    <Box sx={{ minWidth: 0, pr: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
        <Box
          component={onOpen ? 'button' : 'span'}
          type={onOpen ? 'button' : undefined}
          onClick={(event) => {
            event.stopPropagation()
            onOpen?.()
          }}
          sx={{
            border: 0,
            p: 0,
            minWidth: 0,
            bgcolor: 'transparent',
            color: 'info.main',
            cursor: onOpen ? 'pointer' : 'default',
            font: 'inherit',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 0.6,
            '&:hover': onOpen ? { textDecoration: 'underline' } : undefined,
          }}
        >
          <Box component="span" sx={{ flexShrink: 0, lineHeight: 1 }}>
            {market.flag}
          </Box>
          <Box
            component="strong"
            sx={{
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Box>
        </Box>
        {market.cluster === 'focal' ? (
          <StarIcon sx={{ fontSize: 15, color: 'warning.main', flexShrink: 0 }} aria-label="Focal market" />
        ) : null}
      </Box>
      {subtitle || market.market_updated_at ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'text.secondary',
            fontSize: 12,
            mt: 0.15,
            minWidth: 0,
          }}
        >
          {subtitle ? (
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </Box>
          ) : null}
          {market.market_updated_at ? (
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.35,
                color: 'merkur.gray',
                flexShrink: 0,
                ml: 'auto',
              }}
            >
              <CalendarMonthOutlinedIcon sx={{ fontSize: 13 }} aria-hidden />
              {market.market_updated_at}
            </Box>
          ) : null}
        </Box>
      ) : null}
    </Box>
  )
}

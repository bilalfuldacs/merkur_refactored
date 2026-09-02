import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { RoadmapRow } from '@/api'
import { MilestonePill } from './MilestonePill'
import type { RoadmapMonth } from './format'
import { rowTitle } from './format'

export function RoadmapGrid({
  itemLabel,
  rows,
  months,
  showSubtitles,
  onOpenRow,
}: {
  itemLabel: string
  rows: RoadmapRow[]
  months: RoadmapMonth[]
  showSubtitles: boolean
  onOpenRow: (row: RoadmapRow) => void
}) {
  if (rows.length === 0 || months.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4 }}>
        No {itemLabel}s match these filters in this period.
      </Typography>
    )
  }

  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white' }}>
      <Box
        component="table"
        sx={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          minWidth: '100%',
          '& th, & td': {
            borderBottom: '1px solid',
            borderColor: 'divider',
            borderRight: '1px solid',
            borderRightColor: 'divider',
            verticalAlign: 'top',
          },
          '& th:last-of-type, & td:last-of-type': { borderRight: 0 },
          '& tbody tr:last-of-type td': { borderBottom: 0 },
        }}
      >
        <Box component="thead">
          <Box component="tr">
            <Box
              component="th"
              sx={{
                position: 'sticky',
                left: 0,
                zIndex: 2,
                minWidth: 220,
                maxWidth: 280,
                p: 1.5,
                textAlign: 'left',
                bgcolor: 'grey.50',
                fontWeight: 800,
                fontSize: 13,
                color: 'secondary.main',
              }}
            >
              {itemLabel === 'version' ? 'Version' : 'Game'}
            </Box>
            {months.map((month) => (
              <Box
                key={month.key}
                component="th"
                sx={{
                  minWidth: 160,
                  p: 1.5,
                  textAlign: 'left',
                  bgcolor: 'grey.50',
                  fontWeight: 800,
                  fontSize: 13,
                  color: 'secondary.main',
                  whiteSpace: 'nowrap',
                }}
              >
                {month.label}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((row) => (
            <Box component="tr" key={row.ID}>
              <Box
                component="td"
                sx={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 1,
                  minWidth: 220,
                  maxWidth: 280,
                  p: 1.5,
                  bgcolor: 'common.white',
                }}
              >
                <Box
                  component="button"
                  type="button"
                  onClick={() => onOpenRow(row)}
                  sx={{
                    border: 0,
                    p: 0,
                    bgcolor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    font: 'inherit',
                    '&:hover .title': { textDecoration: 'underline' },
                  }}
                >
                  <Typography className="title" sx={{ fontWeight: 800, fontSize: 14, color: 'secondary.main', lineHeight: 1.3 }}>
                    {rowTitle(row)}
                  </Typography>
                  {row.platform?.name ? (
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        mt: 0.5,
                        mr: 0.5,
                        px: 0.75,
                        py: 0.1,
                        borderRadius: 999,
                        bgcolor: row.platform.color || 'secondary.main',
                        color: 'common.white',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {row.platform.name}
                    </Box>
                  ) : null}
                  {showSubtitles && row.subtitle ? (
                    <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>{row.subtitle}</Typography>
                  ) : null}
                </Box>
              </Box>
              {months.map((month) => {
                const items = row.milestones.filter((milestone) => milestone.month_key === month.key)
                return (
                  <Box
                    key={month.key}
                    component="td"
                    sx={{
                      minWidth: 160,
                      p: 1,
                      bgcolor: items.length === 0 ? 'grey.50' : 'common.white',
                      backgroundImage:
                        items.length === 0
                          ? 'repeating-linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 8px, transparent 8px, transparent 16px)'
                          : 'none',
                    }}
                  >
                    {items.map((milestone) => (
                      <MilestonePill key={milestone.ID} milestone={milestone} />
                    ))}
                  </Box>
                )
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

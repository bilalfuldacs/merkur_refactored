import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import HouseOutlinedIcon from '@mui/icons-material/HouseOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { SegmentView } from './filter'
import type { SortDirection, SortField } from './sort'

const toggleSx = {
  px: 0.9,
  py: 0.25,
  fontSize: 12,
  lineHeight: 1.2,
} as const

export function ListControls({
  segment,
  sortField,
  sortDirection,
  onSegment,
  onSortField,
  onSortDirection,
}: {
  segment: SegmentView
  sortField: SortField
  sortDirection: SortDirection
  onSegment: (value: SegmentView) => void
  onSortField: (value: SortField) => void
  onSortDirection: (value: SortDirection) => void
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
        <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', minWidth: 36 }}>
          Filter
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={segment}
          onChange={(_event, value: SegmentView | null) => {
            if (value) {
              onSegment(value)
            }
          }}
          aria-label="Filter land-based or online"
        >
          <ToggleButton value="land-based" sx={toggleSx}>
            <HouseOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Land-based
          </ToggleButton>
          <ToggleButton value="online" sx={toggleSx}>
            <PhoneIphoneOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Online
          </ToggleButton>
          <ToggleButton value="both" sx={toggleSx}>
            <LayersOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
            Both
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
        <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', minWidth: 36 }}>
          Sort
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={sortField}
          onChange={(_event, value: SortField | null) => {
            if (value) {
              onSortField(value)
            }
          }}
          aria-label="Sort by market or stakeholder"
        >
          <ToggleButton value="market" sx={toggleSx}>
            Market
          </ToggleButton>
          <ToggleButton value="stakeholder" sx={toggleSx}>
            Stakeholder
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={sortDirection}
          onChange={(_event, value: SortDirection | null) => {
            if (value) {
              onSortDirection(value)
            }
          }}
          aria-label="Sort direction"
        >
          <ToggleButton value="asc" sx={toggleSx} aria-label="Ascending">
            <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.35 }} />
            A–Z
          </ToggleButton>
          <ToggleButton value="desc" sx={toggleSx} aria-label="Descending">
            <ArrowDownwardIcon sx={{ fontSize: 14, mr: 0.35 }} />
            Z–A
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  )
}

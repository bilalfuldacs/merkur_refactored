import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import DonutLargeOutlinedIcon from '@mui/icons-material/DonutLargeOutlined'
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { InstallationReportRatings } from '@/api'
import { PERF_SLICES, type ChartShape } from './chartConfig'

function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)]
}

function slicePath(cx: number, cy: number, radius: number, inner: number, start: number, end: number): string {
  if (end - start >= 359.99) {
    if (inner <= 0) {
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`
    }
    return [
      `M ${cx} ${cy - radius}`,
      `A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius}`,
      `A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`,
      `M ${cx} ${cy - inner}`,
      `A ${inner} ${inner} 0 1 0 ${cx} ${cy + inner}`,
      `A ${inner} ${inner} 0 1 0 ${cx} ${cy - inner}`,
      'Z',
    ].join(' ')
  }

  const [x1, y1] = polar(cx, cy, radius, end)
  const [x2, y2] = polar(cx, cy, radius, start)
  const large = end - start > 180 ? 1 : 0
  if (inner <= 0) {
    return `M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`
  }

  const [ix1, iy1] = polar(cx, cy, inner, end)
  const [ix2, iy2] = polar(cx, cy, inner, start)
  return [
    `M ${x2} ${y2}`,
    `A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`,
    `L ${ix1} ${iy1}`,
    `A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2}`,
    'Z',
  ].join(' ')
}

export function PerformanceChart({
  ratings,
  shape,
  onShapeChange,
}: {
  ratings: InstallationReportRatings
  shape: ChartShape
  onShapeChange: (shape: ChartShape) => void
}) {
  const slices = PERF_SLICES.map((slice) => ({ ...slice, value: ratings[slice.key] }))
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const max = Math.max(1, ...slices.map((slice) => slice.value))

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Performance feedback received</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {total} {total === 1 ? 'rating' : 'ratings'}
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={shape}
          onChange={(_event, value: ChartShape | null) => {
            if (value) {
              onShapeChange(value)
            }
          }}
          aria-label="Chart shape"
        >
          <ToggleButton value="bars" aria-label="Bar chart">
            <BarChartOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
            Bars
          </ToggleButton>
          <ToggleButton value="pie" aria-label="Pie chart">
            <PieChartOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
            Pie
          </ToggleButton>
          <ToggleButton value="donut" aria-label="Donut chart">
            <DonutLargeOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
            Donut
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {total === 0 ? (
        <Typography color="text.secondary">No performance ratings for this version yet.</Typography>
      ) : shape === 'bars' ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {slices.map((slice) => (
            <Box key={slice.key} sx={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) 40px', gap: 1, alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 800 }}>{slice.label}</Typography>
              <Box sx={{ height: 12, bgcolor: 'grey.100', borderRadius: 999, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${(slice.value / max) * 100}%`,
                    height: '100%',
                    bgcolor: slice.color,
                    borderRadius: 999,
                  }}
                />
              </Box>
              <Typography sx={{ textAlign: 'right', color: 'text.secondary', fontWeight: 700 }}>{slice.value}</Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <RoundChart slices={slices} total={total} inner={shape === 'donut' ? 48 : 0} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 140 }}>
            {slices.filter((slice) => slice.value > 0).map((slice) => (
              <Box key={slice.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: slice.color, flexShrink: 0 }} />
                <Typography sx={{ fontWeight: 700 }}>{slice.label}</Typography>
                <Typography color="text.secondary" sx={{ ml: 'auto' }}>
                  {slice.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Typography color="text.secondary" sx={{ mt: 2, fontSize: 12.5 }}>
        {shape === 'bars'
          ? `Bars compare the ${total} submitted ratings. Unrated records are shown separately so they do not hide the rating distribution.`
          : `The ${shape} compares submitted ratings only. Unrated records are listed in the summary, not in the chart.`}
      </Typography>
    </Box>
  )
}

function RoundChart({
  slices,
  total,
  inner,
}: {
  slices: Array<{ key: string; label: string; color: string; value: number }>
  total: number
  inner: number
}) {
  let angle = 0
  const cx = 90
  const cy = 90
  const radius = 80

  return (
    <Box component="svg" viewBox="0 0 180 180" sx={{ width: 220, height: 220 }}>
      {slices
        .filter((slice) => slice.value > 0)
        .map((slice) => {
          const sweep = (slice.value / total) * 360
          const start = angle
          const end = angle + sweep
          angle = end
          return (
            <path
              key={slice.key}
              d={slicePath(cx, cy, radius, inner, start, end)}
              fill={slice.color}
              stroke="#fff"
              strokeWidth={1.5}
            >
              <title>{`${slice.label}: ${slice.value}`}</title>
            </path>
          )
        })}
      {inner > 0 ? (
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="18" fontWeight="800" fill="#022052">
          {total}
        </text>
      ) : null}
    </Box>
  )
}

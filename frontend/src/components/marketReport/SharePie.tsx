import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { MarketReportSlice } from '@/api'

function polar(cx: number, cy: number, radius: number, angle: number): [number, number] {
  const radians = ((angle - 90) * Math.PI) / 180
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)]
}

function slicePath(cx: number, cy: number, radius: number, start: number, end: number): string {
  if (end - start >= 359.99) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`
  }
  const [x1, y1] = polar(cx, cy, radius, end)
  const [x2, y2] = polar(cx, cy, radius, start)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x2} ${y2} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} Z`
}

export function SharePie({ slices, size = 160, legend = true }: { slices: MarketReportSlice[]; size?: number; legend?: boolean }) {
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.value), 0)
  const cx = size / 2
  const radius = size / 2 - 2
  let cursor = 0

  if (total <= 0) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box component="svg" viewBox={`0 0 ${size} ${size}`} sx={{ width: size, height: size }}>
        {slices.map((slice, index) => {
          const span = (Math.max(0, slice.value) / total) * 360
          const start = cursor
          const end = cursor + span
          cursor = end
          return <path key={`${slice.label}-${index}`} d={slicePath(cx, cx, radius, start, end)} fill={slice.color} />
        })}
      </Box>
      {legend ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1 }}>
          {slices.map((slice, index) => (
            <Typography key={`${slice.label}-${index}`} sx={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" sx={{ width: 10, height: 10, borderRadius: 0.3, bgcolor: slice.color, display: 'inline-block' }} />
              {slice.label} {slice.value}%
            </Typography>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

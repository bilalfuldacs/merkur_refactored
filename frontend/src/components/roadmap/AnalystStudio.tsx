import { useMemo, useState } from 'react'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { RoadmapGame } from '@/api'

type Perspective = 'pry-design-target-mkt' | 'studio'
type ChartType = 'bar' | 'column' | 'pie' | 'donut'

type Slice = { label: string; count: number; color: string }

const DEFAULT_COLORS = ['#009FE3', '#022052', '#E83181', '#A2C617', '#F07E26', '#EB0000', '#FFCC00', '#566A8C']

function slicesFromGames(games: RoadmapGame[], perspective: Perspective): Slice[] {
  const buckets = new Map<string, Slice>()
  games.forEach((game) => {
    const label =
      perspective === 'studio'
        ? game.studio || '∅ (NULL)'
        : game.target_market?.name || game.target_market?.iso3166 || '∅ (NULL)'
    const color =
      perspective === 'studio'
        ? DEFAULT_COLORS[buckets.size % DEFAULT_COLORS.length]
        : game.target_market?.color || DEFAULT_COLORS[buckets.size % DEFAULT_COLORS.length]
    const current = buckets.get(label) ?? { label, count: 0, color }
    current.count += 1
    buckets.set(label, current)
  })
  return [...buckets.values()].sort((a, b) => b.count - a.count)
}

export function AnalystStudio({ games }: { games: RoadmapGame[] }) {
  const [perspective, setPerspective] = useState<Perspective>('pry-design-target-mkt')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [percent, setPercent] = useState(false)
  const [heading, setHeading] = useState(true)
  const [legend, setLegend] = useState(true)
  const slices = useMemo(() => slicesFromGames(games, perspective), [games, perspective])
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  const title = perspective === 'studio' ? 'Studio' : 'Primary Design Target Market'

  return (
    <Accordion sx={{ mb: 2, background: 'linear-gradient(90deg, rgba(232,49,129,0.08), rgba(0,159,227,0.08))' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BoltOutlinedIcon sx={{ color: 'merkur.pink' }} />
          Analyst Studio
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 2fr' }, gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>1 Perspective</Typography>
            <RadioGroup value={perspective} onChange={(event) => setPerspective(event.target.value as Perspective)}>
              <FormControlLabel value="pry-design-target-mkt" control={<Radio size="small" />} label="Pry Design Target Mkt" />
              <FormControlLabel value="studio" control={<Radio size="small" />} label="Studio" />
            </RadioGroup>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>2 Parameters</Typography>
            <RadioGroup value={chartType} onChange={(event) => setChartType(event.target.value as ChartType)}>
              <FormControlLabel value="bar" control={<Radio size="small" />} label="Bar" />
              <FormControlLabel value="column" control={<Radio size="small" />} label="Column" />
              <FormControlLabel value="pie" control={<Radio size="small" />} label="Pie" />
              <FormControlLabel value="donut" control={<Radio size="small" />} label="Donut" />
            </RadioGroup>
            <FormControlLabel control={<Switch size="small" checked={percent} onChange={(event) => setPercent(event.target.checked)} />} label="Calculate percentage" />
            <FormControlLabel control={<Switch size="small" checked={heading} onChange={(event) => setHeading(event.target.checked)} />} label="Heading" />
            <FormControlLabel control={<Switch size="small" checked={legend} onChange={(event) => setLegend(event.target.checked)} />} label="Legend" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, mb: 1 }}>3 Output</Typography>
            {heading ? (
              <Typography sx={{ fontWeight: 800, mb: 1.5 }}>{title}</Typography>
            ) : null}
            {slices.length === 0 ? (
              <Typography color="text.secondary">No games in the current period.</Typography>
            ) : chartType === 'bar' || chartType === 'column' ? (
              <BarChart slices={slices} total={total} percent={percent} columns={chartType === 'column'} />
            ) : (
              <PieChart slices={slices} total={total} percent={percent} donut={chartType === 'donut'} />
            )}
            {legend ? (
              <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {slices.map((slice) => (
                  <Typography key={slice.label} sx={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box component="span" sx={{ width: 10, height: 10, bgcolor: slice.color, display: 'inline-block', borderRadius: 0.5 }} />
                    {slice.label} ({percent && total ? `${Math.round((slice.count / total) * 100)}%` : slice.count})
                  </Typography>
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

function BarChart({
  slices,
  total,
  percent,
  columns,
}: {
  slices: Slice[]
  total: number
  percent: boolean
  columns: boolean
}) {
  const max = Math.max(...slices.map((slice) => slice.count), 1)
  if (columns) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 180 }}>
        {slices.map((slice) => {
          const value = percent && total ? Math.round((slice.count / total) * 100) : slice.count
          return (
            <Box key={slice.label} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{value}{percent ? '%' : ''}</Typography>
              <Box sx={{ height: `${Math.max(8, (slice.count / max) * 140)}px`, bgcolor: slice.color, borderRadius: 1 }} />
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {slices.map((slice) => {
        const value = percent && total ? Math.round((slice.count / total) * 100) : slice.count
        return (
          <Box key={slice.label} sx={{ display: 'grid', gridTemplateColumns: 'minmax(80px, 140px) 1fr auto', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{slice.label}</Typography>
            <Box sx={{ height: 18, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ width: `${(slice.count / max) * 100}%`, height: '100%', bgcolor: slice.color }} />
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>{value}{percent ? '%' : ''}</Typography>
          </Box>
        )
      })}
    </Box>
  )
}

function PieChart({
  slices,
  total,
  percent,
  donut,
}: {
  slices: Slice[]
  total: number
  percent: boolean
  donut: boolean
}) {
  let offset = 0
  const segments = slices.map((slice) => {
    const sweep = total ? (slice.count / total) * 360 : 0
    const start = offset
    offset += sweep
    return { ...slice, start, sweep }
  })

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 120 120" width="180" height="180">
        {segments.map((segment) => (
          <path
            key={segment.label}
            d={arcPath(60, 60, donut ? 28 : 0, 52, segment.start, segment.sweep)}
            fill={segment.color}
          >
            <title>
              {segment.label}: {percent && total ? `${Math.round((segment.count / total) * 100)}%` : segment.count}
            </title>
          </path>
        ))}
      </svg>
    </Box>
  )
}

function arcPath(cx: number, cy: number, inner: number, outer: number, start: number, sweep: number): string {
  if (sweep <= 0) {
    return ''
  }
  const startAngle = ((start - 90) * Math.PI) / 180
  const endAngle = ((start + sweep - 90) * Math.PI) / 180
  const large = sweep > 180 ? 1 : 0
  const x1 = cx + outer * Math.cos(startAngle)
  const y1 = cy + outer * Math.sin(startAngle)
  const x2 = cx + outer * Math.cos(endAngle)
  const y2 = cy + outer * Math.sin(endAngle)
  if (inner <= 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} Z`
  }
  const ix1 = cx + inner * Math.cos(endAngle)
  const iy1 = cy + inner * Math.sin(endAngle)
  const ix2 = cx + inner * Math.cos(startAngle)
  const iy2 = cy + inner * Math.sin(startAngle)
  return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z`
}

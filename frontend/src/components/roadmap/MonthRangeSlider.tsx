import { useRef } from 'react'
import AllInclusiveOutlinedIcon from '@mui/icons-material/AllInclusiveOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Slider from '@mui/material/Slider'
import Switch from '@mui/material/Switch'
import ToggleButton from '@mui/material/ToggleButton'
import Typography from '@mui/material/Typography'
import type { RoadmapMonth } from './format'

const yearPillSx = {
  px: 1.1,
  py: 0.25,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  fontSize: 13,
  bgcolor: 'common.white',
  color: 'secondary.main',
  border: '1px solid',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

export function MonthRangeSlider({
  span,
  fromKey,
  toKey,
  onChange,
}: {
  span: RoadmapMonth[]
  fromKey: string
  toKey: string | null
  onChange: (next: { fromKey: string; toKey: string | null }) => void
}) {
  const lastClosedEnd = useRef<string | null>(toKey)
  if (span.length === 0) {
    return null
  }

  const maxIndex = span.length - 1
  const startIndex = Math.max(
    0,
    span.findIndex((month) => month.key === fromKey),
  )
  const openEnd = toKey == null
  const endIndex = openEnd
    ? maxIndex
    : Math.max(
        startIndex,
        span.findIndex((month) => month.key === toKey),
      )
  const years = [...new Set(span.map((month) => month.year))]
  const marks = years.map((year) => ({
    value: span.findIndex((month) => month.year === year && month.month === 1),
    label: String(year),
  }))

  function emit(nextFrom: string, nextTo: string | null) {
    if (nextTo != null) {
      lastClosedEnd.current = nextTo
    }
    onChange({ fromKey: nextFrom, toKey: nextTo })
  }

  function selectYear(year: number) {
    const first = span.find((month) => month.year === year)
    const last = [...span].reverse().find((month) => month.year === year)
    if (!first || !last) {
      return
    }
    emit(first.key, last.key)
  }

  function toggleOpenEnd(checked: boolean) {
    if (checked) {
      if (toKey != null) {
        lastClosedEnd.current = toKey
      }
      emit(fromKey, null)
      return
    }
    const restore =
      lastClosedEnd.current && lastClosedEnd.current >= fromKey ? lastClosedEnd.current : span[maxIndex].key
    emit(fromKey, restore)
  }

  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.75 }}>Time range</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
        {years.map((year) => {
          const first = span.find((month) => month.year === year)
          const last = [...span].reverse().find((month) => month.year === year)
          const selected = !openEnd && first?.key === fromKey && last?.key === toKey
          return (
            <ToggleButton
              key={year}
              value={year}
              selected={selected}
              onClick={() => selectYear(year)}
              sx={yearPillSx}
            >
              {year}
            </ToggleButton>
          )
        })}
      </Box>

      <Box sx={{ px: { xs: 1, sm: 1.5 } }}>
        <Slider
          value={[startIndex < 0 ? 0 : startIndex, endIndex < 0 ? maxIndex : endIndex]}
          min={0}
          max={maxIndex}
          disableSwap
          marks={marks}
          valueLabelDisplay="auto"
          valueLabelFormat={(index) => span[index]?.label ?? ''}
          getAriaLabel={(index) => (index === 0 ? 'Start month' : 'End month')}
          onChange={(_event, value) => {
            const [nextStart, nextEnd] = value as number[]
            const nextFrom = span[nextStart].key
            if (openEnd && nextEnd < maxIndex) {
              emit(nextFrom, span[nextEnd].key)
              return
            }
            emit(nextFrom, openEnd ? null : span[nextEnd].key)
          }}
          sx={{
            color: 'info.main',
            '& .MuiSlider-thumb[data-index="0"]': { bgcolor: 'info.main' },
            '& .MuiSlider-thumb[data-index="1"]': { bgcolor: 'success.main' },
            '& .MuiSlider-track': {
              background: 'linear-gradient(90deg, #009FE3, #4caf50)',
              border: 0,
            },
            '& .MuiSlider-markLabel': { fontSize: 11, fontWeight: 700, color: 'text.secondary' },
          }}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1,
          mt: 0.5,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Start</Typography>
          <Typography sx={{ color: 'info.main', fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>
            {span[startIndex < 0 ? 0 : startIndex]?.label}
          </Typography>
        </Box>
        <ArrowForwardOutlinedIcon sx={{ color: 'text.disabled', mb: 0.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, ml: 'auto' }}>
          <Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>End</Typography>
            {openEnd ? (
              <Typography
                sx={{
                  color: 'success.main',
                  fontWeight: 800,
                  fontSize: 20,
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <AllInclusiveOutlinedIcon fontSize="small" />
                open
              </Typography>
            ) : (
              <Typography sx={{ color: 'success.main', fontWeight: 800, fontSize: 20, lineHeight: 1.2 }}>
                {span[endIndex < 0 ? maxIndex : endIndex]?.label}
              </Typography>
            )}
          </Box>
          <FormControlLabel
            sx={{ mr: 0, ml: 0.5 }}
            control={
              <Switch
                size="small"
                checked={openEnd}
                onChange={(event) => toggleOpenEnd(event.target.checked)}
                inputProps={{ 'aria-label': 'Open end' }}
              />
            }
            label={<AllInclusiveOutlinedIcon fontSize="small" titleAccess="Open end" />}
          />
        </Box>
      </Box>
    </Box>
  )
}

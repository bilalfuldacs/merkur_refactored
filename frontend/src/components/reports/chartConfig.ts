export const PERF_SLICES = [
  { key: 'a_plus', label: 'A+', color: '#51630c' },
  { key: 'a', label: 'A', color: '#A2C617' },
  { key: 'b', label: 'B', color: '#FFCC00' },
  { key: 'c', label: 'C', color: '#F07E26' },
  { key: 'd', label: 'D', color: '#EB0000' },
  { key: 'd_minus', label: 'D-', color: '#9d0000' },
] as const

export type ChartShape = 'bars' | 'pie' | 'donut'

export type RatingKey = (typeof PERF_SLICES)[number]['key']

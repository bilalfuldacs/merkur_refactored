import { FIELDS, H, SEARCH_COLUMNS } from './schema'
import type { AnalystFilters, FeatureDef, FieldKey, Row } from './schema'

export const normalize = (s: unknown): string =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .trim()
export const clean = (s: unknown): string => normalize(s) || '(Not specified)'
export const NOT_SPECIFIED = '(Not specified)'

export const value = (r: Row, key: FieldKey): string => clean(r[typeof key === 'number' ? key : FIELDS[key]])
export const isYes = (v: unknown): boolean => /^(y|yes|true|1|sí|si)$/i.test(normalize(v))
export const isNo = (v: unknown): boolean => /^(n|no|false|0)$/i.test(normalize(v))

export const pct = (x: number, y: number): number => (y ? Math.round((x / y) * 100) : 0)
export const fmt = (n: number): string => n.toLocaleString('en-US')

export type FeatureState = 'Yes' | 'No' | 'Unknown'
export const featureShortName = (i: number): string => H[i].replace(/\s*\(Y\/N(?:\/Cancelled)?\)/, '')

export const featureState = (v: unknown): FeatureState => (isYes(v) ? 'Yes' : isNo(v) ? 'No' : 'Unknown')

export function filterRows(data: Row[], filters: AnalystFilters, term: string): Row[] {
  const active = Object.entries(filters).filter(([, v]) => v)
  return data.filter((r) => active.every(([k, v]) => value(r, k) === v) && (!term || SEARCH_COLUMNS.some((i) => normalize(r[i]).toLowerCase().includes(term))))
}

export function group(rows: Row[], key: FieldKey): Array<[string, number]> {
  const m = new Map<string, number>()
  rows.forEach((r) => {
    const k = value(r, key)
    m.set(k, (m.get(k) ?? 0) + 1)
  })
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

export type FeatureStats = {
  y: number
  n: number
  u: number
  known: number
  rate: number
}

export function featureStats(rows: Row[], i: number): FeatureStats {
  let y = 0
  let n = 0
  let u = 0
  rows.forEach((r) => {
    if (isYes(r[i])) y++
    else if (isNo(r[i])) n++
    else u++
  })
  return { y, n, u, known: y + n, rate: pct(y, y + n) }
}

export type BarItem = { name: string; count: number; other: boolean }

/** Top-N groups plus an aggregated “Other (N categories)” entry. */
export function barItems(rows: Row[], key: FieldKey, max: number): BarItem[] {
  const groups = group(rows, key)
  const top: BarItem[] = groups.slice(0, max).map(([name, count]) => ({ name, count, other: false }))
  const other = groups.slice(max).reduce((a, x) => a + x[1], 0)
  if (other)
    top.push({
      name: `Other (${groups.length - max} categories)`,
      count: other,
      other: true,
    })
  return top
}

export type PieItem = {
  name: string
  count: number
  other: boolean
  color: string
}

export function pieItems(rows: Row[], key: FieldKey, colors: readonly string[], max = 6): PieItem[] {
  const groups = group(rows, key).filter((x) => x[0] !== NOT_SPECIFIED)
  const missing = rows.length - groups.reduce((sum, x) => sum + x[1], 0)
  if (missing > 0) groups.push([NOT_SPECIFIED, missing])
  const top = groups.slice(0, max).map(([name, count]) => ({ name, count, other: false }))
  const other = groups.slice(max).reduce((sum, x) => sum + x[1], 0)
  if (other)
    top.push({
      name: `Other (${groups.length - max})`,
      count: other,
      other: true,
    })
  return top.map((x, i) => ({ ...x, color: colors[i % colors.length] }))
}

export type PieSlicePath = { item: PieItem; full: boolean; d: string }

export function pieSlices(items: PieItem[], totalRows: number): PieSlicePath[] {
  const total = totalRows || 1
  const rad = Math.PI / 180
  let angle = -90
  return items.map((item) => {
    const sweep = (item.count / total) * 360
    const start = angle
    angle += sweep
    if (item.count === total) return { item, full: true, d: '' }
    const sx = 84 + Math.cos(start * rad) * 70
    const sy = 84 + Math.sin(start * rad) * 70
    const ex = 84 + Math.cos(angle * rad) * 70
    const ey = 84 + Math.sin(angle * rad) * 70
    const large = sweep > 180 ? 1 : 0
    return {
      item,
      full: false,
      d: `M84 84 L${sx.toFixed(2)} ${sy.toFixed(2)} A70 70 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`,
    }
  })
}

export type CoverageCell = { a: string; b: string; n: number }

export function strategicCells(rows: Row[], a: FieldKey, b: FieldKey) {
  const av = group(rows, a)
    .filter((x) => x[0] !== NOT_SPECIFIED)
    .map((x) => x[0])
  const bv = group(rows, b)
    .filter((x) => x[0] !== NOT_SPECIFIED)
    .map((x) => x[0])
  const buckets = new Map<string, Row[]>()
  for (const r of rows) {
    const x = value(r, a)
    const y = value(r, b)
    if (x === NOT_SPECIFIED || y === NOT_SPECIFIED) continue
    const k = JSON.stringify([x, y])
    const list = buckets.get(k)
    if (list) list.push(r)
    else buckets.set(k, [r])
  }
  const cells: CoverageCell[] = av.flatMap((x) =>
    bv.map((y) => ({
      a: x,
      b: y,
      n: buckets.get(JSON.stringify([x, y]))?.length ?? 0,
    })),
  )
  return { av, bv, cells, buckets }
}

export type StrategyAnalysis = ReturnType<typeof strategicCells> & {
  gaps: CoverageCell[]
  low: CoverageCell[]
  adequate: CoverageCell[]
  indexed: Map<string, number>
  cutoff: number
}

export function analyzeStrategy(rows: Row[], a: FieldKey, b: FieldKey, minCoverage: number): StrategyAnalysis {
  const base = strategicCells(rows, a, b)
  const { cells } = base
  return {
    ...base,
    gaps: cells.filter((c) => c.n === 0),
    low: cells.filter((c) => c.n > 0 && c.n < minCoverage),
    adequate: cells.filter((c) => c.n >= minCoverage),
    indexed: new Map(cells.map((c) => [JSON.stringify([c.a, c.b]), c.n])),
    cutoff: Math.max(1, ...cells.map((c) => c.n)),
  }
}

export function featureByCombination(analysis: StrategyAnalysis, feature: FeatureDef, limit = 18) {
  return analysis.cells
    .filter((c) => c.n)
    .map((c) => ({
      ...c,
      feat: featureStats(analysis.buckets.get(JSON.stringify([c.a, c.b])) ?? [], feature[1]),
    }))
    .sort((x, y) => y.feat.rate - x.feat.rate || y.n - x.n)
    .slice(0, limit)
}

export function rankedCombinations(cells: CoverageCell[], onlyGaps: boolean, minCoverage: number, limit = 120): CoverageCell[] {
  return [...cells]
    .filter((c) => (onlyGaps ? c.n === 0 : c.n < minCoverage))
    .sort((x, y) => x.n - y.n || x.a.localeCompare(y.a) || x.b.localeCompare(y.b))
    .slice(0, limit)
}

export function findDuplicateNames(data: Row[]): Array<[string, number]> {
  const dup = new Map<string, number>()
  data.forEach((r) => {
    const k = normalize(r[0]).toLowerCase()
    if (k) dup.set(k, (dup.get(k) ?? 0) + 1)
  })
  return [...dup].filter(([, n]) => n > 1)
}

const csvLine = (r: unknown[]): string => r.map((x) => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(',')

export function buildFilteredCsv(rows: Row[]): string {
  return '\uFEFF' + [csvLine([...H]), ...rows.map(csvLine)].join('\r\n')
}

export function buildCoverageCsv(cells: CoverageCell[], axisA: string, axisB: string, minCoverage: number): string {
  const lines: unknown[][] = [
    ['Axis A', 'Axis B', 'Value A', 'Value B', 'Game Count', 'Coverage status'],
    ...cells.map((c) => [axisA, axisB, c.a, c.b, c.n, c.n === 0 ? 'Absent' : c.n < minCoverage ? 'Low' : 'At threshold']),
  ]
  return '\uFEFF' + lines.map(csvLine).join('\r\n')
}

export function downloadTextFile(content: string, filename: string, type = 'text/csv;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 3000)
}

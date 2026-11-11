import { apiFile, getTableRowAssets } from '@/api'
import type { TableAssetFile } from '@/api'
import { tableAssetFilePath } from '@/api/tableAssets'
import { parseRoadmapBuffer } from './parse'
import type { AnalystDataset } from './parse'

export class SampleDataUnavailableError extends Error {
  constructor() {
    super('No sample roadmap workbook was found. Please use “Open Excel/CSV” to load your roadmap file.')
    this.name = 'SampleDataUnavailableError'
  }
}

const SAMPLE_NAME = /roadmap[_\s-]*v?\d*|content roadmap/i
const SPREADSHEET = /\.(xlsx|csv)$/i

/** Picks the most plausible roadmap spreadsheet among the virtual roadmap assets. */
export function pickSampleAsset(files: TableAssetFile[]): TableAssetFile | null {
  const sheets = files.filter((f) => SPREADSHEET.test(f.name) || SPREADSHEET.test(f.filename))
  const strong = sheets.find((f) => /roadmap_v1|content roadmap/i.test(`${f.name} ${f.filename}`))
  if (strong) return strong
  const named = sheets.find((f) => SAMPLE_NAME.test(`${f.name} ${f.filename}`))
  if (named) return named
  return null
}

async function fromVirtualAssets(): Promise<AnalystDataset | null> {
  const payload = await getTableRowAssets('roadmap', null)
  const files = payload.classes.flatMap((c) => c.files ?? [])
  const file = pickSampleAsset(files)
  if (!file) return null
  const blob = await apiFile(tableAssetFilePath('roadmap', null, file, true))
  const name = file.name || file.filename
  return parseRoadmapBuffer(name, await blob.arrayBuffer())
}

async function fromStaticCandidate(fileName: string): Promise<AnalystDataset | null> {
  const url = `${import.meta.env.BASE_URL}${fileName}`
  const response = await fetch(url)
  const type = response.headers.get('Content-Type') ?? ''
  if (!response.ok || type.includes('text/html')) return null
  return parseRoadmapBuffer(fileName, await response.arrayBuffer())
}

async function fromStaticFile(): Promise<AnalystDataset | null> {
  for (const fileName of ['roadmap-sample.csv', 'roadmap-sample.xlsx']) {
    try {
      const dataset = await fromStaticCandidate(fileName)
      if (dataset) return dataset
    } catch {
      // try the next candidate
    }
  }
  return null
}

/**
 * Loads sample data: first from the authenticated virtual roadmap asset listing,
 * then from optional static `public/roadmap-sample.csv` / `.xlsx`.
 */
export async function loadSampleDataset(): Promise<AnalystDataset> {
  let assetError: unknown = null
  try {
    const fromAssets = await fromVirtualAssets()
    if (fromAssets) return fromAssets
  } catch (error) {
    assetError = error
  }
  try {
    const fromStatic = await fromStaticFile()
    if (fromStatic) return fromStatic
  } catch {
    // fall through to the clear message below
  }
  if (assetError instanceof Error) {
    // A matching asset exists but could not be downloaded/parsed: surface the real reason.
    throw assetError
  }
  throw new SampleDataUnavailableError()
}

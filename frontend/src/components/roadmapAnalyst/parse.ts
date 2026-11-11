import { normalize } from './analytics'
import { H } from './schema'
import type { Row } from './schema'

export type AnalystDataset = {
  data: Row[]
  fileName: string
  sourceColumns: number
  /** Rows dropped because they had no game name. */
  skipped: number
  /** Expected schema headers that were not found in the source file. */
  unknownHeaders: number
}

/** Minimal CSV parser (comma or semicolon separated, quoted cells, BOM-safe). */
export function csvParse(input: string): string[][] {
  const out: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const txt = input.replace(/^\uFEFF/, '')
  const firstLine = txt.split(/\r?\n/)[0] ?? ''
  const sep = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ';' : ','
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i]
    if (c === '"') {
      if (quoted && txt[i + 1] === '"') {
        cell += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (c === sep && !quoted) {
      row.push(cell)
      cell = ''
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && txt[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((s) => normalize(s))) out.push(row)
      row = []
      cell = ''
    } else {
      cell += c
    }
  }
  row.push(cell)
  if (row.some((s) => normalize(s))) out.push(row)
  return out
}

type ZipEntry = { method: number; size: number; offset: number }

/** Native browser ZIP reader. XLSX = ZIP + XML. No CDN / network / external scripts. */
export async function unzipXlsx(buf: ArrayBuffer) {
  const dv = new DataView(buf)
  const u = new Uint8Array(buf)
  const td = new TextDecoder('utf-8')
  let eocd = -1
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Not a valid XLSX / ZIP file')
  let p = dv.getUint32(eocd + 16, true)
  const n = dv.getUint16(eocd + 10, true)
  const entries: Record<string, ZipEntry> = {}
  for (let j = 0; j < n; j++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('Invalid ZIP directory')
    const method = dv.getUint16(p + 10, true)
    const size = dv.getUint32(p + 20, true)
    const namelen = dv.getUint16(p + 28, true)
    const extra = dv.getUint16(p + 30, true)
    const comment = dv.getUint16(p + 32, true)
    const offset = dv.getUint32(p + 42, true)
    const name = td.decode(u.slice(p + 46, p + 46 + namelen))
    entries[name] = { method, size, offset }
    p += 46 + namelen + extra + comment
  }

  async function read(name: string): Promise<string> {
    const x = entries[name]
    if (!x) throw new Error('XLSX entry missing: ' + name)
    const o = x.offset
    const at = o + 30 + dv.getUint16(o + 26, true) + dv.getUint16(o + 28, true)
    const bytes = u.slice(at, at + x.size)
    if (x.method === 0) return td.decode(bytes)
    if (x.method !== 8) throw new Error('Unsupported Excel compression method')
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser does not support offline XLSX decompression. Use current Chrome/Edge or import CSV.')
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return await new Response(stream).text()
  }

  return { entries, read }
}

function xml(text: string): Document {
  const x = new DOMParser().parseFromString(text, 'application/xml')
  if (x.querySelector('parsererror')) throw new Error('Malformed XML inside Excel file')
  return x
}

function localElements(el: Document | Element, name: string): Element[] {
  return [...el.getElementsByTagName('*')].filter((x) => x.localName === name)
}

const directChildren = (el: Element, name: string): Element[] => [...el.children].filter((x) => x.localName === name)

/** Reads the “Content Roadmap” sheet (or the first sheet) of an .xlsx workbook into a sparse string matrix. */
export async function readExcel(buffer: ArrayBuffer): Promise<string[][]> {
  const zip = await unzipXlsx(buffer)
  const book = xml(await zip.read('xl/workbook.xml'))
  const rels = xml(await zip.read('xl/_rels/workbook.xml.rels'))
  const sheets = localElements(book, 'sheet')
  const relmap: Record<string, string> = {}
  localElements(rels, 'Relationship').forEach((r) => {
    relmap[r.getAttribute('Id') ?? ''] = r.getAttribute('Target') ?? ''
  })
  const chosen = sheets.find((s) => /Content Roadmap/i.test(s.getAttribute('name') ?? '')) ?? sheets[0]
  if (!chosen) throw new Error('Workbook has no worksheets')
  const id = chosen.getAttribute('r:id') ?? chosen.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ?? ''
  const target = relmap[id]
  if (!target) throw new Error('Worksheet relationship not found')
  const path = target.startsWith('/') ? target.replace(/^\//, '') : target.startsWith('xl/') ? target : 'xl/' + target.replace(/^\.\.\//, '')
  let sst: string[] = []
  if (zip.entries['xl/sharedStrings.xml']) {
    const s = xml(await zip.read('xl/sharedStrings.xml'))
    sst = localElements(s, 'si').map((e) =>
      localElements(e, 't')
        .map((x) => x.textContent ?? '')
        .join(''),
    )
  }
  const sheet = xml(await zip.read(path))
  const rs = localElements(sheet, 'sheetData').flatMap((e) => directChildren(e, 'row'))
  const output: string[][] = []
  for (const r of rs) {
    const arr: string[] = []
    for (const cell of directChildren(r, 'c')) {
      const ref = cell.getAttribute('r') ?? ''
      const letters = ref.match(/^[A-Z]+/i)?.[0] ?? ''
      let ci = 0
      for (const l of letters.toUpperCase()) ci = ci * 26 + l.charCodeAt(0) - 64
      ci--
      if (ci < 0 || ci > 300) continue
      const t = cell.getAttribute('t')
      let v = directChildren(cell, 'v')[0]?.textContent ?? ''
      if (t === 's') v = sst[Number(v)] ?? ''
      if (t === 'inlineStr')
        v = localElements(cell, 't')
          .map((z) => z.textContent ?? '')
          .join('')
      if (t === 'b') v = v === '1' ? 'Yes' : 'No'
      if (v) arr[ci] = v
    }
    if (arr.some((x) => normalize(x))) output.push(arr)
  }
  if (!output.length) throw new Error('No header row found')
  return output
}

/** Maps a source matrix (header row + records) onto the fixed 52-column schema. */
export function buildDataset(rows: string[][], fileName: string): AnalystDataset {
  const idx = rows.findIndex((r) => normalize(r[0]).toLowerCase() === 'game name')
  if (idx < 0) throw new Error('Could not find the “Game Name” column in the file. Please use the roadmap template.')
  const headers = rows[idx]
  const records = rows.slice(idx + 1)
  const map: Record<string, number> = {}
  headers.forEach((h, i) => {
    const n = normalize(h).toLowerCase()
    if (n) map[n] = i
  })
  const indexes = H.map((h) => map[normalize(h).toLowerCase()])
  const unknownHeaders = indexes.filter((i) => i === undefined).length
  let skipped = 0
  const data = records
    .map((row) => indexes.map((i) => (i === undefined ? '' : normalize(row[i]))))
    .filter((r) => {
      if (normalize(r[0])) return true
      skipped++
      return false
    })
  return {
    data,
    fileName,
    sourceColumns: headers.length,
    skipped,
    unknownHeaders,
  }
}

export async function parseRoadmapBuffer(fileName: string, buffer: ArrayBuffer): Promise<AnalystDataset> {
  if (fileName.toLowerCase().endsWith('.csv')) {
    return buildDataset(csvParse(new TextDecoder('utf-8').decode(buffer)), fileName)
  }
  return buildDataset(await readExcel(buffer), fileName)
}

export async function parseRoadmapFile(file: File): Promise<AnalystDataset> {
  const rows = file.name.toLowerCase().endsWith('.csv') ? csvParse(await file.text()) : await readExcel(await file.arrayBuffer())
  return buildDataset(rows, file.name)
}

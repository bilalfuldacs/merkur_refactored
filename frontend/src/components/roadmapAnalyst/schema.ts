/** 52-column roadmap schema and shared constants, ported from the original Roadmap Analyst. */

export type Row = string[]
export type FilterKey = 'country' | 'segment' | 'type' | 'studio'
/** Either a named field (see FIELDS) or a raw column index. */
export type FieldKey = string | number
export type AnalystFilters = Record<FilterKey, string>
export type TabKey = 'overview' | 'dimensions' | 'features' | 'strategy' | 'records' | 'quality'

export const H: readonly string[] = [
  'Game Name',
  'Game Design Studio',
  'If "3rd Party", which?',
  'Trademarked for EU? (Y/N)',
  'Trademarked for UK? (Y/N)',
  'Trademarked for US? (Y/N)',
  'Trademarked for CAN? (Y/N)',
  'Trademarked for AUS & NZL? (Y/N)',
  'Licensed Brand? (Y/N)',
  'Assigned to Roadmapslot? (Y/N/Cancelled)',
  'Development Type',
  'If "Iteration" or "Port", which Origin Game?',
  'Market Segment',
  'Primary Design target market',
  'Targeted Release to US Fieldtrial',
  'Cabinet Type',
  'Game Type',
  'Player Selectable Single Game / Multi Game',
  'Progressive Type',
  'Cabinet',
  'Supported CPU Module',
  'Button Panel',
  'SW Foundation',
  'Game Engine',
  'Foundation Details',
  'Signage Content? (Y/N)',
  'Portfolio Strategy',
  'If "Competetive Response" or "Evolution …", which Origin Game?',
  'Reel Matrix Basegame (# of reels x # of rows)',
  'Game Theme',
  'Base Game USP',
  'Feature Game USP',
  'Cash On Reels? (Y/N)',
  'Hold&Spin? (Y/N)',
  'Perceived Persistence (# of Pots, counting combinations of individual pots as well)',
  'True Persistence? (Y/N)',
  'Feature In Feature? (Y/N)',
  'Estimated Design/Development/Test Effort',
  'Targeted Accepted Product Ask',
  'Actual Accepted Product Ask',
  'Targeted Roadmap Assignment',
  'Actual Roadmap Assignment',
  'Targeted Game Design Sign Off',
  'Actual Game Design Sign Off',
  'Targeted Submission Date',
  'Targeted Release to Pre-Fieldtrial (prior to QA Release)',
  'Targeted Release to Fieldtrial (QA Release)',
  'Actual Release for Fieldtrial',
  'Targeted Operational Readiness',
  'Actual Operational Readiness',
  'Status',
  'Additional Information',
]

export const FIELDS: Record<string, number> = {
  name: 0,
  studio: 1,
  segment: 12,
  country: 13,
  type: 16,
  foundation: 22,
  theme: 29,
  status: 50,
}

export const FILTER_KEYS: readonly FilterKey[] = ['country', 'segment', 'type', 'studio']

export const FILTER_LABELS: Record<FilterKey, string> = {
  country: 'Market',
  segment: 'Segment',
  type: 'Type',
  studio: 'Studio',
}

export const emptyFilters: AnalystFilters = {
  country: '',
  segment: '',
  type: '',
  studio: '',
}

export function isFilterKey(key: FieldKey): key is FilterKey {
  return typeof key === 'string' && (FILTER_KEYS as readonly string[]).includes(key)
}

export type FeatureDef = readonly [label: string, index: number]

export const FEATURES: readonly FeatureDef[] = [
  ['Cash On Reels', 32],
  ['Hold & Spin', 33],
  ['True Persistence', 35],
  ['Feature In Feature', 36],
  ['Signage Content', 25],
  ['Licensed Brand', 8],
]

export const AVAILABLE_FEATURES: readonly FeatureDef[] = [
  ...new Map<number, FeatureDef>(
    [...FEATURES, ...[3, 4, 5, 6, 7, 9].map((i): FeatureDef => [H[i].replace(/\s*\(Y\/N(?:\/Cancelled)?\)/, '').replace(/\?$/, ''), i])].map(
      (x) => [x[1], x] as [number, FeatureDef],
    ),
  ).values(),
]

export const DEFAULT_CHOSEN_FEATURES: readonly number[] = [32, 33, 35, 36, 25, 8]

export const DIM: ReadonlyArray<readonly [label: string, key: FieldKey]> = [
  ['Country / target market', 'country'],
  ['Market Segment', 'segment'],
  ['Game Type', 'type'],
  ['Studio', 'studio'],
  ['Development Type', 10],
  ['Portfolio Strategy', 26],
  ['Cabinet', 19],
  ['Status', 'status'],
  ['Progressive Type', 18],
]

export const STRATEGY_DIM: ReadonlyArray<readonly [label: string, key: FilterKey]> = [
  ['Country / Target Market', 'country'],
  ['Market Segment', 'segment'],
  ['Game Type', 'type'],
  ['Studio', 'studio'],
]

export const FEATURE_GROUP_OPTIONS: ReadonlyArray<readonly [FilterKey, string]> = [
  ['segment', 'Market Segment'],
  ['country', 'Country / Market'],
  ['type', 'Game Type'],
  ['studio', 'Studio'],
]

export const PIE_COLORS = ['#E83181', '#009FE3', '#022052', '#A2C617', '#F07E25', '#55BFEC', '#898B8E', '#EB0000']

/** Columns searched by the free-text filter. */
export const SEARCH_COLUMNS = [0, 1, 12, 13, 16, 22, 29, 30, 31, 50]
/** Columns shown in the Game Explorer table. */
export const RECORD_COLUMNS = [0, 1, 12, 13, 16, 22, 29, 32, 33, 35, 36, 50]
/** Fields counted for “core completeness”. */
export const CORE_COLUMNS = [0, 1, 12, 13, 16, 22, 29]

export const QUALITY_KEYS: ReadonlyArray<readonly [string, number]> = [
  ['Game name', 0],
  ['Studio', 1],
  ['Market segment', 12],
  ['Primary target market', 13],
  ['Game type', 16],
  ['SW foundation', 22],
  ['Theme', 29],
  ['Status', 50],
  ['Cash on Reels', 32],
  ['Hold & Spin', 33],
  ['True Persistence', 35],
  ['Feature in Feature', 36],
]

export const PROFILE_QUICK_FIELDS: ReadonlyArray<readonly [string, number]> = [
  ['Studio', 1],
  ['Market Segment', 12],
  ['Target Market (not Country)', 13],
  ['Game Type', 16],
  ['SW Foundation', 22],
  ['Theme', 29],
  ['Status', 50],
  ['Game Engine', 23],
  ['Cabinet', 19],
]

export function toFieldKey(raw: string): FieldKey {
  return /^\d+$/.test(raw) ? Number(raw) : raw
}

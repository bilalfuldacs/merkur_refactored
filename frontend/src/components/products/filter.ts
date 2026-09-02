import type {
  ProductCompatibilityGroup,
  ProductHardwareComponent,
  ProductJurisdiction,
  ProductPlatform,
  ProductStatus,
  ProductVersion,
} from '@/api/products'
import { jurisdictionLabel } from './format'

export const BUTTON_PANEL_TYPE = 'Button Panel'
export const CPU_MODULE_TYPE = 'CPU Module'

export type ProductFilterState = {
  query: string
  statusIds: number[]
  platformId: number | null
  marketId: number | null
  buttonPanelId: number | null
  cpuModuleId: number | null
  extraComponentIds: Record<string, number | null>
}

export const emptyProductFilters: ProductFilterState = {
  query: '',
  statusIds: [],
  platformId: null,
  marketId: null,
  buttonPanelId: null,
  cpuModuleId: null,
  extraComponentIds: {},
}

export function filtersAreActive(filters: ProductFilterState): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.statusIds.length > 0 ||
    filters.platformId != null ||
    filters.marketId != null ||
    filters.buttonPanelId != null ||
    filters.cpuModuleId != null ||
    Object.values(filters.extraComponentIds).some((id) => id != null)
  )
}

function typeMatches(type: string, expected: string): boolean {
  return type.toLowerCase() === expected.toLowerCase()
}

function uniqueById<T extends { ID: number }>(items: T[]): T[] {
  const map = new Map<number, T>()
  for (const item of items) {
    map.set(item.ID, item)
  }
  return [...map.values()]
}

export function componentsForType(version: ProductVersion, typeName: string): ProductHardwareComponent[] {
  return version.compatibilities.find((group) => typeMatches(group.type, typeName))?.components ?? []
}

export function versionHasComponent(version: ProductVersion, typeName: string, componentId: number): boolean {
  return componentsForType(version, typeName).some((component) => component.ID === componentId)
}

function versionMarketIds(version: ProductVersion): number[] {
  return [...version.markets.available, ...version.markets.intended]
    .map((market) => market.jurisdiction?.ID)
    .filter((id): id is number => id != null)
}

function versionMatchesQuery(version: ProductVersion, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return true
  }

  return [version.name, version.name2, version.subtitle].some((value) => (value ?? '').toLowerCase().includes(needle))
}

export function filterVersions(versions: ProductVersion[], filters: ProductFilterState): ProductVersion[] {
  return versions.filter((version) => {
    if (!versionMatchesQuery(version, filters.query)) {
      return false
    }
    if (filters.statusIds.length > 0 && !filters.statusIds.includes(version.status?.ID ?? -1)) {
      return false
    }
    if (filters.platformId != null && version.platform?.ID !== filters.platformId) {
      return false
    }
    if (filters.marketId != null && !versionMarketIds(version).includes(filters.marketId)) {
      return false
    }
    if (filters.buttonPanelId != null && !versionHasComponent(version, BUTTON_PANEL_TYPE, filters.buttonPanelId)) {
      return false
    }
    if (filters.cpuModuleId != null && !versionHasComponent(version, CPU_MODULE_TYPE, filters.cpuModuleId)) {
      return false
    }
    return Object.entries(filters.extraComponentIds).every(([type, componentId]) => {
      if (componentId == null) {
        return true
      }
      return versionHasComponent(version, type, componentId)
    })
  })
}

export function uniqueStatuses(versions: ProductVersion[]): ProductStatus[] {
  return uniqueById(versions.map((version) => version.status).filter((status): status is ProductStatus => status != null)).sort(
    (a, b) => a.ID - b.ID,
  )
}

export function uniquePlatforms(versions: ProductVersion[]): ProductPlatform[] {
  return uniqueById(versions.map((version) => version.platform).filter((platform): platform is ProductPlatform => platform != null)).sort(
    (a, b) => a.name.localeCompare(b.name),
  )
}

export function uniqueMarkets(versions: ProductVersion[]): ProductJurisdiction[] {
  const items: ProductJurisdiction[] = []
  for (const version of versions) {
    for (const market of [...version.markets.available, ...version.markets.intended]) {
      if (market.jurisdiction) {
        items.push(market.jurisdiction)
      }
    }
  }
  return uniqueById(items).sort((a, b) => jurisdictionLabel(a).localeCompare(jurisdictionLabel(b)))
}

function uniqueComponents(versions: ProductVersion[], typeName: string): ProductHardwareComponent[] {
  const items: ProductHardwareComponent[] = []
  for (const version of versions) {
    for (const component of componentsForType(version, typeName)) {
      if (component.ID != null) {
        items.push(component)
      }
    }
  }
  return uniqueById(items as Array<ProductHardwareComponent & { ID: number }>).sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? ''),
  )
}

export function uniqueHardwareTypes(versions: ProductVersion[]): ProductCompatibilityGroup[] {
  const grouped = new Map<string, ProductHardwareComponent[]>()
  for (const version of versions) {
    for (const group of version.compatibilities) {
      const current = grouped.get(group.type) ?? []
      grouped.set(group.type, [...current, ...group.components])
    }
  }
  return [...grouped.entries()]
    .map(([type, components]) => ({
      type_ID: versions.flatMap((version) => version.compatibilities).find((group) => group.type === type)?.type_ID ?? null,
      type,
      components: uniqueById(components.filter((component): component is ProductHardwareComponent & { ID: number } => component.ID != null)).sort(
        (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
      ),
    }))
    .sort((a, b) => a.type.localeCompare(b.type))
}

export function extraHardwareTypes(versions: ProductVersion[]): ProductCompatibilityGroup[] {
  return uniqueHardwareTypes(versions).filter(
    (group) => !typeMatches(group.type, BUTTON_PANEL_TYPE) && !typeMatches(group.type, CPU_MODULE_TYPE),
  )
}

export function buttonPanelOptions(versions: ProductVersion[]): ProductHardwareComponent[] {
  return uniqueComponents(versions, BUTTON_PANEL_TYPE)
}

export function cpuModuleOptions(versions: ProductVersion[]): ProductHardwareComponent[] {
  return uniqueComponents(versions, CPU_MODULE_TYPE)
}

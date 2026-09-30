import { apiFile, apiRequest, downloadApiFile } from './client'

export type TableAssetUploader = {
  ID: number
  initials?: string | null
  firstname?: string | null
  lastname?: string | null
  bcolor?: string | null
  color?: string | null
  role_ID?: number | null
}

export type TableAssetFile = {
  filename: string
  name: string
  tlp: 'red' | 'amber' | 'green' | 'clear' | string
  tlp_label: string
  asset_class: string
  folder: string | null
  size: number
  size_label: string
  uploaded_at: string | null
  description: string | null
  draft: boolean
  featured: boolean
  is_image: boolean
  uploader: TableAssetUploader | null
}

export type TableAssetFolder = {
  tlp: string
  path: string
}

export type TableAssetClass = {
  key: string
  label: string
  group: 'general' | 'print' | 'other' | string
  span: number
  hint: string
  files: TableAssetFile[]
  folders?: TableAssetFolder[]
}

export type TableAssetMoodBoard = {
  screenshots: Array<TableAssetFile | null>
  banner: TableAssetFile | null
}

export type TableAssetsPayload = {
  files: number
  can_upload: boolean
  can_modify?: boolean
  can_use_tlp_red: boolean
  uses_asset_hub: boolean
  max_bytes: number
  classes: TableAssetClass[]
  mood_board: TableAssetMoodBoard | null
}

export type TableAssetUploadInput = {
  file: File
  tlp: string
  assetClass?: string
  featured?: boolean
}

function assetsCollectionPath(table: string, id: number | null): string {
  if (id === null) {
    return `/virtual-tables/${encodeURIComponent(table)}/assets`
  }

  return `/tables/${encodeURIComponent(table)}/rows/${id}/assets`
}

export function getTableRowAssets(table: string, id: number | null): Promise<TableAssetsPayload> {
  return apiRequest<TableAssetsPayload>(assetsCollectionPath(table, id))
}

export function uploadTableAsset(
  table: string,
  id: number | null,
  input: TableAssetUploadInput,
): Promise<TableAssetsPayload> {
  const form = new FormData()
  form.append('upload', input.file)
  form.append('tlp', input.tlp)
  form.append('ac', input.assetClass ?? '')
  if (input.featured) {
    form.append('featured', '1')
  }

  return apiRequest<TableAssetsPayload>(assetsCollectionPath(table, id), {
    method: 'POST',
    body: form,
  })
}

export function tableAssetFilePath(table: string, id: number | null, file: TableAssetFile, download = false): string {
  const params = new URLSearchParams({
    tlp: file.tlp,
    f: file.filename,
  })
  if (file.asset_class) {
    params.set('ac', file.asset_class)
  }
  if (file.folder) {
    params.set('sf', file.folder)
  }
  if (download) {
    params.set('dl', '1')
  }
  return `${assetsCollectionPath(table, id)}/file?${params.toString()}`
}

export async function viewTableAsset(table: string, id: number | null, file: TableAssetFile): Promise<void> {
  const blob = await apiFile(tableAssetFilePath(table, id, file))
  const url = URL.createObjectURL(blob)
  const tab = window.open(url, '_blank')
  if (!tab) {
    await downloadApiFile(tableAssetFilePath(table, id, file, true), file.name)
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

export function modifyTableAsset(
  table: string,
  id: number | null,
  input: {
    tlp: string
    filename?: string
    assetClass?: string
    folder?: string | null
    tlpNew?: string
    folderNew?: string | null
    folderCreate?: string
    nameNew?: string
    description?: string
    featured?: boolean
    draft?: boolean
    trash?: boolean
  },
): Promise<TableAssetsPayload> {
  return apiRequest<TableAssetsPayload>(assetsCollectionPath(table, id), {
    method: 'PATCH',
    body: {
      tlp: input.tlp,
      ac: input.assetClass ?? '',
      sf: input.folder ?? '',
      f: input.filename,
      tlp_new: input.tlpNew,
      sf_new: input.folderNew,
      folder_create: input.folderCreate,
      name_new: input.nameNew,
      description: input.description,
      featured: input.featured,
      draft: input.draft,
      delete: input.trash,
    },
  })
}

export async function downloadTableAsset(table: string, id: number | null, file: TableAssetFile): Promise<void> {
  await downloadApiFile(tableAssetFilePath(table, id, file, true), file.name)
}

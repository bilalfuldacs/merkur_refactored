import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import {
  downloadTableAsset,
  getTableRowAssets,
  modifyTableAsset,
  tableAssetFilePath,
  uploadTableAsset,
  viewTableAsset,
} from '@/api/tableAssets'
import type { TableAssetClass, TableAssetFile, TableAssetsPayload } from '@/api/tableAssets'
import { ApiError, apiFile } from '@/api/client'
import { UserAvatar } from '@/components/user'
import { AppButton, AppTextField } from '@/components/ui'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.mp3,.mp4'
const FOLDER_NAME_RE = /^[-+ /)(\p{L}0-9]{1,100}$/u
const ASSET_DRAG_MIME = 'application/x-merkur-asset'

const TLP_COLOR: Record<string, string> = {
  red: '#EB0000',
  amber: '#F07E26',
  green: '#A2C617',
  clear: '#898B8E',
}

const TLP_OPTIONS = [
  { value: 'red', label: 'TLP:RED', hint: 'Do not share' },
  { value: 'amber', label: 'TLP:AMBER', hint: 'Share on a need-to-know basis' },
  { value: 'green', label: 'TLP:GREEN', hint: 'Circulate, but do not post publicly' },
  { value: 'clear', label: 'TLP:CLEAR', hint: 'Share without restriction' },
] as const

type UploadTarget = { assetClass: string; featured?: boolean }

type AssetDragPayload = {
  filename: string
  tlp: string
  asset_class: string
  folder: string | null
}

function isAssetDrag(event: { dataTransfer: DataTransfer }): boolean {
  return Array.from(event.dataTransfer.types).includes(ASSET_DRAG_MIME)
}

function readAssetDrag(event: { dataTransfer: DataTransfer }): AssetDragPayload | null {
  const raw = event.dataTransfer.getData(ASSET_DRAG_MIME)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AssetDragPayload>
    if (typeof parsed.filename !== 'string' || typeof parsed.tlp !== 'string' || typeof parsed.asset_class !== 'string') {
      return null
    }
    return {
      filename: parsed.filename,
      tlp: parsed.tlp,
      asset_class: parsed.asset_class,
      folder: typeof parsed.folder === 'string' ? parsed.folder : null,
    }
  } catch {
    return null
  }
}

export function TableRecordAssets({
  table,
  recordId,
  decolorize = false,
}: {
  table: string
  recordId: number | null
  decolorize?: boolean
}) {
  const [payload, setPayload] = useState<TableAssetsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tlp, setTlp] = useState('amber')
  const [uploading, setUploading] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingTarget = useRef<UploadTarget>({ assetClass: '' })

  useEffect(() => {
    let cancelled = false
    setPayload(null)
    setError(null)
    setNotice(null)
    void getTableRowAssets(table, recordId)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Assets could not be loaded.')
          setPayload(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [table, recordId])

  const canUpload = Boolean(payload?.can_upload)
  const canModify = Boolean(payload?.can_modify ?? payload?.can_upload)
  const tlpHint = TLP_OPTIONS.find((option) => option.value === tlp)?.hint ?? ''
  const sizeLimit = formatUploadLimit(payload?.max_bytes ?? 104857600)

  async function uploadFiles(files: FileList | File[], target: UploadTarget) {
    const list = Array.from(files)
    if (list.length === 0 || !canUpload) {
      return
    }

    setError(null)
    setNotice(null)
    setUploading((count) => count + list.length)
    let latest: TableAssetsPayload | null = null
    const failures: string[] = []

    for (const file of list) {
      try {
        latest = await uploadTableAsset(table, recordId, {
          file,
          tlp,
          assetClass: target.assetClass,
          featured: target.featured,
        })
      } catch (caught) {
        failures.push(uploadErrorMessage(caught, file.name))
      } finally {
        setUploading((count) => Math.max(0, count - 1))
      }
    }

    if (latest) {
      setPayload(latest)
    }
    if (failures.length > 0) {
      setError(failures.join(' '))
    } else if (list.length === 1) {
      setNotice(`‘${list[0].name}’ has been uploaded.`)
    } else {
      setNotice(`${list.length} assets have been uploaded.`)
    }
  }

  function pickFiles(target: UploadTarget) {
    pendingTarget.current = target
    fileInputRef.current?.click()
  }

  if (error && payload === null) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  if (payload === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  const groups = groupClasses(payload.classes)

  return (
    <Box sx={{ p: 2, pb: 3 }}>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPT}
        onChange={(event) => {
          const files = event.target.files
          if (files && files.length > 0) {
            void uploadFiles(files, pendingTarget.current)
          }
          event.target.value = ''
        }}
      />

      {canUpload ? (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'common.white',
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1 }}>TLP level for uploads</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {TLP_OPTIONS.map((option) => {
              if (option.value === 'red' && !payload.can_use_tlp_red) {
                return null
              }
              const selected = tlp === option.value
              return (
                <Box
                  key={option.value}
                  component="label"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    pr: 1,
                    borderRadius: 1,
                    bgcolor: selected ? 'grey.100' : 'transparent',
                  }}
                >
                  <Radio
                    size="small"
                    checked={selected}
                    onChange={() => setTlp(option.value)}
                    value={option.value}
                  />
                  <Chip
                    size="small"
                    label={option.label}
                    sx={{
                      height: 22,
                      fontWeight: 800,
                      bgcolor: TLP_COLOR[option.value],
                      color: option.value === 'clear' ? '#022052' : '#fff',
                    }}
                  />
                </Box>
              )
            })}
          </Box>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.75, textAlign: 'center' }}>
            {tlpHint} · Applies to every drop zone · PDF · JPG · PNG · MP3 · MP4 · ≤ {sizeLimit}
          </Typography>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          You can view and download assets. TLP describes what you may do with each file.
        </Alert>
      )}

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {notice ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      ) : null}
      {uploading > 0 ? (
        <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 2 }}>
          Uploading {uploading === 1 ? '1 file' : `${uploading} files`}…
        </Alert>
      ) : null}

      {payload.mood_board ? (
        <MoodBoard
          table={table}
          recordId={recordId}
          board={payload.mood_board}
          canUpload={canUpload}
          onPick={pickFiles}
          onDrop={uploadFiles}
        />
      ) : null}

      {groups.general.length > 0 ? (
        <Section title="General Assets">
          <ClassGrid
            table={table}
            recordId={recordId}
            classes={groups.general}
            decolorize={decolorize}
            canUpload={canUpload}
            canModify={canModify}
            onUpdated={setPayload}
            onPick={pickFiles}
            onDrop={uploadFiles}
          />
        </Section>
      ) : null}

      {groups.print.length > 0 ? (
        <Section title="Print Assets [High Resolution]">
          <ClassGrid
            table={table}
            recordId={recordId}
            classes={groups.print}
            decolorize={decolorize}
            canUpload={canUpload}
            canModify={canModify}
            onUpdated={setPayload}
            onPick={pickFiles}
            onDrop={uploadFiles}
          />
        </Section>
      ) : null}

      <Section title={payload.uses_asset_hub ? 'Description & Other Assets' : undefined}>
        {canUpload ? (
          <DropZone
            size="large"
            label="Drop uncategorized assets here"
            onPick={() => pickFiles({ assetClass: '' })}
            onDrop={(files) => void uploadFiles(files, { assetClass: '' })}
          />
        ) : null}
        <ClassGrid
          table={table}
          recordId={recordId}
          classes={groups.other}
          decolorize={decolorize}
          canUpload={canUpload}
          canModify={canModify}
          onUpdated={setPayload}
          onPick={pickFiles}
          onDrop={uploadFiles}
        />
      </Section>
    </Box>
  )
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      {title ? (
        <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1 }}>{title}</Typography>
      ) : null}
      {children}
    </Box>
  )
}

function ClassGrid({
  table,
  recordId,
  classes,
  decolorize,
  canUpload,
  canModify,
  onUpdated,
  onPick,
  onDrop,
}: {
  table: string
  recordId: number | null
  classes: TableAssetClass[]
  decolorize: boolean
  canUpload: boolean
  canModify: boolean
  onUpdated: (payload: TableAssetsPayload) => void
  onPick: (target: UploadTarget) => void
  onDrop: (files: FileList | File[], target: UploadTarget) => void
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 1.5,
      }}
    >
      {classes.map((group) => (
        <Box key={group.key || 'other'} sx={{ gridColumn: group.span >= 12 ? '1 / -1' : undefined }}>
          <ClassCard
            table={table}
            recordId={recordId}
            group={group}
            decolorize={decolorize}
            canUpload={canUpload}
            canModify={canModify}
            onUpdated={onUpdated}
            onPick={() => onPick({ assetClass: group.key })}
            onDrop={(files) => onDrop(files, { assetClass: group.key })}
          />
        </Box>
      ))}
    </Box>
  )
}

function ClassCard({
  table,
  recordId,
  group,
  decolorize,
  canUpload,
  canModify,
  onUpdated,
  onPick,
  onDrop,
}: {
  table: string
  recordId: number | null
  group: TableAssetClass
  decolorize: boolean
  canUpload: boolean
  canModify: boolean
  onUpdated: (payload: TableAssetsPayload) => void
  onPick: () => void
  onDrop: (files: FileList | File[]) => void
}) {
  const folders = useMemo(() => uniqueFolderPaths(group), [group])
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [folderName, setFolderName] = useState('New Folder')
  const [folderTlp, setFolderTlp] = useState('amber')
  const [folderParent, setFolderParent] = useState('')
  const [busy, setBusy] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null)
  const [moveNotice, setMoveNotice] = useState<string | null>(null)

  async function moveAssetToFolder(payload: AssetDragPayload, folderPath: string) {
    if (!canModify || busy) {
      return
    }
    const currentFolder = payload.folder ?? ''
    if (currentFolder === folderPath) {
      return
    }
    if (payload.asset_class !== group.key) {
      setFolderError('Assets can only be moved within the same class.')
      return
    }

    setBusy(true)
    setFolderError(null)
    setMoveNotice(null)
    try {
      const next = await modifyTableAsset(table, recordId, {
        tlp: payload.tlp,
        filename: payload.filename,
        assetClass: payload.asset_class,
        folder: payload.folder,
        folderNew: folderPath || null,
      })
      onUpdated(next)
      setMoveNotice(`Moved to “${folderPath}”.`)
    } catch (caught) {
      setFolderError(caught instanceof ApiError && caught.message.trim() ? caught.message : 'The asset could not be moved.')
    } finally {
      setBusy(false)
      setDragOverFolder(null)
    }
  }

  const summary =
    group.files.length === 0 && folders.length === 0
      ? 'Empty'
      : `${group.files.length === 1 ? '1 Asset' : `${group.files.length} Assets`}, ${
          folders.length === 0 ? 'No Folders' : folders.length === 1 ? '1 Folder' : `${folders.length} Folders`
        }`

  async function createFolder() {
    const name = folderName.trim()
    if (!FOLDER_NAME_RE.test(name)) {
      setFolderError('Folder name may only contain letters, digits, spaces, and - / ( ).')
      return
    }
    setBusy(true)
    setFolderError(null)
    try {
      const next = await modifyTableAsset(table, recordId, {
        tlp: folderTlp,
        assetClass: group.key,
        folder: folderParent || null,
        folderCreate: name,
      })
      onUpdated(next)
      setCreatingFolder(false)
    } catch (caught) {
      setFolderError(caught instanceof ApiError && caught.message.trim() ? caught.message : 'Folder could not be created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'common.white', p: 1.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{group.label}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>{summary}</Typography>
          {group.hint ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 11, mt: 0.25 }}>{group.hint}</Typography>
          ) : null}
        </Box>
        {canModify ? (
          <IconButton
            size="small"
            aria-label={`New folder in ${group.label}`}
            onClick={() => {
              setFolderName('New Folder')
              setFolderParent('')
              setFolderTlp('amber')
              setFolderError(null)
              setCreatingFolder(true)
            }}
          >
            <CreateNewFolderOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        ) : null}
        {canUpload ? <DropZone size="small" onPick={onPick} onDrop={onDrop} /> : null}
      </Box>
      {folders.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {folders.map((path) => {
            const over = dragOverFolder === path
            return (
              <Chip
                key={path}
                size="small"
                icon={<CreateNewFolderOutlinedIcon />}
                label={path}
                onDragEnter={(event) => {
                  if (!canModify || !isAssetDrag(event)) {
                    return
                  }
                  event.preventDefault()
                  setDragOverFolder(path)
                }}
                onDragOver={(event) => {
                  if (!canModify || !isAssetDrag(event)) {
                    return
                  }
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  if (dragOverFolder !== path) {
                    setDragOverFolder(path)
                  }
                }}
                onDragLeave={(event) => {
                  const related = event.relatedTarget
                  if (related instanceof Node && event.currentTarget.contains(related)) {
                    return
                  }
                  setDragOverFolder((current) => (current === path ? null : current))
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setDragOverFolder(null)
                  const payload = readAssetDrag(event)
                  if (payload) {
                    void moveAssetToFolder(payload, path)
                  }
                }}
                sx={{
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: over ? 'info.main' : 'transparent',
                  bgcolor: over ? 'rgba(0, 159, 227, 0.16)' : undefined,
                  transition: 'background-color 120ms ease, border-color 120ms ease',
                }}
              />
            )
          })}
        </Box>
      ) : null}
      {folderError ? (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setFolderError(null)}>
          {folderError}
        </Alert>
      ) : null}
      {moveNotice ? (
        <Alert severity="success" sx={{ mb: 1 }} onClose={() => setMoveNotice(null)}>
          {moveNotice}
        </Alert>
      ) : null}
      {group.files.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', fontSize: 13, textAlign: 'center', py: 1.5 }}>
          No assets have been uploaded yet.
        </Typography>
      ) : (
        group.files.map((file) => (
          <AssetRow
            key={`${file.tlp}-${file.asset_class}-${file.folder ?? ''}-${file.filename}`}
            table={table}
            recordId={recordId}
            file={file}
            group={group}
            decolorize={decolorize}
            canModify={canModify}
            onUpdated={onUpdated}
          />
        ))
      )}
      <Dialog open={creatingFolder} onClose={() => setCreatingFolder(false)} fullWidth maxWidth="xs">
        <DialogTitle>New folder</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <AppTextField
            label="Folder name"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            helperText="Use / to create nested folders at once."
          />
          <AppTextField
            select
            label="Parent folder"
            value={folderParent}
            onChange={(event) => setFolderParent(event.target.value)}
          >
            <MenuItem value="">Home</MenuItem>
            {folders.map((path) => (
              <MenuItem key={path} value={path}>
                {path}
              </MenuItem>
            ))}
          </AppTextField>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {TLP_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onClick={() => setFolderTlp(option.value)}
                sx={{
                  fontWeight: 700,
                  bgcolor: folderTlp === option.value ? TLP_COLOR[option.value] : 'grey.200',
                  color: folderTlp === option.value && option.value !== 'clear' ? '#fff' : '#022052',
                }}
              />
            ))}
          </Box>
          {folderError ? <Alert severity="error">{folderError}</Alert> : null}
        </DialogContent>
        <DialogActions>
          <AppButton variant="text" onClick={() => setCreatingFolder(false)}>
            Cancel
          </AppButton>
          <AppButton disabled={busy || folderName.trim() === ''} onClick={() => void createFolder()}>
            Create
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function MoodBoard({
  table,
  recordId,
  board,
  canUpload,
  onPick,
  onDrop,
}: {
  table: string
  recordId: number | null
  board: NonNullable<TableAssetsPayload['mood_board']>
  canUpload: boolean
  onPick: (target: UploadTarget) => void
  onDrop: (files: FileList | File[], target: UploadTarget) => void
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
        {board.screenshots.map((file, index) => (
          <MoodSlot
            key={`ss-${index}`}
            table={table}
            recordId={recordId}
            file={file}
            label={`Screenshot ${index + 1}`}
            canUpload={canUpload}
            onPick={() => onPick({ assetClass: 'screenshots', featured: true })}
            onDrop={(files) => onDrop(files, { assetClass: 'screenshots', featured: true })}
            onOpen={file ? () => void viewTableAsset(table, recordId, file) : undefined}
          />
        ))}
      </Box>
      <MoodSlot
        table={table}
        recordId={recordId}
        file={board.banner}
        label="Banner"
        tall
        canUpload={canUpload}
        onPick={() => onPick({ assetClass: 'buttons-headers-banners', featured: true })}
        onDrop={(files) => onDrop(files, { assetClass: 'buttons-headers-banners', featured: true })}
        onOpen={board.banner ? () => void viewTableAsset(table, recordId, board.banner as TableAssetFile) : undefined}
      />
    </Box>
  )
}

function MoodSlot({
  table,
  recordId,
  file,
  label,
  tall = false,
  canUpload,
  onPick,
  onDrop,
  onOpen,
}: {
  table: string
  recordId: number | null
  file: TableAssetFile | null
  label: string
  tall?: boolean
  canUpload: boolean
  onPick: () => void
  onDrop: (files: FileList | File[]) => void
  onOpen?: () => void
}) {
  const [active, setActive] = useState(false)
  const height = tall ? { xs: 140, sm: 180 } : { xs: 160, sm: 210 }

  return (
    <Box
      onDragEnter={(event) => {
        event.preventDefault()
        if (canUpload && !isAssetDrag(event)) {
          setActive(true)
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setActive(false)
        if (isAssetDrag(event)) {
          return
        }
        if (canUpload && event.dataTransfer.files.length > 0) {
          onDrop(event.dataTransfer.files)
        }
      }}
      onClick={() => {
        if (file && onOpen) {
          onOpen()
          return
        }
        if (canUpload) {
          onPick()
        }
      }}
      sx={{
        position: 'relative',
        height,
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: canUpload || file ? 'pointer' : 'default',
        border: '1px dashed',
        borderColor: active ? 'info.main' : 'divider',
        bgcolor: active ? 'rgba(0, 159, 227, 0.08)' : 'grey.100',
      }}
    >
      {file ? (
        <AssetThumb table={table} recordId={recordId} file={file} fill />
      ) : (
        <PlaceholderCross label={tall ? 'asset to be added' : 'asset'} />
      )}
      <Typography
        sx={{
          position: 'absolute',
          left: 8,
          bottom: 6,
          px: 0.75,
          py: 0.15,
          borderRadius: 1,
          bgcolor: 'rgba(2, 32, 82, 0.72)',
          color: 'common.white',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

function DropZone({
  size,
  label,
  onPick,
  onDrop,
}: {
  size: 'small' | 'large'
  label?: string
  onPick: () => void
  onDrop: (files: FileList | File[]) => void
}) {
  const [active, setActive] = useState(false)
  const large = size === 'large'

  return (
    <Box
      onDragEnter={(event) => {
        event.preventDefault()
        if (isAssetDrag(event)) {
          return
        }
        setActive(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (isAssetDrag(event)) {
          return
        }
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(event) => {
        event.preventDefault()
        setActive(false)
        if (isAssetDrag(event)) {
          return
        }
        if (event.dataTransfer.files.length > 0) {
          onDrop(event.dataTransfer.files)
        }
      }}
      sx={{
        border: '1px dashed',
        borderColor: active ? 'info.main' : large ? 'info.main' : 'divider',
        borderRadius: 2,
        bgcolor: active ? 'rgba(0, 159, 227, 0.12)' : large ? 'rgba(162, 198, 23, 0.12)' : 'rgba(162, 198, 23, 0.08)',
        textAlign: 'center',
        px: large ? 2 : 1,
        py: large ? 3 : 1,
        mb: large ? 1.5 : 0,
        minWidth: large ? undefined : 64,
      }}
    >
      <CloudUploadOutlinedIcon sx={{ color: large ? 'info.main' : 'text.secondary', fontSize: large ? 40 : 22 }} />
      {large ? (
        <>
          <Typography sx={{ fontWeight: 800, mt: 0.5 }}>Drop your PDF · JPG · PNG · MP3 · MP4</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, my: 0.5 }}>{label ?? '— or —'}</Typography>
          <AppButton type="button" size="small" onClick={onPick}>
            Select files
          </AppButton>
        </>
      ) : (
        <AppButton type="button" size="small" variant="text" onClick={onPick} sx={{ display: 'block', mx: 'auto', minWidth: 0 }}>
          Add
        </AppButton>
      )}
    </Box>
  )
}

function PlaceholderCross({ label }: { label: string }) {
  return (
    <Box sx={{ height: '100%', position: 'relative', bgcolor: 'grey.200' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to top right, transparent calc(50% - 1px), #cfcfcf 50%, transparent calc(50% + 1px)),
            linear-gradient(to top left, transparent calc(50% - 1px), #cfcfcf 50%, transparent calc(50% + 1px))`,
        }}
      />
      <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 13 }}>{label}</Typography>
      </Box>
    </Box>
  )
}

function AssetRow({
  table,
  recordId,
  file,
  group,
  decolorize,
  canModify,
  onUpdated,
}: {
  table: string
  recordId: number | null
  file: TableAssetFile
  group: TableAssetClass
  decolorize: boolean
  canModify: boolean
  onUpdated: (payload: TableAssetsPayload) => void
}) {
  const tlpColor = TLP_COLOR[file.tlp] ?? TLP_COLOR.clear
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [name, setName] = useState(file.name)
  const [description, setDescription] = useState(file.description ?? '')
  const [tlp, setTlp] = useState(file.tlp)
  const [featured, setFeatured] = useState(file.featured)
  const [draft, setDraft] = useState(file.draft)
  const [targetFolder, setTargetFolder] = useState(file.folder ?? '')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const moveTargets = useMemo(() => folderTargetsForFile(group, file), [group, file])

  async function save(extra?: { trash?: boolean; draftOnly?: boolean; moveOnly?: boolean }) {
    setBusy(true)
    setActionError(null)
    try {
      const next = await modifyTableAsset(table, recordId, {
        tlp: file.tlp,
        filename: file.filename,
        assetClass: file.asset_class,
        folder: file.folder,
        tlpNew: extra?.trash || extra?.draftOnly || extra?.moveOnly ? undefined : tlp,
        nameNew: extra?.trash || extra?.draftOnly || extra?.moveOnly ? undefined : name,
        description: extra?.trash || extra?.draftOnly || extra?.moveOnly ? undefined : description,
        featured: extra?.trash || extra?.draftOnly || extra?.moveOnly ? undefined : featured,
        draft: extra?.draftOnly ? !file.draft : extra?.trash || extra?.moveOnly ? undefined : draft,
        folderNew: extra?.moveOnly ? targetFolder || null : undefined,
        trash: extra?.trash,
      })
      onUpdated(next)
      setEditing(false)
      setMoving(false)
      setMenuAnchor(null)
    } catch (caught) {
      setActionError(caught instanceof ApiError && caught.message.trim() ? caught.message : 'The asset could not be updated.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      draggable={canModify}
      onDragStart={(event) => {
        if (!canModify) {
          event.preventDefault()
          return
        }
        const payload: AssetDragPayload = {
          filename: file.filename,
          tlp: file.tlp,
          asset_class: file.asset_class,
          folder: file.folder,
        }
        event.dataTransfer.setData(ASSET_DRAG_MIME, JSON.stringify(payload))
        event.dataTransfer.effectAllowed = 'move'
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 0.5,
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        cursor: canModify ? 'grab' : undefined,
        '&:active': canModify ? { cursor: 'grabbing' } : undefined,
      }}
    >
      {file.is_image ? (
        <AssetThumb table={table} recordId={recordId} file={file} />
      ) : (
        <InsertDriveFileOutlinedIcon sx={{ color: 'text.secondary' }} />
      )}
      <UserAvatar user={file.uploader} size="sm" decolorize={decolorize} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, wordBreak: 'break-word' }}>{file.name}</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
          {file.size_label}
          {file.uploaded_at ? ` · ${file.uploaded_at}` : ''}
          {file.folder ? ` · ${file.folder}` : ''}
        </Typography>
        {file.description ? (
          <Typography sx={{ fontSize: 13, mt: 0.5 }}>{file.description}</Typography>
        ) : null}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
          <Chip
            size="small"
            label={file.tlp_label}
            sx={{ height: 20, fontWeight: 700, bgcolor: tlpColor, color: file.tlp === 'clear' ? '#022052' : '#fff' }}
          />
          {file.draft ? <Chip size="small" color="error" label="DRAFT" sx={{ height: 20, fontWeight: 700 }} /> : null}
          {file.featured ? <Chip size="small" color="info" label="MOOD BOARD" sx={{ height: 20, fontWeight: 700 }} /> : null}
        </Box>
      </Box>
      <IconButton
        size="small"
        aria-label={`View ${file.name}`}
        onClick={() => void viewTableAsset(table, recordId, file)}
        sx={{ bgcolor: 'secondary.main', color: 'common.white', '&:hover': { bgcolor: 'secondary.dark' } }}
      >
        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        size="small"
        aria-label={`Download ${file.name}`}
        onClick={() => void downloadTableAsset(table, recordId, file)}
        sx={{ bgcolor: 'grey.200' }}
      >
        <CloudDownloadOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
      {canModify ? (
        <>
          <IconButton size="small" aria-label={`Edit ${file.name}`} onClick={(event) => setMenuAnchor(event.currentTarget)}>
            <MoreVertIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
            <MenuItem
              onClick={() => {
                setName(file.name)
                setDescription(file.description ?? '')
                setTlp(file.tlp)
                setFeatured(file.featured)
                setDraft(file.draft)
                setActionError(null)
                setEditing(true)
                setMenuAnchor(null)
              }}
            >
              Rename / TLP
            </MenuItem>
            <MenuItem
              onClick={() => {
                setTargetFolder(file.folder ?? '')
                setActionError(null)
                setMoving(true)
                setMenuAnchor(null)
              }}
            >
              <DriveFileMoveOutlinedIcon sx={{ fontSize: 16, mr: 1 }} />
              Move…
            </MenuItem>
            <MenuItem
              disabled={busy}
              onClick={() => {
                void save({ draftOnly: true })
              }}
            >
              {file.draft ? 'Clear draft' : 'Mark as draft'}
            </MenuItem>
            <MenuItem
              onClick={() => {
                void save({ trash: true })
              }}
            >
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 16, mr: 1 }} />
              Move to trash
            </MenuItem>
          </Menu>
          <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="xs">
            <DialogTitle>Edit asset</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
              <AppTextField label="Name" value={name} onChange={(event) => setName(event.target.value)} />
              <AppTextField
                label="Description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                multiline
                minRows={2}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {TLP_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => setTlp(option.value)}
                    sx={{
                      fontWeight: 700,
                      bgcolor: tlp === option.value ? TLP_COLOR[option.value] : 'grey.200',
                      color: tlp === option.value && option.value !== 'clear' ? '#fff' : '#022052',
                    }}
                  />
                ))}
              </Box>
              <FormControlLabel
                control={<Switch checked={featured} onChange={(event) => setFeatured(event.target.checked)} />}
                label="Mood board"
              />
              <FormControlLabel
                control={<Switch checked={draft} onChange={(event) => setDraft(event.target.checked)} />}
                label="Draft"
              />
              {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            </DialogContent>
            <DialogActions>
              <AppButton variant="text" onClick={() => setEditing(false)}>
                Cancel
              </AppButton>
              <AppButton disabled={busy || name.trim() === ''} onClick={() => void save()}>
                Save
              </AppButton>
            </DialogActions>
          </Dialog>
          <Dialog open={moving} onClose={() => setMoving(false)} fullWidth maxWidth="xs">
            <DialogTitle>Move {file.name}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
              <FormControlLabel
                control={<Radio checked={targetFolder === ''} onChange={() => setTargetFolder('')} />}
                label="Home"
              />
              {moveTargets.map((path) => (
                <FormControlLabel
                  key={path}
                  control={<Radio checked={targetFolder === path} onChange={() => setTargetFolder(path)} />}
                  label={path}
                />
              ))}
              {actionError ? <Alert severity="error">{actionError}</Alert> : null}
            </DialogContent>
            <DialogActions>
              <AppButton variant="text" onClick={() => setMoving(false)}>
                Cancel
              </AppButton>
              <AppButton
                disabled={busy || targetFolder === (file.folder ?? '')}
                onClick={() => void save({ moveOnly: true })}
              >
                Move
              </AppButton>
            </DialogActions>
          </Dialog>
        </>
      ) : null}
    </Box>
  )
}

function AssetThumb({
  table,
  recordId,
  file,
  fill = false,
}: {
  table: string
  recordId: number | null
  file: TableAssetFile
  fill?: boolean
}) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    void apiFile(tableAssetFilePath(table, recordId, file))
      .then((blob) => {
        if (cancelled) {
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null)
        }
      })
    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [table, recordId, file.filename, file.tlp, file.asset_class, file.folder])

  if (!src) {
    return fill ? <PlaceholderCross label="asset" /> : <InsertDriveFileOutlinedIcon sx={{ color: 'text.secondary' }} />
  }

  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={
        fill
          ? { width: '100%', height: '100%', objectFit: 'contain', bgcolor: '#111' }
          : { width: 48, height: 48, objectFit: 'cover', borderRadius: 1, flexShrink: 0, bgcolor: 'grey.100' }
      }
    />
  )
}

function groupClasses(classes: TableAssetClass[]) {
  return {
    general: classes.filter((item) => item.group === 'general'),
    print: classes.filter((item) => item.group === 'print'),
    other: classes.filter((item) => item.group !== 'general' && item.group !== 'print'),
  }
}

function uniqueFolderPaths(group: TableAssetClass): string[] {
  const names = new Set<string>()
  for (const folder of group.folders ?? []) {
    if (folder.path) {
      names.add(folder.path)
    }
  }
  for (const file of group.files) {
    if (file.folder) {
      names.add(file.folder)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function folderTargetsForFile(group: TableAssetClass, file: TableAssetFile): string[] {
  const names = new Set<string>()
  for (const folder of group.folders ?? []) {
    if (folder.path && folder.tlp === file.tlp) {
      names.add(folder.path)
    }
  }
  for (const candidate of group.files) {
    if (candidate.tlp === file.tlp && candidate.folder) {
      names.add(candidate.folder)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function uploadErrorMessage(caught: unknown, fileName: string): string {
  if (caught instanceof ApiError && caught.message.trim()) {
    return caught.message.trim()
  }

  return `‘${fileName}’ could not be uploaded.`
}

function formatUploadLimit(bytes: number): string {
  if (bytes >= 1048576) {
    const mb = bytes / 1048576
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

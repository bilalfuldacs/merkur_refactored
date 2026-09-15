import { useRef, useState } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Switch from '@mui/material/Switch'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import type {
  IceGame,
  IceMultigameProduct,
  IceProgressPhoto,
  IceQuestionnaireHistory,
  IceQuestionnaireProducts,
  IceQuestionnaireSectioned,
  IceScoutProduct,
  IceStandardProduct,
} from '@/api/ice2027'
import { deleteIcePhoto, ICE_GAME_TYPES, uploadIcePhoto } from '@/api/ice2027'
import { useAuthFileUrl } from '@/components/docs/format'
import { AppButton, AppTextField } from '@/components/ui'
import { IceSectionHead } from './IceChrome'

const STAR = '#c4002a'

const FUNCTIONS = [
  { value: 'hold_and_spin', label: 'Hold & Spin' },
  { value: 'perceived_persistence', label: 'Perceived Persistence' },
  { value: 'combination_persist_hold', label: 'Combination Perceived Persistence / Hold & Spin' },
  { value: 'feature_in_feature', label: 'Feature in Feature' },
] as const

const CATEGORIES = [
  { value: 'mlp', label: 'MLP' },
  { value: 'sap', label: 'SAP (stand-alone)' },
  { value: 'multigame', label: 'Multigame' },
  { value: 'cabinet', label: 'Cabinet' },
] as const

const emptyDraft = (): IceScoutProduct => ({
  is_new_product: false,
  game_name: '',
  category: '',
  game_ids: [],
  photos: [],
  progressive_jp: 'no',
  integrated_jp: 'no',
  functionality: [],
})

export function emptyProducts(
  saved?: IceQuestionnaireProducts | IceQuestionnaireSectioned | IceScoutProduct[] | null,
): IceScoutProduct[] {
  if (!saved) {
    return []
  }
  if (Array.isArray(saved)) {
    return saved.map((item) => ({ ...item, photos: item.photos ?? [], game_ids: item.game_ids ?? [] }))
  }
  const out: IceScoutProduct[] = []
  const sections: Array<[keyof IceQuestionnaireSectioned, string, boolean]> = [
    ['new', 'new_product', true],
    ['mlp', 'mlp', false],
    ['sap', 'sap', false],
    ['multigame', 'multigame', false],
  ]
  for (const [key, category, isNew] of sections) {
    for (const item of saved[key] ?? []) {
      out.push({
        ...item,
        is_new_product: isNew,
        category: (item as IceScoutProduct).category || category,
        game_ids: (item as IceScoutProduct).game_ids ?? [],
        photos: (item as IceScoutProduct).photos ?? [],
      })
    }
  }
  return out
}

function RequiredStar() {
  return (
    <Box component="span" sx={{ color: STAR, fontWeight: 700 }} aria-hidden>
      {' '}
      *
    </Box>
  )
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Typography sx={{ fontWeight: 700, mb: 0.75 }}>
      {children}
      {required ? <RequiredStar /> : null}
    </Typography>
  )
}

function YesNo({
  value,
  onChange,
  label,
  required,
}: {
  value: string
  onChange: (next: 'yes' | 'no') => void
  label: string
  required?: boolean
}) {
  const current = value === 'yes' ? 'yes' : 'no'
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={current}
        onChange={(_, next: 'yes' | 'no' | null) => {
          if (next) {
            onChange(next)
          }
        }}
      >
        <ToggleButton value="no">No</ToggleButton>
        <ToggleButton value="yes">Yes</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}

function StandardFields({
  product,
  onChange,
}: {
  product: IceStandardProduct
  onChange: (next: IceStandardProduct) => void
}) {
  const functions = Array.isArray(product.functionality) ? product.functionality : []
  const jpYes = product.progressive_jp === 'yes'
  const theme = String(product.theme ?? '')
  const [themeOther, setThemeOther] = useState(theme !== '')

  function toggleFn(value: string, checked: boolean) {
    const next = checked ? [...functions.filter((item) => item !== value), value] : functions.filter((item) => item !== value)
    onChange({ ...product, functionality: next })
  }

  return (
    <>
      <YesNo
        required
        label="Progressive JP"
        value={String(product.progressive_jp ?? 'no')}
        onChange={(next) => onChange({ ...product, progressive_jp: next })}
      />
      {jpYes ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
          <Box>
            <FieldLabel required>No. Progressives</FieldLabel>
            <AppTextField
              type="number"
              size="small"
              fullWidth
              value={product.no_progressives ?? ''}
              onChange={(event) => onChange({ ...product, no_progressives: event.target.value })}
            />
          </Box>
          <Box>
            <FieldLabel required>No. Static</FieldLabel>
            <AppTextField
              type="number"
              size="small"
              fullWidth
              value={product.no_static ?? ''}
              onChange={(event) => onChange({ ...product, no_static: event.target.value })}
            />
          </Box>
        </Box>
      ) : null}

      <FieldLabel required>Functionality</FieldLabel>
      <FormGroup sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.5, mb: 2 }}>
        {FUNCTIONS.slice(0, 2).map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                size="small"
                checked={functions.includes(option.value)}
                onChange={(event) => toggleFn(option.value, event.target.checked)}
              />
            }
            label={option.label}
          />
        ))}
        <Box sx={{ my: 1 }}>
          <Typography sx={{ mb: 0.5, fontSize: 14 }}>No. of Pots</Typography>
          <AppTextField
            type="number"
            size="small"
            fullWidth
            value={product.no_of_pots ?? ''}
            onChange={(event) => onChange({ ...product, no_of_pots: event.target.value })}
          />
        </Box>
        {FUNCTIONS.slice(2).map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                size="small"
                checked={functions.includes(option.value)}
                onChange={(event) => toggleFn(option.value, event.target.checked)}
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>

      <Box sx={{ mb: 2 }}>
        <FieldLabel required>Win-Lines</FieldLabel>
        <AppTextField size="small" fullWidth value={product.win_lines ?? ''} onChange={(event) => onChange({ ...product, win_lines: event.target.value })} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Denomination Structure</Typography>
        <AppTextField size="small" fullWidth value={product.denomination ?? ''} onChange={(event) => onChange({ ...product, denomination: event.target.value })} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <FieldLabel required>Theme</FieldLabel>
        <AppTextField
          select
          size="small"
          fullWidth
          value={themeOther ? '__other__' : ''}
          onChange={(event) => {
            const other = event.target.value === '__other__'
            setThemeOther(other)
            if (!other) {
              onChange({ ...product, theme: '' })
            }
          }}
        >
          <MenuItem value="">Select a theme world…</MenuItem>
          <MenuItem value="__other__">Other (type below)</MenuItem>
        </AppTextField>
        {themeOther ? (
          <AppTextField
            size="small"
            fullWidth
            sx={{ mt: 1 }}
            placeholder="Theme world name"
            value={theme}
            onChange={(event) => onChange({ ...product, theme: event.target.value })}
          />
        ) : null}
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Cabinet</Typography>
        <AppTextField size="small" fullWidth value={product.cabinet ?? ''} onChange={(event) => onChange({ ...product, cabinet: event.target.value })} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Target Market</Typography>
        <AppTextField size="small" fullWidth value={product.target_market ?? ''} onChange={(event) => onChange({ ...product, target_market: event.target.value })} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>USP</Typography>
        <AppTextField multiline minRows={3} size="small" fullWidth value={product.usp ?? ''} onChange={(event) => onChange({ ...product, usp: event.target.value })} />
      </Box>
    </>
  )
}

function MultigameFields({
  product,
  onChange,
}: {
  product: IceMultigameProduct
  onChange: (next: IceMultigameProduct) => void
}) {
  const jpYes = product.integrated_jp === 'yes'
  return (
    <>
      <YesNo
        label="Integrated Jackpot-Systems"
        value={String(product.integrated_jp ?? 'no')}
        onChange={(next) => onChange({ ...product, integrated_jp: next })}
      />
      {jpYes ? (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ mb: 0.75 }}>If yes: Number</Typography>
          <AppTextField
            type="number"
            size="small"
            fullWidth
            value={product.integrated_jp_number ?? ''}
            onChange={(event) => onChange({ ...product, integrated_jp_number: event.target.value })}
          />
        </Box>
      ) : null}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Number of categories</Typography>
        <AppTextField
          type="number"
          size="small"
          fullWidth
          value={product.number_of_categories ?? ''}
          onChange={(event) => onChange({ ...product, number_of_categories: event.target.value })}
        />
      </Box>
      <Box>
        <Typography sx={{ mb: 0.75 }}>Number of games</Typography>
        <AppTextField
          type="number"
          size="small"
          fullWidth
          value={product.number_of_games ?? ''}
          onChange={(event) => onChange({ ...product, number_of_games: event.target.value })}
        />
      </Box>
    </>
  )
}

function DraftPhotoThumb({ photo, onRemove }: { photo: IceProgressPhoto; onRemove: () => void }) {
  const src = useAuthFileUrl(photo.url)
  return (
    <Box sx={{ position: 'relative', width: 72, height: 72 }}>
      {src ? (
        <Box component="img" src={src} alt={photo.name} sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
      ) : (
        <Box sx={{ width: 72, height: 72, bgcolor: 'action.hover', borderRadius: 1 }} />
      )}
      <IconButton size="small" onClick={onRemove} aria-label={`Remove ${photo.name}`} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1 }}>
        <CloseOutlinedIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  )
}

function ProductThumb({ photo }: { photo: IceProgressPhoto }) {
  const src = useAuthFileUrl(photo.url)
  if (!src) {
    return null
  }
  return <Box component="img" src={src} alt="" sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
}

function productTitle(item: IceScoutProduct, games: IceGame[]): string {
  if (item.is_new_product) {
    return item.game_name?.trim() || 'Untitled new product'
  }
  const ids = item.game_ids ?? []
  if (ids.length === 0) {
    return ICE_GAME_TYPES[(item.category ?? '') as keyof typeof ICE_GAME_TYPES] || 'Product'
  }
  return ids.map((id) => games.find((game) => game.ID === id)?.name ?? `Game #${id}`).join(', ')
}

function draftErrors(item: IceScoutProduct, games: IceGame[], usedIds: Set<number>): string[] {
  const errors: string[] = []
  if (!item.category) {
    errors.push('Select a category.')
  }
  if (item.is_new_product) {
    if (!item.game_name?.trim()) {
      errors.push('Enter the new product’s game name.')
    }
  } else if (games.length === 0) {
    errors.push('This competitor has no games yet. Turn on New product to type a name.')
  } else if (!(item.game_ids ?? []).length) {
    errors.push(games.some((game) => !usedIds.has(game.ID)) ? 'Select a game.' : 'All catalog games are already on this questionnaire. Turn on New product to add another name.')
  } else {
    for (const id of item.game_ids ?? []) {
      if (usedIds.has(id)) {
        errors.push('That game is already on this questionnaire. Pick a different game.')
        break
      }
    }
  }
  if (item.category !== 'multigame') {
    if (item.progressive_jp === 'yes') {
      if (item.no_progressives === '' || item.no_progressives == null) {
        errors.push('Enter the number of progressives.')
      }
      if (item.no_static === '' || item.no_static == null) {
        errors.push('Enter the number of static jackpots.')
      }
    }
    if (!(item.functionality ?? []).length) {
      errors.push('Select at least one functionality.')
    }
    if (!String(item.win_lines ?? '').trim()) {
      errors.push('Enter win-lines.')
    }
    if (!String(item.theme ?? '').trim()) {
      errors.push('Select a theme world.')
    }
  }
  return errors
}

export function IceQuestionnaireForm({
  products,
  games,
  competitorId,
  teamMembers,
  updatedBy,
  updatedAt,
  history,
  onChange,
  onPersist,
}: {
  products: IceScoutProduct[]
  games: IceGame[]
  competitorId: number
  teamMembers?: string[]
  updatedBy?: string | null
  updatedAt?: string | null
  history?: IceQuestionnaireHistory[]
  onChange: (next: IceQuestionnaireProducts) => void
  onPersist?: (next: IceQuestionnaireProducts) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [draft, setDraft] = useState<IceScoutProduct>(emptyDraft())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)

  const usedIds = (except: number | null) => {
    const used = new Set<number>()
    products.forEach((item, index) => {
      if (except !== null && index === except) {
        return
      }
      for (const id of item.game_ids ?? []) {
        used.add(id)
      }
    })
    return used
  }

  function openAdd() {
    setDraft(emptyDraft())
    setEditingIndex(null)
    setErrors([])
    setOpen(true)
  }

  function openEdit(index: number) {
    const item = products[index]
    setDraft({ ...emptyDraft(), ...item, photos: item.photos ?? [], game_ids: item.game_ids ?? [] })
    setEditingIndex(index)
    setErrors([])
    setOpen(true)
  }

  async function persist(next: IceScoutProduct[]) {
    const previous = products
    onChange(next)
    if (!onPersist) {
      return
    }
    try {
      await onPersist(next)
    } catch (error) {
      onChange(previous)
      throw error
    }
  }

  async function saveDraft() {
    const used = usedIds(editingIndex)
    const found = draftErrors(draft, games, used)
    if (found.length) {
      setErrors(found)
      return
    }
    const next = [...products]
    if (editingIndex === null) {
      next.push(draft)
    } else {
      next[editingIndex] = draft
    }
    try {
      await persist(next)
      setOpen(false)
    } catch (error) {
      setErrors([error instanceof ApiError ? error.message : 'Could not save the questionnaire.'])
    }
  }

  async function removeProduct(index: number) {
    const next = products.filter((_, i) => i !== index)
    try {
      await persist(next)
    } catch {
      // Ice2027Page already shows the save error.
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }
    setUploading(true)
    setErrors([])
    try {
      const uploaded: IceProgressPhoto[] = []
      for (const file of Array.from(files)) {
        const result = await uploadIcePhoto(competitorId, file)
        uploaded.push(result.photo)
      }
      setDraft((current) => ({ ...current, photos: [...(current.photos ?? []), ...uploaded] }))
    } catch (error) {
      setErrors([error instanceof ApiError ? error.message : 'Could not upload the picture.'])
    } finally {
      setUploading(false)
    }
  }

  async function removePhoto(index: number) {
    const photo = draft.photos?.[index]
    if (!photo) {
      return
    }
    try {
      await deleteIcePhoto(competitorId, photo.id)
    } catch {
      // Live also removes from the draft even if the file is already gone.
    }
    setDraft((current) => ({ ...current, photos: (current.photos ?? []).filter((_, i) => i !== index) }))
  }

  const isNew = Boolean(draft.is_new_product)
  const isMultigame = draft.category === 'multigame'
  const selectedGameId = draft.game_ids?.[0] ?? 0
  const available = games.filter((game) => !usedIds(editingIndex).has(game.ID) || game.ID === selectedGameId)
  const pastHistory = (history ?? []).filter((entry) => !entry.is_current)
  const gamePlaceholder = games.length === 0 ? 'No games for this competitor' : available.length === 0 ? 'All games already on this questionnaire' : 'Select a game…'

  return (
    <>
      {teamMembers && teamMembers.length > 0 ? (
        <Alert
          severity="info"
          sx={{ mb: 2, alignItems: 'center', '& .MuiAlert-message': { width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 } }}
        >
          <Box sx={{ flex: 1 }}>
            Shared questionnaire — team: <strong>{teamMembers.join(' & ')}</strong>. Either member can edit.
          </Box>
          {updatedBy && updatedAt ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              Last saved by <strong>{updatedBy}</strong> on {updatedAt}
            </Typography>
          ) : null}
          {pastHistory.length > 0 ? (
            <AppButton size="small" variant="outlined" color="secondary" startIcon={<HistoryOutlinedIcon />} onClick={() => setHistoryOpen(true)}>
              History ({pastHistory.length})
            </AppButton>
          ) : null}
        </Alert>
      ) : null}

      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <IceSectionHead
          title="Products"
          action={
            <AppButton size="small" variant="contained" color="inherit" startIcon={<AddOutlinedIcon />} onClick={openAdd} sx={{ color: 'secondary.main', bgcolor: 'common.white' }}>
              Add product
            </AppButton>
          }
        />
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            Use <strong>Add product</strong> for each game you scout. It is saved as soon as you add or edit it. Fields marked with <strong>*</strong> are required. Turn on{' '}
            <strong>New product</strong> to type a game name; leave it off to pick this competitor’s games. You can also upload game pictures.
          </Typography>
          {products.length === 0 ? (
            <Typography sx={{ color: 'text.secondary' }}>No products yet. Use Add product to start.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {products.map((item, index) => (
                <Paper
                  key={`${item.game_name ?? ''}-${index}`}
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography sx={{ fontWeight: 800 }}>{productTitle(item, games)}</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {(ICE_GAME_TYPES[(item.category ?? '') as keyof typeof ICE_GAME_TYPES] ?? item.category ?? 'Product') + (item.is_new_product ? ' · New product' : '')}
                    </Typography>
                    {(item.photos ?? []).length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {(item.photos ?? []).map((photo) => (
                          <ProductThumb key={photo.id} photo={photo} />
                        ))}
                      </Box>
                    ) : null}
                  </Box>
                  <AppButton size="small" variant="outlined" color="secondary" onClick={() => openEdit(index)}>
                    Edit
                  </AppButton>
                  <AppButton size="small" variant="outlined" color="error" onClick={() => void removeProduct(index)}>
                    Delete
                  </AppButton>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
          {editingIndex === null ? 'Add product' : 'Edit product'}
          <IconButton aria-label="Close" onClick={() => setOpen(false)} sx={{ ml: 'auto' }}>
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {errors.length > 0 ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Please fix the following:</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </Box>
            </Alert>
          ) : null}

          <Box sx={{ p: 1.5, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
            <FormControlLabel
              sx={{ ml: 0 }}
              control={
                <Switch
                  checked={isNew}
                  onChange={(_, checked) =>
                    setDraft((current) => ({
                      ...current,
                      is_new_product: checked,
                      game_name: checked ? current.game_name : '',
                      game_ids: checked ? [] : current.game_ids,
                    }))
                  }
                />
              }
              label={<Typography sx={{ fontWeight: 800 }}>New product</Typography>}
            />
            <Typography sx={{ color: 'text.secondary', fontSize: 13, ml: 0.5 }}>
              On: type a game name. Off: pick from this competitor’s games. Category stays in both cases.
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <FieldLabel required>Category</FieldLabel>
            <AppTextField
              select
              size="small"
              fullWidth
              value={draft.category ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
            >
              <MenuItem value="">Select category…</MenuItem>
              {CATEGORIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </AppTextField>
          </Box>

          {isNew ? (
            <Box sx={{ mb: 2 }}>
              <FieldLabel required>Game name</FieldLabel>
              <AppTextField
                size="small"
                fullWidth
                placeholder="Name of the new game"
                value={draft.game_name ?? ''}
                onChange={(event) => setDraft((current) => ({ ...current, game_name: event.target.value }))}
              />
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <FieldLabel required>Game</FieldLabel>
              <AppTextField
                select
                size="small"
                fullWidth
                disabled={available.length === 0}
                value={selectedGameId ? String(selectedGameId) : ''}
                onChange={(event) => {
                  const id = Number(event.target.value)
                  setDraft((current) => ({ ...current, game_ids: id > 0 ? [id] : [] }))
                }}
              >
                <MenuItem value="">{gamePlaceholder}</MenuItem>
                {available.map((game) => (
                  <MenuItem key={game.ID} value={String(game.ID)}>
                    {game.name}
                  </MenuItem>
                ))}
              </AppTextField>
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.5 }}>All games for this competitor.</Typography>
            </Box>
          )}

          {isMultigame ? (
            <MultigameFields product={draft} onChange={(next) => setDraft((current) => ({ ...current, ...next }))} />
          ) : (
            <StandardFields product={draft} onChange={(next) => setDraft((current) => ({ ...current, ...next }))} />
          )}

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ mb: 1 }}>Game pictures</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <AppButton size="small" variant="outlined" color="secondary" startIcon={<PhotoCameraOutlinedIcon />} disabled={uploading} onClick={() => cameraRef.current?.click()}>
                Take photo
              </AppButton>
              <AppButton size="small" variant="outlined" color="secondary" startIcon={<PhotoLibraryOutlinedIcon />} disabled={uploading} onClick={() => libraryRef.current?.click()}>
                Upload from phone
              </AppButton>
            </Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1 }}>
              On a phone, Take photo opens the camera. Upload from phone opens the gallery. JPG or PNG.
            </Typography>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(event) => {
                void uploadFiles(event.target.files)
                event.target.value = ''
              }}
            />
            <input
              ref={libraryRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => {
                void uploadFiles(event.target.files)
                event.target.value = ''
              }}
            />
            {(draft.photos ?? []).length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(draft.photos ?? []).map((photo, index) => (
                  <DraftPhotoThumb key={photo.id} photo={photo} onRemove={() => void removePhoto(index)} />
                ))}
              </Box>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <AppButton size="medium" variant="outlined" color="secondary" onClick={() => setOpen(false)}>
            Cancel
          </AppButton>
          <AppButton size="medium" color="secondary" onClick={() => void saveDraft()}>
            {editingIndex === null ? 'Add to questionnaire' : 'Save product'}
          </AppButton>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          History
          <IconButton aria-label="Close" onClick={() => setHistoryOpen(false)} sx={{ ml: 'auto' }}>
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {(history ?? []).map((entry) => (
            <Box key={`${entry.ID}-${entry.at}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{entry.is_current ? 'Current' : entry.by || 'Saved'}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {entry.at ?? ''} · {entry.product_count} product{entry.product_count === 1 ? '' : 's'}
                </Typography>
              </Box>
              {!entry.is_current && entry.products ? (
                <AppButton
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    void persist(emptyProducts(entry.products))
                    setHistoryOpen(false)
                  }}
                >
                  Restore
                </AppButton>
              ) : (
                <Chip size="small" label="Current" color="success" />
              )}
            </Box>
          ))}
        </DialogContent>
      </Dialog>
    </>
  )
}

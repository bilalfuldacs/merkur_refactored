import { useEffect, useRef, useState } from 'react'
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
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { ApiError, getStoredUser } from '@/api'
import type { AuthUser } from '@/api'
import type {
  IceCompetitor,
  IceGame,
  IceGameMediaPhoto,
  IceMultigameProduct,
  IceProgressPhoto,
  IceQuestionnaireHistory,
  IceQuestionnaireProducts,
  IceQuestionnaireSectioned,
  IceScoutProduct,
  IceStandardProduct,
} from '@/api/ice2027'
import {
  deleteIceDraft,
  deleteIcePhoto,
  getIceGameMedia,
  ICE_DENOMINATIONS,
  ICE_EVAL_CRITERIA,
  ICE_GAME_TYPES,
  ICE_MECHANICS_HELP,
  ICE_MECHANICS_OPTIONS,
  ICE_RATING_SCALE,
  saveIceDraft,
  uploadIcePhoto,
} from '@/api/ice2027'
import { compressPhoto } from './compressPhoto'
import { useAuthFileUrl } from '@/components/docs/format'
import { AppButton, AppTextField } from '@/components/ui'
import Autocomplete from '@mui/material/Autocomplete'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import {
  clearIceProductDraft,
  iceProductDraftHasContent,
  readIceProductDraft,
  saveIceProductDraft,
} from '@/offline/iceOffline'
import { IceSectionHead } from './IceChrome'

const STAR = '#c4002a'

/** Touch-friendly inputs: 16px avoids iOS zoom; 42px matches scout.php mobile. */
const mobileFieldSx = {
  '& .MuiInputBase-root': { minHeight: { xs: 42 } },
  '& .MuiInputBase-input': { fontSize: { xs: 16 } },
  '& .MuiSelect-select': { fontSize: { xs: 16 }, display: 'flex', alignItems: 'center' },
} as const

const BET_LEVELS = ['20', '40', '80', '160', '240', '400', '800', '1600', '2400', '4000', '8000'] as const

function mechanicsEntries(
  options?: Record<string, string>,
  help?: Record<string, string>,
): Array<{ value: string; label: string; help: string }> {
  const source = options && Object.keys(options).length > 0 ? options : ICE_MECHANICS_OPTIONS
  const tips = help && Object.keys(help).length > 0 ? help : ICE_MECHANICS_HELP
  return Object.entries(source).map(([value, label]) => ({
    value,
    label,
    help: tips[value] ?? '',
  }))
}

function selectedBets(value: IceStandardProduct['bets']): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }
  return String(value ?? '')
    .split(/[\s,;]+/)
    .filter(Boolean)
}

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
  competitor_ID: '',
  competitor_name: '',
  game_ids: [],
  photos: [],
  progressive_jp: 'no',
  integrated_jp: 'no',
  functionality: [],
  mechanics_description: '',
  bets: [],
  bet_other: '',
  denominations: [],
  denomination_other: '',
  progressive_reset: '',
  played_at: 'show',
  field_market: '',
  field_venue: '',
  rating: {},
  would_play: '',
  eval_note: '',
  number_of_monitors: '',
  monitor_size: '',
  uhd: 'no',
  video_button_panel: 'no',
  vbp_functions: '',
})

/** A 1–5 score as the select value ('' when not rated). */
function scoreValue(value: string | number | undefined | null): string {
  const score = Number.parseInt(String(value ?? ''), 10)
  return score >= 1 && score <= 5 ? String(score) : ''
}

/**
 * Bring a saved/draft product into form shape: defaults, all eight score keys,
 * and legacy free-text denomination split into the checkbox list.
 */
function hydrateProduct(item: IceScoutProduct): IceScoutProduct {
  const base = { ...emptyDraft(), ...item, photos: item.photos ?? [], game_ids: item.game_ids ?? [] }
  const rating: Record<string, string> = {}
  for (const { key } of ICE_EVAL_CRITERIA) {
    rating[key] = scoreValue(item.rating?.[key])
  }
  let denominations = Array.isArray(item.denominations) ? item.denominations.map(String) : []
  let denominationOther = String(item.denomination_other ?? '')
  if (denominations.length === 0 && !denominationOther && item.denomination) {
    for (const part of String(item.denomination).split(/[,;/]+/).map((value) => value.trim()).filter(Boolean)) {
      if (part in ICE_DENOMINATIONS) {
        denominations.push(part)
      } else {
        denominationOther = denominationOther ? `${denominationOther}, ${part}` : part
      }
    }
  }
  denominations = denominations.filter((value) => value in ICE_DENOMINATIONS)
  return {
    ...base,
    rating,
    would_play: ['yes', 'no', 'unsure'].includes(String(item.would_play ?? '')) ? String(item.would_play) : '',
    eval_note: String(item.eval_note ?? ''),
    played_at: item.played_at === 'field' ? 'field' : 'show',
    denominations,
    denomination_other: denominationOther,
    category: item.category === 'new_product' ? '' : item.category ?? '',
  }
}

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

/** Soft warning: shown under the field, never blocks a save. */
function Warn({ text }: { text?: string }) {
  if (!text) {
    return null
  }
  return (
    <Typography role="status" sx={{ color: 'warning.dark', fontSize: 12.5, fontWeight: 600, mt: 0.5 }}>
      {text}
    </Typography>
  )
}

function YesNo({
  value,
  onChange,
  label,
  required,
  warn,
}: {
  value: string
  onChange: (next: 'yes' | 'no') => void
  label: string
  required?: boolean
  warn?: string
}) {
  const current = value === 'yes' ? 'yes' : 'no'
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={current}
        onChange={(_, next: 'yes' | 'no' | null) => {
          if (next) {
            onChange(next)
          }
        }}
        sx={{
          maxWidth: { sm: 280 },
          '& .MuiToggleButton-root': { minHeight: { xs: 42 }, flex: 1 },
        }}
      >
        <ToggleButton value="no">No</ToggleButton>
        <ToggleButton value="yes">Yes</ToggleButton>
      </ToggleButtonGroup>
      <Warn text={warn} />
    </Box>
  )
}

function StandardFields({
  product,
  onChange,
  themeWorlds,
  cabinet,
  mechanicsOptions,
  mechanicsHelp,
  warns = {},
}: {
  product: IceStandardProduct
  onChange: (next: IceStandardProduct) => void
  themeWorlds: string[]
  cabinet?: boolean
  mechanicsOptions?: Record<string, string>
  mechanicsHelp?: Record<string, string>
  warns?: Record<string, string>
}) {
  const inField = product.played_at === 'field'
  const functions = Array.isArray(product.functionality) ? product.functionality : []
  const jpYes = product.progressive_jp === 'yes'
  const theme = String(product.theme ?? '')
  const vbpYes = product.video_button_panel === 'yes'
  const mechanics = mechanicsEntries(mechanicsOptions, mechanicsHelp)

  function toggleFn(value: string, checked: boolean) {
    const next = checked ? [...functions.filter((item) => item !== value), value] : functions.filter((item) => item !== value)
    onChange({ ...product, functionality: next })
  }

  if (cabinet) {
    return (
      <>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
          <Box>
            <FieldLabel required>Number of monitors</FieldLabel>
            <AppTextField
              type="number"
              size="small"
              fullWidth
              sx={mobileFieldSx}
              value={product.number_of_monitors ?? ''}
              onChange={(event) => onChange({ ...product, number_of_monitors: event.target.value })}
            />
            <Warn text={warns.monitors} />
          </Box>
          <Box>
            <FieldLabel required>Monitor size</FieldLabel>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="e.g. 27 inch"
              value={product.monitor_size ?? ''}
              onChange={(event) => onChange({ ...product, monitor_size: event.target.value })}
            />
            <Warn text={warns.monitor_size} />
          </Box>
        </Box>
        <YesNo required label="UHD" warn={warns.uhd} value={String(product.uhd ?? 'no')} onChange={(next) => onChange({ ...product, uhd: next })} />
        <YesNo
          required
          warn={warns.vbp}
          label="Video Button Panel"
          value={String(product.video_button_panel ?? 'no')}
          onChange={(next) => onChange({ ...product, video_button_panel: next, vbp_functions: next === 'yes' ? product.vbp_functions : '' })}
        />
        {vbpYes ? (
          <Box sx={{ mb: 2 }}>
            <FieldLabel required>Functions of VBP</FieldLabel>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="Functions of the Video Button Panel"
              value={product.vbp_functions ?? ''}
              onChange={(event) => onChange({ ...product, vbp_functions: event.target.value })}
            />
            <Warn text={warns.vbp_functions} />
          </Box>
        ) : null}
      </>
    )
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
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mb: 2 }}>
          <Box>
            <FieldLabel required>Progressives</FieldLabel>
            <AppTextField
              type="number"
              size="small"
              fullWidth
              sx={mobileFieldSx}
              value={product.no_progressives ?? ''}
              onChange={(event) => onChange({ ...product, no_progressives: event.target.value })}
            />
            <Warn text={warns.no_progressives} />
          </Box>
          <Box>
            <FieldLabel required>Static</FieldLabel>
            <AppTextField
              type="number"
              size="small"
              fullWidth
              sx={mobileFieldSx}
              value={product.no_static ?? ''}
              onChange={(event) => onChange({ ...product, no_static: event.target.value })}
            />
            <Warn text={warns.no_static} />
          </Box>
          <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
            <Typography sx={{ fontWeight: 700, mb: 0.75 }}>Progressive reset values</Typography>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="Optional. Example: Mini 250, Major 2,500, Grand 10,000"
              value={product.progressive_reset ?? ''}
              onChange={(event) => onChange({ ...product, progressive_reset: event.target.value })}
            />
            <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.5 }}>
              Reset values depend on the market. Leave this blank at a show when the figure is not a real floor value.
            </Typography>
          </Box>
        </Box>
      ) : null}

      <FieldLabel required>Mechanics</FieldLabel>
      <FormGroup sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.5, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 1 }}>
          {mechanics.map((option) => (
            <FormControlLabel
              key={option.value}
              control={
                <Checkbox
                  size="small"
                  checked={functions.includes(option.value)}
                  onChange={(event) => toggleFn(option.value, event.target.checked)}
                />
              }
              label={
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{option.label}</span>
                  {option.help ? (
                    <Tooltip title={option.help} enterTouchDelay={0}>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          border: '1px solid',
                          borderColor: 'text.secondary',
                          color: 'text.secondary',
                          fontSize: 11,
                          fontWeight: 700,
                          lineHeight: 1,
                          cursor: 'help',
                        }}
                        aria-label={option.help}
                      >
                        ?
                      </Box>
                    </Tooltip>
                  ) : null}
                </Box>
              }
            />
          ))}
        </Box>
        <Box sx={{ my: 1 }}>
          <Typography sx={{ mb: 0.5, fontSize: 14 }}>No. of Pots</Typography>
          <AppTextField
            type="number"
            size="small"
            fullWidth
            sx={mobileFieldSx}
            value={product.no_of_pots ?? ''}
            onChange={(event) => onChange({ ...product, no_of_pots: event.target.value })}
          />
        </Box>
        <Box sx={{ mb: 1 }}>
          <Typography sx={{ mb: 0.5, fontSize: 14 }}>Description of game mechanics</Typography>
          <AppTextField
            multiline
            minRows={4}
            size="small"
            fullWidth
            sx={mobileFieldSx}
            value={product.mechanics_description ?? ''}
            onChange={(event) => onChange({ ...product, mechanics_description: event.target.value })}
          />
        </Box>
      </FormGroup>
      <Warn text={warns.mechanics} />

      <Box sx={{ mb: 2, mt: 2 }}>
        <FieldLabel required>Win-Lines</FieldLabel>
        <AppTextField size="small" fullWidth sx={mobileFieldSx} value={product.win_lines ?? ''} onChange={(event) => onChange({ ...product, win_lines: event.target.value })} />
        <Warn text={warns.win_lines} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <FieldLabel required={inField}>Denomination</FieldLabel>
        <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mb: 0.75 }}>
          Required when the game was played live in a casino. Optional at a show, because show values are often not the real market.
        </Typography>
        <FormGroup sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' }, columnGap: 1 }}>
            {Object.entries(ICE_DENOMINATIONS).map(([value, label]) => {
              const selected = product.denominations ?? []
              return (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      size="small"
                      checked={selected.includes(value)}
                      onChange={(event) => {
                        const next = event.target.checked ? [...selected.filter((item) => item !== value), value] : selected.filter((item) => item !== value)
                        const ordered = Object.keys(ICE_DENOMINATIONS).filter((item) => next.includes(item))
                        const other = String(product.denomination_other ?? '').trim()
                        onChange({ ...product, denominations: ordered, denomination: [...ordered, ...(other ? [other] : [])].join(', ') })
                      }}
                    />
                  }
                  label={label}
                />
              )
            })}
          </Box>
          <Box sx={{ my: 1 }}>
            <Typography sx={{ mb: 0.5, fontSize: 14 }}>Other denomination</Typography>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="Type a denomination that is not in the list"
              value={product.denomination_other ?? ''}
              onChange={(event) => {
                const other = event.target.value.trim()
                const ordered = product.denominations ?? []
                onChange({ ...product, denomination_other: event.target.value, denomination: [...ordered, ...(other ? [other] : [])].join(', ') })
              }}
            />
          </Box>
        </FormGroup>
        <Warn text={warns.denoms} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <FieldLabel required={inField}>Bets</FieldLabel>
        <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mb: 0.75 }}>
          Required for a live casino play. Optional at a show. Use the box below if the bet is not listed.
        </Typography>
        <FormGroup sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 1.5, py: 0.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, minmax(0, 1fr))' }, columnGap: 1 }}>
            {BET_LEVELS.map((level) => {
              const selected = selectedBets(product.bets)
              return (
                <FormControlLabel
                  key={level}
                  control={
                    <Checkbox
                      size="small"
                      checked={selected.includes(level)}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...selected.filter((item) => item !== level), level]
                          : selected.filter((item) => item !== level)
                        const ordered = BET_LEVELS.filter((item) => next.includes(item))
                        onChange({ ...product, bets: [...ordered] })
                      }}
                    />
                  }
                  label={level}
                />
              )
            })}
          </Box>
          <Box sx={{ my: 1 }}>
            <Typography sx={{ mb: 0.5, fontSize: 14 }}>Other bet</Typography>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="Type a bet that is not in the list"
              value={product.bet_other ?? ''}
              onChange={(event) => onChange({ ...product, bet_other: event.target.value })}
            />
          </Box>
        </FormGroup>
        <Warn text={warns.bets} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Theme</Typography>
        <Autocomplete
          freeSolo
          options={[...themeWorlds, 'Add new theme…']}
          value={theme}
          onInputChange={(_, value) => onChange({ ...product, theme: value === 'Add new theme…' ? '' : value })}
          renderInput={(params) => <AppTextField {...params} size="small" sx={mobileFieldSx} placeholder="Search themes…" />}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Cabinet</Typography>
        <AppTextField size="small" fullWidth sx={mobileFieldSx} value={product.cabinet ?? ''} onChange={(event) => onChange({ ...product, cabinet: event.target.value })} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>Target Market</Typography>
        <AppTextField size="small" fullWidth sx={mobileFieldSx} value={product.target_market ?? ''} onChange={(event) => onChange({ ...product, target_market: event.target.value })} />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ mb: 0.75 }}>USP</Typography>
        <AppTextField multiline minRows={3} size="small" fullWidth sx={mobileFieldSx} value={product.usp ?? ''} onChange={(event) => onChange({ ...product, usp: event.target.value })} />
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
            sx={mobileFieldSx}
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
          sx={mobileFieldSx}
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
          sx={mobileFieldSx}
          value={product.number_of_games ?? ''}
          onChange={(event) => onChange({ ...product, number_of_games: event.target.value })}
        />
      </Box>
    </>
  )
}

type PendingPhoto = { id: string; file: File; url: string; kind: 'image' | 'video' }

function releasePending(items: PendingPhoto[]) {
  items.forEach((item) => URL.revokeObjectURL(item.url))
}

const PHOTO_UPLOAD_CONCURRENCY = 3
const PHOTO_MAX_BYTES = 10 * 1024 * 1024
const VIDEO_MAX_BYTES = 400 * 1024 * 1024

/** Uploader user id encoded in the stored file name ("{userId}~{time}~{rand}~~name"). */
function photoUploaderId(photo: { id: string }): number {
  const match = /^(\d+)~/.exec(String(photo.id))
  return match ? Number(match[1]) : 0
}

/** Competitor folder the file was stored under (from its URL), falling back to the open questionnaire's own. */
function photoCompetitorId(photo: { url: string }, fallback: number): number {
  const match = /[?&]c=(\d+)/.exec(photo.url || '')
  return match ? Number(match[1]) : fallback
}

function PlayedAtFields({
  product,
  onChange,
  warns,
}: {
  product: IceScoutProduct
  onChange: (next: Partial<IceScoutProduct>) => void
  warns: Record<string, string>
}) {
  const inField = product.played_at === 'field'
  return (
    <Box sx={{ mb: 2 }}>
      <FieldLabel required>Where was this played?</FieldLabel>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={inField ? 'field' : 'show'}
        onChange={(_, next: 'show' | 'field' | null) => {
          if (next) {
            onChange({ played_at: next })
          }
        }}
        sx={{ maxWidth: { sm: 360 }, '& .MuiToggleButton-root': { minHeight: { xs: 42 }, flex: 1 } }}
      >
        <ToggleButton value="show">At a show</ToggleButton>
        <ToggleButton value="field">In the field</ToggleButton>
      </ToggleButtonGroup>
      <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.5 }}>
        At a show, bets and denominations are optional. In the field they are required, and the market and venue are required too.
      </Typography>
      <Warn text={warns.played_at} />
      {inField ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5, mt: 1.5 }}>
          <Box>
            <FieldLabel required>Market</FieldLabel>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="Example: Nevada, UK, NSW"
              value={product.field_market ?? ''}
              onChange={(event) => onChange({ field_market: event.target.value })}
            />
            <Warn text={warns.field_market} />
          </Box>
          <Box>
            <FieldLabel required>Venue</FieldLabel>
            <AppTextField
              size="small"
              fullWidth
              sx={mobileFieldSx}
              placeholder="Example: Aria, Hippodrome"
              value={product.field_venue ?? ''}
              onChange={(event) => onChange({ field_venue: event.target.value })}
            />
            <Warn text={warns.field_venue} />
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

/** Personal 1–5 rating. Stored in this user's evaluation, never in the shared questionnaire. */
function RatingFields({
  product,
  onChange,
  warns,
}: {
  product: IceScoutProduct
  onChange: (next: Partial<IceScoutProduct>) => void
  warns: Record<string, string>
}) {
  const rating = product.rating ?? {}
  const scale = Object.entries(ICE_RATING_SCALE)
    .map(([score, label]) => [Number(score), label] as const)
    .sort((a, b) => b[0] - a[0])
  return (
    <Box sx={{ mb: 2, p: { xs: 1.25, md: 1.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
        Your rating
        <RequiredStar />
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1 }}>
        Required to save the game, including when the game is typical. The same meaning is used by every team. Your score is added to your own
        evaluation and is not shared with your teammate. A photo can still be saved first with <strong>Save photo now</strong>.
      </Typography>
      <Box component="ul" sx={{ m: 0, mb: 1.5, pl: 2.5, fontSize: 13, color: 'text.secondary' }}>
        {scale.map(([score, label]) => (
          <li key={score}>
            <strong>{score}</strong> {label}
          </li>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
        {ICE_EVAL_CRITERIA.map(({ key, label }) => (
          <Box key={key}>
            <FieldLabel required>{label}</FieldLabel>
            <AppTextField
              select
              size="small"
              fullWidth
              sx={mobileFieldSx}
              value={scoreValue(rating[key])}
              onChange={(event) => onChange({ rating: { ...rating, [key]: event.target.value } })}
            >
              <MenuItem value="">Select…</MenuItem>
              {scale.map(([score, text]) => (
                <MenuItem key={score} value={String(score)}>
                  {score} — {text}
                </MenuItem>
              ))}
            </AppTextField>
          </Box>
        ))}
      </Box>
      <Warn text={warns.rating} />
      <Box sx={{ mt: 2 }}>
        <FieldLabel required>Would you play this game at a casino?</FieldLabel>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={product.would_play ?? ''}
          onChange={(_, next: string | null) => onChange({ would_play: next ?? '' })}
          sx={{ maxWidth: { sm: 360 }, '& .MuiToggleButton-root': { minHeight: { xs: 42 }, flex: 1 } }}
        >
          <ToggleButton value="yes">Yes</ToggleButton>
          <ToggleButton value="no">No</ToggleButton>
          <ToggleButton value="unsure">Unsure</ToggleButton>
        </ToggleButtonGroup>
        <Warn text={warns.would_play} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <FieldLabel>Rating note</FieldLabel>
        <AppTextField
          multiline
          minRows={2}
          size="small"
          fullWidth
          sx={mobileFieldSx}
          placeholder="Optional. Example: Strong theme, but the feature takes too long on the floor."
          value={product.eval_note ?? ''}
          onChange={(event) => onChange({ eval_note: event.target.value })}
        />
        <Typography sx={{ color: 'text.secondary', fontSize: 12.5, mt: 0.5 }}>
          Optional. A sentence on why you scored it this way is enough. It is stored with your evaluation, not scored automatically.
        </Typography>
      </Box>
    </Box>
  )
}

function DraftPhotoThumb({ photo, onRemove }: { photo: IceProgressPhoto; onRemove?: () => void }) {
  const src = useAuthFileUrl(photo.url)
  const isVideo = photo.kind === 'video' || /\.(mp4|mov|m4v|webm)($|\?)/i.test(`${photo.name}${photo.id}`)
  return (
    <Box sx={{ position: 'relative', width: 140, height: 105 }}>
      {isVideo ? (
        <Box
          component="video"
          src={src || undefined}
          sx={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'common.black' }}
        />
      ) : src ? (
        <Box component="img" src={src} alt={photo.name} sx={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
      ) : (
        <Box sx={{ width: 140, height: 105, bgcolor: 'action.hover', borderRadius: 1 }} />
      )}
      {onRemove ? (
        <IconButton size="small" onClick={onRemove} aria-label={`Remove ${photo.name}`} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1 }}>
          <CloseOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
    </Box>
  )
}

/** Placeholder shown while a picked file is being uploaded; replaced by the server photo when done. */
function LocalPhotoThumb({ item }: { item: PendingPhoto }) {
  return (
    <Box sx={{ position: 'relative', width: 140, height: 105 }}>
      {item.kind === 'video' ? (
        <Box component="video" src={item.url} sx={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'common.black', opacity: 0.55 }} />
      ) : (
        <Box component="img" src={item.url} alt={item.file.name} sx={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', opacity: 0.55 }} />
      )}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: 'text.primary',
        }}
      >
        Uploading…
      </Box>
    </Box>
  )
}

function ProductThumb({ photo }: { photo: IceProgressPhoto }) {
  const src = useAuthFileUrl(photo.url)
  const isVideo = photo.kind === 'video' || /\.(mp4|mov|m4v|webm)($|\?)/i.test(`${photo.name}${photo.id}`)
  if (!src && !isVideo) {
    return null
  }
  if (isVideo) {
    return (
      <Box
        component="video"
        src={src || undefined}
        sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'common.black' }}
      />
    )
  }
  return <Box component="img" src={src ?? undefined} alt="" sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
}

function gameDraftKey(item: IceScoutProduct | null | undefined): string {
  if (!item) {
    return ''
  }
  if (item.is_new_product) {
    const name = String(item.game_name ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return name ? (`n:${name}`).slice(0, 80) : ''
  }
  const id = item.game_ids?.[0] ?? 0
  return id ? `g:${id}` : ''
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

type DraftWarning = { key: string; message: string }

function savedPhotoCount(item: IceScoutProduct): number {
  return (item.photos ?? []).filter((photo) => photo && photo.id && !String(photo.id).startsWith('pending-')).length
}

/**
 * Same split as the original scout form: identity problems always block, the personal rating
 * blocks "Save game" only, and the rest of the questionnaire is a soft warning that stays
 * marked on the game until it is filled in.
 */
function draftIssues(
  item: IceScoutProduct,
  games: IceGame[],
  usedIds: Set<number>,
  options: { needCompetitor?: boolean; forceNew?: boolean; photoOnly?: boolean; uploading?: boolean },
): { blocking: string[]; warnings: DraftWarning[] } {
  const blocking: string[] = []
  const warnings: DraftWarning[] = []
  const warn = (key: string, message: string) => warnings.push({ key, message })
  const photoOnly = Boolean(options.photoOnly)
  const photoSaved = savedPhotoCount(item) > 0

  if (photoOnly && !photoSaved) {
    blocking.push(options.uploading ? 'Wait until the photo or video has finished uploading.' : 'Add a photo or video first.')
  } else if (options.uploading) {
    blocking.push('Wait until the photo or video has finished uploading.')
  }
  if (!item.category && !photoOnly && !photoSaved) {
    blocking.push('Select a category.')
  } else if (!item.category && (photoOnly || photoSaved)) {
    warn('category', 'Category and the other questionnaire fields can be filled in later.')
  }
  if (options.needCompetitor) {
    const typed = (item.competitor_name ?? item.competitor ?? '').trim()
    if (!typed && !(Number(item.competitor_ID) > 0)) {
      blocking.push('Select the competitor.')
    }
  }
  if (item.is_new_product || options.forceNew) {
    if (!item.game_name?.trim()) {
      blocking.push('Enter the new product’s game name.')
    }
  } else if (games.length === 0) {
    blocking.push('This competitor has no games yet. Turn on New product to type a name.')
  } else if (!(item.game_ids ?? []).length) {
    blocking.push(
      games.some((game) => !usedIds.has(game.ID))
        ? 'Select the game this product belongs to.'
        : 'All catalog games are already on this questionnaire. Turn on New product to add another name.',
    )
  } else {
    for (const id of item.game_ids ?? []) {
      if (usedIds.has(id)) {
        blocking.push('That game is already on this questionnaire. Pick a different game.')
        break
      }
    }
  }

  if (item.category && item.played_at !== 'show' && item.played_at !== 'field') {
    warn('played_at', 'Say whether this was played at a show or in the field.')
  }
  if (item.played_at === 'field') {
    if (!String(item.field_market ?? '').trim()) {
      warn('field_market', 'Enter the market where the game was played.')
    }
    if (!String(item.field_venue ?? '').trim()) {
      warn('field_venue', 'Enter the venue where the game was played.')
    }
  }
  const slotSpecs = Boolean(item.category) && item.category !== 'cabinet' && item.category !== 'multigame'
  if (slotSpecs) {
    if (item.progressive_jp === 'yes') {
      if (item.no_progressives === '' || item.no_progressives == null) {
        warn('no_progressives', 'Enter the number of progressives.')
      }
      if (item.no_static === '' || item.no_static == null) {
        warn('no_static', 'Enter the number of static jackpots.')
      }
    }
    if (!(item.functionality ?? []).length) {
      warn('mechanics', 'Select at least one mechanic. Tap ? beside a name if the term is unfamiliar.')
    }
    if (!String(item.win_lines ?? '').trim()) {
      warn('win_lines', 'Enter win-lines.')
    }
    if (item.played_at === 'field') {
      const hasBet = selectedBets(item.bets).length > 0 || String(item.bet_other ?? '').trim() !== ''
      const hasDenom =
        (item.denominations ?? []).length > 0 || String(item.denomination_other ?? '').trim() !== '' || String(item.denomination ?? '').trim() !== ''
      if (!hasBet) {
        warn('bets', 'Enter at least one bet for a live casino play, or type it under Other bet.')
      }
      if (!hasDenom) {
        warn('denoms', 'Enter at least one denomination for a live casino play, or type it under Other denomination.')
      }
    }
  }
  if (item.category === 'cabinet') {
    if (item.number_of_monitors === '' || item.number_of_monitors == null) {
      warn('monitors', 'Enter the number of monitors.')
    }
    if (!String(item.monitor_size ?? '').trim()) {
      warn('monitor_size', 'Enter the monitor size.')
    }
    if (item.uhd !== 'yes' && item.uhd !== 'no') {
      warn('uhd', 'Select UHD yes or no.')
    }
    if (item.video_button_panel !== 'yes' && item.video_button_panel !== 'no') {
      warn('vbp', 'Select Video Button Panel yes or no.')
    } else if (item.video_button_panel === 'yes' && !String(item.vbp_functions ?? '').trim()) {
      warn('vbp_functions', 'Enter the functions of the Video Button Panel.')
    }
  }

  const rating = item.rating ?? {}
  if (ICE_EVAL_CRITERIA.some(({ key }) => scoreValue(rating[key]) === '')) {
    warn('rating', 'Rate every criterion from 1 to 5. 5 means we would want this, 3 means typical, and 1 means well below what we would put on the floor.')
    if (!photoOnly) {
      blocking.push('Rate every criterion from 1 to 5 before saving the game. Use 3 when the game is typical.')
    }
  }
  if (!['yes', 'no', 'unsure'].includes(String(item.would_play ?? ''))) {
    warn('would_play', 'Say whether you would play this game at a casino.')
    if (!photoOnly) {
      blocking.push('Say whether you would play this game at a casino.')
    }
  }
  return { blocking, warnings }
}

function productRated(item: IceScoutProduct): boolean {
  const rating = item.rating ?? {}
  return (
    ICE_EVAL_CRITERIA.every(({ key }) => scoreValue(rating[key]) !== '') && ['yes', 'no', 'unsure'].includes(String(item.would_play ?? ''))
  )
}

function ensureDraftKey(product: IceScoutProduct): string {
  if (product.draft_key && /^[A-Za-z0-9:_-]{1,80}$/.test(product.draft_key)) {
    return product.draft_key
  }
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function IceQuestionnaireForm({
  products,
  drafts = [],
  games,
  competitorId,
  competitorName = '',
  teamMembers,
  updatedBy,
  updatedAt,
  history,
  allCompetitors = [],
  themeWorlds = [],
  mechanicsOptions,
  mechanicsHelp,
  openMode = false,
  forceNewProduct = false,
  onChange,
  onPersist,
  onDraftsChange,
}: {
  products: IceScoutProduct[]
  drafts?: IceScoutProduct[]
  games: IceGame[]
  competitorId: number
  /** Assigned competitor's name (used to look up shared game media). Open questionnaires pick one per product. */
  competitorName?: string
  teamMembers?: string[]
  updatedBy?: string | null
  updatedAt?: string | null
  history?: IceQuestionnaireHistory[]
  allCompetitors?: IceCompetitor[]
  themeWorlds?: string[]
  mechanicsOptions?: Record<string, string>
  mechanicsHelp?: Record<string, string>
  openMode?: boolean
  forceNewProduct?: boolean
  onChange: (next: IceQuestionnaireProducts) => void
  onPersist?: (next: IceQuestionnaireProducts) => Promise<void>
  onDraftsChange?: (next: IceScoutProduct[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [draft, setDraft] = useState<IceScoutProduct>(emptyDraft())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [removedPhotos, setRemovedPhotos] = useState<Array<{ id: string; competitorId: number }>>([])
  const [sharedPhotos, setSharedPhotos] = useState<IceGameMediaPhoto[]>([])
  const [showWarnings, setShowWarnings] = useState(false)
  /** Bumped whenever the dialog opens or closes so late uploads from an old session are discarded. */
  const sessionRef = useRef(0)
  const uploadQueueRef = useRef<Array<{ item: PendingPhoto; session: number; competitorId: number }>>([])
  const uploadsInFlightRef = useRef(0)
  const uploadedThisSessionRef = useRef<Set<string>>(new Set())
  const currentUserId = getStoredUser<AuthUser>()?.ID ?? 0
  const [productDraft, setProductDraft] = useState<{ item: IceScoutProduct; index: number } | null>(null)
  const [modalDirty, setModalDirty] = useState(false)
  const modalLockedRef = useRef(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const theme = useTheme()
  const fullScreenDialog = useMediaQuery(theme.breakpoints.down('md'))
  const draftCompetitorKey = openMode ? 0 : competitorId

  useEffect(() => {
    let cancelled = false
    void readIceProductDraft(draftCompetitorKey).then((pack) => {
      if (!cancelled) {
        setProductDraft(pack)
      }
    })
    return () => {
      cancelled = true
    }
  }, [draftCompetitorKey])

  useEffect(() => {
    if (!open || modalLockedRef.current || !modalDirty) {
      return
    }
    const timer = window.setTimeout(() => {
      if (!iceProductDraftHasContent(draft, openMode)) {
        void clearIceProductDraft(draftCompetitorKey).then(() => setProductDraft(null))
        if (!openMode && draft.draft_key) {
          void deleteIceDraft(competitorId, draft.draft_key).catch(() => undefined)
        }
        return
      }
      const key = ensureDraftKey(draft)
      const withKey = draft.draft_key === key ? draft : { ...draft, draft_key: key }
      if (withKey !== draft) {
        setDraft(withKey)
      }
      const pack = { item: withKey, index: editingIndex ?? -1 }
      void saveIceProductDraft(draftCompetitorKey, pack).then(() => setProductDraft(pack))
      if (!openMode && competitorId > 0) {
        void saveIceDraft(competitorId, key, withKey)
          .then((result) => {
            onDraftsChange?.(
              [result.draft, ...drafts.filter((item) => item.draft_key !== result.draft.draft_key)],
            )
          })
          .catch(() => undefined)
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [draft, open, modalDirty, editingIndex, draftCompetitorKey, openMode, competitorId, drafts, onDraftsChange])

  useEffect(() => {
    if (!open || !modalDirty) {
      return
    }
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [open, modalDirty])

  function patchDraft(next: IceScoutProduct | ((current: IceScoutProduct) => IceScoutProduct)) {
    setModalDirty(true)
    setDraft(next)
  }

  function closeDialog(persistDraft = true) {
    if (persistDraft && modalDirty && iceProductDraftHasContent(draft, openMode)) {
      const pack = { item: draft, index: editingIndex ?? -1 }
      void saveIceProductDraft(draftCompetitorKey, pack).then(() => setProductDraft(pack))
    }
    clearPendingPhotos()
    setOpen(false)
    setModalDirty(false)
  }

  async function clearStoredProductDraft() {
    modalLockedRef.current = true
    await clearIceProductDraft(draftCompetitorKey)
    setProductDraft(null)
    setModalDirty(false)
    modalLockedRef.current = false
  }

  function productDraftLabel(item: IceScoutProduct): string {
    const name = String(item.game_name ?? '').trim()
    if (name) {
      return `Unfinished product “${name}” is stored in this browser.`
    }
    const category = item.category ? ICE_GAME_TYPES[item.category as keyof typeof ICE_GAME_TYPES] : ''
    if (category) {
      return `Unfinished ${category} is stored in this browser.`
    }
    return 'Unfinished product is stored in this browser.'
  }

  function resumeProductDraft() {
    if (!productDraft) {
      return
    }
    const index = productDraft.index
    clearPendingPhotos()
    setDraft(hydrateProduct(productDraft.item))
    setEditingIndex(Number.isFinite(index) && index >= 0 && index < products.length ? index : null)
    setErrors([])
    setShowWarnings(true)
    setModalDirty(false)
    setOpen(true)
  }

  /** Continue a team draft (same fields; your own scores only). */
  function openServerDraft(item: IceScoutProduct) {
    clearPendingPhotos()
    const rest: IceScoutProduct = { ...item }
    delete rest.is_draft
    delete rest.draft_by
    delete rest.draft_at
    setDraft(hydrateProduct(rest))
    setEditingIndex(null)
    setErrors([])
    setShowWarnings(true)
    setModalDirty(false)
    setOpen(true)
  }

  function discardServerDraft(item: IceScoutProduct) {
    const key = item.draft_key
    if (!key || !window.confirm('Discard this draft? The questionnaire is not changed.')) {
      return
    }
    onDraftsChange?.(drafts.filter((entry) => entry.draft_key !== key))
    void deleteIceDraft(competitorId, key).catch(() => undefined)
  }

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

  /** Forget queued/in-flight uploads from the closing dialog and release local previews. */
  function clearPendingPhotos() {
    sessionRef.current += 1
    uploadQueueRef.current = []
    uploadedThisSessionRef.current = new Set()
    setPendingPhotos((current) => {
      releasePending(current)
      return []
    })
    setRemovedPhotos([])
    setSharedPhotos([])
  }

  function openAdd() {
    clearPendingPhotos()
    setDraft({ ...emptyDraft(), is_new_product: forceNewProduct })
    setEditingIndex(null)
    setErrors([])
    setShowWarnings(false)
    setModalDirty(false)
    setOpen(true)
  }

  function openEdit(index: number) {
    clearPendingPhotos()
    setDraft(hydrateProduct(products[index]))
    setEditingIndex(index)
    setErrors([])
    setShowWarnings(true)
    setModalDirty(false)
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

  /** The product as sent to the server (legacy denomination text kept in sync with the checkboxes). */
  function productForSave(item: IceScoutProduct): IceScoutProduct {
    const out: IceScoutProduct = { ...item }
    const ordered = Object.keys(ICE_DENOMINATIONS).filter((value) => (item.denominations ?? []).includes(value))
    const other = String(item.denomination_other ?? '').trim()
    out.denominations = ordered
    out.denomination_other = other
    out.denomination = [...ordered, ...(other ? [other] : [])].join(', ')
    out.bet_other = String(item.bet_other ?? '').trim()
    out.played_at = item.played_at === 'field' ? 'field' : 'show'
    out.field_market = out.played_at === 'field' ? String(item.field_market ?? '').trim() : ''
    out.field_venue = out.played_at === 'field' ? String(item.field_venue ?? '').trim() : ''
    out.eval_note = String(item.eval_note ?? '').trim()
    if (!openMode && !String(out.competitor_name ?? '').trim() && competitorName) {
      out.competitor_name = competitorName
    }
    out.photos = (item.photos ?? []).filter((photo) => photo && photo.id && !String(photo.id).startsWith('pending-'))
    return out
  }

  /** Saved product for the same catalog game / new-product name, so a draft replaces it instead of duplicating. */
  function officialIndexFor(item: IceScoutProduct): number {
    const key = gameDraftKey(item)
    if (!key) {
      return -1
    }
    return products.findIndex((entry) => gameDraftKey(entry) === key)
  }

  /**
   * Save game (photoOnly = false): identity and the full personal rating are required.
   * Save photo now (photoOnly = true): needs a saved photo; everything else stays a warning.
   */
  async function commitDraft(photoOnly: boolean) {
    const used = usedIds(editingIndex)
    const issues = draftIssues(draft, gamesForDraft, used, {
      needCompetitor: openMode,
      forceNew: forceNewProduct,
      photoOnly,
      uploading: pendingPhotos.length > 0,
    })
    setShowWarnings(true)
    if (issues.blocking.length) {
      setErrors(issues.blocking)
      return
    }
    setErrors([])
    setSaving(true)
    try {
      const product = productForSave(draft)
      const next = [...products]
      const index = editingIndex !== null ? editingIndex : officialIndexFor(product)
      if (index >= 0 && index < next.length) {
        next[index] = product
      } else {
        next.push(product)
      }
      await persist(next)
      for (const removed of removedPhotos) {
        try {
          await deleteIcePhoto(removed.competitorId, removed.id)
        } catch {
          // The picture is already gone from the saved questionnaire.
        }
      }
      if (!openMode && product.draft_key) {
        void deleteIceDraft(competitorId, product.draft_key).catch(() => undefined)
      }
      await clearStoredProductDraft()
      clearPendingPhotos()
      setOpen(false)
      setModalDirty(false)
    } catch (error) {
      setErrors([error instanceof ApiError ? error.message : 'Could not save the questionnaire.'])
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(index: number) {
    if (!window.confirm('Remove this product from the questionnaire?')) {
      return
    }
    const next = products.filter((_, i) => i !== index)
    try {
      await persist(next)
    } catch {
      // Ice2027Page already shows the save error.
    }
  }

  function pumpUploads() {
    while (uploadsInFlightRef.current < PHOTO_UPLOAD_CONCURRENCY && uploadQueueRef.current.length > 0) {
      const job = uploadQueueRef.current.shift()
      if (!job) {
        break
      }
      uploadsInFlightRef.current += 1
      void runUpload(job).finally(() => {
        uploadsInFlightRef.current -= 1
        pumpUploads()
      })
    }
  }

  async function runUpload(job: { item: PendingPhoto; session: number; competitorId: number }) {
    const { item } = job
    const stale = () => job.session !== sessionRef.current
    try {
      const ready = item.kind === 'video' ? item.file : await compressPhoto(item.file)
      const limit = item.kind === 'video' ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES
      if (ready.size > limit) {
        throw new Error(item.kind === 'video' ? 'Videos must be 400 MB or smaller.' : 'Pictures must be 10 MB or smaller.')
      }
      const result = await uploadIcePhoto(job.competitorId, ready)
      if (stale()) {
        // The dialog was closed or reopened meanwhile: do not leave an orphan file behind.
        void deleteIcePhoto(job.competitorId, result.photo.id).catch(() => undefined)
        return
      }
      uploadedThisSessionRef.current.add(result.photo.id)
      // Replace the placeholder with the server photo id.
      setPendingPhotos((current) => {
        const found = current.find((entry) => entry.id === item.id)
        if (found) {
          URL.revokeObjectURL(found.url)
        }
        return current.filter((entry) => entry.id !== item.id)
      })
      setDraft((current) => ({ ...current, photos: [...(current.photos ?? []), result.photo] }))
      setModalDirty(true)
    } catch (error) {
      if (stale()) {
        return
      }
      setPendingPhotos((current) => {
        const found = current.find((entry) => entry.id === item.id)
        if (found) {
          URL.revokeObjectURL(found.url)
        }
        return current.filter((entry) => entry.id !== item.id)
      })
      const message = error instanceof Error ? error.message : 'Could not upload the file.'
      setErrors((current) => [...current.filter((entry) => !entry.startsWith(`${item.file.name}:`)), `${item.file.name}: ${message}`])
    }
  }

  /** Photos upload as soon as they are picked; the placeholder is replaced by the server photo. */
  function queuePhotos(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }
    const problems: string[] = []
    const queued: PendingPhoto[] = []
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name)
      if (isVideo && file.size > VIDEO_MAX_BYTES) {
        problems.push('Videos must be 400 MB or smaller.')
        continue
      }
      if (!isVideo && file.size > 40 * 1024 * 1024) {
        problems.push('That picture is too large to prepare for upload.')
        continue
      }
      queued.push({
        id: `pending-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
        kind: isVideo ? 'video' : 'image',
      })
    }
    if (problems.length) {
      setErrors(problems)
    } else if (queued.length) {
      setErrors([])
    }
    if (queued.length === 0) {
      return
    }
    setModalDirty(true)
    setPendingPhotos((current) => [...current, ...queued])
    for (const item of queued) {
      uploadQueueRef.current.push({ item, session: sessionRef.current, competitorId })
    }
    pumpUploads()
  }

  function canDeletePhoto(photo: { id: string }): boolean {
    return currentUserId > 0 && photoUploaderId(photo) === currentUserId
  }

  /** Remove a picture from this product. Only the uploader may delete the file itself. */
  function removePhoto(photo: IceProgressPhoto) {
    if (!canDeletePhoto(photo)) {
      return
    }
    setModalDirty(true)
    setSharedPhotos((current) => current.filter((entry) => entry.id !== photo.id))
    const inProduct = (draft.photos ?? []).some((entry) => entry.id === photo.id)
    setDraft((current) => ({ ...current, photos: (current.photos ?? []).filter((entry) => entry.id !== photo.id) }))
    if (uploadedThisSessionRef.current.has(photo.id) || !inProduct) {
      // Uploaded in this dialog (not in any saved product yet), or a file from another saved product of yours.
      uploadedThisSessionRef.current.delete(photo.id)
      void deleteIcePhoto(photoCompetitorId(photo, competitorId), photo.id).catch(() => undefined)
      return
    }
    // Part of the saved product: delete the file only once the product is saved without it.
    setRemovedPhotos((current) =>
      current.some((entry) => entry.id === photo.id) ? current : [...current, { id: photo.id, competitorId: photoCompetitorId(photo, competitorId) }],
    )
  }

  const isNew = Boolean(draft.is_new_product) || forceNewProduct
  const isMultigame = draft.category === 'multigame'
  const isCabinet = draft.category === 'cabinet'
  const selectedCompetitorId = Number(draft.competitor_ID) > 0 ? Number(draft.competitor_ID) : 0
  const gamesForDraft = openMode
    ? games.filter((game) => (selectedCompetitorId > 0 ? game.competitor_ID === selectedCompetitorId : false))
    : games
  const selectedGameId = draft.game_ids?.[0] ?? 0
  const available = gamesForDraft.filter((game) => !usedIds(editingIndex).has(game.ID) || game.ID === selectedGameId)
  const pastHistory = (history ?? []).filter((entry) => !entry.is_current)
  const gamePlaceholder = games.length === 0 ? 'No games for this competitor' : available.length === 0 ? 'All games already on this questionnaire' : 'Select a game…'
  const uploading = pendingPhotos.length > 0
  const mediaGameName = isNew ? String(draft.game_name ?? '').trim() : (games.find((game) => game.ID === selectedGameId)?.name ?? '')
  const mediaGameId = isNew ? 0 : selectedGameId
  const mediaCompetitorName = openMode ? String(draft.competitor_name ?? '').trim() : competitorName

  // Pictures already saved for this competitor + game (every questionnaire), refreshed when the game changes.
  useEffect(() => {
    if (!open || (mediaGameId < 1 && !mediaGameName)) {
      setSharedPhotos([])
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void getIceGameMedia({ gameId: mediaGameId, gameName: mediaGameName, competitorName: mediaCompetitorName })
        .then((result) => {
          if (!cancelled) {
            setSharedPhotos(result.photos ?? [])
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSharedPhotos([])
          }
        })
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, mediaGameId, mediaGameName, mediaCompetitorName])

  // Soft warnings: shown next to the fields once the game was opened for editing or a save was tried.
  const warns: Record<string, string> = {}
  if (open && showWarnings) {
    for (const warning of draftIssues(draft, gamesForDraft, usedIds(editingIndex), { needCompetitor: openMode, forceNew: forceNewProduct }).warnings) {
      warns[warning.key] = warning.message
    }
  }
  const sharedExtra = sharedPhotos.filter((photo) => !(draft.photos ?? []).some((entry) => entry.id === photo.id))

  return (
    <>
      {productDraft ? (
        <Alert
          severity="warning"
          sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <AppButton size="small" variant="contained" color="warning" onClick={resumeProductDraft}>
                Continue
              </AppButton>
              <AppButton
                size="small"
                variant="outlined"
                color="secondary"
                onClick={() => {
                  void clearStoredProductDraft().then(() => {
                    if (open) {
                      setDraft({ ...emptyDraft(), is_new_product: forceNewProduct })
                      setEditingIndex(null)
                    }
                  })
                }}
              >
                Discard
              </AppButton>
            </Box>
          }
        >
          {productDraftLabel(productDraft.item)}
        </Alert>
      ) : null}

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
            <AppButton
              size="small"
              variant="contained"
              color="inherit"
              startIcon={<AddOutlinedIcon />}
              onClick={openAdd}
              sx={{ color: 'secondary.main', bgcolor: 'common.white', width: { xs: '100%', sm: 'auto' }, minHeight: { xs: 44 } }}
            >
              Add product
            </AppButton>
          }
        />
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            The questionnaire and your rating for each game are one form. <strong>Save game</strong> needs your 1–5 score on every criterion and whether you would play it. Your score goes into your own evaluation and is not shared with your teammate. Other missing details stay marked. A photo or video can be saved on its own with <strong>Save photo now</strong>. Fields marked with <strong>*</strong> are required.
            {openMode
              ? ' Select the competitor, or type a new competitor name, then pick a catalog game or turn on New product. You can upload pictures and video.'
              : forceNewProduct
                ? ' There are no catalog games yet, so add each game as a new product. You can upload pictures and video.'
                : ' Turn on New product to type a game name; leave it off to pick this competitor’s games. You can also upload pictures and video.'}
          </Typography>
          {drafts.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, mb: 1 }}>Unfinished drafts</Typography>
              <Box sx={{ display: 'grid', gap: 1 }}>
                {drafts.map((item) => (
                  <Paper key={item.draft_key ?? `${item.game_name}-${item.draft_at}`} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {item.game_name || ICE_GAME_TYPES[item.category as keyof typeof ICE_GAME_TYPES] || 'Draft product'}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
                          Draft{item.draft_by ? ` by ${item.draft_by}` : ''}
                          {item.draft_at ? ` · ${item.draft_at}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip size="small" color="warning" label="Draft" sx={{ fontWeight: 700 }} />
                        <AppButton size="small" variant="outlined" color="secondary" onClick={() => openServerDraft(item)}>
                          Continue
                        </AppButton>
                        <AppButton size="small" variant="outlined" color="error" onClick={() => discardServerDraft(item)}>
                          Discard
                        </AppButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          ) : null}
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
                    <Typography sx={{ fontWeight: 800 }}>
                      {productTitle(item, games)}{' '}
                      {productRated(item) ? (
                        <Chip size="small" color="success" label="Rated" sx={{ fontWeight: 700, ml: 0.5 }} />
                      ) : (
                        <Chip size="small" color="warning" variant="outlined" label="Rating missing" sx={{ fontWeight: 700, ml: 0.5 }} />
                      )}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                      {(ICE_GAME_TYPES[(item.category ?? '') as keyof typeof ICE_GAME_TYPES] ?? item.category ?? 'Product')
                        + (item.is_new_product ? ' · New product' : '')
                        + (openMode && (item.competitor_name || item.competitor) ? ` · ${item.competitor_name || item.competitor}` : '')}
                    </Typography>
                    {item.category === 'cabinet' ? (
                      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                        {[
                          item.number_of_monitors ? `${item.number_of_monitors} monitors` : null,
                          item.monitor_size,
                          item.uhd === 'yes' ? 'UHD' : item.uhd === 'no' ? 'no UHD' : null,
                          item.video_button_panel === 'yes' ? (item.vbp_functions ? `VBP: ${item.vbp_functions}` : 'VBP') : item.video_button_panel === 'no' ? 'no VBP' : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    ) : null}
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

      <Dialog open={open} onClose={() => closeDialog(true)} maxWidth="md" fullWidth fullScreen={fullScreenDialog} scroll="paper">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1, px: { xs: 1.5, md: 3 }, py: { xs: 1.25, md: 2 }, fontSize: { xs: '1.05rem', md: undefined } }}>
          {editingIndex === null ? 'Add product' : 'Edit product'}
          <IconButton aria-label="Close" onClick={() => closeDialog(true)} sx={{ ml: 'auto' }}>
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 1.5, md: 2 } }}>
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

          <Box sx={{ p: { xs: 1.25, md: 1.5 }, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }} hidden={forceNewProduct}>
            <FormControlLabel
              sx={{ ml: 0 }}
              control={
                <Switch
                  checked={isNew}
                  onChange={(_, checked) =>
                    patchDraft((current) => ({
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
              sx={mobileFieldSx}
              value={draft.category ?? ''}
              onChange={(event) => patchDraft((current) => ({ ...current, category: event.target.value }))}
            >
              <MenuItem value="">Select category…</MenuItem>
              {CATEGORIES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </AppTextField>
            <Warn text={warns.category} />
          </Box>

          {openMode ? (
            <Box sx={{ mb: 2 }}>
              <FieldLabel required>Competitor</FieldLabel>
              <AppTextField
                select
                size="small"
                fullWidth
                sx={mobileFieldSx}
                value={draft.competitor_ID === '__new__' ? '__new__' : selectedCompetitorId ? String(selectedCompetitorId) : ''}
                onChange={(event) => {
                  const value = event.target.value
                  patchDraft((current) => ({
                    ...current,
                    competitor_ID: value,
                    competitor_name: value === '__new__' ? current.competitor_name : allCompetitors.find((item) => String(item.ID) === value)?.name ?? '',
                    game_ids: [],
                  }))
                }}
              >
                <MenuItem value="">Select competitor…</MenuItem>
                {allCompetitors.map((item) => (
                  <MenuItem key={item.ID} value={String(item.ID)}>
                    {item.name}
                  </MenuItem>
                ))}
                <MenuItem value="__new__">Type a new competitor name</MenuItem>
              </AppTextField>
              {draft.competitor_ID === '__new__' ? (
                <AppTextField
                  size="small"
                  fullWidth
                  sx={{ mt: 1, ...mobileFieldSx }}
                  placeholder="New competitor name"
                  value={draft.competitor_name ?? ''}
                  onChange={(event) => patchDraft((current) => ({ ...current, competitor_name: event.target.value }))}
                />
              ) : null}
            </Box>
          ) : null}

          {isNew ? (
            <Box sx={{ mb: 2 }}>
              <FieldLabel required>Game name</FieldLabel>
              <AppTextField
                size="small"
                fullWidth
                sx={mobileFieldSx}
                placeholder="Name of the new game"
                value={draft.game_name ?? ''}
                onChange={(event) => patchDraft((current) => ({ ...current, game_name: event.target.value }))}
              />
            </Box>
          ) : (
            <Box sx={{ mb: 2 }}>
              <FieldLabel required>Game</FieldLabel>
              <AppTextField
                select
                size="small"
                fullWidth
                sx={mobileFieldSx}
                disabled={available.length === 0}
                value={selectedGameId ? String(selectedGameId) : ''}
                onChange={(event) => {
                  const id = Number(event.target.value)
                  patchDraft((current) => ({ ...current, game_ids: id > 0 ? [id] : [] }))
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

          <PlayedAtFields product={draft} warns={warns} onChange={(next) => patchDraft((current) => ({ ...current, ...next }))} />

          {isMultigame ? (
            <MultigameFields product={draft} onChange={(next) => patchDraft((current) => ({ ...current, ...next }))} />
          ) : (
            <StandardFields
              product={draft}
              cabinet={isCabinet}
              themeWorlds={themeWorlds}
              mechanicsOptions={mechanicsOptions}
              mechanicsHelp={mechanicsHelp}
              warns={warns}
              onChange={(next) => patchDraft((current) => ({ ...current, ...next }))}
            />
          )}

          <RatingFields product={draft} warns={warns} onChange={(next) => patchDraft((current) => ({ ...current, ...next }))} />

          <Box sx={{ mt: 1 }}>
            <Typography sx={{ mb: 1 }}>Game pictures</Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                gap: 1,
                mb: 1,
                '& .MuiButton-root': { minHeight: 44, width: '100%' },
              }}
            >
              <AppButton size="small" variant="outlined" color="secondary" startIcon={<PhotoCameraOutlinedIcon />} onClick={() => cameraRef.current?.click()}>
                Take photo
              </AppButton>
              <AppButton size="small" variant="outlined" color="secondary" startIcon={<PhotoLibraryOutlinedIcon />} onClick={() => libraryRef.current?.click()}>
                Upload from phone
              </AppButton>
              <AppButton
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<VideocamOutlinedIcon />}
                onClick={() => videoRef.current?.click()}
                sx={{ gridColumn: '1 / -1' }}
              >
                Upload video
              </AppButton>
            </Box>
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1 }}>
              Pick the competitor and the game, add a photo or video, then press <strong>Save photo now</strong>. Category, mechanics, bets, and the rating can be filled in later; they stay marked on the game. On a phone, Take photo opens the camera and Upload from phone opens the gallery. JPG, PNG, and HEIC are accepted; video (MP4/MOV) up to 400 MB.
            </Typography>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*,.heic,.heif"
              capture="environment"
              hidden
              onChange={(event) => {
                queuePhotos(event.target.files)
                event.target.value = ''
              }}
            />
            <input
              ref={libraryRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              hidden
              onChange={(event) => {
                queuePhotos(event.target.files)
                event.target.value = ''
              }}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm"
              hidden
              onChange={(event) => {
                queuePhotos(event.target.files)
                event.target.value = ''
              }}
            />
            {uploading ? (
              <Typography sx={{ color: 'warning.dark', fontSize: 13, fontWeight: 700, mb: 1 }} role="status">
                Uploading {pendingPhotos.length} file{pendingPhotos.length === 1 ? '' : 's'}… Wait before saving.
              </Typography>
            ) : null}
            <Typography sx={{ color: 'text.secondary', fontSize: 13, mb: 1 }}>
              Files upload as soon as you pick them. Pictures already saved for this game are shown below; only a file you uploaded has a remove button.
            </Typography>
            {(draft.photos ?? []).length > 0 || pendingPhotos.length > 0 || sharedExtra.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                {(draft.photos ?? []).map((photo) => (
                  <DraftPhotoThumb key={photo.id} photo={photo} onRemove={canDeletePhoto(photo) ? () => removePhoto(photo) : undefined} />
                ))}
                {pendingPhotos.map((item) => (
                  <LocalPhotoThumb key={item.id} item={item} />
                ))}
                {sharedExtra.map((photo) => (
                  <DraftPhotoThumb
                    key={`shared-${photo.id}`}
                    photo={photo}
                    onRemove={photo.can_delete ? () => removePhoto(photo) : undefined}
                  />
                ))}
              </Box>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 5,
            flexShrink: 0,
            gap: 1,
            px: { xs: 1.5, md: 3 },
            pt: { xs: 1.25, md: 2 },
            pb: { xs: 'calc(0.65rem + env(safe-area-inset-bottom, 0px))', md: 2 },
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            '& > :not(style)': { flex: { xs: 1, md: '0 0 auto' }, minHeight: { xs: 44 } },
          }}
        >
          <AppButton size="medium" variant="outlined" color="secondary" onClick={() => closeDialog(true)}>
            Cancel
          </AppButton>
          <AppButton size="medium" variant="outlined" color="secondary" disabled={saving} onClick={() => void commitDraft(true)}>
            {saving ? 'Saving…' : 'Save photo now'}
          </AppButton>
          <AppButton size="medium" color="secondary" disabled={saving} onClick={() => void commitDraft(false)}>
            {saving ? 'Saving…' : 'Save game'}
          </AppButton>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth fullScreen={fullScreenDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', px: { xs: 1.5, md: 3 }, py: { xs: 1.25, md: 2 } }}>
          History
          <IconButton aria-label="Close" onClick={() => setHistoryOpen(false)} sx={{ ml: 'auto' }}>
            <CloseOutlinedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1.5, md: 3 } }}>
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
                    if (!window.confirm('Restore this version? It will be saved for the whole team.')) {
                      return
                    }
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

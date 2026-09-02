import type { ReactNode } from 'react'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { IceMultigameProduct, IceQuestionnaireProducts, IceStandardProduct } from '@/api/ice2027'
import { AppButton, AppTextField } from '@/components/ui'
import { IceSectionHead } from './IceChrome'

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

function asList<T>(items: T[] | undefined): T[] {
  return Array.isArray(items) && items.length > 0 ? items.map((item) => ({ ...item })) : [{} as T]
}

export function emptyProducts(saved?: IceQuestionnaireProducts | null): IceQuestionnaireProducts {
  return {
    new: asList<IceStandardProduct>(saved?.new),
    mlp: asList<IceStandardProduct>(saved?.mlp),
    sap: asList<IceStandardProduct>(saved?.sap),
    multigame: asList<IceMultigameProduct>(saved?.multigame),
  }
}

function YesNo({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (next: 'yes' | 'no') => void
  label: string
}) {
  const current = value === 'yes' ? 'yes' : 'no'
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontWeight: 700, mb: 0.75 }}>{label}</Typography>
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

function ProductShell({
  label,
  index,
  canRemove,
  onRemove,
  children,
}: {
  label: string
  index: number
  canRemove: boolean
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '4px solid',
        borderLeftColor: 'primary.main',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 800, flex: 1 }}>
          {label} {index + 1}
        </Typography>
        {canRemove ? (
          <IconButton size="small" aria-label={`Remove ${label}`} onClick={onRemove}>
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        ) : null}
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  )
}

function StandardFields({
  product,
  withCategory,
  onChange,
}: {
  product: IceStandardProduct
  withCategory: boolean
  onChange: (next: IceStandardProduct) => void
}) {
  const functions = Array.isArray(product.functionality) ? product.functionality : []
  const jpYes = product.progressive_jp === 'yes'

  function toggleFn(value: string, checked: boolean) {
    const next = checked ? [...functions.filter((item) => item !== value), value] : functions.filter((item) => item !== value)
    onChange({ ...product, functionality: next })
  }

  return (
    <>
      {withCategory ? (
        <AppTextField
          select
          label="Category"
          size="small"
          sx={{ mb: 2 }}
          value={product.category ?? ''}
          onChange={(event) => onChange({ ...product, category: event.target.value })}
        >
          <MenuItem value="">Select category…</MenuItem>
          {CATEGORIES.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </AppTextField>
      ) : null}

      <YesNo
        label="Progressive JP"
        value={String(product.progressive_jp ?? 'no')}
        onChange={(next) => onChange({ ...product, progressive_jp: next })}
      />
      {jpYes ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
          <AppTextField
            type="number"
            size="small"
            label="No. Progressives"
            value={product.no_progressives ?? ''}
            onChange={(event) => onChange({ ...product, no_progressives: event.target.value })}
          />
          <AppTextField
            type="number"
            size="small"
            label="No. Static"
            value={product.no_static ?? ''}
            onChange={(event) => onChange({ ...product, no_static: event.target.value })}
          />
        </Box>
      ) : null}

      <Typography sx={{ fontWeight: 700, mb: 0.75 }}>Functionality</Typography>
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
        <AppTextField
          type="number"
          size="small"
          label="No. of Pots"
          sx={{ my: 1 }}
          value={product.no_of_pots ?? ''}
          onChange={(event) => onChange({ ...product, no_of_pots: event.target.value })}
        />
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

      <AppTextField size="small" label="Win-Lines" sx={{ mb: 2 }} value={product.win_lines ?? ''} onChange={(event) => onChange({ ...product, win_lines: event.target.value })} />
      <AppTextField size="small" label="Denomination Structure" sx={{ mb: 2 }} value={product.denomination ?? ''} onChange={(event) => onChange({ ...product, denomination: event.target.value })} />
      <AppTextField size="small" label="Theme" sx={{ mb: 2 }} value={product.theme ?? ''} onChange={(event) => onChange({ ...product, theme: event.target.value })} />
      <AppTextField size="small" label="Cabinet" sx={{ mb: 2 }} value={product.cabinet ?? ''} onChange={(event) => onChange({ ...product, cabinet: event.target.value })} />
      <AppTextField size="small" label="Target Market" sx={{ mb: 2 }} value={product.target_market ?? ''} onChange={(event) => onChange({ ...product, target_market: event.target.value })} />
      <AppTextField multiline minRows={3} size="small" label="USP" value={product.usp ?? ''} onChange={(event) => onChange({ ...product, usp: event.target.value })} />
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
        <AppTextField
          type="number"
          size="small"
          label="If yes: Number"
          sx={{ mb: 2 }}
          value={product.integrated_jp_number ?? ''}
          onChange={(event) => onChange({ ...product, integrated_jp_number: event.target.value })}
        />
      ) : null}
      <AppTextField
        type="number"
        size="small"
        label="Number of categories"
        sx={{ mb: 2 }}
        value={product.number_of_categories ?? ''}
        onChange={(event) => onChange({ ...product, number_of_categories: event.target.value })}
      />
      <AppTextField
        type="number"
        size="small"
        label="Number of games"
        value={product.number_of_games ?? ''}
        onChange={(event) => onChange({ ...product, number_of_games: event.target.value })}
      />
    </>
  )
}

function SlotGrid({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
      {children}
    </Box>
  )
}

export function IceQuestionnaireForm({
  products,
  onChange,
}: {
  products: IceQuestionnaireProducts
  onChange: (next: IceQuestionnaireProducts) => void
}) {
  const news = products.new ?? [{}]
  const mlps = products.mlp ?? [{}]
  const saps = products.sap ?? [{}]
  const mgs = products.multigame ?? [{}]

  return (
    <>
      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <IceSectionHead title="New Products" />
        <Box sx={{ p: 2.5 }}>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>
            Select MLP, SAP, Multigame or Cabinet, then add the product details.
          </Typography>
          <SlotGrid>
            {news.map((product, index) => (
              <ProductShell
                key={`new-${index}`}
                label="NEW"
                index={index}
                canRemove={news.length > 1}
                onRemove={() => onChange({ ...products, new: news.filter((_, i) => i !== index) })}
              >
                <StandardFields
                  withCategory
                  product={product}
                  onChange={(next) => onChange({ ...products, new: news.map((item, i) => (i === index ? next : item)) })}
                />
              </ProductShell>
            ))}
          </SlotGrid>
          <AppButton variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ mt: 2 }} onClick={() => onChange({ ...products, new: [...news, {}] })}>
            Add product
          </AppButton>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <IceSectionHead title="Further Highlights — MLP" />
        <Box sx={{ p: 2.5 }}>
          <SlotGrid>
            {mlps.map((product, index) => (
              <ProductShell
                key={`mlp-${index}`}
                label="MLP"
                index={index}
                canRemove={mlps.length > 1}
                onRemove={() => onChange({ ...products, mlp: mlps.filter((_, i) => i !== index) })}
              >
                <StandardFields
                  withCategory={false}
                  product={product}
                  onChange={(next) => onChange({ ...products, mlp: mlps.map((item, i) => (i === index ? next : item)) })}
                />
              </ProductShell>
            ))}
          </SlotGrid>
          <AppButton variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ mt: 2 }} onClick={() => onChange({ ...products, mlp: [...mlps, {}] })}>
            Add MLP
          </AppButton>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <IceSectionHead title="Further Highlights — SAP" />
        <Box sx={{ p: 2.5 }}>
          <SlotGrid>
            {saps.map((product, index) => (
              <ProductShell
                key={`sap-${index}`}
                label="SAP"
                index={index}
                canRemove={saps.length > 1}
                onRemove={() => onChange({ ...products, sap: saps.filter((_, i) => i !== index) })}
              >
                <StandardFields
                  withCategory={false}
                  product={product}
                  onChange={(next) => onChange({ ...products, sap: saps.map((item, i) => (i === index ? next : item)) })}
                />
              </ProductShell>
            ))}
          </SlotGrid>
          <AppButton variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ mt: 2 }} onClick={() => onChange({ ...products, sap: [...saps, {}] })}>
            Add SAP
          </AppButton>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ mb: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <IceSectionHead title="Further Highlights — Multigame" />
        <Box sx={{ p: 2.5 }}>
          <SlotGrid>
            {mgs.map((product, index) => (
              <ProductShell
                key={`mg-${index}`}
                label="Multigame"
                index={index}
                canRemove={mgs.length > 1}
                onRemove={() => onChange({ ...products, multigame: mgs.filter((_, i) => i !== index) })}
              >
                <MultigameFields
                  product={product}
                  onChange={(next) => onChange({ ...products, multigame: mgs.map((item, i) => (i === index ? next : item)) })}
                />
              </ProductShell>
            ))}
          </SlotGrid>
          <AppButton variant="outlined" startIcon={<AddOutlinedIcon />} sx={{ mt: 2 }} onClick={() => onChange({ ...products, multigame: [...mgs, {}] })}>
            Add Multigame
          </AppButton>
        </Box>
      </Paper>
    </>
  )
}

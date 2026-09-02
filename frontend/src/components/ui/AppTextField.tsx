import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import type { TextFieldProps } from '@mui/material/TextField'

export type AppTextFieldProps = TextFieldProps & {
  startIcon?: ReactNode
}

export const AppTextField = forwardRef<HTMLDivElement, AppTextFieldProps>(
  function AppTextField({ startIcon, slotProps, ...props }, ref) {
    const inputSlot = slotProps?.input
    const inputSlotProps =
      inputSlot && typeof inputSlot === 'object' ? inputSlot : undefined

    return (
      <TextField
        ref={ref}
        fullWidth
        variant="outlined"
        {...props}
        slotProps={{
          ...slotProps,
          input: {
            ...inputSlotProps,
            startAdornment: startIcon ? (
              <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                {startIcon}
              </InputAdornment>
            ) : inputSlotProps?.startAdornment,
          },
        }}
      />
    )
  },
)

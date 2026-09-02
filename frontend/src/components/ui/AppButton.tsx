import { forwardRef } from 'react'
import Button from '@mui/material/Button'
import type { ButtonProps } from '@mui/material/Button'

export type AppButtonProps = ButtonProps

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(
    { variant = 'contained', color = 'primary', size = 'large', ...props },
    ref,
  ) {
    return (
      <Button
        ref={ref}
        variant={variant}
        color={color}
        size={size}
        {...props}
      />
    )
  },
)

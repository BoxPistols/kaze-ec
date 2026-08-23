import type { ElementType, ReactNode } from 'react'
import MuiIconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { alpha, useTheme } from '@mui/material/styles'

/**
 * kaze の IconButton 仕様（get_component('iconButton')）から再生成。
 * kaze-ux 側の実装（@/components/ui/icon-button）は import せず、
 * props 契約（variant / color / size / tooltip / aria-label 必須）だけを
 * 見て MUI IconButton + Tooltip でここに書き直している
 */
export interface AppIconButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'outlined' | 'filled' | 'ghost'
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'inherit'
  size?: 'small' | 'medium' | 'large'
  active?: boolean
  disabled?: boolean
  tooltip: string
  'aria-label': string
  /** react-router の Link 等、別要素としてレンダリングしたいとき */
  component?: ElementType
  to?: string
}

export const AppIconButton = ({
  children,
  onClick,
  variant = 'default',
  color = 'inherit',
  size = 'medium',
  active = false,
  disabled = false,
  tooltip,
  'aria-label': ariaLabel,
  component,
  to,
}: AppIconButtonProps) => {
  const theme = useTheme()
  const tone = color === 'inherit' ? theme.palette.text.primary : theme.palette[color].main

  const variantSx =
    variant === 'outlined'
      ? { border: `1px solid ${alpha(tone, 0.4)}` }
      : variant === 'filled'
        ? { bgcolor: alpha(tone, active ? 0.24 : 0.12) }
        : variant === 'ghost'
          ? { bgcolor: 'transparent' }
          : {}

  const commonProps = {
    onClick,
    color,
    size,
    disabled,
    'aria-label': ariaLabel,
    sx: {
      ...variantSx,
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
    },
  } as const

  return (
    <Tooltip title={tooltip}>
      <span>
        {component ? (
          <MuiIconButton component={component} to={to} {...commonProps}>
            {children}
          </MuiIconButton>
        ) : (
          <MuiIconButton {...commonProps}>{children}</MuiIconButton>
        )}
      </span>
    </Tooltip>
  )
}

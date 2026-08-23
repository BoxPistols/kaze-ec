import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/cn'

/**
 * kaze の Chip 仕様（get_component('chip')）から再生成。ただし **MUI を使わず**
 * Tailwind + CVA で実装している。
 *
 * kaze-ux 側の Chip は import が '@mui/material' なので、そのまま使えば
 * 「MUI をテーマ適用しただけ」になる。ここではあえて別の実装技術で同じ
 * props 契約（label / variant / color / size / clickable / disabled）を
 * 満たし、**仕様と実装が分離できていること**を実証する。
 * 色は CSS 変数（src/theme/cssVars.ts が MUI テーマから流す）を見ているので、
 * トークンの単一ソースは MUI 側と共通のまま
 */
const tagChipVariants = cva(
  'inline-flex items-center gap-1 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      color: {
        default: '',
        primary: '',
        success: '',
        warning: '',
        error: '',
      },
      variant: {
        filled: '',
        outlined: 'bg-transparent border',
      },
      size: {
        small: 'text-xs px-2.5 py-0.5',
        medium: 'text-sm px-3 py-1',
      },
      clickable: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'filled', color: 'default', class: 'bg-surface-muted text-content' },
      { variant: 'filled', color: 'primary', class: 'bg-primary text-primary-contrast' },
      { variant: 'filled', color: 'success', class: 'bg-success text-success-contrast' },
      { variant: 'filled', color: 'warning', class: 'bg-warning text-warning-contrast' },
      { variant: 'filled', color: 'error', class: 'bg-error text-error-contrast' },
      { variant: 'outlined', color: 'default', class: 'border-divider text-content-muted' },
      { variant: 'outlined', color: 'primary', class: 'border-primary text-primary' },
      { variant: 'outlined', color: 'success', class: 'border-success text-success' },
      { variant: 'outlined', color: 'warning', class: 'border-warning text-warning' },
      { variant: 'outlined', color: 'error', class: 'border-error text-error' },
    ],
    defaultVariants: {
      color: 'default',
      variant: 'filled',
      size: 'small',
      clickable: false,
    },
  }
)

export interface TagChipProps extends VariantProps<typeof tagChipVariants> {
  label: ReactNode
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  className?: string
}

export const TagChip = ({
  label,
  color,
  variant,
  size,
  clickable,
  onClick,
  disabled = false,
  selected = false,
  className,
}: TagChipProps) => {
  const classes = cn(
    tagChipVariants({ color, variant, size, clickable: clickable ?? Boolean(onClick) }),
    selected && 'ring-2 ring-primary ring-offset-1 ring-offset-surface',
    className
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
        className={classes}
      >
        {label}
      </button>
    )
  }

  return <span className={classes}>{label}</span>
}

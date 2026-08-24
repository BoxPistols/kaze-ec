import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * kaze の CustomTextField 仕様（get_component('customTextField')）から再生成。
 * import が kaze-ux 内部パスなので実装は持ってこられない。MUI の TextField
 * ではなく **素の input / textarea + Tailwind** で props 契約
 * （label / placeholder / required / error / helperText / disabled / size /
 * aria-*）を満たす。
 *
 * SearchField も同じ仕様からの再生成だが、あちらは検索用途に特化している
 * （type=search・検索アイコン）。同じ仕様から用途違いの実装を作るのは
 * regenerated-tailwind の想定内
 */
export interface FormFieldProps {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  helperText?: string
  required?: boolean
  error?: boolean
  disabled?: boolean
  size?: 'small' | 'medium'
  /** 複数行にする場合の行数。未指定なら 1 行の input */
  rows?: number
  /** モバイルでテンキーを出したいときに 'numeric' */
  inputMode?: 'text' | 'numeric'
  /** 入力欄の前に置く記号（¥ など） */
  prefix?: ReactNode
  className?: string
}

export const FormField = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  required = false,
  error = false,
  disabled = false,
  size = 'medium',
  rows,
  inputMode = 'text',
  prefix,
  className,
}: FormFieldProps) => {
  const id = `field-${label.replace(/\s+/g, '-')}`
  const helperId = helperText ? `${id}-helper` : undefined

  const shell = cn(
    'flex items-center gap-2 rounded-kaze border bg-surface px-3 transition-colors',
    error
      ? 'border-error focus-within:border-error'
      : 'border-divider focus-within:border-primary',
    rows ? 'py-2 items-start' : size === 'small' ? 'h-9' : 'h-11',
    disabled && 'opacity-50'
  )

  const control = cn(
    'w-full bg-transparent text-sm text-content outline-none placeholder:text-content-muted',
    rows && 'resize-y'
  )

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-semibold text-content-muted">
        {label}
        {required && (
          <span className="ml-1 text-error" aria-hidden>
            *
          </span>
        )}
      </label>
      <div className={shell}>
        {prefix && <span className="text-sm text-content-muted">{prefix}</span>}
        {rows ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            aria-required={required}
            aria-invalid={error}
            aria-describedby={helperId}
            onChange={(e) => onChange(e.target.value)}
            className={control}
          />
        ) : (
          <input
            id={id}
            type="text"
            inputMode={inputMode}
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            required={required}
            aria-required={required}
            aria-invalid={error}
            aria-describedby={helperId}
            onChange={(e) => onChange(e.target.value)}
            className={control}
          />
        )}
      </div>
      {helperText && (
        <span
          id={helperId}
          className={cn('text-xs', error ? 'text-error' : 'text-content-muted')}
        >
          {helperText}
        </span>
      )}
    </div>
  )
}

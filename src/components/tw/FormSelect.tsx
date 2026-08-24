import { cn } from '@/lib/cn'

/**
 * kaze の Select 仕様（get_component('select')）から再生成。
 * sample は `<CustomSelect label options />`、accessibility は
 * aria-label / aria-required / aria-invalid。
 *
 * SortSelect も同じ仕様からの再生成だが、あちらは並び替え専用で
 * required / error を持たない。フォームでは必須と検証状態が要るので分けた
 */
export interface FormSelectOption {
  value: string
  label: string
}

export interface FormSelectProps {
  label: string
  value: string
  options: readonly FormSelectOption[]
  onChange: (next: string) => void
  placeholder?: string
  required?: boolean
  error?: boolean
  helperText?: string
  disabled?: boolean
  className?: string
}

export const FormSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder = '選択してください',
  required = false,
  error = false,
  helperText,
  disabled = false,
  className,
}: FormSelectProps) => {
  const id = `select-${label.replace(/\s+/g, '-')}`
  const helperId = helperText ? `${id}-helper` : undefined

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
      <select
        id={id}
        value={value}
        disabled={disabled}
        required={required}
        aria-label={label}
        aria-required={required}
        aria-invalid={error}
        aria-describedby={helperId}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-11 rounded-kaze border bg-surface px-3 text-sm outline-none transition-colors',
          value ? 'text-content' : 'text-content-muted',
          error
            ? 'border-error focus:border-error'
            : 'border-divider focus:border-primary',
          disabled && 'opacity-50'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
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

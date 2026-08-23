import { cn } from '@/lib/cn'

/**
 * kaze の Select 仕様（get_component('select')）から再生成。
 * sample は `<CustomSelect label options />` で、import は kaze-ux 内部パス。
 * ここでは MUI の Select ではなく **素の select + Tailwind** で
 * 同じ契約（label / options / aria-label / disabled）を満たす
 */
export interface SortOption<T extends string> {
  value: T
  label: string
}

export interface SortSelectProps<T extends string> {
  label: string
  value: T
  options: readonly SortOption<T>[]
  onChange: (next: T) => void
  disabled?: boolean
  className?: string
}

export const SortSelect = <T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: SortSelectProps<T>) => {
  const selectId = `sort-${label.replace(/\s+/g, '-')}`

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={selectId} className="text-xs font-semibold text-content-muted">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          'h-11 rounded-kaze border border-divider bg-surface px-3 text-sm text-content outline-none transition-colors focus:border-primary',
          disabled && 'opacity-50'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

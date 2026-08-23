import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'

import { cn } from '@/lib/cn'

/**
 * kaze の CustomTextField 仕様（get_component('customTextField')）から再生成。
 * import が kaze-ux 内部パスなので実装は持ってこられない。ここでは MUI の
 * TextField ではなく **素の input + Tailwind** で props 契約
 * （label / placeholder / helperText / disabled / size / aria-*）を満たす
 */
export interface SearchFieldProps {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  helperText?: string
  disabled?: boolean
  size?: 'small' | 'medium'
  className?: string
}

export const SearchField = ({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  disabled = false,
  size = 'medium',
  className,
}: SearchFieldProps) => {
  const inputId = `search-${label.replace(/\s+/g, '-')}`
  const helperId = helperText ? `${inputId}-helper` : undefined

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={inputId} className="text-xs font-semibold text-content-muted">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center gap-2 rounded-kaze border border-divider bg-surface px-3 transition-colors focus-within:border-primary',
          size === 'small' ? 'h-9' : 'h-11',
          disabled && 'opacity-50'
        )}
      >
        <SearchOutlinedIcon
          className="text-content-muted"
          sx={{ fontSize: size === 'small' ? 18 : 20 }}
        />
        <input
          id={inputId}
          type="search"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          aria-describedby={helperId}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-sm text-content outline-none placeholder:text-content-muted"
        />
      </div>
      {helperText && (
        <span id={helperId} className="text-xs text-content-muted">
          {helperText}
        </span>
      )}
    </div>
  )
}

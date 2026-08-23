import MuiToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

export type SettlementCurrency = 'jpy' | 'stablecoin'

/**
 * kaze の ToggleButton 仕様（get_component('toggleButton')）から再生成。
 * kaze-ux 側の実装（@/components/ui/toggle-button）は import せず、
 * props 契約（color / size / exclusive / disabled / fullWidth / orientation）
 * だけを見て、決済原資の排他選択という用途向けに組み直している
 */
export interface SettlementToggleProps {
  value: SettlementCurrency
  onChange: (next: SettlementCurrency) => void
  stablecoinDisabled?: boolean
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  orientation?: 'horizontal' | 'vertical'
}

export const SettlementToggle = ({
  value,
  onChange,
  stablecoinDisabled = false,
  color = 'primary',
  size = 'medium',
  fullWidth = true,
  orientation = 'horizontal',
}: SettlementToggleProps) => (
  <ToggleButtonGroup
    value={value}
    exclusive
    orientation={orientation}
    fullWidth={fullWidth}
    color={color}
    size={size}
    onChange={(_event, next: SettlementCurrency | null) => {
      if (next) onChange(next)
    }}
    aria-label="支払い原資"
  >
    <MuiToggleButton value="jpy" aria-label="円残高で支払う">
      円残高
    </MuiToggleButton>
    <MuiToggleButton
      value="stablecoin"
      disabled={stablecoinDisabled}
      aria-label="ステーブルコイン残高で支払う"
    >
      ステーブルコイン残高
    </MuiToggleButton>
  </ToggleButtonGroup>
)

import Avatar from '@mui/material/Avatar'
import { useTheme } from '@mui/material/styles'

/**
 * kaze の UserAvatar 仕様（get_component('userAvatar')）から再生成。
 * kaze-ux 側の実装（@/components/ui/avatar/userAvatar）は import せず、
 * props 契約だけを見て MUI Avatar でここに書き直している
 */
export interface UserAvatarProps {
  name: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'circular' | 'rounded' | 'square'
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info'
  src?: string
}

const SIZE_PX: Record<NonNullable<UserAvatarProps['size']>, number> = {
  small: 24,
  medium: 40,
  large: 56,
}

const initialsOf = (name: string): string =>
  name.trim().slice(0, 2).toUpperCase()

export const UserAvatar = ({
  name,
  size = 'medium',
  variant = 'circular',
  color = 'primary',
  src,
}: UserAvatarProps) => {
  const theme = useTheme()
  const dimension = SIZE_PX[size]

  return (
    <Avatar
      variant={variant}
      src={src}
      alt={name}
      aria-label={name}
      sx={{
        width: dimension,
        height: dimension,
        fontSize: dimension * 0.4,
        bgcolor: theme.palette[color].main,
      }}
    >
      {!src && initialsOf(name)}
    </Avatar>
  )
}

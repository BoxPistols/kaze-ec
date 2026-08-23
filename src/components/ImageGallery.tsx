import { useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { alpha, useTheme } from '@mui/material/styles'

/**
 * kaze-ux の DS には image / gallery / carousel 系の部品が無い
 * （kaze MCP の search で確認済み）。フリマは複数写真が前提のため、
 * Box/Grid と同じ「DS 対象外のレイアウト原始要素」として自前で用意した。
 * 実写真は無いので、1 色（swatch）をもとに角度と濃淡を変えた見た目を
 * 生成して「複数枚の写真」を疑似的に表現している
 */
export interface ImageGalleryProps {
  swatch: string
  count: number
  alt: string
  height?: number
}

const tileGradient = (swatch: string, index: number) => {
  const angle = 135 + index * 35
  const endOpacity = 0.5 + (index % 3) * 0.15
  return `linear-gradient(${angle}deg, ${swatch} 0%, ${alpha(swatch, endOpacity)} 100%)`
}

export const ImageGallery = ({ swatch, count, alt, height = 320 }: ImageGalleryProps) => {
  const theme = useTheme()
  const [activeIndex, setActiveIndex] = useState(0)
  const images = Array.from({ length: Math.max(1, count) }, (_, i) => i)

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        <Box
          role="img"
          aria-label={`${alt}（${activeIndex + 1}/${images.length}枚目）`}
          sx={{
            height,
            borderRadius: 1.5,
            backgroundImage: tileGradient(swatch, activeIndex),
          }}
        />
        {images.length > 1 && (
          <Chip
            label={`${activeIndex + 1}/${images.length}`}
            size="small"
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 10,
              bgcolor: alpha(theme.palette.common.black, 0.6),
              color: theme.palette.common.white,
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
      {images.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 1, overflowX: 'auto', pb: 0.5 }}>
          {images.map((i) => (
            <Box
              key={i}
              component="button"
              type="button"
              aria-label={`写真 ${i + 1}/${images.length}を表示`}
              aria-pressed={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              sx={{
                flex: '0 0 56px',
                height: 56,
                borderRadius: 1,
                border: '2px solid',
                borderColor: i === activeIndex ? 'primary.main' : 'transparent',
                padding: 0,
                cursor: 'pointer',
                backgroundImage: tileGradient(swatch, i),
                backgroundColor: 'transparent',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

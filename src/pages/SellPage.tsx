import { useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

import { FormField } from '@/components/tw/FormField'
import { FormSelect } from '@/components/tw/FormSelect'
import { TagChip } from '@/components/tw/TagChip'
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  useListingDraft,
} from '@/hooks/useListingDraft'

const CONTAINER_SX = {
  maxWidth: 'sm' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="caption"
    sx={{
      display: 'block',
      color: 'text.secondary',
      fontWeight: 700,
      mb: 1.5,
    }}
  >
    {children}
  </Typography>
)

export const SellPage = () => {
  const { draft, errors, canSubmit, tags, set, reset } = useListingDraft()
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <Container sx={CONTAINER_SX}>
        <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <CheckCircleOutlinedIcon
              sx={{ color: 'success.main', fontSize: 40, mb: 1.5 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              出品しました
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {draft.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button component={Link} to="/mypage?tab=listings" variant="contained">
                出品管理を見る
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  reset()
                  setSubmitted(false)
                }}
              >
                続けて出品する
              </Button>
            </Box>
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 3, color: 'text.secondary' }}
            >
              モックアップのため、実際には保存されません。
            </Typography>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container sx={CONTAINER_SX}>
      <Typography variant="h5" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
        出品する
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>
        <Box component="span" sx={{ color: 'error.main' }}>
          *
        </Box>{' '}
        は必須です。説明とタグは後からでも足せます。
      </Typography>

      {/* 1 画面スクロール。Stepper に割らない理由は decisions/0004 */}
      <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 2.5 }}>
        <CardContent>
          <SectionLabel>必須</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormField
              label="商品名"
              value={draft.title}
              onChange={(v) => set('title', v)}
              placeholder="例: フィルムカメラ Vintra PEN-7"
              required
              error={Boolean(errors.title)}
              helperText={errors.title ?? `${draft.title.length} / 60`}
            />
            <FormSelect
              label="カテゴリ"
              value={draft.category}
              options={CATEGORY_OPTIONS}
              onChange={(v) => set('category', v)}
              required
            />
            <FormSelect
              label="商品の状態"
              value={draft.condition}
              options={CONDITION_OPTIONS}
              onChange={(v) => set('condition', v)}
              required
            />
            <FormField
              label="価格"
              value={draft.price}
              onChange={(v) => set('price', v)}
              placeholder="8200"
              inputMode="numeric"
              prefix="¥"
              required
              error={Boolean(errors.price)}
              helperText={errors.price ?? '300 円以上で設定できます'}
            />
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 2.5 }}>
        <CardContent>
          <SectionLabel>任意</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormField
              label="商品の説明"
              value={draft.description}
              onChange={(v) => set('description', v)}
              placeholder="使用感・付属品・購入時期など"
              rows={4}
              helperText="状態が伝わるほど売れやすくなります"
            />
            <FormField
              label="タグ"
              value={draft.tagsText}
              onChange={(v) => set('tagsText', v)}
              placeholder="フィルム, レトロ, コンパクト"
              helperText="カンマ・空白で区切ります"
            />
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <TagChip key={t} label={`#${t}`} variant="outlined" size="small" />
                ))}
              </Box>
            )}
            {/* Chip は内容幅で置く。flex の子は既定で伸びるので self-start で止める */}
            <Box sx={{ display: 'flex' }}>
              <TagChip
                label="暗号資産での支払いを受け付ける"
                color="success"
                size="medium"
                variant={draft.acceptsStablecoin ? 'filled' : 'outlined'}
                selected={draft.acceptsStablecoin}
                onClick={() => set('acceptsStablecoin', !draft.acceptsStablecoin)}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 縦に長いので、どこまでスクロールしても出品操作に届くようにする */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          py: 2,
          bgcolor: 'background.default',
          mx: { xs: -2.5, sm: 0 },
          px: { xs: 2.5, sm: 0 },
        }}
      >
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          disabled={!canSubmit}
          onClick={() => setSubmitted(true)}
          sx={{ py: 1.4, fontSize: 16 }}
        >
          {canSubmit ? '出品する' : '必須項目を入力してください'}
        </Button>
      </Box>

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 3, color: 'text.secondary', textAlign: 'center' }}
      >
        これはモックアップです。出品しても実際には保存されません。
      </Typography>
    </Container>
  )
}

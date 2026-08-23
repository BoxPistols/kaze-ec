import { useMemo, useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import { Link, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import {
  SettlementToggle,
  type SettlementCurrency,
} from '@/components/SettlementToggle'
import { findListing } from '@/data/listings'

// デモ用の残高。実チャージ・実オンチェーン処理は行わない（design/decisions/0001 参照）
const MOCK_BALANCE = {
  jpy: 50000,
  stablecoinInJpy: 18000,
}

type TransactionStage = 'idle' | 'escrow' | 'completed'

const FEE_RATE: Record<SettlementCurrency, number> = {
  jpy: 0.05,
  stablecoin: 0.02,
}

const CONTAINER_SX = {
  maxWidth: 'sm' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

export const CheckoutWalletPage = () => {
  const { id } = useParams<{ id: string }>()
  const listing = id ? findListing(id) : undefined
  const [currency, setCurrency] = useState<SettlementCurrency>('jpy')
  const [stage, setStage] = useState<TransactionStage>('idle')

  const stablecoinDisabled = MOCK_BALANCE.stablecoinInJpy <= 0

  const breakdown = useMemo(() => {
    if (!listing) return null
    const fee = Math.round(listing.price * FEE_RATE[currency])
    return {
      price: listing.price,
      fee,
      total: listing.price + fee,
    }
  }, [listing, currency])

  if (!listing || !breakdown) {
    return (
      <Container sx={CONTAINER_SX}>
        <Typography>商品が見つかりませんでした。</Typography>
        <Button component={Link} to="/" sx={{ mt: 2 }}>
          一覧に戻る
        </Button>
      </Container>
    )
  }

  const balance = currency === 'jpy' ? MOCK_BALANCE.jpy : MOCK_BALANCE.stablecoinInJpy
  const insufficientBalance = balance < breakdown.total

  return (
    <Container sx={CONTAINER_SX}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ mb: 3, fontWeight: 800, letterSpacing: '-0.01em' }}
      >
        お支払い
      </Typography>

      <Card variant="outlined" sx={{ borderRadius: 1.5, mb: 2.5, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            購入する商品
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 0.5 }}>
            {listing.title}
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 1.5, mb: 2.5, borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1.5 }}>
            支払い原資
          </Typography>
          <SettlementToggle
            value={currency}
            onChange={setCurrency}
            stablecoinDisabled={stablecoinDisabled}
          />
          <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary' }}>
            利用可能残高: ¥{balance.toLocaleString()}
            {currency === 'stablecoin' && '（ステーブルコイン換算）'}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">商品代金</Typography>
            <Typography variant="body2">¥{breakdown.price.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              決済手数料（{currency === 'jpy' ? '円決済' : 'ステーブルコイン決済'}）
            </Typography>
            <Typography variant="body2">¥{breakdown.fee.toLocaleString()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              合計
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              ¥{breakdown.total.toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {stage === 'idle' && (
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
            disabled={insufficientBalance}
            onClick={() => setStage('escrow')}
            sx={{ py: 1.4, fontSize: 16 }}
          >
            {insufficientBalance ? '残高が不足しています' : '支払いを確定する'}
          </Button>
        </Box>
      )}

      {stage === 'escrow' && (
        <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <LocalShippingOutlinedIcon sx={{ color: 'warning.main' }} fontSize="small" />
              <Chip label="保留中" size="small" color="warning" />
            </Box>
            <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.8 }}>
              お支払いいただいた金額は、出品者の発送確認までお預かりします。
              発送が確認できるまで出品者には入金されません。
            </Typography>
            <Button
              variant="outlined"
              size="medium"
              onClick={() => setStage('completed')}
            >
              出品者が発送を確認しました（デモ操作）
            </Button>
          </CardContent>
        </Card>
      )}

      {stage === 'completed' && (
        <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <CheckCircleOutlinedIcon sx={{ color: 'success.main' }} fontSize="small" />
              <Chip label="取引完了" size="small" color="success" />
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
              発送が確認されました。取引が完了しました。
            </Typography>
          </CardContent>
        </Card>
      )}

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 4, color: 'text.secondary', textAlign: 'center' }}
      >
        これはモックアップです。実際の送金・課金は発生しません。
      </Typography>
    </Container>
  )
}

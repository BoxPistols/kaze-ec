import { useSearchParams, Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'

import { TagChip } from '@/components/tw/TagChip'
import {
  CURRENT_USER,
  PURCHASES,
  selectMyListings,
  selectMyPurchases,
  summarizeListings,
  type MyListing,
  type PurchaseRecord,
  type PurchaseStatus,
} from '@/data/account'
import { LISTINGS } from '@/data/listings'

const CONTAINER_SX = {
  maxWidth: 'md' as const,
  px: { xs: 2.5, sm: 3, md: 4 },
  py: { xs: 3, md: 5 },
}

/** URL にタブの状態を持たせる（decisions/0002）。持たせないと人に共有できない */
type TabKey = 'purchases' | 'listings'
const TAB_KEYS: TabKey[] = ['purchases', 'listings']

const STATUS_COLOR: Record<PurchaseStatus, 'warning' | 'info' | 'success'> = {
  発送待ち: 'warning',
  発送済み: 'info',
  取引完了: 'success',
}

const Thumbnail = ({ swatch }: { swatch: string }) => (
  <Box
    sx={{
      flex: '0 0 72px',
      height: 72,
      borderRadius: 1,
      backgroundImage: `linear-gradient(135deg, ${swatch} 0%, ${alpha(swatch, 0.65)} 100%)`,
    }}
    aria-hidden
  />
)

const PurchaseRow = ({ record }: { record: PurchaseRecord }) => (
  <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 1.5 }}>
    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Thumbnail swatch={record.listing.swatch} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={record.purchase.status}
            size="small"
            color={STATUS_COLOR[record.purchase.status]}
          />
          <TagChip
            label={record.purchase.paidWith === 'jpy' ? '円決済' : 'ステーブルコイン決済'}
            variant="outlined"
            size="small"
          />
        </Box>
        <Typography
          component={Link}
          to={`/items/${record.listing.id}`}
          variant="subtitle2"
          sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
        >
          {record.listing.title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
          ¥{record.listing.price.toLocaleString()}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          購入日 {record.purchase.purchasedAt}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)

const ListingRow = ({ item }: { item: MyListing }) => (
  <Card variant="outlined" sx={{ borderRadius: 1.5, borderColor: 'divider', mb: 1.5 }}>
    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Thumbnail swatch={item.listing.swatch} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={item.status}
            size="small"
            color={item.status === '公開中' ? 'primary' : 'success'}
            variant={item.status === '公開中' ? 'outlined' : 'filled'}
          />
          <TagChip label={item.listing.category} variant="outlined" size="small" />
        </Box>
        <Typography
          component={Link}
          to={`/items/${item.listing.id}`}
          variant="subtitle2"
          sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
        >
          {item.listing.title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
          ¥{item.listing.price.toLocaleString()}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          ♡ {item.listing.likeCount} ・ 出品日 {item.listing.listedAt}
        </Typography>
      </Box>
    </CardContent>
  </Card>
)

const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
  <Box sx={{ py: 6, textAlign: 'center' }}>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: action ? 2 : 0 }}>
      {message}
    </Typography>
    {action}
  </Box>
)

export const MyPage = () => {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const active: TabKey = TAB_KEYS.includes(raw as TabKey) ? (raw as TabKey) : 'purchases'

  const purchases = selectMyPurchases(PURCHASES)
  const myListings = selectMyListings(LISTINGS, PURCHASES, CURRENT_USER)
  const summary = summarizeListings(myListings)

  return (
    <Container sx={CONTAINER_SX}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}
      >
        マイページ
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 3 }}>
        {CURRENT_USER}
      </Typography>

      {/* 役割の切り替えはタブで行う（design/decisions/0002）。
          購入と出品を別画面にすると、行き来のたびに文脈を失う */}
      <Tabs
        value={active}
        onChange={(_e, next: TabKey) => setParams({ tab: next })}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab value="purchases" label={`購入履歴 (${purchases.length})`} />
        <Tab value="listings" label={`出品管理 (${summary.total})`} />
      </Tabs>

      {active === 'purchases' &&
        (purchases.length === 0 ? (
          <EmptyState
            message="まだ購入した商品がありません。"
            action={
              <Button component={Link} to="/" variant="outlined" size="medium">
                商品を探す
              </Button>
            }
          />
        ) : (
          purchases.map((record) => (
            <PurchaseRow key={record.purchase.listingId} record={record} />
          ))
        ))}

      {active === 'listings' && (
        <>
          <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
            <TagChip label={`公開中 ${summary.onSale}`} color="primary" />
            <TagChip label={`売却済み ${summary.sold}`} color="success" />
            <TagChip label={`いいね合計 ${summary.totalLikes}`} variant="outlined" />
          </Box>

          {myListings.length === 0 ? (
            <EmptyState message="まだ出品がありません。" />
          ) : (
            myListings.map((item) => <ListingRow key={item.listing.id} item={item} />)
          )}
        </>
      )}

      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 4, color: 'text.secondary', textAlign: 'center' }}
      >
        これはモックアップです。取引データはすべて架空のものです。
      </Typography>
    </Container>
  )
}

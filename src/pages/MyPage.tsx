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
  SALES,
  selectMyListings,
  selectMyPurchases,
  selectSales,
  summarizeListings,
  summarizeSales,
  type MyListing,
  type PurchaseRecord,
  type PurchaseStatus,
  type SalesSummary,
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

/**
 * 売上サマリ（出品ジャーニー 8）。
 *
 * **合計を 1 つの数字で出さない。** 決済画面が「発送確認まで保留」と
 * エスクローを見せているのに、売上側で全部足すと画面ごとに言っていることが
 * 変わる（design/decisions/0007）。
 *
 * 出さないもの（画面にも書く）: 平均単価・成約率・前月比・予測。
 * 売却 2 件から平均を出しても、その 2 件の値そのものにしかならない
 */
const Amount = ({
  label,
  amount,
  count,
  note,
  strong,
}: {
  label: string
  amount: number
  count: number
  note: string
  strong?: boolean
}) => (
  <Box>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {label}
    </Typography>
    <Typography
      variant={strong ? 'h5' : 'h6'}
      sx={{ fontWeight: 800, color: strong ? 'text.primary' : 'text.secondary' }}
    >
      ¥{amount.toLocaleString()}
      <Typography component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
        {count} 件
      </Typography>
    </Typography>
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      {note}
    </Typography>
  </Box>
)

const SalesSummaryCard = ({ summary }: { summary: SalesSummary }) => (
  <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 1.5, borderColor: 'divider' }}>
    <CardContent>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
        売上
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        }}
      >
        <Amount
          label="確定した売上"
          amount={summary.settled.amount}
          count={summary.settled.count}
          note="受け取りまで終わったもの"
          strong
        />
        <Amount
          label="確定していない売上"
          amount={summary.pending.amount}
          count={summary.pending.count}
          note="発送待ち・発送済み。受取確認まで確定しない"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 2.5, flexWrap: 'wrap' }}>
        <TagChip label={`円決済 ${summary.byCurrency.jpy}`} variant="outlined" size="small" />
        <TagChip
          label={`ステーブルコイン決済 ${summary.byCurrency.stablecoin}`}
          variant="outlined"
          size="small"
        />
      </Box>

      <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
        手数料は購入者が負担するため、受取額は販売価格と同じです（決済原資によって
        購入者の支払総額は変わります）。
        <strong>
          平均単価・成約率・前月比は出していません。
        </strong>
        売却{' '}
        {summary.settled.count + summary.pending.count}{' '}
        件では、平均を出してもその数件の値そのものになります。
      </Typography>
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
  const myListings = selectMyListings(LISTINGS, SALES, CURRENT_USER)
  const summary = summarizeListings(myListings)
  const sales = summarizeSales(selectSales(SALES))

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
          <SalesSummaryCard summary={sales} />

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

          {/* 出品ジャーニー 5（観察）→ 6（施策）の接続点。
              「いいねは付いたが売れない」の次に来る問いをここで受ける */}
          <Card
            variant="outlined"
            sx={{ mt: 3, borderRadius: 1.5, borderColor: 'divider', bgcolor: 'action.hover' }}
          >
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                値下げすべきか迷ったら
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                値下げの効果をどう測るかを、答えの分かっている人工データで確かめられます。
                この出品の実績を分析するものではありません
              </Typography>
              <Button component={Link} to="/effect-lab" variant="outlined" size="small">
                効果の検証を見る
              </Button>
            </CardContent>
          </Card>
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

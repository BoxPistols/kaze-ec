import { findListing, type Listing } from '@/data/listings'

/**
 * 「今ログインしている人」。C2C では同一人物が購入者にも出品者にもなる
 * （design/personas.md §0）ので、役割ごとにユーザーを分けない。
 *
 * モックなので固定。listings.ts の sellerName と突き合わせて出品を引く
 */
export const CURRENT_USER = 'kaze_seller_01'

export type PurchaseStatus = '発送待ち' | '発送済み' | '取引完了'

export interface Purchase {
  listingId: string
  purchasedAt: string
  status: PurchaseStatus
  /** 支払いに使った原資（design/decisions/0001 のトグルで選んだもの） */
  paidWith: 'jpy' | 'stablecoin'
}

/**
 * 自分が買ったもの。**LISTINGS とは別ソース**にしている。
 * カタログ（見た目のための 8 件）と取引の記録は性質が違うので混ぜない
 */
export const PURCHASES: Purchase[] = [
  {
    listingId: 'l-002',
    purchasedAt: '2026-08-21',
    status: '取引完了',
    paidWith: 'jpy',
  },
  {
    listingId: 'l-005',
    purchasedAt: '2026-08-22',
    status: '発送済み',
    paidWith: 'stablecoin',
  },
  {
    listingId: 'l-006',
    purchasedAt: '2026-08-23',
    status: '発送待ち',
    paidWith: 'jpy',
  },
]

/**
 * **自分が売ったもの。** `PURCHASES`（自分が買ったもの）とは別ソース。
 *
 * 同じ形をしているが当事者が逆なので、1 つの配列で兼ねない。
 * 兼ねていたときは「自分の出品 ID が、自分が買った出品の集合に含まれるか」
 * という**構造上成立しない条件**で売却済みを判定しており、
 * マイページの「売却済み」は常に 0 だった（design/decisions/0007）。
 */
export const SALES: Sale[] = [
  {
    listingId: 'l-001',
    soldAt: '2026-08-14',
    status: '取引完了',
    paidWith: 'jpy',
  },
  {
    listingId: 'l-003',
    soldAt: '2026-08-25',
    status: '発送済み',
    paidWith: 'stablecoin',
  },
]

export interface Sale {
  listingId: string
  soldAt: string
  status: PurchaseStatus
  /** 購入者が使った原資。手数料率が変わる（design/decisions/0001） */
  paidWith: 'jpy' | 'stablecoin'
}

export type ListingStatus = '公開中' | '売却済み'

export interface MyListing {
  listing: Listing
  status: ListingStatus
}

export interface PurchaseRecord {
  purchase: Purchase
  listing: Listing
}

/**
 * 自分の出品を、売却済みかどうかを付けて返す。
 *
 * 「売却済み」の判定は SALES 側から引く — 売れた記録がある出品は売却済み。
 * 出品側に status フィールドを持たせると、記録と表示で状態が二重管理になる。
 *
 * **以前は PURCHASES（自分が買ったもの）を見ていた。** 自分が自分の出品を
 * 買わない限り true にならず、常に 0 件だった（design/decisions/0007）
 */
export const selectMyListings = (
  listings: Listing[],
  sales: Sale[],
  user: string
): MyListing[] => {
  const soldIds = new Set(sales.map((s) => s.listingId))
  return listings
    .filter((l) => l.sellerName === user)
    .map((listing) => ({
      listing,
      status: soldIds.has(listing.id) ? ('売却済み' as const) : ('公開中' as const),
    }))
}

/**
 * 自分の購入履歴。新しい順。
 *
 * 参照先の出品が見つからないものは落とす（モックの不整合を画面に出さない）
 */
export const selectMyPurchases = (purchases: Purchase[]): PurchaseRecord[] =>
  purchases
    .map((purchase) => {
      const listing = findListing(purchase.listingId)
      return listing ? { purchase, listing } : null
    })
    .filter((r): r is PurchaseRecord => r !== null)
    .sort((a, b) => b.purchase.purchasedAt.localeCompare(a.purchase.purchasedAt))

/**
 * 出品時の参考として見せる、同カテゴリの出品。
 *
 * **「相場」は出さない**（decisions/0005）。カテゴリあたり 1〜2 件しか
 * 無いので、平均も中央値もその 1 件の価格そのものになる。丸めた数字を
 * 出すと、根拠のない値を根拠があるように見せることになる。
 *
 * - 売却済みは除く（「今出すならいくら」の参考にならない）
 * - 自分の出品は除く（自分の値付けを自分に見せても参考にならない）
 * - 安い順。最大件数は呼び出し側が決める
 */
export const selectCategoryReference = (
  listings: Listing[],
  purchases: Purchase[],
  category: string,
  user: string,
  limit = 3
): Listing[] => {
  if (!category) return []
  const soldIds = new Set(purchases.map((p) => p.listingId))
  return listings
    .filter(
      (l) =>
        l.category === category && l.sellerName !== user && !soldIds.has(l.id)
    )
    .slice()
    .sort((a, b) => a.price - b.price)
    .slice(0, limit)
}

/** 出品のサマリ。ジャーニー 出品 8（振り返り）の最小版 */
export const summarizeListings = (myListings: MyListing[]) => ({
  total: myListings.length,
  onSale: myListings.filter((m) => m.status === '公開中').length,
  sold: myListings.filter((m) => m.status === '売却済み').length,
  totalLikes: myListings.reduce((n, m) => n + m.listing.likeCount, 0),
})

/**
 * 売上サマリ（ジャーニー 出品 8）。
 *
 * **合計を 1 つの数字で出さない。** 決済画面が「発送確認まで保留」と
 * エスクローを見せているのに、売上側で全部足して 1 つにすると、
 * 画面ごとに言っていることが変わる（design/decisions/0007）。
 *
 * 出さないもの: 平均単価・成約率・前月比・予測。
 * 売却 3 件から平均を出しても、その 3 件の値そのものにしかならない
 * （0005 で相場を出さないと決めたのと同じ理由）。
 *
 * 手数料は引かない。現行の決済は**購入者が負担する**ので、出品者の
 * 受取額は販売価格そのもの
 */
export interface SaleRecord {
  sale: Sale
  listing: Listing
}

export interface SalesSummary {
  /** 受け取りまで終わっているもの */
  settled: { count: number; amount: number }
  /** 発送待ち・発送済み。返品や不着がありうるので確定していない */
  pending: { count: number; amount: number }
  /** 決済原資の内訳。手数料率が違うので購入者の支払総額は変わる */
  byCurrency: { jpy: number; stablecoin: number }
}

/**
 * 売却記録に出品を紐付ける。新しい順。
 *
 * 参照先の出品が見つからないものは落とす（モックの不整合を画面に出さない）。
 * **落とした件数は集計に現れない**ので、呼び出し側が件数を比べたいときは
 * 元の配列長と突き合わせること
 */
export const selectSales = (sales: Sale[]): SaleRecord[] =>
  sales
    .map((sale) => {
      const listing = findListing(sale.listingId)
      return listing ? { sale, listing } : null
    })
    .filter((r): r is SaleRecord => r !== null)
    .sort((a, b) => b.sale.soldAt.localeCompare(a.sale.soldAt))

export const summarizeSales = (records: SaleRecord[]): SalesSummary => {
  const summary: SalesSummary = {
    settled: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    byCurrency: { jpy: 0, stablecoin: 0 },
  }
  for (const { sale, listing } of records) {
    const bucket = sale.status === '取引完了' ? summary.settled : summary.pending
    bucket.count += 1
    bucket.amount += listing.price
    summary.byCurrency[sale.paidWith] += 1
  }
  return summary
}

/**
 * 売れた出品の ID 集合。
 *
 * **マイページだけが売却を知っている状態にしない。** 出品管理で
 * 「売却済み」と出しているのに、商品詳細では「購入手続きへ」が押せる、
 * という画面間の矛盾が出る（実際、売却判定を直した直後にその状態になった）。
 *
 * 判定を 1 箇所に置き、売却を表示する画面はここから引く
 */
export const soldListingIds = (sales: Sale[]): Set<string> =>
  new Set(sales.map((s) => s.listingId))

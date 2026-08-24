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
 * 「売却済み」の判定は PURCHASES 側から引く — 誰かが買った出品は売却済み。
 * 出品側に status フィールドを持たせると、購入と出品で状態が二重管理になる
 */
export const selectMyListings = (
  listings: Listing[],
  purchases: Purchase[],
  user: string
): MyListing[] => {
  const soldIds = new Set(purchases.map((p) => p.listingId))
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

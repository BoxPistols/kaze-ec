import { describe, expect, it } from 'vitest'

import {
  CURRENT_USER,
  PURCHASES,
  SALES,
  selectCategoryReference,
  selectMyListings,
  selectMyPurchases,
  selectSales,
  soldListingIds,
  summarizeListings,
  summarizeSales,
  type Purchase,
  type Sale,
} from './account'
import { LISTINGS } from './listings'

describe('selectMyListings', () => {
  it('自分が出品したものだけを返す', () => {
    const mine = selectMyListings(LISTINGS, SALES, CURRENT_USER)
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.every((m) => m.listing.sellerName === CURRENT_USER)).toBe(true)
  })

  it('売れた出品は売却済みになる', () => {
    const sales: Sale[] = [
      { listingId: 'l-001', soldAt: '2026-08-22', status: '取引完了', paidWith: 'jpy' },
    ]
    const mine = selectMyListings(LISTINGS, sales, CURRENT_USER)
    expect(mine.find((m) => m.listing.id === 'l-001')?.status).toBe('売却済み')
  })

  it('売れていない出品は公開中のまま', () => {
    const mine = selectMyListings(LISTINGS, [], CURRENT_USER)
    expect(mine.every((m) => m.status === '公開中')).toBe(true)
  })

  it('出品が無いユーザーなら空配列', () => {
    expect(selectMyListings(LISTINGS, SALES, 'no_such_user')).toEqual([])
  })

  it('**実データで売却済みが 1 件以上ある**（0 が「無い」か「数えられていない」かを区別する）', () => {
    // 以前は「自分の出品 ID が、自分が買った出品の集合に含まれるか」で
    // 判定しており、構造上 true にならなかった。手で作った検体では
    // 偶然を成立させられるので、上の 3 本は緑のままだった。
    // **実データを通す検査でないと、この形は捕まらない**
    const mine = selectMyListings(LISTINGS, SALES, CURRENT_USER)
    expect(mine.filter((m) => m.status === '売却済み').length).toBeGreaterThan(0)
  })

  it('自分が買った記録では売却済みにならない（当事者が逆）', () => {
    // PURCHASES を誤って渡しても売却にならないことを型と合わせて固定する。
    // 購入と売却は同じ形でも別の事実
    const asSales: Sale[] = PURCHASES.map((p) => ({
      listingId: p.listingId,
      soldAt: p.purchasedAt,
      status: p.status,
      paidWith: p.paidWith,
    }))
    const mine = selectMyListings(LISTINGS, asSales, CURRENT_USER)
    expect(mine.every((m) => m.status === '公開中')).toBe(true)
  })
})

describe('売上サマリ', () => {
  it('取引完了だけを確定した売上として数える', () => {
    const summary = summarizeSales(selectSales(SALES))
    const settledIds = SALES.filter((s) => s.status === '取引完了')
    expect(summary.settled.count).toBe(settledIds.length)
    expect(summary.settled.amount).toBeGreaterThan(0)
  })

  it('発送待ち・発送済みは未確定として分ける（合計に混ぜない）', () => {
    const sales: Sale[] = [
      { listingId: 'l-001', soldAt: '2026-08-01', status: '取引完了', paidWith: 'jpy' },
      { listingId: 'l-003', soldAt: '2026-08-02', status: '発送済み', paidWith: 'jpy' },
    ]
    const s = summarizeSales(selectSales(sales))
    expect(s.settled.count).toBe(1)
    expect(s.pending.count).toBe(1)
    // 決済画面がエスクローを見せているので、売上側で足して 1 つにしない
    expect(s.settled.amount).not.toBe(s.settled.amount + s.pending.amount)
  })

  it('決済原資の内訳を数える', () => {
    const s = summarizeSales(selectSales(SALES))
    expect(s.byCurrency.jpy + s.byCurrency.stablecoin).toBe(SALES.length)
  })

  it('参照先が無い売却記録は落とす（画面に不整合を出さない）', () => {
    const sales: Sale[] = [
      { listingId: 'l-999', soldAt: '2026-08-01', status: '取引完了', paidWith: 'jpy' },
    ]
    expect(selectSales(sales)).toEqual([])
    expect(summarizeSales(selectSales(sales)).settled.count).toBe(0)
  })

  it('売却が無ければ全部 0', () => {
    const s = summarizeSales([])
    expect(s.settled).toEqual({ count: 0, amount: 0 })
    expect(s.pending).toEqual({ count: 0, amount: 0 })
  })

  it('新しい順に並ぶ', () => {
    const dates = selectSales(SALES).map((r) => r.sale.soldAt)
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates)
  })
})

describe('selectMyPurchases', () => {
  it('購入日の新しい順に並ぶ', () => {
    const records = selectMyPurchases(PURCHASES)
    const dates = records.map((r) => r.purchase.purchasedAt)
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates)
  })

  it('出品の情報が引けている', () => {
    const records = selectMyPurchases(PURCHASES)
    expect(records.every((r) => r.listing.id === r.purchase.listingId)).toBe(true)
  })

  it('参照先が見つからない購入は落とす', () => {
    const broken: Purchase[] = [
      { listingId: 'does-not-exist', purchasedAt: '2026-08-22', status: '取引完了', paidWith: 'jpy' },
    ]
    expect(selectMyPurchases(broken)).toEqual([])
  })

  it('元の配列を破壊しない', () => {
    const before = PURCHASES.map((p) => p.listingId)
    selectMyPurchases(PURCHASES)
    expect(PURCHASES.map((p) => p.listingId)).toEqual(before)
  })
})

describe('summarizeListings', () => {
  it('公開中と売却済みの合計が総数に一致する', () => {
    const mine = selectMyListings(LISTINGS, SALES, CURRENT_USER)
    const s = summarizeListings(mine)
    expect(s.onSale + s.sold).toBe(s.total)
  })

  it('いいね数を合算する', () => {
    const mine = selectMyListings(LISTINGS, SALES, CURRENT_USER)
    const s = summarizeListings(mine)
    expect(s.totalLikes).toBe(
      mine.reduce((n, m) => n + m.listing.likeCount, 0)
    )
  })

  it('出品が無ければすべて 0', () => {
    expect(summarizeListings([])).toEqual({
      total: 0,
      onSale: 0,
      sold: 0,
      totalLikes: 0,
    })
  })
})

describe('selectCategoryReference', () => {
  it('カテゴリ未選択なら空配列', () => {
    expect(selectCategoryReference(LISTINGS, PURCHASES, '', CURRENT_USER)).toEqual([])
  })

  it('指定カテゴリのものだけを返す', () => {
    const r = selectCategoryReference(LISTINGS, [], 'カメラ', 'nobody')
    expect(r.length).toBeGreaterThan(0)
    expect(r.every((l) => l.category === 'カメラ')).toBe(true)
  })

  it('自分の出品は除く', () => {
    const r = selectCategoryReference(LISTINGS, [], 'カメラ', CURRENT_USER)
    expect(r.every((l) => l.sellerName !== CURRENT_USER)).toBe(true)
  })

  it('売却済みは除く', () => {
    const sold: Purchase[] = [
      { listingId: 'l-008', purchasedAt: '2026-08-22', status: '取引完了', paidWith: 'jpy' },
    ]
    const r = selectCategoryReference(LISTINGS, sold, 'カメラ', 'nobody')
    expect(r.some((l) => l.id === 'l-008')).toBe(false)
  })

  it('安い順に並ぶ', () => {
    const r = selectCategoryReference(LISTINGS, [], 'カメラ', 'nobody')
    const prices = r.map((l) => l.price)
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
  })

  it('limit 件までに絞る', () => {
    expect(selectCategoryReference(LISTINGS, [], 'カメラ', 'nobody', 1)).toHaveLength(1)
  })

  it('該当が無ければ空配列', () => {
    expect(selectCategoryReference(LISTINGS, [], '存在しないカテゴリ', 'nobody')).toEqual([])
  })

  it('元の配列を破壊しない', () => {
    const before = LISTINGS.map((l) => l.id)
    selectCategoryReference(LISTINGS, [], 'カメラ', 'nobody')
    expect(LISTINGS.map((l) => l.id)).toEqual(before)
  })
})

describe('soldListingIds', () => {
  it('売却記録の listingId を集める', () => {
    const ids = soldListingIds(SALES)
    expect(ids.size).toBe(SALES.length)
    expect(ids.has(SALES[0].listingId)).toBe(true)
  })

  it('売却が無ければ空', () => {
    expect(soldListingIds([]).size).toBe(0)
  })

  it('**判定が 1 箇所に集まっている**（画面ごとに別実装しない）', () => {
    // マイページの売却済みと、同じ集合であること。
    // ここがずれると「出品管理では売却済み、詳細では購入できる」になる
    const mine = selectMyListings(LISTINGS, SALES, CURRENT_USER)
    const soldByPage = mine.filter((m) => m.status === '売却済み').map((m) => m.listing.id)
    const ids = soldListingIds(SALES)
    expect(soldByPage.every((id) => ids.has(id))).toBe(true)
  })
})

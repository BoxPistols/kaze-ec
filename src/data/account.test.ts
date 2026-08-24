import { describe, expect, it } from 'vitest'

import {
  CURRENT_USER,
  PURCHASES,
  selectCategoryReference,
  selectMyListings,
  selectMyPurchases,
  summarizeListings,
  type Purchase,
} from './account'
import { LISTINGS } from './listings'

describe('selectMyListings', () => {
  it('自分が出品したものだけを返す', () => {
    const mine = selectMyListings(LISTINGS, PURCHASES, CURRENT_USER)
    expect(mine.length).toBeGreaterThan(0)
    expect(mine.every((m) => m.listing.sellerName === CURRENT_USER)).toBe(true)
  })

  it('誰かが買った出品は売却済みになる', () => {
    const purchases: Purchase[] = [
      { listingId: 'l-001', purchasedAt: '2026-08-22', status: '取引完了', paidWith: 'jpy' },
    ]
    const mine = selectMyListings(LISTINGS, purchases, CURRENT_USER)
    const target = mine.find((m) => m.listing.id === 'l-001')
    expect(target?.status).toBe('売却済み')
  })

  it('買われていない出品は公開中のまま', () => {
    const mine = selectMyListings(LISTINGS, [], CURRENT_USER)
    expect(mine.every((m) => m.status === '公開中')).toBe(true)
  })

  it('出品が無いユーザーなら空配列', () => {
    expect(selectMyListings(LISTINGS, PURCHASES, 'no_such_user')).toEqual([])
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
    const mine = selectMyListings(LISTINGS, PURCHASES, CURRENT_USER)
    const s = summarizeListings(mine)
    expect(s.onSale + s.sold).toBe(s.total)
  })

  it('いいね数を合算する', () => {
    const mine = selectMyListings(LISTINGS, PURCHASES, CURRENT_USER)
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

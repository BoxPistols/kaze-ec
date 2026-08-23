import { describe, expect, it } from 'vitest'

import { LISTINGS } from '@/data/listings'
import { applyListingFilters, type ListingFilters } from './useListingFilters'

const base: ListingFilters = {
  keyword: '',
  category: null,
  tags: [],
  stablecoinOnly: false,
  sort: 'newest',
}

describe('applyListingFilters', () => {
  it('条件なしなら全件返す', () => {
    expect(applyListingFilters(LISTINGS, base)).toHaveLength(LISTINGS.length)
  })

  it('キーワードはタイトル・説明・タグを横断する', () => {
    const byTag = applyListingFilters(LISTINGS, { ...base, keyword: 'フィルム' })
    expect(byTag.length).toBeGreaterThan(0)
    expect(byTag.every((l) => `${l.title}${l.description}${l.tags.join()}`.includes('フィルム'))).toBe(true)
  })

  it('カテゴリで絞れる', () => {
    const cameras = applyListingFilters(LISTINGS, { ...base, category: 'カメラ' })
    expect(cameras.every((l) => l.category === 'カメラ')).toBe(true)
  })

  it('タグは AND 条件', () => {
    const result = applyListingFilters(LISTINGS, { ...base, tags: ['セット', '北欧'] })
    expect(result.every((l) => l.tags.includes('セット') && l.tags.includes('北欧'))).toBe(true)
  })

  it('暗号資産可のみで絞れる', () => {
    const result = applyListingFilters(LISTINGS, { ...base, stablecoinOnly: true })
    expect(result.every((l) => l.acceptsStablecoin)).toBe(true)
  })

  it('価格の安い順で並ぶ', () => {
    const result = applyListingFilters(LISTINGS, { ...base, sort: 'priceAsc' })
    const prices = result.map((l) => l.price)
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
  })

  it('いいね順で並ぶ', () => {
    const result = applyListingFilters(LISTINGS, { ...base, sort: 'popular' })
    const likes = result.map((l) => l.likeCount)
    expect([...likes].sort((a, b) => b - a)).toEqual(likes)
  })

  it('元の配列を破壊しない', () => {
    const before = LISTINGS.map((l) => l.id)
    applyListingFilters(LISTINGS, { ...base, sort: 'priceDesc' })
    expect(LISTINGS.map((l) => l.id)).toEqual(before)
  })

  it('該当なしなら空配列', () => {
    expect(applyListingFilters(LISTINGS, { ...base, keyword: 'zzzz-該当なし' })).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'

import { findListing, LISTINGS } from './listings'

describe('listings', () => {
  it('全件が正の価格を持つ', () => {
    for (const listing of LISTINGS) {
      expect(listing.price).toBeGreaterThan(0)
    }
  })

  it('id で 1 件だけ取得できる', () => {
    const [first] = LISTINGS
    expect(findListing(first.id)?.title).toBe(first.title)
  })

  it('存在しない id は undefined を返す', () => {
    expect(findListing('does-not-exist')).toBeUndefined()
  })
})

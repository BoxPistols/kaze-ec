import { describe, expect, it } from 'vitest'

import { parseFavorites, toggleFavorite } from './useFavorites'

describe('parseFavorites', () => {
  it('未保存なら空配列', () => {
    expect(parseFavorites(null)).toEqual([])
    expect(parseFavorites('')).toEqual([])
  })

  it('保存された配列を読む', () => {
    expect(parseFavorites('["l-001","l-002"]')).toEqual(['l-001', 'l-002'])
  })

  it('壊れた JSON でも落とさない', () => {
    expect(parseFavorites('{壊れている')).toEqual([])
  })

  it('配列でなければ空配列', () => {
    expect(parseFavorites('{"a":1}')).toEqual([])
    expect(parseFavorites('"l-001"')).toEqual([])
  })

  it('文字列以外の要素は捨てる', () => {
    expect(parseFavorites('["l-001",1,null,{"a":1},"l-002"]')).toEqual([
      'l-001',
      'l-002',
    ])
  })

  it('重複を落とす', () => {
    expect(parseFavorites('["l-001","l-001","l-002"]')).toEqual([
      'l-001',
      'l-002',
    ])
  })
})

describe('toggleFavorite', () => {
  it('入っていなければ追加する', () => {
    expect(toggleFavorite([], 'l-001')).toEqual(['l-001'])
    expect(toggleFavorite(['l-002'], 'l-001')).toEqual(['l-002', 'l-001'])
  })

  it('入っていれば外す', () => {
    expect(toggleFavorite(['l-001', 'l-002'], 'l-001')).toEqual(['l-002'])
  })

  it('2 回呼ぶと元に戻る', () => {
    const once = toggleFavorite(['l-002'], 'l-001')
    expect(toggleFavorite(once, 'l-001')).toEqual(['l-002'])
  })

  it('元の配列を破壊しない', () => {
    const src = ['l-001']
    toggleFavorite(src, 'l-002')
    expect(src).toEqual(['l-001'])
  })
})

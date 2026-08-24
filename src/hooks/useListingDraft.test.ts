import { describe, expect, it } from 'vitest'

import {
  EMPTY_DRAFT,
  canSubmitDraft,
  parseTags,
  validateDraft,
  type ListingDraft,
} from './useListingDraft'

const valid: ListingDraft = {
  title: 'フィルムカメラ Vintra PEN-7',
  description: '動作確認済みです。',
  category: 'カメラ',
  condition: '未使用に近い',
  price: '8200',
  tagsText: 'フィルム, レトロ',
  acceptsStablecoin: true,
}

describe('validateDraft', () => {
  it('空の下書きはエラーを出さない（入力前から赤くしない）', () => {
    expect(validateDraft(EMPTY_DRAFT)).toEqual({})
  })

  it('妥当な下書きはエラー無し', () => {
    expect(validateDraft(valid)).toEqual({})
  })

  it('タイトルが 60 文字を超えるとエラー', () => {
    const e = validateDraft({ ...valid, title: 'あ'.repeat(61) })
    expect(e.title).toBeDefined()
  })

  it('タイトルちょうど 60 文字は通る', () => {
    expect(validateDraft({ ...valid, title: 'あ'.repeat(60) }).title).toBeUndefined()
  })

  it('価格が数値でなければエラー', () => {
    expect(validateDraft({ ...valid, price: 'たかい' }).price).toBeDefined()
  })

  it('価格が小数ならエラー', () => {
    expect(validateDraft({ ...valid, price: '300.5' }).price).toBeDefined()
  })

  it('価格の下限・上限を検査する', () => {
    expect(validateDraft({ ...valid, price: '299' }).price).toBeDefined()
    expect(validateDraft({ ...valid, price: '300' }).price).toBeUndefined()
    expect(validateDraft({ ...valid, price: '10000000' }).price).toBeDefined()
  })
})

describe('canSubmitDraft', () => {
  it('必須が全て埋まっていれば送信できる', () => {
    expect(canSubmitDraft(valid)).toBe(true)
  })

  it('空の下書きは送信できない', () => {
    expect(canSubmitDraft(EMPTY_DRAFT)).toBe(false)
  })

  it('任意項目が空でも送信できる', () => {
    expect(canSubmitDraft({ ...valid, description: '', tagsText: '' })).toBe(true)
  })

  it.each(['title', 'category', 'condition', 'price'] as const)(
    '必須の %s が空なら送信できない',
    (field) => {
      expect(canSubmitDraft({ ...valid, [field]: '' })).toBe(false)
    }
  )

  it('タイトルが空白だけなら送信できない', () => {
    expect(canSubmitDraft({ ...valid, title: '   ' })).toBe(false)
  })

  it('検証エラーがあれば送信できない', () => {
    expect(canSubmitDraft({ ...valid, price: '1' })).toBe(false)
  })
})

describe('parseTags', () => {
  it('カンマ・読点・空白のいずれでも区切れる', () => {
    expect(parseTags('a, b、c d')).toEqual(['a', 'b', 'c', 'd'])
  })

  it('先頭の # を落とす', () => {
    expect(parseTags('#フィルム #レトロ')).toEqual(['フィルム', 'レトロ'])
  })

  it('重複を落とす', () => {
    expect(parseTags('a, a, b')).toEqual(['a', 'b'])
  })

  it('空文字なら空配列', () => {
    expect(parseTags('')).toEqual([])
    expect(parseTags('  ,  ')).toEqual([])
  })
})

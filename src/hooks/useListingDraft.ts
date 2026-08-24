import { useMemo, useState } from 'react'

import { CATEGORIES, type Category, type Condition } from '@/data/listings'

export const CONDITIONS: readonly Condition[] = [
  '新品',
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
]

export interface ListingDraft {
  title: string
  description: string
  category: string
  condition: string
  /** 入力中は文字列で持つ。数値に寄せるのは検証を通ってから */
  price: string
  tagsText: string
  acceptsStablecoin: boolean
}

export const EMPTY_DRAFT: ListingDraft = {
  title: '',
  description: '',
  category: '',
  condition: '',
  price: '',
  tagsText: '',
  acceptsStablecoin: false,
}

/** 必須項目だけ。任意（説明・タグ）は空でも出品できる（decisions/0004） */
export type DraftErrorField = 'title' | 'category' | 'condition' | 'price'

export type DraftErrors = Partial<Record<DraftErrorField, string>>

const PRICE_MIN = 300
const PRICE_MAX = 9_999_999

/**
 * 下書きの検証。**純粋関数**なので UI を起動せずにテストできる。
 *
 * 空欄そのものはエラーにしない（入力前から赤くしない）。
 * 「送信できるか」は canSubmitDraft で別に判定する
 */
export const validateDraft = (draft: ListingDraft): DraftErrors => {
  const errors: DraftErrors = {}

  if (draft.title.trim().length > 60) {
    errors.title = 'タイトルは 60 文字以内で入力してください'
  }

  if (draft.price.trim() !== '') {
    const n = Number(draft.price)
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      errors.price = '価格は整数で入力してください'
    } else if (n < PRICE_MIN) {
      errors.price = `価格は ${PRICE_MIN} 円以上で入力してください`
    } else if (n > PRICE_MAX) {
      errors.price = `価格は ${PRICE_MAX.toLocaleString()} 円以下で入力してください`
    }
  }

  return errors
}

/** 必須が埋まっていて、かつ検証エラーが無いこと */
export const canSubmitDraft = (draft: ListingDraft): boolean => {
  const filled =
    draft.title.trim() !== '' &&
    draft.category !== '' &&
    draft.condition !== '' &&
    draft.price.trim() !== ''
  return filled && Object.keys(validateDraft(draft)).length === 0
}

/** 区切り文字混在のタグ入力を配列にする。空要素と重複は落とす */
export const parseTags = (tagsText: string): string[] => [
  ...new Set(
    tagsText
      .split(/[,、\s]+/)
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t !== '')
  ),
]

export const CATEGORY_OPTIONS = CATEGORIES.map((c: Category) => ({
  value: c,
  label: c,
}))

export const CONDITION_OPTIONS = CONDITIONS.map((c) => ({
  value: c,
  label: c,
}))

export const useListingDraft = () => {
  const [draft, setDraft] = useState<ListingDraft>(EMPTY_DRAFT)

  const errors = useMemo(() => validateDraft(draft), [draft])
  const canSubmit = useMemo(() => canSubmitDraft(draft), [draft])
  const tags = useMemo(() => parseTags(draft.tagsText), [draft.tagsText])

  return {
    draft,
    errors,
    canSubmit,
    tags,
    set: <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) =>
      setDraft((prev) => ({ ...prev, [key]: value })),
    reset: () => setDraft(EMPTY_DRAFT),
  }
}

import { useCallback, useState } from 'react'

const STORAGE_KEY = 'kaze-ec:favorites'

/**
 * 保存値を配列に正規化する。**純粋関数**なのでテストできる。
 *
 * 壊れた JSON・型違い・重複が入っていても落とさない。localStorage は
 * 利用者が手で書き換えられるので、読む側が信用しない
 */
export const parseFavorites = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter((v): v is string => typeof v === 'string'))]
  } catch {
    return []
  }
}

/** 追加と削除を 1 つにまとめた純粋関数。保存も state 更新もしない */
export const toggleFavorite = (ids: string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((v) => v !== id) : [...ids, id]

const readStored = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    return parseFavorites(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    return []
  }
}

/** 書けなくても操作は止めない（プライベートモード等） */
const writeStored = (ids: string[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // 保存できないだけ。押せなくなるほうが体験として悪い
  }
}

export const useFavorites = () => {
  const [ids, setIds] = useState<string[]>(readStored)

  // **更新関数の中で localStorage を触らない。** React 18 の StrictMode では
  // 更新関数が 2 回実行されるので、副作用を入れると二重に書き込まれる。
  // 外で計算 → 保存 → setState(値) の順にする（decisions/0006）
  const toggle = useCallback(
    (id: string) => {
      const next = toggleFavorite(ids, id)
      writeStored(next)
      setIds(next)
    },
    [ids]
  )

  return {
    ids,
    has: useCallback((id: string) => ids.includes(id), [ids]),
    toggle,
    count: ids.length,
  }
}

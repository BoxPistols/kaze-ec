/**
 * 再現可能な擬似乱数（mulberry32）。
 *
 * 分析レイヤーでは Math.random / Date.now / 引数なしの new Date() を使わない。
 * 同じ入力・同じ設定・同じ分析バージョンから同じ結果を再現する、という契約を
 * 守るため、乱数は必ず seed 付きの Rng を引数で受け渡す。
 *
 * 出典: adlumetra の causal-effect-lab skill（templates/rng.ts）。
 * このリポジトリの規約（セミコロン無し）に合わせただけで、実装は同じ
 */

export type Rng = () => number

export const makeRng = (seed: number): Rng => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 標準正規乱数（Box-Muller） */
export const normal = (rng: Rng): number => {
  const u = Math.max(rng(), 1e-12) // log(0) を避ける
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** 重み付きの離散選択 */
export const pickWeighted = <T>(
  rng: Rng,
  items: readonly T[],
  weights: readonly number[]
): T => {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = rng() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

export const bernoulli = (rng: Rng, p: number): 0 | 1 => (rng() < p ? 1 : 0)

/** ロジスティック関数。交絡のある割付を作るときに使う */
export const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

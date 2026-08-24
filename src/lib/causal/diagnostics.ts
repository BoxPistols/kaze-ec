import { COVARIATE_LABELS, propensityScores } from './estimators'
import type { BalanceItem, Diagnostics, UnitRow } from './types'

/**
 * 診断。推定値の隣に必ず置く。**無いとその数字は読めない。**
 *
 * - Overlap: そもそも比較できる相手がいるか。ここが大きいと調整では救えない
 * - SMD: 補正が効いたことの唯一の証拠
 * - E-value: 観測していない要因への感度
 */

const OVERLAP_LO = 0.05
const OVERLAP_HI = 0.95

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0)

const variance = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return xs.reduce((s, v) => s + (v - m) ** 2, 0) / (xs.length - 1)
}

/** 標準化平均差。|SMD| > 0.1 が不均衡の目安 */
const smd = (a: number[], b: number[]): number => {
  const pooled = Math.sqrt((variance(a) + variance(b)) / 2)
  if (pooled === 0) return 0
  return (mean(a) - mean(b)) / pooled
}

/** 重み付き平均・分散版の SMD（調整後） */
const smdWeighted = (
  a: number[],
  aw: number[],
  b: number[],
  bw: number[]
): number => {
  const wmean = (x: number[], w: number[]) => {
    const sw = w.reduce((s, v) => s + v, 0)
    return sw === 0 ? 0 : x.reduce((s, v, i) => s + v * w[i], 0) / sw
  }
  const wvar = (x: number[], w: number[], m: number) => {
    const sw = w.reduce((s, v) => s + v, 0)
    return sw === 0 ? 0 : x.reduce((s, v, i) => s + w[i] * (v - m) ** 2, 0) / sw
  }
  const ma = wmean(a, aw)
  const mb = wmean(b, bw)
  const pooled = Math.sqrt((wvar(a, aw, ma) + wvar(b, bw, mb)) / 2)
  if (pooled === 0) return 0
  return (ma - mb) / pooled
}

const CONTINUOUS: { label: string; get: (r: UnitRow) => number }[] = [
  { label: COVARIATE_LABELS[0], get: (r) => r.priceBand },
  { label: COVARIATE_LABELS[1], get: (r) => r.likesAtListing },
  { label: COVARIATE_LABELS[2], get: (r) => r.sellerPastSales },
]

export const overlapShare = (rows: UnitRow[], ps?: number[]): number => {
  const e = ps ?? propensityScores(rows)
  if (e.length === 0) return 0
  const outside = e.filter((v) => v < OVERLAP_LO || v > OVERLAP_HI).length
  return outside / e.length
}

/**
 * E-value。未観測交絡がどれくらい強ければ結論が覆るか。
 * リスク比 RR に対して E = RR + sqrt(RR * (RR - 1))
 */
export const eValue = (rows: UnitRow[], effect: number): number => {
  const control = rows.filter((r) => r.treatment === 0)
  const p0 = mean(control.map((r) => r.y))
  if (p0 <= 0 || p0 >= 1) return 1
  const p1 = Math.min(0.999, Math.max(0.001, p0 + effect))
  let rr = p1 / p0
  if (rr < 1) rr = 1 / rr // 保護的な効果でも同じ尺度に載せる
  return rr + Math.sqrt(rr * (rr - 1))
}

export const diagnose = (rows: UnitRow[], effect: number): Diagnostics => {
  const ps = propensityScores(rows)
  const treatedIdx = rows.map((_, i) => i).filter((i) => rows[i].treatment === 1)
  const controlIdx = rows.map((_, i) => i).filter((i) => rows[i].treatment === 0)

  // ATT の重み: 処置群は 1、対照群は e/(1-e)
  const tw = treatedIdx.map(() => 1)
  const cw = controlIdx.map((i) => ps[i] / (1 - ps[i]))

  const balance: BalanceItem[] = CONTINUOUS.map(({ label, get }) => {
    const a = treatedIdx.map((i) => get(rows[i]))
    const b = controlIdx.map((i) => get(rows[i]))
    return {
      covariate: label,
      smdBefore: smd(a, b),
      smdAfter: smdWeighted(a, tw, b, cw),
    }
  })

  return {
    outsideShare: overlapShare(rows, ps),
    balance,
    eValue: eValue(rows, effect),
  }
}

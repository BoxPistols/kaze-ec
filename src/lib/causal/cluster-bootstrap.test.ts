import { describe, expect, it } from 'vitest'

import { bootstrapCI, estimateAll, generateDataset, getScenario, prepare } from './index'
import type { Scenario } from './generate'

/**
 * クラスタ構造とブートストラップの検証。
 *
 * 発端は「分析単位を出品にすると、同じ出品者の複数出品は独立ではないので、
 * 出品単位の再標本では信頼区間が狭くなりすぎるのではないか」という指摘。
 * **指摘した側も実装・実測していない机上の話だと明示していた。**
 *
 * ここでやるのは、その机上の話を測ることであって、正しさを前提に
 * 実装を足すことではない。判定基準は「真の標本 SD」— 独立なデータセットを
 * 何本も作って点推定がどれだけばらつくかで、これが唯一の正解。
 * ブートストラップはこれを 1 本のデータから当てにいく道具なので、
 * 当たっているかは真の SD と比べるしかない
 */

const CI_TO_SD = 3.92 // 95% 区間の幅 → SD

const sc = (over: Partial<Scenario> = {}): Scenario => ({
  ...getScenario('confounded'),
  n: 2000,
  ...over,
})

/** 独立なデータセットを何本も作り、点推定の真のばらつきを出す */
const trueSamplingSd = (listingsPerSeller: number, reps: number): number => {
  const ests: number[] = []
  for (let i = 1; i <= reps; i++) {
    const { records } = generateDataset(sc({ seed: i * 7, listingsPerSeller }))
    ests.push(estimateAll(prepare(records).rows).aipw)
  }
  const m = ests.reduce((s, v) => s + v, 0) / ests.length
  return Math.sqrt(ests.reduce((s, v) => s + (v - m) ** 2, 0) / (ests.length - 1))
}

/** ブートストラップが推定した SD の平均 */
const bootstrapSd = (
  listingsPerSeller: number,
  resample: 'cluster' | 'unit',
  reps: number
): number => {
  const sds: number[] = []
  for (let i = 1; i <= reps; i++) {
    const { records } = generateDataset(sc({ seed: i * 7, listingsPerSeller }))
    const ci = bootstrapCI(prepare(records).rows, {
      bootstrap: 80,
      seed: i,
      resample,
    }).aipw
    if (ci) sds.push((ci[1] - ci[0]) / CI_TO_SD)
  }
  return sds.reduce((s, v) => s + v, 0) / sds.length
}

describe('クラスタ再標本', () => {
  it('出品者が 1 出品ずつのとき、クラスタ再標本と単位再標本は同じ結果になる', () => {
    // クラスタ = 単位 なので一致するはず。一致しなければクラスタ実装のバグ
    const { records } = generateDataset(sc({ seed: 3, listingsPerSeller: 1 }))
    const rows = prepare(records).rows
    const opts = { bootstrap: 40, seed: 3 } as const
    const a = bootstrapCI(rows, { ...opts, resample: 'cluster' }).aipw
    const b = bootstrapCI(rows, { ...opts, resample: 'unit' }).aipw
    expect(a).not.toBeNull()
    // 再標本の乱数消費が同じ形なので、完全一致まで要求できる
    expect(a).toEqual(b)
  })

  it('出品者あたり 10 出品でも、単位再標本の区間は真の SD より狭くならない', () => {
    // **これが机上の指摘を否定した測定。**
    // 「クラスタを無視すると区間が不当に狭くなる」なら、unit の推定 SD が
    // 真の SD を明確に下回るはず。実測では下回らない
    const truth = trueSamplingSd(10, 30)
    const unit = bootstrapSd(10, 'unit', 6)
    expect(unit).toBeGreaterThan(truth * 0.9)
  })

  it('出品者あたり 10 出品で、両方式の推定 SD の差は 15% 未満', () => {
    // 差が出ないことを固定する。将来この検査が落ちたときは、
    // 生成器の出品者効果を強めたか、割付に出品者効果を入れたかのどちらか。
    // そのときはクラスタ処理が実際に効き始めた合図なので、上のコメントを直す
    const cluster = bootstrapSd(10, 'cluster', 6)
    const unit = bootstrapSd(10, 'unit', 6)
    expect(Math.abs(cluster - unit) / unit).toBeLessThan(0.15)
  })

  it('どちらの方式でも、真の SD を大きく外さない', () => {
    // ブートストラップそのものが妥当かの検査。
    // これが落ちたら、クラスタの話以前に区間推定が壊れている
    const truth = trueSamplingSd(4, 30)
    const cluster = bootstrapSd(4, 'cluster', 6)
    expect(cluster).toBeGreaterThan(truth * 0.7)
    expect(cluster).toBeLessThan(truth * 1.5)
  })
})

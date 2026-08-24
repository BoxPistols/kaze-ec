import { describe, expect, it } from 'vitest'

import {
  bootstrapCI,
  checkQuality,
  estimateAll,
  generateDataset,
  getScenario,
  prepare,
  runScenario,
} from './index'
import type { Scenario } from './generate'
import type { LogRecord } from './types'

/**
 * adlumetra の causal-effect-lab skill が定める契約に対する検証。
 * templates/effect-lab.test.ts の 6 群をこのドメインで実装したもの。
 */

const sc = (id: string, over: Partial<Scenario> = {}): Scenario => ({
  ...getScenario(id),
  ...over,
})

describe('真値の回収', () => {
  it('交絡があるとき、単純比較は系統的に偏り、AIPW は偏らない', () => {
    // **1 シードで比べてはいけない。** 交絡による偏りは期待値の性質なので、
    // 単一データセットでは標本誤差に埋もれる。実際 seed=1 では単純比較の
    // 誤差がたまたま 0.006 まで小さくなり、AIPW（0.025）より良く見えた。
    // 偏りを主張するなら偏りを測る
    const errs = { naive: [] as number[], aipw: [] as number[] }
    for (let seed = 1; seed <= 8; seed++) {
      const { records, truth } = generateDataset(sc('confounded', { seed }))
      const est = estimateAll(prepare(records).rows)
      errs.naive.push(est.naive - truth.ate)
      errs.aipw.push(est.aipw - truth.ate)
    }
    const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length
    const naiveBias = mean(errs.naive)
    const aipwBias = mean(errs.aipw)

    // 売れにくい出品ほど値下げされる作りなので、単純比較は効果を過小評価する
    expect(naiveBias).toBeLessThan(-0.02)
    // AIPW の残存偏りは真の効果 0.08 に対して 1/4 未満に収まる
    expect(Math.abs(aipwBias)).toBeLessThan(0.02)
    expect(Math.abs(aipwBias)).toBeLessThan(Math.abs(naiveBias))
  })

  it('交絡が無いとき、単純比較も AIPW も真値に近い', () => {
    const { records, truth } = generateDataset(sc('rct-positive', { seed: 2 }))
    const est = estimateAll(prepare(records).rows)
    expect(Math.abs(est.naive - truth.ate)).toBeLessThan(0.04)
    expect(Math.abs(est.aipw - truth.ate)).toBeLessThan(0.04)
  })

  it('真の効果がゼロのとき、信頼区間が 0 をまたぐ', () => {
    // 偽陽性の検査。これが無いと「常に効果あり」と出す実装でもテストが通る
    const { records } = generateDataset(sc('rct-zero', { seed: 3 }))
    const ci = bootstrapCI(prepare(records).rows, { bootstrap: 100, seed: 3 }).aipw
    expect(ci).not.toBeNull()
    expect(ci![0]).toBeLessThan(0)
    expect(ci![1]).toBeGreaterThan(0)
  })
})

describe('決定性', () => {
  it('同じ seed で 2 回実行すると完全に一致する', () => {
    const a = runScenario('confounded', { seed: 42 })
    const b = runScenario('confounded', { seed: 42 })
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('seed が違えば結果も違う（seed が実際に効いていることの確認）', () => {
    // これが無いと、seed を無視している実装でも決定性テストが通ってしまう
    const a = runScenario('confounded', { seed: 1 })
    const b = runScenario('confounded', { seed: 2 })
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b))
  })

  it('結果に分析バージョンと設定が含まれる', () => {
    const r = runScenario('confounded', { seed: 5 })
    expect(r.version).toMatch(/\d+\.\d+\.\d+/)
    expect(r.settings.seed).toBe(5)
  })
})

describe('品質ゲート', () => {
  it('各群が下限を割ると分析不能になり、必要なデータが返る', () => {
    const { records } = generateDataset(sc('small-sample', { seed: 5 }))
    const prep = prepare(records)
    const q = checkQuality(records, prep)
    expect(q.analyzable).toBe(false)
    expect(q.requiredData.length).toBeGreaterThan(0)
    // 「不足しています」だけでは直せない。何件あるかが detail に入っていること
    expect(q.checks.find((c) => c.id === 'group-size')?.detail).toMatch(/\d/)
  })

  it('分析不能なとき、推定値は返らない', () => {
    const run = runScenario('small-sample')
    expect(run.status).toBe('blocked')
    expect(run).not.toHaveProperty('results')
  })

  it('Overlap が不足していると分析不能になる', () => {
    const { records } = generateDataset(sc('low-overlap', { seed: 6 }))
    const q = checkQuality(records, prepare(records))
    expect(q.checks.find((c) => c.id === 'overlap')?.status).toBe('fail')
    expect(q.analyzable).toBe(false)
  })

  it('正常なシナリオは分析可能になる', () => {
    const run = runScenario('confounded', { seed: 7 })
    expect(run.status).toBe('ok')
  })
})

describe('除外の計上', () => {
  it('共変量が 1 つ欠けた単位は、黙って消えず件数に計上される', () => {
    const { records } = generateDataset(sc('rct-positive', { seed: 7 }))
    const target = records[0].unit_id
    const broken: LogRecord[] = records.map((r) =>
      r.unit_id === target ? { ...r, likesAtListing: null } : r
    )
    const prep = prepare(broken)
    expect(prep.excluded.missingCovariates).toBe(1)
    expect(prep.rows.find((r) => r.unitId === target)).toBeUndefined()
  })

  it('同一単位で割付が割れていたら除外して数える', () => {
    const { records } = generateDataset(sc('rct-positive', { seed: 8 }))
    const target = records[0]
    const broken: LogRecord[] = [
      ...records,
      { ...target, treatment: (1 - target.treatment) as 0 | 1, date: '2026-07-15' },
    ]
    expect(prepare(broken).excluded.conflictingTreatment).toBe(1)
  })

  it('完全一致の重複行は畳んだうえで件数を返す', () => {
    const { records } = generateDataset(sc('rct-positive', { seed: 9 }))
    const prep = prepare([...records, records[0]])
    expect(prep.duplicateRows).toBe(1)
    expect(prep.recordCount).toBe(records.length + 1)
  })

  it('dirty シナリオは欠損と重複の両方を計上する', () => {
    const { records } = generateDataset(sc('dirty', { seed: 11 }))
    const prep = prepare(records)
    expect(prep.excluded.missingCovariates).toBeGreaterThan(0)
    expect(prep.duplicateRows).toBeGreaterThan(0)
  })
})

describe('中間変数の混入検知', () => {
  it('施策の後に動く値を共変量に入れると、推定が真値から系統的に外れる', () => {
    // このテストは「将来の自分が mediator を共変量に足す」のを止めるために置く。
    // 落ちたときは推定器のバグではなく、共変量の選び方が壊れている
    const { records, truth } = generateDataset(sc('confounded', { seed: 10 }))
    const rows = prepare(records).rows

    const correct = estimateAll(rows)
    // 事前の値を、施策後に動いた値で置き換える = mediator で調整してしまった状態
    const withMediator = estimateAll(
      rows.map((r) => ({ ...r, likesAtListing: r.mediators.likesNow }))
    )

    // 単一シードなので閾値は緩く取る（標本 SD が 0.016 ある）。
    // このテストの本体は下の 1 行で、同じデータ内の比較なので安定している
    expect(Math.abs(correct.aipw - truth.ate)).toBeLessThan(0.05)
    // 中間変数で調整すると効果が過小になる
    expect(withMediator.aipw).toBeLessThan(correct.aipw)
  })
})

describe('合成データであることの明示', () => {
  it('真値を一緒に返す（実データでは絶対にできない見せ方）', () => {
    const r = runScenario('confounded', { seed: 12 })
    expect(r.truth.ate).toBeGreaterThan(0)
  })

  it('シナリオが「何を確かめるところか」を持つ', () => {
    const r = runScenario('rct-zero', { seed: 13 })
    expect(r.scenario.expectation).not.toBe('')
  })

  it('分析可能なとき、前提・限界・次にやることが揃う', () => {
    const r = runScenario('confounded', { seed: 14 })
    if (r.status !== 'ok') throw new Error('expected ok')
    expect(r.assumptions.length).toBeGreaterThan(0)
    expect(r.limitations.length).toBeGreaterThan(0)
    expect(r.nextSteps.length).toBeGreaterThan(0)
  })
})

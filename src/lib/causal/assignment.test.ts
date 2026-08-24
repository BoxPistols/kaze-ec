import { describe, expect, it } from 'vitest'

import { detectAssignment } from './assignment'
import { checkQuality, generateDataset, getScenario, prepare } from './index'
import { GROUP_SIZE_FAIL } from './quality'

/**
 * 処置の割り当て単位の検出と、それを使ったゲート。
 *
 * **設定として受け取らず、データから観測する**ことを固定する。
 * 実ログを繋いだときに誰かが正しく申告する前提を作らない
 */

describe('割り当て単位の検出', () => {
  it('出品者ごとに値下げを決めたデータを、出品者単位と判定する', () => {
    const { records } = generateDataset({
      ...getScenario('cluster-assigned'),
      seed: 3,
    })
    const info = detectAssignment(prepare(records).rows)
    expect(info.unit).toBe('seller')
    expect(info.variationShare).toBe(0)
    // 独立な割り当ての数は出品数ではなく出品者数
    expect(info.treatedUnits + info.controlUnits).toBeLessThan(records.length)
  })

  it('出品ごとに値下げを決めたデータを、出品単位と判定する', () => {
    const { records } = generateDataset({ ...getScenario('confounded'), seed: 3 })
    const rows = prepare(records).rows
    const info = detectAssignment(rows)
    expect(info.unit).toBe('listing')
    expect(info.variationShare).toBeGreaterThan(0.5)
    expect(info.treatedUnits + info.controlUnits).toBe(rows.length)
  })

  it('出品者が 1 出品ずつなら、判定材料が無いので出品単位として扱う', () => {
    // クラスタ = 単位なので、どちらで扱っても結果は変わらない
    const { records } = generateDataset({
      ...getScenario('confounded'),
      listingsPerSeller: 1,
      seed: 4,
    })
    expect(detectAssignment(prepare(records).rows).unit).toBe('listing')
  })
})

describe('独立な割り当て数のゲート', () => {
  it('出品者単位のとき、出品の件数ではなく出品者数で判定する', () => {
    // 総件数を増やしても独立な割り当ては増えない、という状況を作る
    const scenario = {
      ...getScenario('cluster-assigned'),
      n: 4000,
      listingsPerSeller: 40, // 100 人。各群 50 人前後で下限割れ
      seed: 5,
    }
    const { records } = generateDataset(scenario)
    const prep = prepare(records)
    const report = checkQuality(records, prep)

    // 件数のゲートは通る（各群 1000 件以上ある）
    expect(report.checks.find((c) => c.id === 'group-size')?.status).toBe('pass')
    // 割り当て数のゲートで止まる
    const assignCheck = report.checks.find((c) => c.id === 'assignment-unit')
    expect(assignCheck?.status).toBe('fail')
    expect(report.analyzable).toBe(false)
    // 「出品を増やしても増えない」ことまで返す
    expect(report.requiredData.some((r) => r.includes('出品者'))).toBe(true)
  })

  it('出品者数が足りていれば通る', () => {
    const { records } = generateDataset({
      ...getScenario('cluster-assigned'),
      seed: 6,
    })
    const prep = prepare(records)
    const report = checkQuality(records, prep)
    const check = report.checks.find((c) => c.id === 'assignment-unit')
    expect(check?.status).not.toBe('fail')
    expect(check?.detail).toMatch(/出品者ごとに決まっている/)
  })

  it('下限の定数が検査に使われている（閾値を変えたら結果が変わる）', () => {
    expect(GROUP_SIZE_FAIL).toBe(150)
  })
})

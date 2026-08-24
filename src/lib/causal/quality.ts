import { detectAssignment } from './assignment'
import { overlapShare } from './diagnostics'
import type { LogRecord, PrepareResult, QualityCheck, QualityReport } from './types'

/**
 * 品質ゲート。**fail が 1 つでもあれば推定を実行しない。**
 *
 * 数字を出さない経路を、数字を出す経路より先に作る。後から足すと
 * 必ず「とりあえず出す」が残る。
 *
 * 不正を弾くだけで終わらせず、「何があれば分析可能になるか」まで返す
 */

export const GROUP_SIZE_FAIL = 150
export const GROUP_SIZE_WARN = 500

const pct = (v: number) => `${(v * 100).toFixed(1)}%`

export const checkQuality = (
  records: LogRecord[],
  prep: PrepareResult
): QualityReport => {
  const checks: QualityCheck[] = []
  const requiredData: string[] = []

  const rows = prep.rows
  const treated = rows.filter((r) => r.treatment === 1).length
  const control = rows.length - treated

  // 1. 各群の件数
  const minGroup = Math.min(treated, control)
  checks.push({
    id: 'group-size',
    label: '各群の件数',
    status:
      minGroup < GROUP_SIZE_FAIL
        ? 'fail'
        : minGroup < GROUP_SIZE_WARN
          ? 'warn'
          : 'pass',
    // 「不足しています」だけでは直せない。何件あるかを必ず入れる
    detail: `値下げした出品 ${treated} 件 / しなかった出品 ${control} 件（下限 ${GROUP_SIZE_FAIL} 件、推奨 ${GROUP_SIZE_WARN} 件）`,
  })
  if (minGroup < GROUP_SIZE_FAIL) {
    requiredData.push(
      `各群 ${GROUP_SIZE_FAIL} 件以上の出品（現在の最小群は ${minGroup} 件）`
    )
  }

  // 1b. 独立に処置が割り当てられた数。
  // **件数のゲートだけでは足りない。** 処置が出品者単位で割り当てられていると、
  // 出品は各群 2000 件あっても独立な割り当ては 200 人分しかない、ということが
  // 起きる。割り当ての単位は設定で受け取らずデータから観測する（assignment.ts）
  const assign = detectAssignment(rows)
  const minAssign = Math.min(assign.treatedUnits, assign.controlUnits)
  checks.push({
    id: 'assignment-unit',
    label: '独立に処置が割り当てられた数',
    status:
      assign.unit === 'listing'
        ? 'pass'
        : minAssign < GROUP_SIZE_FAIL
          ? 'fail'
          : minAssign < GROUP_SIZE_WARN
            ? 'warn'
            : 'pass',
    detail:
      assign.unit === 'listing'
        ? `値下げは出品ごとに決まっている（複数出品を持つ ${assign.multiListingSellers} 人のうち ${(assign.variationShare * 100).toFixed(0)}% で出品者内に両方がある）。件数がそのまま独立な割り当ての数`
        : `値下げは出品者ごとに決まっている。独立な割り当ては 値下げ ${assign.treatedUnits} 人 / しなかった ${assign.controlUnits} 人（出品の件数ではなくこちらで判定する）`,
  })
  if (assign.unit === 'seller' && minAssign < GROUP_SIZE_FAIL) {
    requiredData.push(
      `各群 ${GROUP_SIZE_FAIL} 人以上の出品者（現在は最小群 ${minAssign} 人。出品を増やしても独立な割り当ては増えない）`
    )
  }

  // 2. 共変量欠損による除外率
  const excludedShare =
    prep.recordCount === 0
      ? 0
      : prep.excluded.missingCovariates /
        (prep.excluded.missingCovariates + rows.length || 1)
  checks.push({
    id: 'missing-covariates',
    label: '共変量欠損による除外',
    status: excludedShare > 0.1 ? 'fail' : excludedShare > 0.03 ? 'warn' : 'pass',
    detail: `${prep.excluded.missingCovariates} 単位を除外（${pct(excludedShare)}）`,
  })
  if (excludedShare > 0.1) {
    requiredData.push('共変量が欠損していない出品ログ（欠損 10% 未満）')
  }

  // 3. 割付の衝突
  checks.push({
    id: 'conflicting-treatment',
    label: '同一単位での割付の衝突',
    status: prep.excluded.conflictingTreatment > 0 ? 'warn' : 'pass',
    detail: `${prep.excluded.conflictingTreatment} 単位を除外`,
  })

  // 4. 重複行
  const dupShare =
    prep.recordCount === 0 ? 0 : prep.duplicateRows / prep.recordCount
  checks.push({
    id: 'duplicates',
    label: '完全一致の重複行',
    status: dupShare > 0.05 ? 'fail' : dupShare > 0.005 ? 'warn' : 'pass',
    detail: `${prep.duplicateRows} 行（${pct(dupShare)}）`,
  })
  if (dupShare > 0.05) requiredData.push('重複を除いたログ（重複 5% 未満）')

  // 5. 成果イベント
  const eventsT = rows.filter((r) => r.treatment === 1 && r.y === 1).length
  const eventsC = rows.filter((r) => r.treatment === 0 && r.y === 1).length
  const rate = rows.length === 0 ? 0 : (eventsT + eventsC) / rows.length
  checks.push({
    id: 'events',
    label: '成果イベント',
    status:
      eventsT === 0 || eventsC === 0 ? 'fail' : rate < 0.01 ? 'warn' : 'pass',
    detail: `成約 ${eventsT} 件 / ${eventsC} 件（発生率 ${pct(rate)}）`,
  })
  if (eventsT === 0 || eventsC === 0) {
    requiredData.push('両群に成約が発生しているログ')
  }

  // 6. Overlap（共通サポート）
  const outside = rows.length === 0 ? 0 : overlapShare(rows)
  checks.push({
    id: 'overlap',
    label: '共通サポート外の割合',
    status: outside > 0.15 ? 'fail' : outside > 0.05 ? 'warn' : 'pass',
    detail: `${pct(outside)}（傾向スコアが [0.05, 0.95] の外）`,
  })
  if (outside > 0.15) {
    requiredData.push(
      '条件の重なる出品（今は比較相手のいない出品が多く、調整では救えない）'
    )
  }

  // 7. 日付の欠測
  const days = new Set(records.map((r) => r.date)).size
  checks.push({
    id: 'date-coverage',
    label: '日付の網羅',
    status: days === 0 ? 'fail' : 'pass',
    detail: `${days} 日分`,
  })

  const fails = checks.filter((c) => c.status === 'fail')
  return {
    checks,
    analyzable: fails.length === 0,
    reasons: fails.map((c) => `${c.label}: ${c.detail}`),
    requiredData,
  }
}

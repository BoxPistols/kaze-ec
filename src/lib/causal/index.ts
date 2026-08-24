import { bootstrapCI } from './bootstrap'
import { diagnose } from './diagnostics'
import { ESTIMATOR_META, estimateAll } from './estimators'
import { generateDataset, getScenario, SCENARIOS, type Scenario } from './generate'
import { prepare } from './prepare'
import { checkQuality } from './quality'
import {
  ANALYSIS_VERSION,
  CAUSAL_SPEC,
  DEFAULT_SETTINGS,
  type AnalysisSettings,
  type Diagnostics,
  type EstimatorId,
  type EstimatorResult,
  type PrepareResult,
  type QualityReport,
} from './types'

/**
 * 公開 API。**UI はこのファイルからしか import しない。**
 *
 * 下の層（生成 / 集約 / 検査 / 推定 / 診断）は互いを知らない。
 */

export interface AnalysisBlocked {
  status: 'blocked'
  version: string
  settings: AnalysisSettings
  scenario: Scenario
  quality: QualityReport
  prepare: PrepareResult
  /** 合成データであることを画面に出すため、真値も返す */
  truth: { ate: number; att: number }
}

export interface AnalysisOk {
  status: 'ok'
  version: string
  settings: AnalysisSettings
  scenario: Scenario
  quality: QualityReport
  prepare: PrepareResult
  truth: { ate: number; att: number }
  results: EstimatorResult[]
  diagnostics: Diagnostics
  assumptions: string[]
  limitations: string[]
  nextSteps: string[]
}

export type AnalysisResult = AnalysisOk | AnalysisBlocked

const ASSUMPTIONS = [
  '値下げの有無は、観測している共変量（カテゴリ・状態・価格帯・出品者の過去成約数・出品時のいいね数）で条件付ければランダムとみなせる',
  '共変量はすべて値下げより前の時点で確定している',
  '同じ出品者の出品は独立ではないため、信頼区間は出品者単位で再標本して算出している',
]

const LIMITATIONS = [
  'これは合成データによる方法論の検証で、kaze-ec の実挙動の分析ではない',
  '写真の質や説明文の丁寧さは観測していない。E-value がその感度を示す',
  '推定できるのは集団の平均で、個別の出品について「効いた」とは言えない',
]

const NEXT_STEPS = [
  '実ログを繋ぐ（出品・値下げ・成約の日次記録）',
  'セグメント別（カテゴリ × 価格帯）の効果を出す。分割は分析前に宣言する',
  '成果を金額に拡張する（外れ値検査と中央値の併記が要る）',
]

export const runScenario = (
  scenarioId: string,
  settings: Partial<AnalysisSettings> = {}
): AnalysisResult => {
  const s = getScenario(scenarioId)
  const cfg: AnalysisSettings = { ...DEFAULT_SETTINGS, ...settings }
  // シナリオ側の seed も設定で上書きできるようにする（決定性テスト用）
  const scenario: Scenario = { ...s, seed: settings.seed ?? s.seed }

  const { records, truth } = generateDataset(scenario)
  const prep = prepare(records)
  const quality = checkQuality(records, prep)

  const common = {
    version: ANALYSIS_VERSION,
    settings: cfg,
    scenario,
    quality,
    prepare: prep,
    truth,
  }

  // **fail があれば推定を実行しない。** results を持たせない
  if (!quality.analyzable) {
    return { status: 'blocked', ...common }
  }

  const point = estimateAll(prep.rows)
  const ci = bootstrapCI(prep.rows, {
    bootstrap: cfg.bootstrap,
    seed: cfg.seed,
  })

  const results: EstimatorResult[] = (
    ['naive', 'regression', 'ipw', 'aipw'] as EstimatorId[]
  ).map((id) => ({
    id,
    ...ESTIMATOR_META[id],
    ATE: point[id],
    ci: ci[id],
  }))

  return {
    status: 'ok',
    ...common,
    results,
    diagnostics: diagnose(prep.rows, point.aipw),
    assumptions: ASSUMPTIONS,
    limitations: LIMITATIONS,
    nextSteps: NEXT_STEPS,
  }
}

export { CAUSAL_SPEC, ANALYSIS_VERSION, DEFAULT_SETTINGS, SCENARIOS, getScenario }
export { generateDataset } from './generate'
export { prepare } from './prepare'
export { checkQuality } from './quality'
export { estimateAll } from './estimators'
export { bootstrapCI } from './bootstrap'
export type { Scenario } from './generate'
export type {
  AnalysisSettings,
  Diagnostics,
  EstimatorResult,
  QualityReport,
  UnitRow,
} from './types'

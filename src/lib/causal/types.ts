/**
 * 因果効果レイヤーの型。
 *
 * 因果定義は design/decisions/0003-analytics-scope.md §5 が単一ソース。
 * ここはその型表現で、値の意味は向こうを読む。
 */

/** 推定器を変えたら上げる。過去の出力と突き合わせられなくなるのを防ぐ */
export const ANALYSIS_VERSION = '1.0.0'

/** 施策の閾値。**分析前に決め、結果を見てから動かさない** */
export const DISCOUNT_THRESHOLD = 0.1

export const CAUSAL_SPEC = {
  unit: '出品（listing）',
  treatment: '出品価格から 10% 以上値下げした',
  outcome: '期間内に成約した',
  timeWindow: '出品日から 30 日',
  comparison: '値下げした出品 vs しなかった出品',
  estimand: 'ATT（実際に値下げした出品にとってどうだったか）',
  confounders: [
    'カテゴリ',
    '商品状態',
    '出品時の価格帯',
    '出品者の過去成約数',
    '出品時点のいいね数',
  ],
  exclusions: [
    '共変量に欠損がある単位',
    '同一単位で割付が割れている単位',
    '完全一致の重複行',
  ],
} as const

/**
 * 施策の後に動く値。**共変量に混ぜないために入れ子にする。**
 *
 * フラットに並べると、いつか誰かが特徴量の配列へ足す。入れ子なら
 * 共変量を組み立てる関数から見えない（decisions/0003 §5）
 */
export interface Mediators {
  /** 現在のいいね数。値下げ後に増えるので confounder ではない */
  likesNow: number
  /** 値下げ後の閲覧数 */
  viewsAfter: number
}

/** 生ログ 1 行。共変量は欠損しうる（null が 1 つでもあれば単位ごと落ちる） */
export interface LogRecord {
  unit_id: string
  seller_id: string
  date: string
  treatment: 0 | 1
  sold: 0 | 1
  // --- 共変量（すべて施策より前の時点で確定している） ---
  category: string | null
  condition: string | null
  /** 出品時の価格帯（対数スケールに寄せた連続値） */
  priceBand: number | null
  /** 出品者の過去成約数 */
  sellerPastSales: number | null
  /** **出品時点の**いいね数。現在の値ではない */
  likesAtListing: number | null
  // --- 中間変数（推定に使わない） ---
  mediators: Mediators
}

/** 単位へ集約した後の 1 行。共変量が揃っているものだけが残る */
export interface UnitRow {
  unitId: string
  sellerId: string
  treatment: 0 | 1
  y: 0 | 1
  category: string
  condition: string
  priceBand: number
  sellerPastSales: number
  likesAtListing: number
  mediators: Mediators
}

export interface PrepareResult {
  rows: UnitRow[]
  recordCount: number
  duplicateRows: number
  excluded: {
    missingCovariates: number
    conflictingTreatment: number
  }
}

export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface QualityCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface QualityReport {
  checks: QualityCheck[]
  analyzable: boolean
  reasons: string[]
  requiredData: string[]
}

export interface EffectEstimate {
  /** 率のポイント差。0.062 = +6.2pt */
  ATE: number
  ci: [number, number] | null
}

export type EstimatorId = 'naive' | 'regression' | 'ipw' | 'aipw'

export interface EstimatorResult extends EffectEstimate {
  id: EstimatorId
  label: string
  /** naive は参考値。意思決定に使わない */
  adopted: boolean
  note: string
}

export interface BalanceItem {
  covariate: string
  smdBefore: number
  smdAfter: number
}

export interface Diagnostics {
  /** 傾向スコアが [0.05, 0.95] の外にいる割合 */
  outsideShare: number
  balance: BalanceItem[]
  /** 未観測交絡がどれくらい強ければ結論が覆るか */
  eValue: number
}

export interface AnalysisSettings {
  seed: number
  bootstrap: number
}

export const DEFAULT_SETTINGS: AnalysisSettings = {
  seed: 20260816,
  bootstrap: 150,
}

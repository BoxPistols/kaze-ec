import { bernoulli, makeRng, normal, pickWeighted, sigmoid } from './rng'
import type { LogRecord } from './types'

/**
 * 分析用の合成ログ生成器。
 *
 * **これは kaze-ec の実挙動ではない。** 真の効果が既知の合成データで、
 * 推定器が真値を回収できるかを検証するためのもの。実ログが入ったときに
 * そのまま回る配管の先行実装（decisions/0003）。
 *
 * 画面に出るカタログ（src/data/listings.ts の 8 件）とは**完全に別ソース**。
 * 混ぜるとモックの数字が実績として読まれる。
 */

export interface Scenario {
  id: string
  label: string
  description: string
  /** このシナリオで何を確かめるか。画面にも出す */
  expectation: string
  /** 生成する単位（出品）数 */
  n: number
  /** 出品者 1 人あたりの出品数。クラスタ構造の強さを決める */
  listingsPerSeller: number
  seed: number
  days: number
  startDate: string
  /** 施策を受けなかった場合の成果率 */
  baseRate: number
  /** 真の効果（ポイント差） */
  effect: number
  /** 観測共変量による割付の交絡強度。0 = ランダム化 */
  confounding: number
  /** 割付の偏り。Overlap 不足の再現用 */
  overlapSkew: number
  /** 未観測交絡の強度 */
  hiddenConfounding: number
  /** 出品者ごとの共通効果の大きさ（ランダム切片の標準偏差） */
  sellerSd: number
  /**
   * 処置を出品者単位で割り当てる（この出品者は全出品値下げ / この出品者はしない）。
   *
   * false（既定）だと同じ出品者の中で値下げした出品としなかった出品が混ざり、
   * 出品者の切片は差分で相殺される。true にすると相殺されなくなる
   */
  treatmentByCluster: boolean
  corruption: { missing: number; duplicate: number } | null
}

const CATEGORIES = ['カメラ', '食器', 'PC周辺機器', '本', '楽器', 'アウトドア']
const CONDITIONS = ['新品', '未使用に近い', '目立った傷や汚れなし', 'やや傷や汚れあり']

const BASE: Scenario = {
  id: 'base',
  label: '',
  description: '',
  expectation: '',
  n: 2000,
  listingsPerSeller: 4,
  seed: 20260816,
  days: 30,
  startDate: '2026-07-01',
  baseRate: 0.22,
  effect: 0.08,
  confounding: 0,
  overlapSkew: 0,
  hiddenConfounding: 0,
  sellerSd: 0.6,
  treatmentByCluster: false,
  corruption: null,
}

/**
 * 名前付きシナリオ。引数を毎回組み立てず、設定の集合に名前を付けて定数化する。
 * テストと画面の両方から同じ条件を呼べる
 */
export const SCENARIOS: Record<string, Scenario> = {
  'rct-positive': {
    ...BASE,
    id: 'rct-positive',
    label: 'ランダム割付・効果あり',
    description: '値下げを無作為に割り当てた場合。交絡が無い理想状態',
    expectation: '交絡が無いので、単純比較も AIPW も真値に近づくはず',
  },
  'rct-zero': {
    ...BASE,
    id: 'rct-zero',
    label: 'ランダム割付・効果ゼロ',
    description: '値下げに効果が無い場合',
    expectation: '信頼区間が 0 をまたぐはず。またがなければ偽陽性',
    effect: 0,
  },
  confounded: {
    ...BASE,
    id: 'confounded',
    label: '交絡あり・効果あり',
    description: '売れにくい出品ほど値下げされる。実際のフリマに近い',
    expectation: '単純比較は真値から外れ、AIPW は真値に近づくはず',
    confounding: 1.4,
  },
  'small-sample': {
    ...BASE,
    id: 'small-sample',
    label: 'サンプル不足',
    description: '各群が下限（150 件）を割る',
    expectation: '数字を出さずに分析不能と返すはず',
    n: 180,
    confounding: 1.0,
  },
  'low-overlap': {
    ...BASE,
    id: 'low-overlap',
    label: '比較相手がいない',
    description: '特定の条件の出品しか値下げされない',
    expectation: '共通サポート外が多く、調整では救えないと返すはず',
    confounding: 1.0,
    overlapSkew: 4.5,
  },
  'cluster-assigned': {
    ...BASE,
    id: 'cluster-assigned',
    label: '出品者単位で値下げ',
    description:
      '値下げを出品者ごとに決める（この出品者は全出品値下げ / この出品者はしない）',
    expectation:
      '出品の件数は十分でも、独立な割り当ては出品者数しかない。ゲートが件数ではなく出品者数で判定するはず',
    confounding: 1.4,
    n: 4000,
    listingsPerSeller: 10,
    treatmentByCluster: true,
  },
  dirty: {
    ...BASE,
    id: 'dirty',
    label: '欠損・重複あり',
    description: '共変量の欠損と重複行が混ざったログ',
    expectation: '除外した件数を黙って減らさず計上するはず',
    confounding: 1.0,
    corruption: { missing: 0.06, duplicate: 0.02 },
  },
}

export const getScenario = (id: string): Scenario => {
  const s = SCENARIOS[id]
  if (!s) throw new Error(`unknown scenario: ${id}`)
  return s
}

const addDays = (iso: string, days: number): string => {
  // Date.now / new Date() は使わない。文字列から組み立てて UTC で足す
  const [y, m, d] = iso.split('-').map(Number)
  const t = Date.UTC(y, m - 1, d) + days * 86400000
  const dt = new Date(t)
  return dt.toISOString().slice(0, 10)
}

export interface GeneratedDataset {
  scenario: Scenario
  records: LogRecord[]
  /** 合成データなので真値が分かる。**実データでは絶対にできない見せ方** */
  truth: { ate: number; att: number }
}

export const generateDataset = (s: Scenario): GeneratedDataset => {
  const rng = makeRng(s.seed)
  const records: LogRecord[] = []

  const sellerCount = Math.max(1, Math.ceil(s.n / s.listingsPerSeller))
  // 出品者ごとの共通効果（ランダム切片）。出品の巧拙・発送の速さ・評価などは
  // 出品者ごとに共通で成約率に効く。**同じ出品者の出品は独立ではない**ので、
  // ブートストラップは出品者単位で再標本する（bootstrap.ts）
  const sellerEffect = Array.from({ length: sellerCount }, () => normal(rng) * s.sellerSd)
  const sellerPastSales = Array.from({ length: sellerCount }, () =>
    Math.max(0, Math.round(Math.abs(normal(rng)) * 8))
  )
  // 出品者単位で処置を割り当てる場合は、ループに入る前に決めてしまう。
  // 出品者の過去成約数で交絡させる（売れていない出品者ほど値下げする）
  const sellerTreatment = s.treatmentByCluster
    ? sellerPastSales.map((past) =>
        bernoulli(rng, sigmoid(s.confounding * (0.5 - 0.12 * past)))
      )
    : null

  for (let i = 0; i < s.n; i++) {
    const sellerIdx = i % sellerCount
    const category = pickWeighted(rng, CATEGORIES, [3, 2, 2, 1, 1, 1])
    const condition = pickWeighted(rng, CONDITIONS, [1, 3, 3, 2])
    // 価格帯は対数スケールに寄せた連続値（そのまま線形モデルに載る）
    const priceBand = 7 + normal(rng) * 1.1
    const likesAtListing = Math.max(0, Math.round(Math.abs(normal(rng)) * 12))

    // 売れにくい出品ほど値下げされる、という交絡を作る。
    // 交絡強度 0 ならランダム割付
    const hidden = normal(rng)
    const propensityLogit =
      s.confounding * (0.45 * (priceBand - 7) - 0.06 * likesAtListing) +
      s.overlapSkew * (priceBand - 7) +
      s.hiddenConfounding * hidden
    const treatment = sellerTreatment
      ? sellerTreatment[sellerIdx]
      : bernoulli(rng, sigmoid(propensityLogit))

    // 成果。真の効果は s.effect（ポイント差ではなくロジット上で足すと
    // 率が変わってしまうので、確率スケールで足してからクリップする）
    const baseLogit =
      -0.35 * (priceBand - 7) +
      0.03 * likesAtListing +
      0.04 * sellerPastSales[sellerIdx] +
      s.hiddenConfounding * hidden
    // 出品者の効果は tanh の中に入れない。中に入れると squash されて
    // ほぼ消え、「同じ出品者の出品は似た成約率になる」という構造が
    // 再現できない（実測で確認: CI 幅が単位再標本とクラスタ再標本でほぼ
    // 同じになってしまい、クラスタ処理の有無を検証できなかった）
    const p0 = Math.min(
      0.97,
      Math.max(
        0.03,
        s.baseRate + 0.12 * Math.tanh(baseLogit) + 0.12 * sellerEffect[sellerIdx]
      )
    )
    const p = Math.min(0.99, Math.max(0.01, p0 + treatment * s.effect))
    const sold = bernoulli(rng, p)

    // 中間変数。値下げ後に動く値なので共変量に入れてはいけない
    const likesNow = likesAtListing + treatment * Math.round(rng() * 9 + 3) + Math.round(rng() * 3)
    const viewsAfter = Math.round((likesNow + 2) * (4 + rng() * 4))

    records.push({
      unit_id: `L${String(i).padStart(5, '0')}`,
      seller_id: `S${String(sellerIdx).padStart(4, '0')}`,
      date: addDays(s.startDate, Math.floor(rng() * s.days)),
      treatment,
      sold,
      category,
      condition,
      priceBand,
      sellerPastSales: sellerPastSales[sellerIdx],
      likesAtListing,
      mediators: { likesNow, viewsAfter },
    })
  }

  // 真値。生成に使った確率から直接出せるのが合成データの強み
  const truth = computeTruth(s, records)

  if (s.corruption) {
    return { scenario: s, records: corrupt(records, s, rng), truth }
  }
  return { scenario: s, records, truth }
}

/**
 * 真値。反実仮想を両方計算できるのは合成データだけ。
 * ATT は実際に施策を受けた単位に限った平均
 */
const computeTruth = (s: Scenario, records: LogRecord[]) => {
  const treated = records.filter((r) => r.treatment === 1).length
  return {
    ate: s.effect,
    // 効果を一律に足す作りなので ATT も同じ値になる。件数 0 のときは 0
    att: treated === 0 ? 0 : s.effect,
  }
}

/** 欠損と重複を混ぜる。除外が黙って起きないことを確かめるため */
const corrupt = (
  records: LogRecord[],
  s: Scenario,
  rng: () => number
): LogRecord[] => {
  const c = s.corruption
  if (!c) return records
  const out = records.map((r) =>
    rng() < c.missing ? { ...r, likesAtListing: null } : r
  )
  const dupCount = Math.floor(records.length * c.duplicate)
  for (let i = 0; i < dupCount; i++) {
    out.push({ ...records[Math.floor(rng() * records.length)] })
  }
  return out
}

import type { EstimatorId, EstimatorResult, UnitRow } from './types'

/**
 * 4 手法を並べて出す。**1 つの数字だけを出さない。**
 * naive と AIPW の差が、そのデータに含まれる交絡の大きさそのもの。
 */

const CATEGORIES = ['カメラ', '食器', 'PC周辺機器', '本', '楽器', 'アウトドア']
const CONDITIONS = ['新品', '未使用に近い', '目立った傷や汚れなし', 'やや傷や汚れあり']

/**
 * 特徴量ベクトル。**mediators を参照しない。**
 *
 * row.mediators は入れ子になっているので、ここから見えない。
 * フラットに並べていたら、いつか誰かがこの配列に足す
 */
export const featuresOf = (row: UnitRow): number[] => [
  1,
  row.priceBand - 7,
  row.likesAtListing / 10,
  row.sellerPastSales / 10,
  ...CATEGORIES.slice(1).map((c) => (row.category === c ? 1 : 0)),
  ...CONDITIONS.slice(1).map((c) => (row.condition === c ? 1 : 0)),
]

export const COVARIATE_LABELS = [
  '価格帯',
  '出品時のいいね数',
  '出品者の過去成約数',
]

/** 対称正定値行列の連立方程式を解く（ガウス消去 + 部分ピボット） */
const solve = (A: number[][], b: number[]): number[] => {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r
    }
    if (Math.abs(M[piv][col]) < 1e-12) continue // 特異なら 0 のまま進む
    ;[M[col], M[piv]] = [M[piv], M[col]]
    const d = M[col][col]
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = M[r][col] / d
      if (f === 0) continue
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c]
    }
  }
  return Array.from({ length: n }, (_, i) =>
    Math.abs(M[i][i]) < 1e-12 ? 0 : M[i][n] / M[i][i]
  )
}

/**
 * ロジスティック回帰（IRLS / ニュートン法）。
 *
 * 勾配降下だと収束が遅く、300 反復でも係数が縮んだままで推定が偏った
 * （実測: AIPW の誤差が真値 8pt に対して 4.1pt）。ニュートン法なら
 * 10 反復程度で収束し、**速度も 1 桁以上速い**。
 * ブートストラップで何百回も解き直すので、ここの速度がそのまま効く
 */
const fitLogistic = (X: number[][], y: number[], iterations = 12): number[] => {
  const d = X[0]?.length ?? 0
  const n = X.length
  const w = new Array(d).fill(0)
  if (n === 0 || d === 0) return w

  const ridge = 1e-4 // ヘッセ行列が特異になるのを防ぐ最小限の正則化

  for (let it = 0; it < iterations; it++) {
    const grad = new Array(d).fill(0)
    const H = Array.from({ length: d }, () => new Array(d).fill(0))

    for (let i = 0; i < n; i++) {
      const x = X[i]
      let z = 0
      for (let j = 0; j < d; j++) z += w[j] * x[j]
      const p = 1 / (1 + Math.exp(-z))
      const r = p * (1 - p)
      const e = p - y[i]
      for (let j = 0; j < d; j++) {
        grad[j] += e * x[j]
        if (r > 1e-10) {
          for (let k = j; k < d; k++) H[j][k] += r * x[j] * x[k]
        }
      }
    }
    for (let j = 0; j < d; j++) {
      grad[j] += ridge * w[j]
      H[j][j] += ridge
      for (let k = 0; k < j; k++) H[j][k] = H[k][j] // 対称に埋め戻す
    }

    const step = solve(H, grad)
    let maxDelta = 0
    for (let j = 0; j < d; j++) {
      w[j] -= step[j]
      maxDelta = Math.max(maxDelta, Math.abs(step[j]))
    }
    if (maxDelta < 1e-8) break // 収束したら止める（決定的）
  }
  return w
}

const predict = (w: number[], x: number[]): number => {
  let z = 0
  for (let j = 0; j < w.length; j++) z += w[j] * x[j]
  return 1 / (1 + Math.exp(-z))
}

/** 傾向スコア。極端な重みで分散が爆発するのでクリップする */
export const propensityScores = (rows: UnitRow[]): number[] => {
  const X = rows.map(featuresOf)
  const t = rows.map((r) => r.treatment)
  const w = fitLogistic(X, t)
  return X.map((x) => Math.min(0.99, Math.max(0.01, predict(w, x))))
}

const mean = (xs: number[]): number =>
  xs.length === 0 ? 0 : xs.reduce((s, v) => s + v, 0) / xs.length

/** 単純比較。交絡を調整しない。**採用しない参考値** */
const naiveATE = (rows: UnitRow[]): number => {
  const t = rows.filter((r) => r.treatment === 1).map((r) => r.y)
  const c = rows.filter((r) => r.treatment === 0).map((r) => r.y)
  if (t.length === 0 || c.length === 0) return 0
  return mean(t) - mean(c)
}

/** 群ごとに成果を回帰し、全員に両方の割付を当てた予測の差（g-computation） */
const regressionATE = (rows: UnitRow[]): number => {
  const treated = rows.filter((r) => r.treatment === 1)
  const control = rows.filter((r) => r.treatment === 0)
  if (treated.length === 0 || control.length === 0) return 0

  const w1 = fitLogistic(treated.map(featuresOf), treated.map((r) => r.y))
  const w0 = fitLogistic(control.map(featuresOf), control.map((r) => r.y))

  // ATT なので、実際に施策を受けた単位で平均する
  const diffs = treated.map((r) => {
    const x = featuresOf(r)
    return predict(w1, x) - predict(w0, x)
  })
  return mean(diffs)
}

/** IPW（Hajek 型 = 重みの和で割る）。Horvitz-Thompson 型は少数群で破綻する */
const ipwATE = (rows: UnitRow[], ps: number[]): number => {
  let numT = 0
  let denT = 0
  let numC = 0
  let denC = 0
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const e = ps[i]
    if (r.treatment === 1) {
      // ATT なので処置群は重み 1
      numT += r.y
      denT += 1
    } else {
      const w = e / (1 - e)
      numC += w * r.y
      denC += w
    }
  }
  if (denT === 0 || denC === 0) return 0
  return numT / denT - numC / denC
}

/** AIPW（Doubly Robust）。回帰か傾向スコアのどちらかが正しければ一致推定 */
const aipwATE = (rows: UnitRow[], ps: number[]): number => {
  const treated = rows.filter((r) => r.treatment === 1)
  const control = rows.filter((r) => r.treatment === 0)
  if (treated.length === 0 || control.length === 0) return 0

  const w0 = fitLogistic(control.map(featuresOf), control.map((r) => r.y))

  let tSum = 0
  let tN = 0
  let cSum = 0
  let cW = 0
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const e = ps[i]
    const mu0 = predict(w0, featuresOf(r))
    if (r.treatment === 1) {
      tSum += r.y - mu0
      tN += 1
    } else {
      // 対照群の残差を、処置群の分布に合わせて重み付けして引く。
      // **重みの和で割る（Hajek 型）。** 割らない形（Horvitz-Thompson）は
      // 傾向スコアの推定誤差がそのまま分散に乗り、少数群で暴れる
      const w = e / (1 - e)
      cSum += w * (r.y - mu0)
      cW += w
    }
  }
  if (tN === 0 || cW === 0) return 0
  return tSum / tN - cSum / cW
}

export const estimateAll = (rows: UnitRow[]): Record<EstimatorId, number> => {
  const ps = propensityScores(rows)
  return {
    naive: naiveATE(rows),
    regression: regressionATE(rows),
    ipw: ipwATE(rows, ps),
    aipw: aipwATE(rows, ps),
  }
}

export const ESTIMATOR_META: Record<
  EstimatorId,
  Pick<EstimatorResult, 'label' | 'adopted' | 'note'>
> = {
  naive: {
    label: '単純比較',
    adopted: false,
    note: '交絡を調整していない。意思決定には使わない参考値',
  },
  regression: {
    label: '回帰調整',
    adopted: true,
    note: '共変量で成果を回帰し、両方の割付を当てた予測の差',
  },
  ipw: {
    label: 'IPW',
    adopted: true,
    note: '傾向スコアで重み付けし、群の偏りを補正',
  },
  aipw: {
    label: 'AIPW（採用値）',
    adopted: true,
    note: '回帰と傾向スコアの併用。どちらか一方が正しければ一致推定',
  },
}

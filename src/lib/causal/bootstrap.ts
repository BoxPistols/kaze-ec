import { estimateAll } from './estimators'
import { makeRng, type Rng } from './rng'
import type { EstimatorId, UnitRow } from './types'

/**
 * ブートストラップ信頼区間。
 *
 * **再標本の単位は出品ではなく出品者。**
 *
 * 分析単位は出品だが、同じ出品者の出品は独立ではない。出品の巧拙・写真の
 * 撮り方・発送の速さ・評価は出品者ごとに共通で、成約率に効く。共変量に
 * 「出品者の過去成約数」を入れても平均を揃えるだけで、出品者内の相関は
 * 消えない。
 *
 * 理屈の上では、出品を独立に再標本すると実際より多くの独立な情報がある
 * ことになり、信頼区間が不当に狭くなる。
 *
 * **ただしこの合成データでは、その差は再現しなかった。**
 * `cluster-bootstrap.test.ts` で、独立なデータセットを 30 本作って点推定の
 * 真の標本 SD を出し、両方式のブートストラップ推定 SD と突き合わせた結果、
 * 出品者あたり 10 出品でも両者はほぼ同じで、どちらも真の SD より狭くならない。
 *
 * 理由は、**値下げが出品者の中で変動している**こと。同じ出品者の中で値下げ
 * した出品としなかった出品を比べるので、出品者の切片は差分で相殺される
 * （ペアデザインに近い）。出品者効果は成果には効くが、処置効果の推定分散
 * には乗ってこない。
 *
 * **これは条件付きの結論で、無条件ではない。** 値下げ施策を出品者単位で
 * 展開する設計（この出品者は全出品値下げ / この出品者はしない）に変えると、
 * 出品者切片が相殺されなくなり、クラスタ再標本が必須に変わる。
 *
 * 既定をクラスタにしてあるのは、一般には正しい側で計算コストも変わらない
 * から。**「クラスタ処理を入れたから区間が正しい」とは書かない。**
 * この条件下では効いていることを測れていない
 */

/** 出品者を復元抽出し、選ばれた出品者の出品を全部入れる */
export const resampleByCluster = (rows: UnitRow[], rng: Rng): UnitRow[] => {
  const bySeller = new Map<string, UnitRow[]>()
  for (const r of rows) {
    const list = bySeller.get(r.sellerId)
    if (list) list.push(r)
    else bySeller.set(r.sellerId, [r])
  }
  const sellers = [...bySeller.keys()]
  const out: UnitRow[] = []
  for (let i = 0; i < sellers.length; i++) {
    const picked = sellers[Math.floor(rng() * sellers.length)]
    out.push(...(bySeller.get(picked) ?? []))
  }
  return out
}

/** 出品を独立に復元抽出する。**クラスタ構造を無視するので通常は使わない** */
export const resampleByUnit = (rows: UnitRow[], rng: Rng): UnitRow[] =>
  rows.map(() => rows[Math.floor(rng() * rows.length)])

const percentile = (sorted: number[], q: number): number => {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * q
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export interface BootstrapOptions {
  bootstrap: number
  seed: number
  /** 既定はクラスタ。検証用に単位再標本へ切り替えられる */
  resample?: 'cluster' | 'unit'
}

/** percentile 法。再標本で群が退化したら捨てる */
export const bootstrapCI = (
  rows: UnitRow[],
  opts: BootstrapOptions
): Record<EstimatorId, [number, number] | null> => {
  const rng = makeRng(opts.seed)
  const pick = opts.resample === 'unit' ? resampleByUnit : resampleByCluster
  const samples: Record<EstimatorId, number[]> = {
    naive: [],
    regression: [],
    ipw: [],
    aipw: [],
  }

  for (let b = 0; b < opts.bootstrap; b++) {
    const boot = pick(rows, rng)
    const t = boot.filter((r) => r.treatment === 1).length
    // 片群が消えたら推定できない。捨てる（0 を混ぜると区間が歪む）
    if (t === 0 || t === boot.length) continue
    const est = estimateAll(boot)
    for (const k of Object.keys(samples) as EstimatorId[]) samples[k].push(est[k])
  }

  const out = {} as Record<EstimatorId, [number, number] | null>
  for (const k of Object.keys(samples) as EstimatorId[]) {
    const s = samples[k].slice().sort((a, b) => a - b)
    out[k] = s.length < 10 ? null : [percentile(s, 0.025), percentile(s, 0.975)]
  }
  return out
}

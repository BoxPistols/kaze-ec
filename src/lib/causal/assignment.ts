import type { UnitRow } from './types'

/**
 * 処置が何の単位で割り当てられたかを、**データから観測する。**
 *
 * これを設定として受け取らないのが要点。「このシナリオはクラスタ単位です」と
 * 教えてもらう作りにすると、実ログを繋いだときに誰かが正しく申告することが
 * 前提になる。処置が出品者の中で変動しているかどうかは観測できるので、
 * 観測する。
 *
 * なぜ要るか。処置を出品者単位で割り当てると、**独立に処置が割り当てられた
 * 数は出品数ではなく出品者数になる。** 総件数 4000・10 出品/人なら、
 * 出品は各群 2000 件あるが、独立な割り当ては各群 200 人分しかない。
 * 件数のゲートだけ見ていると、実質的な標本サイズが 1/10 でも通ってしまう。
 *
 * 実測（総件数 4000、独立データセット 150 本で真の標本 SD を出し、
 * ブートストラップ推定 SD と突き合わせた。誤差は真の SD 推定自体の標準誤差）:
 *
 * | 出品/人 | 処置の単位 | 真の SD         | 単位再標本 | クラスタ再標本 |
 * | ------- | ---------- | --------------- | ---------- | -------------- |
 * | 10      | 出品       | 0.0181 ± 0.0011 | -15%       | -7%            |
 * | 10      | 出品者     | 0.0153 ± 0.0009 | -5%        | +20%           |
 * | 25      | 出品者     | 0.0215 ± 0.0012 | **-27%**   | -6%            |
 *
 * 読み方。**処置が出品者単位で、かつクラスタが大きいときに、単位再標本が
 * はっきり狭くなる**（25 出品/人で -27%）。クラスタ再標本はそこで -6% まで
 * 追いつく。クラスタが小さい（10 出品/人）と差は埋もれ、クラスタ再標本の
 * ほうが逆に広めに出ることもある。
 *
 * **最初は 30 本で測って -9% / -21% という数字を書いたが、間違いだった。**
 * 真の SD の推定誤差は本数の平方根でしか縮まないので、30 本では ±16% あり、
 * 上の差と同じ大きさだった。150 本に増やして書き直した。
 *
 * 同じデータで再標本方式だけ変えた「比」のほうが対で比べられるぶん安定していて、
 * 出品者単位・25 出品/人では 8 シード全部でクラスタ側が広くなる（比 1.08〜）。
 * 出品単位の割り当てでは比が 1 を割るシードもある。テストはこの比で固定してある
 */

/** 出品者内で処置が変動している出品者の割合が、これ未満なら出品者単位とみなす */
const VARIATION_THRESHOLD = 0.1

export interface AssignmentInfo {
  unit: 'listing' | 'seller'
  /** 複数出品を持つ出品者のうち、処置が出品者内で変動している割合 */
  variationShare: number
  /** 複数出品を持つ出品者の数（この数が 0 なら判定材料が無い） */
  multiListingSellers: number
  /** 独立に処置が割り当てられた数（処置群） */
  treatedUnits: number
  /** 同じく対照群 */
  controlUnits: number
}

export const detectAssignment = (rows: UnitRow[]): AssignmentInfo => {
  const bySeller = new Map<string, UnitRow[]>()
  for (const r of rows) {
    const list = bySeller.get(r.sellerId)
    if (list) list.push(r)
    else bySeller.set(r.sellerId, [r])
  }

  let multi = 0
  let varying = 0
  for (const list of bySeller.values()) {
    if (list.length < 2) continue
    multi += 1
    if (list.some((r) => r.treatment !== list[0].treatment)) varying += 1
  }

  // 複数出品の出品者がいなければ、出品者単位かどうかは区別できない。
  // その場合クラスタ = 単位なので、出品単位として扱って差し支えない
  const variationShare = multi === 0 ? 1 : varying / multi
  const unit: AssignmentInfo['unit'] =
    variationShare < VARIATION_THRESHOLD ? 'seller' : 'listing'

  if (unit === 'listing') {
    const treated = rows.filter((r) => r.treatment === 1).length
    return {
      unit,
      variationShare,
      multiListingSellers: multi,
      treatedUnits: treated,
      controlUnits: rows.length - treated,
    }
  }

  // 出品者単位。出品者を、その出品者の処置で数える
  let treatedSellers = 0
  let controlSellers = 0
  for (const list of bySeller.values()) {
    if (list[0].treatment === 1) treatedSellers += 1
    else controlSellers += 1
  }
  return {
    unit,
    variationShare,
    multiListingSellers: multi,
    treatedUnits: treatedSellers,
    controlUnits: controlSellers,
  }
}

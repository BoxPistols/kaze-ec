import type { LogRecord, PrepareResult, UnitRow } from './types'

/**
 * ログ → 分析単位（出品）へ集約する。
 *
 * **除外は黙ってやらない。** 何件落としたかを必ず返す。
 * 母数が変わったことに誰も気づかない状態を作らないため。
 */

const keyOf = (r: LogRecord): string =>
  JSON.stringify([
    r.unit_id,
    r.seller_id,
    r.date,
    r.treatment,
    r.sold,
    r.category,
    r.condition,
    r.priceBand,
    r.sellerPastSales,
    r.likesAtListing,
  ])

/** 共変量が 1 つでも欠けていたら使えない。**AND で効く** */
const hasAllCovariates = (
  r: LogRecord
): r is LogRecord & {
  category: string
  condition: string
  priceBand: number
  sellerPastSales: number
  likesAtListing: number
} =>
  r.category !== null &&
  r.condition !== null &&
  r.priceBand !== null &&
  r.sellerPastSales !== null &&
  r.likesAtListing !== null

export const prepare = (records: LogRecord[]): PrepareResult => {
  const recordCount = records.length

  // 完全一致の重複を畳む
  const seen = new Set<string>()
  const deduped: LogRecord[] = []
  let duplicateRows = 0
  for (const r of records) {
    const k = keyOf(r)
    if (seen.has(k)) {
      duplicateRows++
      continue
    }
    seen.add(k)
    deduped.push(r)
  }

  // 単位ごとにまとめる
  const byUnit = new Map<string, LogRecord[]>()
  for (const r of deduped) {
    const list = byUnit.get(r.unit_id)
    if (list) list.push(r)
    else byUnit.set(r.unit_id, [r])
  }

  const rows: UnitRow[] = []
  let missingCovariates = 0
  let conflictingTreatment = 0

  for (const [unitId, list] of byUnit) {
    // 同一単位で割付が割れていたら、割付が定義できない。**片方を黙って採らない**
    const treatments = new Set(list.map((r) => r.treatment))
    if (treatments.size > 1) {
      conflictingTreatment++
      continue
    }

    // 共変量が全部そろっている行を代表にする。1 つでも欠けていれば単位ごと落ちる
    const rep = list.find(hasAllCovariates)
    if (!rep) {
      missingCovariates++
      continue
    }

    rows.push({
      unitId,
      sellerId: rep.seller_id,
      treatment: rep.treatment,
      // 期間内に 1 回でも成果があったか
      y: list.some((r) => r.sold === 1) ? 1 : 0,
      category: rep.category,
      condition: rep.condition,
      priceBand: rep.priceBand,
      sellerPastSales: rep.sellerPastSales,
      likesAtListing: rep.likesAtListing,
      mediators: rep.mediators,
    })
  }

  return {
    rows,
    recordCount,
    duplicateRows,
    excluded: { missingCovariates, conflictingTreatment },
  }
}

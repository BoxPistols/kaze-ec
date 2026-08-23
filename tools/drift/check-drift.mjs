#!/usr/bin/env node
/**
 * design/screen-spec.json（宣言された仕様）と実装ファイルを、kaze-mcp
 * （kaze-ux 本体、別リポジトリ）から引いた「今のトークン・コンポーネント仕様」
 * に対して突き合わせ、ドリフトを検出する。
 *
 * 見るもの:
 *   1. 未実装   — spec に宣言されているが、実装の JSX に現れないコンポーネント
 *   2. 無申告   — 実装の JSX にあるが、spec に宣言されていない DS 依存
 *   3. 値の不一致 — コード中のハードコード値（色 hex / borderRadius）が
 *                   spec が宣言したトークンのどの値とも一致しない
 *   4. 禁止パターン — kaze-mcp の check_rule によるコード片照合
 *
 * pnpm ds:adoption（kaze-ux 側）が測るのは import 準拠率であり、これとは別物。
 * ここで見るのは「宣言した仕様と実装が食い違っていないか」で、そちらは
 * kaze-ux の prohibited.md で K01（ハードコード色値）が「強制: なし」と
 * 明記されている領域にまで踏み込む
 *
 * screen-spec.json の screens[] は画面（JSX 有り、未実装/無申告も見る）、
 * foundations[] は src/theme/theme.ts のような設定ファイル（JSX 無し、
 * 値の一致だけを見る）。MUI のテーマは実行時に MCP を呼べないので値自体は
 * コードに残るが、foundations に登録することで CI が毎回それを検証する
 */
import { readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

import { KazeMcpClient } from './mcp-client.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const KAZE_UX_PATH = path.resolve(
  ROOT,
  process.env.KAZE_UX_PATH || '../kaze-ux'
)

// 画面固有のレイアウト原始要素。DS 仕様との対応を宣言しなくてよい
// （kaze-ux DESIGN.md の「Box/Grid/Stack/Typography は DS 対象外」と同じ扱い）。
// CardContent / CardActionArea は Card の構造的な子であり独立した get_component
// エントリを持たないため、Card 自体が宣言されていれば対象外とする。
// ImageGallery は kaze MCP の search で image/gallery/carousel 系の DS 部品が
// 存在しないことを確認済み — 「再実装」ではなく最初から DS 対象外の独自部品
// ToggleButtonGroup / MuiToggleButton は意図的に含めない — SettlementToggle が
// 再実装した ToggleButton 仕様そのものであり、画面から直接使われたら
// SettlementToggle を経由していない = 無申告として検出したい
const LAYOUT_ALLOWLIST = new Set([
  'Box',
  'Container',
  'Grid',
  'Typography',
  'Divider',
  'Stack',
  'AppBar',
  'Toolbar',
  'CardContent',
  'CardActionArea',
  'ImageGallery',
  'Table',
  'TableBody',
  'TableRow',
  'TableCell',
  'Link',
  'Route',
  'Routes',
])

const extractJsxComponentNames = (filePath, sourceText) => {
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const names = new Set()
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.tagName
      if (ts.isIdentifier(tagName) && /^[A-Z]/.test(tagName.text)) {
        names.add(tagName.text)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return names
}

// ファイル内で const X = (...) => ... / function X(...) として定義された
// コンポーネント名。DS への外部依存ではなく画面内のローカル合成なので、
// 「無申告」の対象から外す
const extractLocallyDeclaredNames = (filePath, sourceText) => {
  const source = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  )
  const names = new Set()
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      /^[A-Z]/.test(node.name.text)
    ) {
      names.add(node.name.text)
    }
    if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
      names.add(node.name.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return names
}

const extractLiteralValues = (sourceText) => {
  const hexes = [...sourceText.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(
    (m) => m[0]
  )
  // sx={{ borderRadius: '12px' }} のような絶対値（引用符付き文字列）だけを拾う。
  // sx={{ borderRadius: 1.5 }} のような単位無し数値は theme.shape.borderRadius
  // の倍数（相対値）で、それ自体は決してドリフトしない値なので対象外にする
  const quotedRadii = [
    ...sourceText.matchAll(/borderRadius:\s*'(\d+px)'/g),
  ].map((m) => m[1])
  // theme の shape.borderRadius: 8 は絶対値（単位無し = px 前提）。
  // shape ブロック内に限定することで sx の相対倍数と区別する
  const shapeRadii = [
    ...sourceText.matchAll(/shape:\s*{\s*borderRadius:\s*(\d+)/g),
  ].map((m) => `${m[1]}px`)
  return { hexes, radii: [...quotedRadii, ...shapeRadii] }
}

const collectAllowedTokenValues = async (client, tokenPaths) => {
  const colors = new Set()
  const radii = new Set()
  for (const tokenPath of tokenPaths) {
    const value = await client.callTool('get_token', { path: tokenPath })
    if (typeof value?.$value !== 'string') continue
    if (value.$type === 'color') colors.add(value.$value.toLowerCase())
    if (value.$type === 'dimension') radii.add(value.$value)
  }
  return { colors, radii }
}

// check_rule は JSON ではなく整形済みテキストを返す（例:
// "[C01] コンポーネント\n  禁止: React.FC ...\n  代わりに: ...\n  強制: ..."）。
// 実際のレスポンスを見て決めた形式で、JSON 化されていた場合の想定はしない
const parseRuleViolations = (text) => {
  if (typeof text !== 'string') return []
  const violations = []
  for (const block of text.split(/\n\n+/)) {
    const idMatch = block.match(/^\[([A-Za-z0-9]+)\]/m)
    const forbidMatch = block.match(/禁止:\s*(.+)/)
    if (idMatch && forbidMatch) {
      violations.push({ id: idMatch[1], message: forbidMatch[1].trim() })
    }
  }
  return violations
}

const checkScreen = async (client, screen) => {
  const filePath = path.resolve(ROOT, screen.path)
  const findings = []

  if (!existsSync(filePath)) {
    findings.push({
      type: '未実装',
      detail: `${screen.path} が存在しません`,
    })
    return findings
  }

  const sourceText = readFileSync(filePath, 'utf8')

  // foundations エントリ（例: theme.ts）は JSX を持たないコンポーネント宣言不要の
  // 設定ファイル。components が無ければ未実装/無申告チェックはスキップし、
  // トークン値の一致だけを見る
  if (screen.components) {
    const usedNames = extractJsxComponentNames(filePath, sourceText)
    const declaredNames = new Set(screen.components.map((c) => c.as))
    const locallyDeclared = extractLocallyDeclaredNames(filePath, sourceText)

    for (const name of declaredNames) {
      if (!usedNames.has(name)) {
        findings.push({
          type: '未実装',
          detail: `${screen.name}: 宣言済みの ${name} が実装に現れない`,
        })
      }
    }

    for (const name of usedNames) {
      // MUI アイコン（*Icon サフィックス）は kaze の metadata/components.json
      // で個別追跡されていない — 一つずつ宣言させると spec が肥大化するだけ
      if (name.endsWith('Icon')) continue
      if (locallyDeclared.has(name)) continue
      if (!declaredNames.has(name) && !LAYOUT_ALLOWLIST.has(name)) {
        findings.push({
          type: '無申告',
          detail: `${screen.name}: ${name} が screen-spec.json に未宣言のまま使われている`,
        })
      }
    }
  }

  const { colors: allowedColors, radii: allowedRadii } =
    await collectAllowedTokenValues(client, screen.tokens)
  const { hexes, radii } = extractLiteralValues(sourceText)

  for (const hex of hexes) {
    if (!allowedColors.has(hex.toLowerCase())) {
      findings.push({
        type: '値の不一致',
        detail: `${screen.name}: 色 ${hex} が宣言済みトークンのどの値とも一致しない`,
      })
    }
  }
  for (const radius of radii) {
    if (!allowedRadii.has(radius)) {
      findings.push({
        type: '値の不一致',
        detail: `${screen.name}: borderRadius ${radius} が宣言済みトークンのどの値とも一致しない`,
      })
    }
  }

  const ruleResult = await client.callTool('check_rule', {
    code: sourceText,
  })
  const violations = parseRuleViolations(ruleResult)
  for (const violation of violations) {
    findings.push({
      type: '禁止パターン',
      detail: `${screen.name}: [${violation.id}] ${violation.message}`,
    })
  }

  return findings
}

const main = async () => {
  if (!existsSync(KAZE_UX_PATH)) {
    console.error(
      `kaze-ux が見つかりません: ${KAZE_UX_PATH}\n` +
        `KAZE_UX_PATH 環境変数で場所を指定するか、隣に clone してください。`
    )
    process.exitCode = 1
    return
  }

  const specPath = path.resolve(ROOT, 'design/screen-spec.json')
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))

  const client = new KazeMcpClient(KAZE_UX_PATH)
  await client.initialize()

  const allFindings = []
  try {
    for (const entry of [...spec.screens, ...(spec.foundations ?? [])]) {
      const findings = await checkScreen(client, entry)
      allFindings.push(...findings)
    }
  } finally {
    client.close()
  }

  if (allFindings.length === 0) {
    console.log('ドリフト検出: 0 件（screen-spec.json と実装は一致しています）')
    return
  }

  console.log(`ドリフト検出: ${allFindings.length} 件\n`)
  for (const finding of allFindings) {
    console.log(`  [${finding.type}] ${finding.detail}`)
  }
  process.exitCode = 1
}

main().catch((error) => {
  console.error('check-drift 実行エラー:', error)
  process.exitCode = 1
})

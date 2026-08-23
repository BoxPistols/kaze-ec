#!/usr/bin/env node
/**
 * design/screen-spec.json で宣言されている全コンポーネントの仕様と、
 * 主要トークンを kaze-mcp から引いて src/data/componentCatalog.generated.json
 * に書き出す。
 *
 *   node tools/catalog/generate-catalog.mjs
 *
 * ComponentCatalogPage はこの生成物を読むだけで、MCP には直接繋がない
 * （ブラウザ実行時に MCP は呼べない — check-drift.mjs と同じ制約）。
 * 「画面は MCP から仕様を引いて再生成される」という本リポジトリの主張を、
 * カタログページという形でもう一度見せるための生成器
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { KazeMcpClient } from '../drift/mcp-client.mjs'

const ROOT = path.resolve(import.meta.dirname, '..', '..')
const KAZE_UX_PATH = path.resolve(
  ROOT,
  process.env.KAZE_UX_PATH || '../kaze-ux'
)

const TOKEN_PATHS = {
  primary: 'color.light.primary.main',
  secondary: 'color.light.secondary.main',
  success: 'color.light.success.main',
  warning: 'color.light.warning.main',
  error: 'color.light.error.main',
}

const RADIUS_PATH = 'borderRadius'

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

  const seen = new Map()
  for (const screen of spec.screens) {
    for (const component of screen.components ?? []) {
      // 同じ kaze 仕様に対して実装が複数ありうる（例: Chip → MUI 直使用の
      // Chip と Tailwind 実装の TagChip）。カタログはその対比こそ見せたいので、
      // kaze 名ではなく「kaze 名 + 実装名」で一意にする
      const key = `${component.kaze}::${component.as}`
      if (!seen.has(key)) seen.set(key, component)
    }
  }

  const client = new KazeMcpClient(KAZE_UX_PATH)
  await client.initialize()

  const colors = {}
  const components = []
  try {
    for (const [name, tokenPath] of Object.entries(TOKEN_PATHS)) {
      colors[name] = await client.callTool('get_token', { path: tokenPath })
    }
    const borderRadius = await client.callTool('get_token', {
      path: RADIUS_PATH,
    })

    for (const declared of seen.values()) {
      const kazeName = declared.kaze
      const componentSpec = await client.callTool('get_component', {
        name: kazeName.charAt(0).toLowerCase() + kazeName.slice(1),
      })
      components.push({
        kaze: kazeName,
        as: declared.as,
        source: declared.source,
        localPath: declared.localPath ?? null,
        spec: componentSpec,
      })
    }

    const catalog = {
      $description:
        '生成物。手で編集しない（node tools/catalog/generate-catalog.mjs）。kaze-mcp（kaze-ux 本体）から取得した、このリポジトリで実際に使っているコンポーネントとトークンのスナップショット',
      tokens: { colors, borderRadius },
      components,
    }

    const outPath = path.resolve(
      ROOT,
      'src/data/componentCatalog.generated.json'
    )
    writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`)
    console.log(
      `${components.length} 件のコンポーネント仕様を書き出しました: ${outPath}`
    )
  } finally {
    client.close()
  }
}

main().catch((error) => {
  console.error('generate-catalog 実行エラー:', error)
  process.exitCode = 1
})

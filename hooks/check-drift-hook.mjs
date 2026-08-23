#!/usr/bin/env node
/**
 * PostToolUse hook（Write|Edit）: src/pages/**、src/theme/** が編集されたら
 * tools/drift/check-drift.mjs を実行し、ドリフトがあれば exit 2 + stderr で
 * エージェントに差し戻す。kaze-ux 側の hooks/check-prohibited.mjs と同じ思想
 * （即時性が要る違反をその場で止める）だが、判定は kaze MCP に問い合わせる
 * ため必ず check-drift.mjs 本体を呼ぶ — ロジックをここに複製しない
 */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const readStdin = async () => {
  let buf = ''
  for await (const chunk of process.stdin) buf += chunk
  return buf
}

const isRelevant = (filePath) =>
  /[\\/]src[\\/]pages[\\/].*\.tsx$/.test(filePath) ||
  /[\\/]src[\\/]theme[\\/].*\.tsx?$/.test(filePath)

const main = async () => {
  let input
  try {
    input = JSON.parse(await readStdin())
  } catch {
    return // hook 入力が読めないときは黙って通す（編集自体を壊さない）
  }

  const filePath = input?.tool_input?.file_path
  if (!filePath || !isRelevant(filePath)) return

  const result = spawnSync('node', ['tools/drift/check-drift.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  })

  if (result.status !== 0) {
    process.stderr.write(
      `kaze-ec drift check が違反を検出しました。修正してから続けてください。\n\n${result.stdout ?? ''}${result.stderr ?? ''}`
    )
    process.exit(2)
  }
}

main()

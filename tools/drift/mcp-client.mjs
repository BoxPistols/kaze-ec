/**
 * kaze-mcp（kaze-ux/mcp）と stdio 越しに JSON-RPC で話す最小クライアント。
 *
 * kaze-ec はトークン・コンポーネント仕様を一切バンドルしない
 * （design/screen-spec.json 冒頭のコメント参照）。そのため
 * check-drift.mjs は「仕様が今どうなっているか」を毎回ここ経由で
 * kaze-ux 本体（別リポジトリ）に問い合わせる。バンドルしていたら
 * 比較対象そのものが古びて、ドリフト検出は成立しない。
 */
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

const REQUEST_TIMEOUT_MS = 15000

export class KazeMcpClient {
  #proc
  #rl
  #nextId = 1
  #pending = new Map()

  /** @param {string} kazeUxPath kaze-ux リポジトリのパス（clone 済み） */
  constructor(kazeUxPath) {
    this.#proc = spawn(
      'npx',
      ['-y', 'tsx', `${kazeUxPath}/mcp/src/index.ts`],
      {
        env: { ...process.env, DS_ROOT: kazeUxPath },
        stdio: ['pipe', 'pipe', 'inherit'],
      }
    )
    this.#rl = createInterface({ input: this.#proc.stdout })
    this.#rl.on('line', (line) => {
      if (!line.trim()) return
      let msg
      try {
        msg = JSON.parse(line)
      } catch {
        return // stdout に混ざる非 JSON 行は無視
      }
      if (msg.id == null) return
      const pending = this.#pending.get(msg.id)
      if (!pending) return
      this.#pending.delete(msg.id)
      if (msg.error) pending.reject(new Error(msg.error.message))
      else pending.resolve(msg.result)
    })
  }

  #send(method, params) {
    const id = this.#nextId++
    const payload = { jsonrpc: '2.0', id, method, params }
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject })
      this.#proc.stdin.write(`${JSON.stringify(payload)}\n`)
      setTimeout(() => {
        if (this.#pending.delete(id)) {
          reject(new Error(`kaze-mcp: timeout waiting for ${method} (id=${id})`))
        }
      }, REQUEST_TIMEOUT_MS)
    })
  }

  async initialize() {
    await this.#send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'kaze-ec-drift-check', version: '1' },
    })
    this.#proc.stdin.write(
      `${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`
    )
  }

  /** tools/call を実行し、返答の text を JSON として解釈して返す */
  async callTool(name, args) {
    const result = await this.#send('tools/call', { name, arguments: args })
    const text = result?.content?.[0]?.text ?? ''
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  close() {
    this.#rl.close()
    this.#proc.kill()
  }
}

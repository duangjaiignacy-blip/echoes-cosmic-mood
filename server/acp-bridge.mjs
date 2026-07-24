/**
 * ACP 桥接服务：浏览器(WebSocket) ↔ codex-acp(stdio, Agent Client Protocol)
 *
 * 每个 WebSocket 连接会启动一个独立的 codex-acp 进程与会话。
 * 浏览器协议：
 *   → {type:'prompt', id, text}
 *   ← {type:'ready'} | {type:'delta', id, text} | {type:'turn_end', id, stopReason} | {type:'error', message}
 */
import { spawn } from 'node:child_process'
import { Writable, Readable } from 'node:stream'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer } from 'ws'
import { ClientSideConnection, ndJsonStream, PROTOCOL_VERSION } from '@zed-industries/agent-client-protocol'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.ACP_BRIDGE_PORT ?? 8787)

/** 解析 codex-acp 可执行文件 */
function resolveCodexAcp() {
  // 用户 config.toml 中的模型可能比 codex-acp 内置内核新，这里显式覆盖为兼容模型
  const model = process.env.ACP_MODEL ?? 'gpt-5.4-mini'
  const args = ['-c', `model="${model}"`, '-c', 'model_reasoning_effort="low"']
  if (process.env.CODEX_ACP_CMD) return { cmd: process.env.CODEX_ACP_CMD, args }
  const bin = path.join(__dirname, '..', 'node_modules', '.bin', 'codex-acp')
  return { cmd: bin, args }
}

class Session {
  constructor(ws) {
    this.ws = ws
    this.proc = null
    this.conn = null
    this.sessionId = null
    this.activeId = null
  }

  send(obj) {
    if (this.ws.readyState === 1) this.ws.send(JSON.stringify(obj))
  }

  async start() {
    const { cmd, args } = resolveCodexAcp()
    this.proc = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: { ...process.env, RUST_LOG: process.env.RUST_LOG ?? 'error' },
    })
    this.proc.on('error', (err) => {
      this.send({ type: 'error', message: `无法启动 codex-acp: ${err.message}` })
    })
    this.proc.on('exit', (code) => {
      if (code !== 0 && code != null) {
        this.send({ type: 'error', message: `codex-acp 退出（code ${code}）` })
      }
    })

    const stream = ndJsonStream(Writable.toWeb(this.proc.stdin), Readable.toWeb(this.proc.stdout))

    const self = this
    this.conn = new ClientSideConnection(
      () => ({
        async requestPermission(params) {
          // 纯对话场景不应触发工具权限；如触发，自动选择“允许一次”，否则拒绝
          const opts = params.options ?? []
          const allow = opts.find((o) => o.kind === 'allow_once') ?? opts[0]
          return allow
            ? { outcome: { outcome: 'selected', optionId: allow.optionId } }
            : { outcome: { outcome: 'cancelled' } }
        },
        async sessionUpdate(params) {
          const u = params.update
          if (u?.sessionUpdate === 'agent_message_chunk' && u.content?.type === 'text') {
            self.send({ type: 'delta', id: self.activeId, text: u.content.text })
          }
        },
      }),
      stream,
    )

    const init = await this.conn.initialize({
      protocolVersion: PROTOCOL_VERSION,
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } },
    })

    try {
      const res = await this.conn.newSession({ cwd: process.cwd(), mcpServers: [] })
      this.sessionId = res.sessionId
    } catch (err) {
      // 需要认证时尝试第一个认证方式（通常为已有的 ChatGPT 登录态）
      const method = init.authMethods?.[0]
      if (method) {
        await this.conn.authenticate({ methodId: method.id })
        const res = await this.conn.newSession({ cwd: process.cwd(), mcpServers: [] })
        this.sessionId = res.sessionId
      } else {
        throw err
      }
    }

    this.send({ type: 'ready' })
  }

  async prompt(id, text) {
    this.activeId = id
    try {
      const res = await this.conn.prompt({
        sessionId: this.sessionId,
        prompt: [{ type: 'text', text }],
      })
      this.send({ type: 'turn_end', id, stopReason: res.stopReason })
    } catch (err) {
      this.send({ type: 'error', message: `对话失败: ${err.message}` })
    } finally {
      this.activeId = null
    }
  }

  dispose() {
    try {
      this.proc?.kill()
    } catch {
      /* noop */
    }
  }
}

const wss = new WebSocketServer({ port: PORT })
console.log(`[acp-bridge] listening on ws://localhost:${PORT}`)

wss.on('connection', (ws) => {
  const session = new Session(ws)
  const queue = []
  let running = false

  const pump = async () => {
    if (running) return
    running = true
    while (queue.length) {
      const { id, text } = queue.shift()
      await session.prompt(id, text)
    }
    running = false
  }

  session
    .start()
    .then(() => console.log('[acp-bridge] session ready'))
    .catch((err) => {
      console.error('[acp-bridge] start failed:', err.message)
      session.send({ type: 'error', message: err.message })
      ws.close()
    })

  ws.on('message', (data) => {
    let msg
    try {
      msg = JSON.parse(data.toString())
    } catch {
      return
    }
    if (msg.type === 'prompt' && typeof msg.text === 'string') {
      queue.push({ id: msg.id, text: msg.text })
      void pump()
    }
  })

  ws.on('close', () => session.dispose())
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const home = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('echo demo presents the mood planet at the approved reference scale', () => {
  assert.match(home, /const ECHO_ORB_SIZE = 300/)
  assert.match(home, /size=\{echoVoid \? ECHO_ORB_SIZE : 188\}/)
})

test('keyboard focus follows the circular mood dial instead of drawing a square browser outline', () => {
  assert.match(css, /\.echo-feel-dial:focus-visible\s*\{[^}]*outline:\s*none/s)
  assert.match(css, /\.echo-feel-dial:focus-visible \.dial-ring\s*\{[^}]*filter:\s*drop-shadow/s)
})

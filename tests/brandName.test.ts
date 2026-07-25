import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const home = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

test('the home header uses the Milo-米洛 brand name', () => {
  assert.match(home, /<div className="eyebrow">Milo-米洛<\/div>/)
})

test('the browser tab uses the Milo-米洛 brand name', () => {
  assert.match(html, /<title>Milo-米洛<\/title>/)
})

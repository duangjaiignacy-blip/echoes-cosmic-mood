import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const home = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const pastTime = readFileSync(new URL('../src/pages/PastTime.tsx', import.meta.url), 'utf8')

test('descriptor words expose pressed state and selection feedback', () => {
  assert.match(home, /<button[\s\S]*className=\{cls\}[\s\S]*aria-pressed=\{labels\.includes\(w\)\}/)
  assert.match(home, /triggerTapHaptic\(\)/)
})

test('time presets expose pressed state and selection feedback', () => {
  assert.match(pastTime, /aria-pressed=\{picked === p && !custom\.trim\(\)\}/)
  assert.match(pastTime, /triggerTapHaptic\(\)/)
})

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const component = readFileSync(new URL('../src/components/MoodExpression.tsx', import.meta.url), 'utf8')
const orb = readFileSync(new URL('../src/components/MoodOrb.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

test('expression overlay keeps the sphere geometry separate from its safe outer accents', () => {
  assert.match(component, /viewBox="-24 -24 248 248"/)
  assert.match(component, /aria-hidden="true"/)
  assert.match(component, /mood-expression__\$\{name\}/)
  assert.match(component, /name="face"/)
  assert.match(component, /name="hands"/)
  assert.match(component, /name="accents"/)
  assert.match(orb, /<MoodExpression/)
})

test('expression styling is crisp, pointer inert, motion-safe, and never elliptically squashes the orb', () => {
  assert.match(css, /\.mood-expression\s*\{[^}]*pointer-events:\s*none/s)
  assert.match(css, /\.mood-stroke\s*\{[^}]*vector-effect:\s*non-scaling-stroke/s)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mood-expression/)

  const bounce = css.match(/@keyframes echo-orb-drop\s*\{([\s\S]*?)\n\}/)?.[1] ?? ''
  assert.doesNotMatch(bounce, /scale\([^)]*,/)
})

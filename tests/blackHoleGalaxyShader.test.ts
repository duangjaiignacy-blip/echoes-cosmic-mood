import assert from 'node:assert/strict'
import test from 'node:test'
import { BLACK_HOLE_FRAGMENT_SHADER, BLACK_HOLE_VERTEX_SHADER } from '../src/components/blackHoleGalaxyShader.ts'

test('shader exposes every settings and interaction uniform', () => {
  assert.match(BLACK_HOLE_VERTEX_SHADER, /attribute vec2 aPosition/)
  for (const name of [
    'uResolution', 'uTime', 'uPointer', 'uPointerActive', 'uStarSpeed', 'uDensity',
    'uHueShift', 'uSpeed', 'uGlowIntensity', 'uSaturation', 'uRepulsionStrength',
    'uTwinkleIntensity', 'uRotationSpeed',
  ]) {
    assert.match(BLACK_HOLE_FRAGMENT_SHADER, new RegExp(`uniform .* ${name};`))
  }
})

test('fragment shader contains the reference-image shape stages', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float eventHorizon/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float accretionDisk/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float particleStream/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float starLayer/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec2 repelPointer/)
})

test('accretion disk keeps its reference-image tilt while its texture rotates', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /rotate2d\(-0\.314159\) \* point/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /uTime \* uRotationSpeed/)
})

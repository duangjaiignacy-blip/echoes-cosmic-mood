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

test('fragment shader builds the approved deep starfield and tiny echo vortex', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float layeredStarField/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float tinyVortex/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float echoStream/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float VORTEX_CORE_RADIUS = 0\.018/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec2 vortexCenter = vec2\(0\.0, 0\.52\)/)
})

test('pointer repulsion affects stars without moving the vortex center', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /layeredStarField\(repelPointer/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /tinyVortex\(uv - vortexCenter/)
})

test('vortex trails stay dust-softened', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float spiralDust/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /spiralDust\(vortexPoint\)/)
})

test('starfield uses six depth layers with micro dust and irregular density masks', () => {
  const layerCalls = (BLACK_HOLE_FRAGMENT_SHADER.match(/animatedStarLayer\(/g) ?? []).length - 1

  assert.equal(layerCalls, 6)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float microStarDust/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float clusterA/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float clusterB/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float MICRO_DUST_POPULATION = 0\.26/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float STARFIELD_DENSITY_FLOOR = 0\.52/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float densityFloor = STARFIELD_DENSITY_FLOOR/)
})

test('star layers cycle through restrained depth and ambient rotation', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float galaxyDepth/)
  assert.match(
    BLACK_HOLE_FRAGMENT_SHADER,
    /fract\(phase \+ uTime \* uStarSpeed \* uSpeed \* 0\.022\)/,
  )
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /mix\(0\.84, 1\.24, depth\)/)
  assert.match(
    BLACK_HOLE_FRAGMENT_SHADER,
    /float starRotation = uTime \* uRotationSpeed \* 0\.18/,
  )
  assert.match(
    BLACK_HOLE_FRAGMENT_SHADER,
    /layeredStarField\(repelPointer\(starUv, pointer\)\)/,
  )
})

test('individual stars drift while the vortex keeps fixed coordinates', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec2 stellarDrift/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /local - offset \* 0\.58 - stellarDrift/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /tinyVortex\(uv - vortexCenter\)/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /spiralDust\(vortexPoint\)/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /echoStream\(vortexPoint\)/)
})

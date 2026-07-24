import assert from 'node:assert/strict'
import test from 'node:test'
import { FRAGMENT_SHADER, VERTEX_SHADER } from '../src/components/glassyOrbShader.ts'

test('shader exposes every renderer attribute and uniform', () => {
  assert.match(VERTEX_SHADER, /attribute vec2 aPosition/)
  for (const uniform of ['uResolution', 'uTime', 'uSpin', 'uPulse', 'uColorMain', 'uColorDeep', 'uColorLight', 'uSilverTone']) {
    assert.match(FRAGMENT_SHADER, new RegExp(`uniform .* ${uniform};`))
  }
})

test('fragment shader contains nebula, stars, Fresnel glass, and prismatic rim stages', () => {
  assert.match(FRAGMENT_SHADER, /float nebulaDensity/)
  assert.match(FRAGMENT_SHADER, /float starLayer/)
  assert.match(FRAGMENT_SHADER, /float fresnel/)
  assert.match(FRAGMENT_SHADER, /vec3 prism/)
})

test('shader remaps emotion colors into a saturated cosmic palette', () => {
  assert.match(FRAGMENT_SHADER, /vec3 cosmicMain/)
  assert.match(FRAGMENT_SHADER, /vec3 cosmicDeep/)
  assert.match(FRAGMENT_SHADER, /vec3 cosmicLight/)
})

test('shader can blend the orb into a moon-silver graphite palette', () => {
  assert.match(FRAGMENT_SHADER, /vec3 silverMain/)
  assert.match(FRAGMENT_SHADER, /mix\(cosmicMain, silverMain, uSilverTone\)/)
})

test('shader keeps the galactic core compact at mood-orb scale', () => {
  assert.match(FRAGMENT_SHADER, /float galaxyCore/)
  assert.match(FRAGMENT_SHADER, /exp\(-72\.0/)
})

test('shader keeps stars visible at the 188px product size', () => {
  assert.match(FRAGMENT_SHADER, /const float STAR_RADIUS = 0\.105/)
})

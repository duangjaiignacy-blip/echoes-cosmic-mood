import assert from 'node:assert/strict'
import test from 'node:test'
import { FRAGMENT_SHADER, VERTEX_SHADER } from '../src/components/glassyOrbShader.ts'

test('shader exposes every renderer attribute and uniform', () => {
  assert.match(VERTEX_SHADER, /attribute vec2 aPosition/)
  for (const uniform of ['uResolution', 'uTime', 'uSpin', 'uPulse', 'uColorMain', 'uColorDeep', 'uColorLight']) {
    assert.match(FRAGMENT_SHADER, new RegExp(`uniform .* ${uniform};`))
  }
})

test('fragment shader contains nebula, stars, Fresnel glass, and prismatic rim stages', () => {
  assert.match(FRAGMENT_SHADER, /float nebulaDensity/)
  assert.match(FRAGMENT_SHADER, /float starLayer/)
  assert.match(FRAGMENT_SHADER, /float fresnel/)
  assert.match(FRAGMENT_SHADER, /vec3 prism/)
})

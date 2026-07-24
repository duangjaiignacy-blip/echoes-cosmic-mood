import assert from 'node:assert/strict'
import test from 'node:test'
import { BLACK_HOLE_GALAXY_SETTINGS } from '../src/components/blackHoleGalaxyModel.ts'
import {
  createBlackHoleGalaxyRenderer,
  resizeBlackHoleBuffer,
} from '../src/components/blackHoleGalaxyRenderer.ts'

test('resizeBlackHoleBuffer uses capped DPR and only mutates changed dimensions', () => {
  const canvas = { clientWidth: 100, clientHeight: 50, width: 0, height: 0 } as HTMLCanvasElement

  assert.equal(resizeBlackHoleBuffer(canvas, 2), true)
  assert.equal(canvas.width, 150)
  assert.equal(canvas.height, 75)
  assert.equal(resizeBlackHoleBuffer(canvas, 2), false)
})

test('createBlackHoleGalaxyRenderer returns null and invokes fallback when WebGL is unavailable', () => {
  let failure: unknown
  const canvas = { getContext: () => null } as unknown as HTMLCanvasElement

  const renderer = createBlackHoleGalaxyRenderer(
    canvas,
    BLACK_HOLE_GALAXY_SETTINGS,
    () => undefined,
    (error) => { failure = error },
  )

  assert.equal(renderer, null)
  assert.match(String(failure), /WebGL unavailable/)
})

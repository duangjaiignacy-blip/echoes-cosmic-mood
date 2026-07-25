import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { ECHO_MOODS } from '../src/components/moodEmotionModel.ts'
import { getMoodOrbAsset, MOOD_ORB_ASSETS } from '../src/components/moodOrbAssets.ts'

test('mood orb assets follow the canonical mood order exactly once', () => {
  const assetIds = MOOD_ORB_ASSETS.map(({ id }) => id)
  const moodIds = ECHO_MOODS.map(({ id }) => id)

  assert.deepEqual(assetIds, moodIds)
  assert.equal(new Set(assetIds).size, assetIds.length)
})

test('each three-mood sheet uses panels zero, one, and two in order', () => {
  assert.equal(MOOD_ORB_ASSETS.length % 3, 0)

  for (let index = 0; index < MOOD_ORB_ASSETS.length; index += 3) {
    const group = MOOD_ORB_ASSETS.slice(index, index + 3)

    assert.equal(new Set(group.map(({ sheet }) => sheet)).size, 1)
    assert.deepEqual(
      group.map(({ panel }) => panel),
      [0, 1, 2],
    )
  }
})

test('all five referenced sheets are transparent raster files on disk', () => {
  const sheets = [...new Set(MOOD_ORB_ASSETS.map(({ sheet }) => sheet))]

  assert.equal(sheets.length, 5)
  for (const sheet of sheets) {
    assert.match(sheet, /-transparent\.png$/)
    assert.equal(existsSync(fileURLToPath(sheet)), true, `Missing mood orb sheet: ${sheet}`)
  }
})

test('getMoodOrbAsset returns the exact registered asset', () => {
  for (const asset of MOOD_ORB_ASSETS) {
    assert.strictEqual(getMoodOrbAsset(asset.id), asset)
  }
})

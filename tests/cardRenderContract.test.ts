import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { ECHO_MOODS, getMoodVisual, moodPalette } from '../src/components/moodEmotionModel.ts'
import {
  getMoodOrbAsset,
  MOOD_ORB_SHEET_PANEL_COUNT,
  moodOrbSheetLeftPercent,
} from '../src/components/moodOrbAssets.ts'
import {
  CARD_THEME,
  cardMoodArtwork,
  cardRenderContract,
} from '../src/lib/card.ts'

test('named moods reuse the exact MoodPlanetImage sheet and crop contract', () => {
  for (const mood of ECHO_MOODS) {
    const asset = getMoodOrbAsset(mood.id)
    const artwork = cardMoodArtwork(mood.id)

    assert.ok(artwork)
    assert.equal(artwork.sheet, asset.sheet)
    assert.equal(
      artwork.sourceXRatio,
      -moodOrbSheetLeftPercent(asset) / (MOOD_ORB_SHEET_PANEL_COUNT * 100),
    )
    assert.equal(artwork.sourceWidthRatio, 1 / MOOD_ORB_SHEET_PANEL_COUNT)
    assert.equal(artwork.sourceYRatio, 0)
    assert.equal(artwork.sourceHeightRatio, 1)
  }
})

test('legacy valence-only records keep the gradient-orb fallback', () => {
  const contract = cardRenderContract({ valence: -2, labels: [] })

  assert.equal(contract.artwork, null)
  assert.deepEqual(contract.palette, moodPalette(-2))
})

test('named mood cards preserve their palette while keeping tint restrained', () => {
  const contract = cardRenderContract({ valence: 3, labels: [], emotionId: 'angry' })

  assert.equal(contract.palette, getMoodVisual('angry').palette)
  assert.ok(contract.moodTintAlpha > 0)
  assert.ok(contract.moodTintAlpha <= 0.18)
})

test('the card theme is deep-space silver-purple instead of mood-owned', () => {
  assert.deepEqual(
    [
      CARD_THEME.backgroundTop,
      CARD_THEME.backgroundMid,
      CARD_THEME.backgroundBottom,
      CARD_THEME.silver,
      CARD_THEME.lavender,
    ],
    ['#11111d', '#070810', '#020308', '#d9dce7', '#aaa4c4'],
  )
})

test('the card page awaits async rendering and cancels stale or unmounted work', () => {
  const cardPage = readFileSync(new URL('../src/pages/Card.tsx', import.meta.url), 'utf8')

  assert.match(cardPage, /const controller = new AbortController\(\)/)
  assert.match(cardPage, /await renderCard\(entry, \{ signal: controller\.signal \}\)/)
  assert.match(cardPage, /if \(active\) setUrl\(nextUrl\)/)
  assert.match(cardPage, /return \(\) => \{\s*active = false\s*controller\.abort\(\)\s*\}/s)
})

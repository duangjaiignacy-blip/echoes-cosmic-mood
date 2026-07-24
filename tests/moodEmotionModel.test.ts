import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_ECHO_MOOD_INDEX,
  ECHO_MOODS,
  getMoodVisual,
  moodLabel,
  moodPalette,
  type MoodMotion,
} from '../src/components/moodEmotionModel.ts'
import { moodColors } from '../src/components/moodOrbModel.ts'

const expected = [
  ['very-low', '非常低落', -3],
  ['low', '低落', -2],
  ['heavy', '有些沉', -1],
  ['calm', '平静', 0],
  ['okay', '还不错', 1],
  ['bright', '明亮', 2],
  ['joyful', '雀跃', 3],
  ['lonely', '孤独', -2],
  ['sad', '悲伤', -3],
  ['angry', '愤怒', -2],
  ['afraid', '害怕', -2],
  ['disappointed', '失望', -2],
  ['anxious', '焦虑', -1],
  ['aggrieved', '委屈', -2],
  ['embarrassed', '尴尬', -1],
] as const

const validMotions = new Set<MoodMotion>([
  'sink',
  'settle',
  'breathe',
  'lift',
  'glow',
  'spark',
  'withdraw',
  'rain',
  'bristle',
  'shiver',
  'fade',
  'orbit',
  'hold',
  'wobble',
])

test('registry preserves the exact stable fifteen-state order', () => {
  assert.deepEqual(
    ECHO_MOODS.map(({ id, label, valence }) => [id, label, valence]),
    expected,
  )
  assert.equal(ECHO_MOODS.length, 15)
  assert.equal(new Set(ECHO_MOODS.map(({ id }) => id)).size, 15)
})

test('every mood has valid colors, required geometry, and a declared motion', () => {
  const hex = /^#[0-9a-f]{6}$/i

  for (const mood of ECHO_MOODS) {
    assert.equal(mood.palette.length, 3, `${mood.id} palette length`)
    mood.palette.forEach((color) => assert.match(color, hex, `${mood.id} palette color`))
    assert.match(mood.ink, hex, `${mood.id} ink color`)
    assert.match(mood.blush, hex, `${mood.id} blush color`)
    assert.match(mood.accent, hex, `${mood.id} accent color`)
    assert.ok(mood.eyes.length > 0, `${mood.id} eyes`)
    assert.ok(mood.mouth.length > 0, `${mood.id} mouth`)
    assert.ok(mood.hands.length > 0, `${mood.id} hands`)
    assert.ok(validMotions.has(mood.motion), `${mood.id} motion`)
  }
})

test('every expression signature is unique and every stroke has path data', () => {
  const signatures = new Set<string>()

  for (const mood of ECHO_MOODS) {
    const expression = [mood.eyes, mood.brows, mood.mouth, mood.hands, mood.accents]
    signatures.add(JSON.stringify(expression))

    for (const stroke of expression.flat()) {
      assert.ok(stroke.d.trim().length > 0, `${mood.id} has an empty SVG path`)
    }
  }

  assert.equal(signatures.size, ECHO_MOODS.length)
})

test('default and lookup helpers return the registry records themselves', () => {
  assert.equal(ECHO_MOODS[DEFAULT_ECHO_MOOD_INDEX]?.id, 'calm')

  for (const mood of ECHO_MOODS) {
    assert.equal(getMoodVisual(mood.id), mood)
  }
})

test('moodLabel prefers a discrete label and preserves legacy seven-level fallback', () => {
  assert.equal(moodLabel(3, 'angry'), '愤怒')
  assert.deepEqual(
    [-3, -2, -1, 0, 1, 2, 3].map((valence) => moodLabel(valence)),
    ['非常低落', '低落', '有些沉', '平静', '还不错', '明亮', '雀跃'],
  )
  assert.equal(moodLabel(-99), '非常低落')
  assert.equal(moodLabel(99), '雀跃')
  assert.equal(moodLabel(0.6), '还不错')
})

test('moodPalette prefers a discrete palette and delegates numeric fallback', () => {
  assert.equal(moodPalette(3, 'angry'), getMoodVisual('angry').palette)

  for (const valence of [-99, -2, 0.6, 2, 99]) {
    assert.deepEqual(moodPalette(valence), moodColors(valence))
  }
})

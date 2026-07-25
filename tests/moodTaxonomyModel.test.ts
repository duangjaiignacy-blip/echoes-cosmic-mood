import assert from 'node:assert/strict'
import test from 'node:test'

import { ECHO_MOODS } from '../src/components/moodEmotionModel.ts'
import {
  getMoodDescriptorWords,
  getMoodTaxonomyPosition,
  MOOD_TAXONOMY_POSITIONS,
  moodPolarity,
  polarityFromValence,
} from '../src/components/moodTaxonomyModel.ts'

test('taxonomy positions cover all stable mood ids exactly once without reordering the registry', () => {
  const taxonomyIds = MOOD_TAXONOMY_POSITIONS.map(({ id }) => id)
  const registryIds = ECHO_MOODS.map(({ id }) => id)

  assert.equal(taxonomyIds.length, registryIds.length)
  assert.deepEqual([...taxonomyIds].sort(), [...registryIds].sort())
  assert.equal(new Set(taxonomyIds).size, taxonomyIds.length)
  assert.equal(Object.isFrozen(MOOD_TAXONOMY_POSITIONS), true)
  assert.deepEqual(registryIds.slice(0, 7), [
    'very-low',
    'low',
    'heavy',
    'calm',
    'okay',
    'bright',
    'joyful',
  ])
})

test('negative moods occupy the left semicircle, positive moods the right, and calm the boundary', () => {
  for (const mood of ECHO_MOODS) {
    const position = getMoodTaxonomyPosition(mood.id)
    const x = Math.sin(position.angle * Math.PI / 180) * position.radius

    if (mood.valence < 0) {
      assert.equal(position.polarity, 'negative', mood.id)
      assert.equal(position.side, 'left', mood.id)
      assert.ok(x < -1, `${mood.id} must render left of the vertical boundary`)
    } else if (mood.valence > 0) {
      assert.equal(position.polarity, 'positive', mood.id)
      assert.equal(position.side, 'right', mood.id)
      assert.ok(x > 1, `${mood.id} must render right of the vertical boundary`)
    } else {
      assert.equal(mood.id, 'calm')
      assert.equal(position.polarity, 'neutral')
      assert.equal(position.side, 'boundary')
      assert.ok(Math.abs(x) < 1)
    }
  }

  assert.equal(getMoodTaxonomyPosition('calm').angle, 0)
})

test('each half progresses from calm-adjacent mild moods toward stronger moods', () => {
  const valenceById = new Map(ECHO_MOODS.map(({ id, valence }) => [id, valence]))
  const negativeLevels = MOOD_TAXONOMY_POSITIONS
    .filter(({ polarity }) => polarity === 'negative')
    .sort((a, b) => b.angle - a.angle)
    .map(({ id }) => valenceById.get(id))
  const positiveLevels = MOOD_TAXONOMY_POSITIONS
    .filter(({ polarity }) => polarity === 'positive')
    .sort((a, b) => a.angle - b.angle)
    .map(({ id }) => valenceById.get(id))

  assert.deepEqual(negativeLevels, [-1, -1, -1, -2, -2, -2, -2, -2, -2, -3, -3])
  assert.deepEqual(positiveLevels, [1, 2, 3])
})

test('polarity uses a discrete emotion when present and keeps valence-only records compatible', () => {
  assert.equal(polarityFromValence(-0.01), 'negative')
  assert.equal(polarityFromValence(0), 'neutral')
  assert.equal(polarityFromValence(0.01), 'positive')

  assert.equal(moodPolarity({ valence: -2 }), 'negative')
  assert.equal(moodPolarity({ valence: 0 }), 'neutral')
  assert.equal(moodPolarity({ valence: 2 }), 'positive')
  assert.equal(moodPolarity({ valence: 3, emotionId: 'angry' }), 'negative')
  assert.equal(moodPolarity({ valence: -3, emotionId: 'joyful' }), 'positive')
})

test('valence-only descriptor rings use distinct twelve-word vocabularies by polarity', () => {
  const negative = getMoodDescriptorWords({ valence: -1 })
  const neutral = getMoodDescriptorWords({ valence: 0 })
  const positive = getMoodDescriptorWords({ valence: 1 })

  assert.equal(negative.length, 12)
  assert.equal(neutral.length, 12)
  assert.equal(positive.length, 12)
  assert.notDeepEqual(negative, positive)
  assert.notDeepEqual(negative, neutral)
  assert.notDeepEqual(neutral, positive)
  assert.ok(negative.includes('失落'))
  assert.ok(neutral.includes('平静'))
  assert.ok(positive.includes('喜悦'))
})

test('discrete emotions refine descriptor words while retaining stable unique rings', () => {
  for (const mood of ECHO_MOODS) {
    const words = getMoodDescriptorWords({ valence: mood.valence, emotionId: mood.id })
    assert.equal(words.length, 12, mood.id)
    assert.equal(new Set(words).size, words.length, mood.id)
    assert.equal(Object.isFrozen(words), true, mood.id)
    assert.strictEqual(
      words,
      getMoodDescriptorWords({ valence: mood.valence, emotionId: mood.id }),
      mood.id,
    )
  }

  const angry = getMoodDescriptorWords({ valence: -2, emotionId: 'angry' })
  const sad = getMoodDescriptorWords({ valence: -3, emotionId: 'sad' })
  const joyful = getMoodDescriptorWords({ valence: 3, emotionId: 'joyful' })

  assert.ok(angry.includes('恼火'))
  assert.ok(sad.includes('心碎'))
  assert.ok(joyful.includes('兴奋'))
  assert.notDeepEqual(angry, sad)
  assert.notDeepEqual(angry, joyful)
})

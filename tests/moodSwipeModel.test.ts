import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ECHO_MOOD_BOUNCE_MS,
  ECHO_MOOD_IMPACT_MS,
  classifyMoodSwipe,
  stepMoodIndex,
  stepMoodLevel,
} from '../src/components/moodSwipeModel.ts'

test('horizontal swipes dominate vertical movement and map to mood direction', () => {
  assert.equal(classifyMoodSwipe(-60, 8), 1)
  assert.equal(classifyMoodSwipe(60, 8), -1)
  assert.equal(classifyMoodSwipe(30, 2), 0)
  assert.equal(classifyMoodSwipe(60, 58), 0)
})

test('mood levels wrap through all seven options one step at a time', () => {
  assert.equal(stepMoodLevel(0, 1), 1)
  assert.equal(stepMoodLevel(0, -1), -1)
  assert.equal(stepMoodLevel(3, 1), -3)
  assert.equal(stepMoodLevel(-3, -1), 3)
})

test('mood indices wrap through all fifteen options one step at a time', () => {
  assert.equal(stepMoodIndex(0, 1, 15), 1)
  assert.equal(stepMoodIndex(0, -1, 15), 14)
  assert.equal(stepMoodIndex(14, 1, 15), 0)
  assert.equal(stepMoodIndex(7, -1, 15), 6)
})

test('bounce timing changes the label at impact before the animation ends', () => {
  assert.equal(ECHO_MOOD_IMPACT_MS, 140)
  assert.equal(ECHO_MOOD_BOUNCE_MS, 480)
})

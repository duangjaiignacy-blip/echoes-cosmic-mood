import assert from 'node:assert/strict'
import test from 'node:test'

import * as swipeModel from '../src/components/moodSwipeModel.ts'
import {
  activeMoodIndex,
  moodPositionFromDrag,
  nearestMoodPosition,
  orbitalMoodPose,
  projectMoodSnap,
  wrapMoodIndex,
} from '../src/components/moodSwipeModel.ts'

test('continuous positions wrap and activate at the nearest half-step', () => {
  assert.equal(wrapMoodIndex(-1, 15), 14)
  assert.equal(wrapMoodIndex(15, 15), 0)
  assert.equal(activeMoodIndex(3.49, 15), 3)
  assert.equal(activeMoodIndex(3.51, 15), 4)
})

test('horizontal drag updates an unbounded position without stealing vertical intent', () => {
  assert.equal(moodPositionFromDrag(3, -208, 0, 104), 5)
  assert.equal(moodPositionFromDrag(3, 208, 0, 104), 1)
  assert.equal(moodPositionFromDrag(3, -80, 90, 104), 3)
})

test('fixed mood controls choose the nearest copy on the circular track', () => {
  assert.equal(nearestMoodPosition(14, 0, 15), 15)
  assert.equal(nearestMoodPosition(1, 14, 15), -1)
  assert.equal(nearestMoodPosition(31, 1, 15), 31)
})

test('release velocity projects a restrained snap of at most three steps', () => {
  assert.equal(projectMoodSnap(4.1, -4, 104, 160, 3), 7)
  assert.equal(projectMoodSnap(4.1, 4, 104, 160, 3), 1)
  assert.equal(projectMoodSnap(4.6, 0, 104, 160, 3), 5)
})

test('orbital poses preserve the center and form lower neighboring steps', () => {
  const center = orbitalMoodPose(4, 4, 15)
  const previous = orbitalMoodPose(3, 4, 15)
  const next = orbitalMoodPose(5, 4, 15)
  const remote = orbitalMoodPose(10, 4, 15)

  assert.deepEqual(center, {
    visible: true,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    zIndex: 30,
  })
  assert.equal(previous.x < 0, true)
  assert.equal(next.x > 0, true)
  assert.equal(previous.y > center.y, true)
  assert.equal(next.y > center.y, true)
  assert.equal(previous.scale < center.scale, true)
  assert.equal(next.scale < center.scale, true)
  assert.equal(remote.visible, false)
  assert.equal(remote.opacity, 0)
})

test('the abrupt impact and bounce timers are no longer public behavior', () => {
  assert.equal('ECHO_MOOD_IMPACT_MS' in swipeModel, false)
  assert.equal('ECHO_MOOD_BOUNCE_MS' in swipeModel, false)
})

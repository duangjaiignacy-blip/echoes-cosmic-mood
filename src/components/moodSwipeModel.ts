export type MoodSwipeDirection = -1 | 1

export const ECHO_MOOD_STEP_PX = 104
export const ECHO_MOOD_PROJECTION_MS = 160
export const ECHO_MOOD_MAX_FLING_STEPS = 3

export interface OrbitalMoodPose {
  visible: boolean
  x: number
  y: number
  scale: number
  opacity: number
  zIndex: number
}

export interface MoodDragTargetDescriptor {
  readonly tagName?: string
  readonly isContentEditable?: boolean
}

const INTERACTIVE_MOOD_TAGS = new Set(['a', 'button', 'input', 'label', 'select', 'textarea'])

export function isMoodDragStartAllowed(path: readonly MoodDragTargetDescriptor[]): boolean {
  return !path.some((target) => (
    target.isContentEditable === true
    || (target.tagName ? INTERACTIVE_MOOD_TAGS.has(target.tagName.toLowerCase()) : false)
  ))
}

export function wrapMoodIndex(index: number, count: number): number {
  if (!Number.isInteger(count) || count < 1) return 0
  return ((Math.round(index) % count) + count) % count
}

export function activeMoodIndex(position: number, count: number): number {
  return wrapMoodIndex(Math.round(position), count)
}

export function hasHorizontalMoodIntent(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaX) >= Math.abs(deltaY) * 1.15
}

export function moodPositionFromDrag(
  startPosition: number,
  deltaX: number,
  deltaY: number,
  stepPx = ECHO_MOOD_STEP_PX,
): number {
  if (!hasHorizontalMoodIntent(deltaX, deltaY) || stepPx <= 0) return startPosition
  return startPosition - deltaX / stepPx
}

export function nearestMoodPosition(position: number, targetIndex: number, count: number): number {
  if (!Number.isInteger(count) || count < 1) return 0
  const wrappedTarget = wrapMoodIndex(targetIndex, count)
  const cycle = Math.round((position - wrappedTarget) / count)
  return wrappedTarget + cycle * count
}

export function projectMoodSnap(
  position: number,
  velocityPxPerMs: number,
  stepPx = ECHO_MOOD_STEP_PX,
  projectionMs = ECHO_MOOD_PROJECTION_MS,
  maxSteps = ECHO_MOOD_MAX_FLING_STEPS,
): number {
  if (stepPx <= 0) return Math.round(position)
  const projectedSteps = (-velocityPxPerMs * projectionMs) / stepPx
  const boundedSteps = Math.max(-Math.abs(maxSteps), Math.min(Math.abs(maxSteps), projectedSteps))
  return Math.round(position + boundedSteps)
}

export function orbitalMoodPose(index: number, position: number, count: number): OrbitalMoodPose {
  const distance = nearestMoodPosition(position, index, count) - position
  const absoluteDistance = Math.abs(distance)

  if (absoluteDistance > 2.5) {
    return {
      visible: false,
      x: distance * ECHO_MOOD_STEP_PX,
      y: 72,
      scale: 0.58,
      opacity: 0,
      zIndex: 0,
    }
  }

  return {
    visible: true,
    x: distance * ECHO_MOOD_STEP_PX,
    y: absoluteDistance * absoluteDistance * 20,
    scale: Math.max(0.58, 1 - absoluteDistance * 0.18),
    opacity: Math.max(0.12, 1 - absoluteDistance * 0.34),
    zIndex: 30 - Math.round(absoluteDistance * 8),
  }
}

// Kept for the legacy seven-level rotary path while Echo mode uses continuous positions.
export function stepMoodLevel(current: number, direction: MoodSwipeDirection): number {
  const normalized = Math.max(-3, Math.min(3, Math.round(current)))
  if (direction === 1 && normalized === 3) return -3
  if (direction === -1 && normalized === -3) return 3
  return normalized + direction
}

export function stepMoodIndex(current: number, direction: MoodSwipeDirection, count: number): number {
  return wrapMoodIndex(Math.round(current) + direction, count)
}

export type MoodSwipeDirection = -1 | 1

export const ECHO_MOOD_IMPACT_MS = 140
export const ECHO_MOOD_BOUNCE_MS = 480

export function classifyMoodSwipe(
  deltaX: number,
  deltaY: number,
  threshold = 42,
): MoodSwipeDirection | 0 {
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return 0
  return deltaX < 0 ? 1 : -1
}

export function stepMoodLevel(current: number, direction: MoodSwipeDirection): number {
  const normalized = Math.max(-3, Math.min(3, Math.round(current)))
  if (direction === 1 && normalized === 3) return -3
  if (direction === -1 && normalized === -3) return 3
  return normalized + direction
}

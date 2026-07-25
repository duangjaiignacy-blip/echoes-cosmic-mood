import { useEffect, useRef } from 'react'
import {
  ECHO_MOOD_STEP_PX,
  moodPositionFromDrag,
  projectMoodSnap,
} from '../components/moodSwipeModel'

export type MoodSwipePhase = 'dragging' | 'settling'

interface PointerSample {
  x: number
  time: number
}

const VELOCITY_WINDOW_MS = 80

export function useMoodSwipe(
  position: number,
  onPositionChange: (position: number, phase: MoodSwipePhase) => void,
  disabled = false,
  stepPx = ECHO_MOOD_STEP_PX,
) {
  const ref = useRef<HTMLDivElement>(null)
  const positionRef = useRef(position)
  const onPositionChangeRef = useRef(onPositionChange)
  positionRef.current = position
  onPositionChangeRef.current = onPositionChange

  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return

    let startPosition = positionRef.current
    let startX = 0
    let startY = 0
    let livePosition = startPosition
    let activePointerId: number | null = null
    let samples: PointerSample[] = []

    const remember = (x: number, time: number) => {
      samples.push({ x, time })
      samples = samples.filter((sample) => time - sample.time <= VELOCITY_WINDOW_MS)
    }

    const down = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return

      activePointerId = event.pointerId
      startPosition = positionRef.current
      livePosition = startPosition
      startX = event.clientX
      startY = event.clientY
      samples = []
      remember(event.clientX, event.timeStamp)
      element.setPointerCapture(event.pointerId)
      onPositionChangeRef.current(livePosition, 'dragging')
    }

    const move = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId) return

      livePosition = moodPositionFromDrag(
        startPosition,
        event.clientX - startX,
        event.clientY - startY,
        stepPx,
      )
      remember(event.clientX, event.timeStamp)
      onPositionChangeRef.current(livePosition, 'dragging')
    }

    const finish = (event: PointerEvent, cancelled: boolean) => {
      if (event.pointerId !== activePointerId) return

      if (!cancelled) remember(event.clientX, event.timeStamp)
      const first = samples.at(0)
      const last = samples.at(-1)
      const elapsed = first && last ? last.time - first.time : 0
      const velocity = !cancelled && first && last && elapsed > 0 ? (last.x - first.x) / elapsed : 0
      const target = projectMoodSnap(livePosition, velocity, stepPx)

      activePointerId = null
      samples = []
      onPositionChangeRef.current(target, 'settling')

      try {
        element.releasePointerCapture(event.pointerId)
      } catch {
        /* Pointer capture may already be released by the browser. */
      }
    }

    const up = (event: PointerEvent) => finish(event, false)
    const cancel = (event: PointerEvent) => finish(event, true)

    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', cancel)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', cancel)
    }
  }, [disabled, stepPx])

  return ref
}

import { useEffect, useRef } from 'react'
import { classifyMoodSwipe, type MoodSwipeDirection } from '../components/moodSwipeModel'

export function useMoodSwipe(onSwipe: (direction: MoodSwipeDirection) => void, disabled = false) {
  const ref = useRef<HTMLDivElement>(null)
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe

  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return

    let startX = 0
    let startY = 0
    let tracking = false
    let committed = false

    const down = (event: PointerEvent) => {
      tracking = true
      committed = false
      startX = event.clientX
      startY = event.clientY
      element.setPointerCapture(event.pointerId)
    }

    const move = (event: PointerEvent) => {
      if (!tracking || committed) return
      const direction = classifyMoodSwipe(event.clientX - startX, event.clientY - startY)
      if (!direction) return
      committed = true
      onSwipeRef.current(direction)
    }

    const end = (event: PointerEvent) => {
      tracking = false
      try {
        element.releasePointerCapture(event.pointerId)
      } catch {
        /* pointer capture may already be released */
      }
    }

    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', end)
    element.addEventListener('pointercancel', end)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', end)
      element.removeEventListener('pointercancel', end)
    }
  }, [disabled])

  return ref
}

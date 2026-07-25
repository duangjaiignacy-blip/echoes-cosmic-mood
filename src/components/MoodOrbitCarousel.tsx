import type { CSSProperties, PointerEvent } from 'react'

import type { MoodSwipePhase } from '../lib/useMoodSwipe'
import { ECHO_MOODS } from './moodEmotionModel'
import { MoodPlanetImage } from './MoodPlanetImage'
import { orbitalMoodPose } from './moodSwipeModel'

const ORB_VIEWPORT_SIZE = 348

interface Props {
  position: number
  activeIndex: number
  phase: MoodSwipePhase | 'idle'
  onSelect: (index: number) => void
}

export function MoodOrbitCarousel({ position, activeIndex, phase, onSelect }: Props) {
  const stopDrag = (event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()

  return (
    <div className={`mood-orbit-carousel is-${phase}`} data-orbit-phase={phase}>
      <div className="mood-orbit-lane" aria-hidden="true">
        {ECHO_MOODS.map((mood, index) => {
          const pose = orbitalMoodPose(index, position, ECHO_MOODS.length)
          const style: CSSProperties = {
            opacity: pose.opacity,
            zIndex: pose.zIndex,
            visibility: pose.visible ? 'visible' : 'hidden',
            transform: `translate3d(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px), 0) scale(${pose.scale})`,
          }

          return (
            <div
              key={mood.id}
              className={`mood-orbit-item ${index === activeIndex ? 'is-active' : ''}`}
              data-mood-id={mood.id}
              style={style}
            >
              <MoodPlanetImage moodId={mood.id} alt="" size={ORB_VIEWPORT_SIZE} />
            </div>
          )
        })}
      </div>

      <div className="mood-orbit-steps" aria-label="全部情绪">
        {ECHO_MOODS.map((mood, index) => (
          <button
            key={mood.id}
            type="button"
            className="mood-orbit-step"
            data-active={index === activeIndex ? true : undefined}
            aria-label={`选择${mood.label}`}
            aria-pressed={index === activeIndex}
            onPointerDown={stopDrag}
            onClick={() => onSelect(index)}
          >
            <span className="sr-only">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

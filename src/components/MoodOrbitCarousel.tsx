import type { CSSProperties, PointerEvent } from 'react'

import type { MoodSwipePhase } from '../lib/useMoodSwipe'
import { ECHO_MOODS } from './moodEmotionModel'
import { MoodPlanetImage } from './MoodPlanetImage'
import {
  moodOrbitTextPose,
  moodTickAngle,
  moodTickOpacity,
  orbitalMoodPose,
} from './moodSwipeModel'

const ORB_VIEWPORT_SIZE = 244

interface Props {
  position: number
  activeIndex: number
  phase: MoodSwipePhase | 'idle'
  expanded: boolean
  onSelect: (index: number) => void
  onExpandedChange: (expanded: boolean) => void
}

export function MoodOrbitCarousel({
  position,
  activeIndex,
  phase,
  expanded,
  onSelect,
  onExpandedChange,
}: Props) {
  const stopDrag = (event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()
  const activeMood = ECHO_MOODS[activeIndex]
  const pose = orbitalMoodPose(activeIndex, position, ECHO_MOODS.length)
  const style: CSSProperties = {
    opacity: pose.opacity,
    zIndex: pose.zIndex,
    transform: `translate3d(calc(-50% + ${pose.x}px), -50%, 0) scale(${pose.scale})`,
  }
  const selectMood = (index: number) => {
    onExpandedChange(true)
    onSelect(index)
  }

  return (
    <div
      className={`mood-orbit-carousel is-${phase} ${expanded ? 'is-expanded' : 'is-collapsed'}`}
      data-orbit-phase={phase}
      data-orbit-expanded={expanded}
    >
      <div className="mood-orbit-lane" aria-hidden="true">
        <div className="mood-orbit-item is-active" data-mood-id={activeMood.id} style={style}>
          <MoodPlanetImage moodId={activeMood.id} alt="" size={ORB_VIEWPORT_SIZE} />
        </div>
      </div>

      <button
        type="button"
        className="mood-orbit-toggle"
        aria-label={expanded ? '收起情绪文字' : '展开情绪文字'}
        aria-expanded={expanded}
        onPointerDown={stopDrag}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="sr-only">{expanded ? '收起情绪文字' : '展开情绪文字'}</span>
      </button>

      <div className="mood-orbit-texts" aria-live="off">
        {ECHO_MOODS.map((mood, index) => {
          const textPose = moodOrbitTextPose(index, position, ECHO_MOODS.length, expanded)
          const textStyle: CSSProperties = {
            opacity: textPose.opacity,
            transform: [
              'translate(-50%, -50%)',
              `rotate(${textPose.angle}deg)`,
              'translateY(-174px)',
              `rotate(${-textPose.angle}deg)`,
              `scale(${textPose.scale})`,
            ].join(' '),
          }
          return (
            <span
              key={mood.id}
              className="mood-orbit-text"
              data-active={index === activeIndex ? true : undefined}
              data-visible={textPose.visible ? true : undefined}
              aria-hidden="true"
              style={textStyle}
            >
              {mood.label}
            </span>
          )
        })}
      </div>

      <div className="mood-orbit-steps" aria-label="全部情绪">
        {ECHO_MOODS.map((mood, index) => {
          const tickStyle: CSSProperties = {
            opacity: moodTickOpacity(index, position, ECHO_MOODS.length),
            transform: `translate(-50%, -50%) rotate(${moodTickAngle(index, position, ECHO_MOODS.length)}deg) translateY(-143px)`,
          }
          return (
            <button
              key={mood.id}
              type="button"
              className="mood-orbit-step"
              data-active={index === activeIndex ? true : undefined}
              aria-label={`选择${mood.label}`}
              aria-pressed={index === activeIndex}
              style={tickStyle}
              onPointerDown={stopDrag}
              onClick={() => selectMood(index)}
            >
              <span className="sr-only">{mood.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

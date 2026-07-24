import type { CSSProperties } from 'react'
import type { MoodStroke, MoodVisual } from './moodEmotionModel'

type MoodExpressionStyle = CSSProperties & {
  '--mood-ink': string
  '--mood-blush': string
  '--mood-accent': string
}

function StrokeGroup({ name, strokes }: { name: string; strokes: readonly MoodStroke[] }) {
  return (
    <g className={`mood-expression__${name}`}>
      {strokes.map((stroke, index) => (
        <path
          key={`${stroke.layer}-${index}-${stroke.d}`}
          className={`mood-stroke mood-stroke--${stroke.layer}`}
          d={stroke.d}
          fill={stroke.fill ? 'currentColor' : 'none'}
        />
      ))}
    </g>
  )
}

/** Decorative hand-drawn expression layer; the glass sphere remains a separate perfect circle. */
export function MoodExpression({ mood }: { mood: MoodVisual }) {
  const style: MoodExpressionStyle = {
    '--mood-ink': mood.ink,
    '--mood-blush': mood.blush,
    '--mood-accent': mood.accent,
  }

  return (
    <svg
      className={`mood-expression mood-expression--${mood.motion}`}
      viewBox="-24 -24 248 248"
      aria-hidden="true"
      style={style}
    >
      <StrokeGroup name="accents" strokes={mood.accents} />
      <StrokeGroup name="face" strokes={[...mood.brows, ...mood.eyes, ...mood.mouth]} />
      <StrokeGroup name="hands" strokes={mood.hands} />
    </svg>
  )
}

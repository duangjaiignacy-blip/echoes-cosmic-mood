import type { CSSProperties } from 'react'

import type { MoodId } from '../types'
import { ECHO_MOODS } from './moodEmotionModel'
import { getMoodOrbAsset, moodOrbSheetLeftPercent } from './moodOrbAssets'

export interface MoodPlanetImageProps {
  moodId: MoodId
  alt?: string
  className?: string
  size?: CSSProperties['width']
  style?: CSSProperties
}

export function MoodPlanetImage({
  moodId,
  alt,
  className,
  size = '100%',
  style,
}: MoodPlanetImageProps) {
  const asset = getMoodOrbAsset(moodId)
  const mood = ECHO_MOODS.find(({ id }) => id === moodId)

  return (
    <span
      className={className}
      style={{
        ...style,
        position: 'relative',
        display: 'inline-block',
        width: size,
        aspectRatio: '1748 / 2700',
        overflow: 'hidden',
        lineHeight: 0,
      }}
    >
      <img
        src={asset.sheet}
        alt={alt ?? `${mood?.label ?? moodId}情绪星球`}
        draggable={false}
        style={{
          position: 'absolute',
          top: 0,
          left: `${moodOrbSheetLeftPercent(asset)}%`,
          display: 'block',
          width: '300%',
          height: '100%',
          maxWidth: 'none',
        }}
      />
    </span>
  )
}

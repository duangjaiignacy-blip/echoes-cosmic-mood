import type { MoodId } from '../types'

export interface MoodOrbAsset {
  readonly id: MoodId
  readonly sheet: string
  readonly panel: 0 | 1 | 2
}

const VERY_LOW_LOW_HEAVY_SHEET = new URL(
  '../../docs/superpowers/concepts/mood-orbs/01-very-low-low-heavy-transparent.png',
  import.meta.url,
).href

const CALM_OKAY_BRIGHT_SHEET = new URL(
  '../../docs/superpowers/concepts/mood-orbs/02-calm-okay-bright-transparent.png',
  import.meta.url,
).href

const JOYFUL_LONELY_SAD_SHEET = new URL(
  '../../docs/superpowers/concepts/mood-orbs/03-joyful-lonely-sad-transparent.png',
  import.meta.url,
).href

const ANGRY_AFRAID_DISAPPOINTED_SHEET = new URL(
  '../../docs/superpowers/concepts/mood-orbs/04-angry-afraid-disappointed-transparent.png',
  import.meta.url,
).href

const ANXIOUS_AGGRIEVED_EMBARRASSED_SHEET = new URL(
  '../../docs/superpowers/concepts/mood-orbs/05-anxious-aggrieved-embarrassed-transparent.png',
  import.meta.url,
).href

export const MOOD_ORB_ASSETS: readonly Readonly<MoodOrbAsset>[] = Object.freeze([
  Object.freeze({ id: 'very-low', sheet: VERY_LOW_LOW_HEAVY_SHEET, panel: 0 }),
  Object.freeze({ id: 'low', sheet: VERY_LOW_LOW_HEAVY_SHEET, panel: 1 }),
  Object.freeze({ id: 'heavy', sheet: VERY_LOW_LOW_HEAVY_SHEET, panel: 2 }),
  Object.freeze({ id: 'calm', sheet: CALM_OKAY_BRIGHT_SHEET, panel: 0 }),
  Object.freeze({ id: 'okay', sheet: CALM_OKAY_BRIGHT_SHEET, panel: 1 }),
  Object.freeze({ id: 'bright', sheet: CALM_OKAY_BRIGHT_SHEET, panel: 2 }),
  Object.freeze({ id: 'joyful', sheet: JOYFUL_LONELY_SAD_SHEET, panel: 0 }),
  Object.freeze({ id: 'lonely', sheet: JOYFUL_LONELY_SAD_SHEET, panel: 1 }),
  Object.freeze({ id: 'sad', sheet: JOYFUL_LONELY_SAD_SHEET, panel: 2 }),
  Object.freeze({ id: 'angry', sheet: ANGRY_AFRAID_DISAPPOINTED_SHEET, panel: 0 }),
  Object.freeze({ id: 'afraid', sheet: ANGRY_AFRAID_DISAPPOINTED_SHEET, panel: 1 }),
  Object.freeze({ id: 'disappointed', sheet: ANGRY_AFRAID_DISAPPOINTED_SHEET, panel: 2 }),
  Object.freeze({ id: 'anxious', sheet: ANXIOUS_AGGRIEVED_EMBARRASSED_SHEET, panel: 0 }),
  Object.freeze({ id: 'aggrieved', sheet: ANXIOUS_AGGRIEVED_EMBARRASSED_SHEET, panel: 1 }),
  Object.freeze({ id: 'embarrassed', sheet: ANXIOUS_AGGRIEVED_EMBARRASSED_SHEET, panel: 2 }),
])

export function getMoodOrbAsset(id: MoodId): Readonly<MoodOrbAsset> {
  const asset = MOOD_ORB_ASSETS.find((candidate) => candidate.id === id)

  if (!asset) {
    throw new Error(`Missing mood orb asset for mood: ${id}`)
  }

  return asset
}

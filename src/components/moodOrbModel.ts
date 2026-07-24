export type MoodPalette = [string, string, string]

const PALETTES: Record<number, MoodPalette> = {
  [-3]: ['#3b4370', '#232849', '#6a7ab0'],
  [-2]: ['#4a548c', '#2c3158', '#7d8ac0'],
  [-1]: ['#5f68a8', '#3a4173', '#95a0d6'],
  [0]: ['#7d7ec0', '#4d4e8e', '#b3b4e8'],
  [1]: ['#9c8ad0', '#66549e', '#cfc0ee'],
  [2]: ['#c79ed2', '#8f68a0', '#f0d4ec'],
  [3]: ['#e8b8c8', '#b57d94', '#ffe3c4'],
}

function hexToRgb255(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function mixHex(a: string, b: string, amount: number): string {
  const from = hexToRgb255(a)
  const to = hexToRgb255(b)
  const mixed = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function moodColors(valence: number): MoodPalette {
  return PALETTES[Math.max(-3, Math.min(3, Math.round(valence)))]
}

export function moodColorsF(valence: number): MoodPalette {
  const clamped = Math.max(-3, Math.min(3, valence))
  const lower = Math.floor(clamped)
  const upper = Math.min(3, lower + 1)
  const amount = clamped - lower
  return PALETTES[lower].map((color, index) => mixHex(color, PALETTES[upper][index], amount)) as MoodPalette
}

export function hexToRgb01(hex: string): [number, number, number] {
  return hexToRgb255(hex).map((channel) => channel / 255) as [number, number, number]
}

export function capRenderDpr(dpr: number): number {
  return Math.max(1, Math.min(2, dpr))
}

export function spinDegreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function pulseStrength(elapsedMs: number): number {
  return Math.max(0, 1 - elapsedMs / 450)
}

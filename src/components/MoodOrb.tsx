/** 情绪配色：valence -3..3 → 渐变色组 */
export function moodColors(valence: number): [string, string, string] {
  const palettes: Record<number, [string, string, string]> = {
    [-3]: ['#3b4370', '#2a2f55', '#516091'],
    [-2]: ['#4a548c', '#343a66', '#6472ab'],
    [-1]: ['#5f68a8', '#464e85', '#7d86c4'],
    [0]: ['#7d7ec0', '#5d5fa5', '#9d9ed8'],
    [1]: ['#9c8ad0', '#7a6cb8', '#c0aae2'],
    [2]: ['#c79ed2', '#a37ec0', '#e8bede'],
    [3]: ['#e8b8c8', '#cf94b4', '#ffdcb8'],
  }
  return palettes[Math.max(-3, Math.min(3, Math.round(valence)))]
}

interface Props {
  valence: number
  size?: number
}

/** 呼吸感情绪光球 */
export function MoodOrb({ valence, size = 200 }: Props) {
  const [c1, c2, c3] = moodColors(valence)
  return (
    <div className="orb-wrap" style={{ height: size * 1.35 }}>
      <div
        className="orb-halo"
        style={{
          width: size * 1.5,
          height: size * 1.5,
          background: `radial-gradient(circle, ${c1}66, transparent 65%)`,
        }}
      />
      <div
        className="orb"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 32% 28%, ${c3}, ${c1} 55%, ${c2} 100%)`,
          boxShadow: `0 0 70px ${c1}88, 0 0 140px ${c2}55, inset 0 0 60px ${c3}44`,
        }}
      />
    </div>
  )
}

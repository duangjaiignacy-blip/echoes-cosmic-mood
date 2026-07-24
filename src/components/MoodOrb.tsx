/** 情绪基准色（valence 整数 -3..3 → [主色, 深色, 亮色]） */
const PALETTES: Record<number, [string, string, string]> = {
  [-3]: ['#3b4370', '#232849', '#6a7ab0'],
  [-2]: ['#4a548c', '#2c3158', '#7d8ac0'],
  [-1]: ['#5f68a8', '#3a4173', '#95a0d6'],
  [0]: ['#7d7ec0', '#4d4e8e', '#b3b4e8'],
  [1]: ['#9c8ad0', '#66549e', '#cfc0ee'],
  [2]: ['#c79ed2', '#8f68a0', '#f0d4ec'],
  [3]: ['#e8b8c8', '#b57d94', '#ffe3c4'],
}

function hexToRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
}

function mix(a: string, b: string, t: number): string {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  const c = ra.map((v, i) => Math.round(v + (rb[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** 整数档位取色（卡片渲染等场景） */
export function moodColors(valence: number): [string, string, string] {
  return PALETTES[Math.max(-3, Math.min(3, Math.round(valence)))]
}

/** 连续取色：在相邻档位之间插值（拨盘旋转时平滑过渡） */
export function moodColorsF(valence: number): [string, string, string] {
  const v = Math.max(-3, Math.min(3, valence))
  const lo = Math.floor(v)
  const hi = Math.min(3, lo + 1)
  const t = v - lo
  const a = PALETTES[lo]
  const b = PALETTES[hi]
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
}

interface Props {
  valence: number
  size?: number
  /** 拨盘旋转角（度），驱动晶体内部星云转动 */
  spin?: number
  /** 选中档位时的脉冲动画 */
  pulse?: boolean
}

/** 晶体质感情绪光球 */
export function MoodOrb({ valence, size = 200, spin = 0, pulse = false }: Props) {
  const [c1, c2, c3] = moodColorsF(valence)
  return (
    <div className={`corb ${pulse ? 'corb-pulse' : ''}`} style={{ width: size, height: size }}>
      {/* 外部光晕 */}
      <div
        className="corb-halo"
        style={{ background: `radial-gradient(circle, ${c1}77 0%, ${c2}33 45%, transparent 70%)` }}
      />
      {/* 球体 */}
      <div
        className="corb-body"
        style={{
          background: `radial-gradient(circle at 34% 30%, ${c3}, ${c1} 52%, ${c2} 88%)`,
          boxShadow: [
            `0 0 60px ${c1}66`,
            `0 0 130px ${c2}44`,
            `inset -18px -26px 50px ${c2}dd`,
            `inset 14px 18px 42px rgba(255,255,255,0.18)`,
            `inset 0 0 12px rgba(255,255,255,0.10)`,
          ].join(', '),
        }}
      >
        {/* 内部星云：随拨盘转动 + 缓慢自转 */}
        <div className="corb-nebula-spin" style={{ transform: `rotate(${spin}deg)` }}>
          <div
            className="corb-nebula"
            style={{
              background: `conic-gradient(from 40deg, ${c1}00, ${c3}66 90deg, ${c1}00 160deg, ${c2}88 240deg, ${c1}00 330deg)`,
            }}
          />
        </div>
        {/* 深水层：底部密度 */}
        <div className="corb-depth" style={{ background: `radial-gradient(circle at 50% 78%, ${c2}cc, transparent 55%)` }} />
        {/* 冷光折射 */}
        <div className="corb-refract" style={{ background: `radial-gradient(circle at 70% 62%, ${c3}44, transparent 42%)` }} />
        {/* 主高光 */}
        <div className="corb-spec" />
        {/* 次高光（下缘反光） */}
        <div className="corb-spec2" style={{ background: `radial-gradient(ellipse, ${c3}88, transparent 65%)` }} />
        {/* 边缘弧光 */}
        <div className="corb-arc" />
      </div>
      {/* 底部透光 */}
      <div className="corb-caustic" style={{ background: `radial-gradient(ellipse, ${c1}55, transparent 65%)` }} />
    </div>
  )
}

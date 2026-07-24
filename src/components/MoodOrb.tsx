import { moodColorsF } from './moodOrbModel'

export { moodColors } from './moodOrbModel'

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

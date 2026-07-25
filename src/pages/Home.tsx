import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { MoodOrb } from '../components/MoodOrb'
import {
  ECHO_MOOD_BOUNCE_MS,
  ECHO_MOOD_IMPACT_MS,
  stepMoodIndex,
  stepMoodLevel,
  type MoodSwipeDirection,
} from '../components/moodSwipeModel'
import { DEFAULT_ECHO_MOOD_INDEX, ECHO_MOODS } from '../components/moodEmotionModel'
import { useMoodSwipe } from '../lib/useMoodSwipe'
import { useRotary } from '../lib/useRotary'
import type { MoodState } from '../types'

const VALENCE_TEXT: Record<number, string> = {
  [-3]: '非常低落',
  [-2]: '低落',
  [-1]: '有些沉',
  [0]: '平静',
  [1]: '还不错',
  [2]: '明亮',
  [3]: '雀跃',
}

const WORDS = ['怀念', '想念', '感动', '温暖', '喜悦', '悸动', '释然', '平静', '孤独', '失落', '遗憾', '迷茫']

const DIAL = 300 // 拨盘直径
const ECHO_ORB_SIZE = 300
const WORD_R = 136 // 词环半径

interface Props {
  echoVoid?: boolean
  onNext: (mood: MoodState) => void
  onTimeline: () => void
  entryCount: number
}

export function Home({ echoVoid = false, onNext, onTimeline, entryCount }: Props) {
  const [step, setStep] = useState<'feel' | 'word'>('feel')

  /* ---- 第一步：旋转调整整体感受 ---- */
  const [angle, setAngle] = useState(0) // -270..270，每 90° 一档
  const [echoMoodIndex, setEchoMoodIndex] = useState(DEFAULT_ECHO_MOOD_INDEX)
  const [pulse, setPulse] = useState(false)
  const prevLevel = useRef(0)
  const transitionRef = useRef(false)
  const impactTimerRef = useRef<number | null>(null)
  const bounceTimerRef = useRef<number | null>(null)
  const [bounceDirection, setBounceDirection] = useState<MoodSwipeDirection | null>(null)

  const valence = angle / 90 // 连续值 -3..3
  const level = Math.max(-3, Math.min(3, Math.round(valence)))
  const echoMood = ECHO_MOODS[echoMoodIndex]

  const feelDial = useRotary((d) => {
    setAngle((a) => {
      const next = Math.max(-270, Math.min(270, a + d))
      const lv = Math.round(next / 90)
      if (lv !== prevLevel.current) {
        prevLevel.current = lv
        navigator.vibrate?.(8)
        setPulse(true)
        setTimeout(() => setPulse(false), 450)
      }
      return next
    })
  })

  const commitMoodSwipe = (direction: MoodSwipeDirection) => {
    if (transitionRef.current) return
    transitionRef.current = true
    setBounceDirection(direction)

    impactTimerRef.current = window.setTimeout(() => {
      if (echoVoid) {
        setEchoMoodIndex((current) => stepMoodIndex(current, direction, ECHO_MOODS.length))
      } else {
        setAngle((current) => stepMoodLevel(Math.round(current / 90), direction) * 90)
      }
      navigator.vibrate?.(8)
      setPulse(true)
    }, ECHO_MOOD_IMPACT_MS)

    bounceTimerRef.current = window.setTimeout(() => {
      transitionRef.current = false
      setBounceDirection(null)
      setPulse(false)
    }, ECHO_MOOD_BOUNCE_MS)
  }

  const moodSwipe = useMoodSwipe(commitMoodSwipe, !echoVoid || step !== 'feel')

  const handleMoodKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!echoVoid || step !== 'feel') return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      commitMoodSwipe(1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      commitMoodSwipe(-1)
    }
  }

  useEffect(() => () => {
    if (impactTimerRef.current !== null) window.clearTimeout(impactTimerRef.current)
    if (bounceTimerRef.current !== null) window.clearTimeout(bounceTimerRef.current)
  }, [])

  /* ---- 第二步：词环旋转选词 ---- */
  const [ringAngle, setRingAngle] = useState(0)
  const [smooth, setSmooth] = useState(false)
  const [labels, setLabels] = useState<string[]>([])

  const wordDial = useRotary(
    (d) => {
      setSmooth(false)
      setRingAngle((a) => a + d)
    },
    () => {
      // 松手后吸附到最近的词位
      setSmooth(true)
      setRingAngle((a) => Math.round(a / 30) * 30)
    },
  )

  const norm = (a: number) => ((a % 360) + 360) % 360
  // 顶部（-90°）对准的词
  const focusIdx = (() => {
    let best = 0
    let bestDiff = 361
    for (let i = 0; i < WORDS.length; i++) {
      const a = norm(i * 30 - 90 + ringAngle)
      const diff = Math.min(Math.abs(a - 270), 360 - Math.abs(a - 270))
      if (diff < bestDiff) {
        bestDiff = diff
        best = i
      }
    }
    return best
  })()

  const toggleWord = (w: string) =>
    setLabels((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : prev.length < 3 ? [...prev, w] : prev))

  return (
    <div className={`screen screen-scroll ${echoVoid ? 'screen--echo-void' : ''}`}>
      <div className="topbar">
        <div className="eyebrow">ECHOES · 回响</div>
        {step === 'feel' ? (
          <button className="back-link" onClick={onTimeline}>
            回忆 {entryCount > 0 ? `· ${entryCount}` : ''}
          </button>
        ) : (
          <button className="back-link" onClick={() => setStep('feel')}>
            ← 重新感受
          </button>
        )}
      </div>

      {step === 'feel' ? (
        <>
          <div className="feel-heading" style={{ textAlign: 'center', marginTop: 6 }}>
            <h1 className={`title ${echoVoid ? 'echo-feel-title' : ''}`}>此刻，你的心里泛起了什么？</h1>
          </div>

          {/* 拨盘 */}
          <div
            ref={echoVoid ? moodSwipe : feelDial}
            className={`dial ${echoVoid ? 'echo-feel-dial' : ''}`}
            data-mood-swipe={echoVoid ? true : undefined}
            aria-label={echoVoid ? '左右滑动切换此刻的感受' : '旋转选择此刻的感受'}
            role={echoVoid ? 'slider' : undefined}
            tabIndex={echoVoid ? 0 : undefined}
            aria-valuemin={echoVoid ? 1 : undefined}
            aria-valuemax={echoVoid ? ECHO_MOODS.length : undefined}
            aria-valuenow={echoVoid ? echoMoodIndex + 1 : undefined}
            aria-valuetext={echoVoid ? echoMood.label : undefined}
            onKeyDown={handleMoodKeyDown}
            style={{ width: DIAL, height: DIAL, marginTop: 26 }}
          >
            <div className="dial-ring" />
            <div
              className="dial-dot"
              style={{ transform: `rotate(${angle}deg) translateY(-${DIAL / 2 - 7}px)` }}
            />
            <div
              className={`echo-orb-bounce ${bounceDirection ? 'is-bouncing' : ''}`}
              data-orb-bounce={bounceDirection ?? 'idle'}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <MoodOrb
                valence={echoVoid ? echoMood.valence : valence}
                size={echoVoid ? ECHO_ORB_SIZE : 188}
                spin={echoVoid ? echoMoodIndex * 24 : angle * 1.6}
                pulse={pulse}
                tone={echoVoid ? 'echo' : 'default'}
                emotionId={echoVoid ? echoMood.id : undefined}
              />
            </div>
          </div>

          {echoVoid ? (
            <>
              <div
                className="echo-mood-label"
                data-mood-level={echoMood.valence}
                data-mood-id={echoMood.id}
                aria-live="polite"
              >
                <span aria-hidden="true">‹</span>
                <span>{echoMood.label}</span>
                <span aria-hidden="true">›</span>
              </div>
              <div className="dial-hint echo-swipe-hint">左右滑动，切换此刻的感受</div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginTop: 26, minHeight: 44 }}>
                <span className="title" style={{ fontSize: 24 }}>
                  {VALENCE_TEXT[level]}
                </span>
              </div>
              <div className="dial-hint" style={{ marginTop: 8, marginBottom: 26 }}>
                <span className="arc">⟳</span>
                <span>沿着光环旋转，找到此刻的感受</span>
              </div>
            </>
          )}

          <button className={`btn btn-primary ${echoVoid ? 'echo-confirm' : ''}`} onClick={() => setStep('word')}>
            就是这种感觉
          </button>
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginTop: 6 }}>
            <h1 className="title" style={{ fontSize: 22 }}>
              如果要给它一个名字
            </h1>
          </div>

          {/* 词环拨盘 */}
          <div ref={wordDial} className="dial" style={{ width: DIAL + 60, height: DIAL + 60, marginTop: 30 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <MoodOrb
                valence={echoVoid ? echoMood.valence : valence}
                size={118}
                spin={ringAngle * 1.4}
                tone={echoVoid ? 'echo' : 'default'}
                emotionId={echoVoid ? echoMood.id : undefined}
              />
            </div>
            <div className="word-ring">
              {WORDS.map((w, i) => {
                const a = ((i * 30 - 90 + ringAngle) * Math.PI) / 180
                const x = Math.cos(a) * WORD_R
                const y = Math.sin(a) * WORD_R
                const cls = [
                  'word-item',
                  i === focusIdx ? 'focus' : '',
                  labels.includes(w) ? 'picked' : '',
                  smooth ? 'smooth' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <span
                    key={w}
                    className={cls}
                    style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
                    onClick={() => toggleWord(w)}
                  >
                    {w}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="dial-hint" style={{ marginTop: 18 }}>
            <span className="arc">⟳</span>
            <span>旋转词环，轻点收下最贴切的词（最多 3 个）</span>
          </div>

          <div style={{ textAlign: 'center', minHeight: 30, marginTop: 12, marginBottom: 14 }}>
            {labels.length > 0 && (
              <span className="subtitle" style={{ fontSize: 15, color: '#c9befc' }}>
                {labels.join(' · ')}
              </span>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onNext({
              valence: echoVoid ? echoMood.valence : level,
              labels,
              ...(echoVoid ? { emotionId: echoMood.id } : {}),
            })}
          >
            继续
          </button>
          <p className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
            也可以不选任何词，感受不必都有名字
          </p>
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { MoodOrb } from '../components/MoodOrb'
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

const LABELS = ['怀念', '想念', '感动', '温暖', '喜悦', '平静', '孤独', '失落', '遗憾', '迷茫', '悸动', '释然']

interface Props {
  onNext: (mood: MoodState) => void
  onTimeline: () => void
  entryCount: number
}

export function Home({ onNext, onTimeline, entryCount }: Props) {
  const [valence, setValence] = useState(0)
  const [labels, setLabels] = useState<string[]>([])

  const toggle = (l: string) =>
    setLabels((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : prev.length < 3 ? [...prev, l] : prev))

  return (
    <div className="screen screen-scroll">
      <div className="topbar">
        <div>
          <div className="eyebrow">ECHOES · 回响</div>
        </div>
        <button className="back-link" onClick={onTimeline}>
          回忆 {entryCount > 0 ? `· ${entryCount}` : ''}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <h1 className="title">此刻，你的心里泛起了什么？</h1>
        <p className="subtitle" style={{ marginTop: 10 }}>
          不用思考未来，也不用计划什么。
          <br />
          只是感受，此刻的波动。
        </p>
      </div>

      <MoodOrb valence={valence} />

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <span
          className="title"
          style={{ fontSize: 20, transition: 'opacity 0.4s' }}
        >
          {VALENCE_TEXT[valence]}
        </span>
      </div>

      <input
        className="mood-slider"
        type="range"
        min={-3}
        max={3}
        step={1}
        value={valence}
        onChange={(e) => setValence(Number(e.target.value))}
        aria-label="情绪波动"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, marginBottom: 26 }}>
        <span className="hint">非常低落</span>
        <span className="hint">非常明亮</span>
      </div>

      <div className="chips" style={{ marginBottom: 30 }}>
        {LABELS.map((l) => (
          <button key={l} className={`chip ${labels.includes(l) ? 'on' : ''}`} onClick={() => toggle(l)}>
            {l}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={() => onNext({ valence, labels })}>
        继续
      </button>
      <p className="hint" style={{ textAlign: 'center', marginTop: 14 }}>
        最多选 3 个词，也可以一个都不选
      </p>
    </div>
  )
}

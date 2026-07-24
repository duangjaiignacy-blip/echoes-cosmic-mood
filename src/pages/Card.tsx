import { useEffect, useState } from 'react'
import { renderCard } from '../lib/card'
import type { Entry } from '../types'

interface Props {
  entry: Entry
  onDone: () => void
}

export function Card({ entry, onDone }: Props) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    // 等字体就绪后渲染，避免卡片字体回退
    const run = () => setUrl(renderCard(entry))
    if (document.fonts?.ready) {
      document.fonts.ready.then(run).catch(run)
    } else {
      run()
    }
  }, [entry])

  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `echoes-${entry.timeMark ?? '此刻'}.png`
    a.click()
  }

  const share = async () => {
    if (!url) return
    try {
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], 'echoes.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '回响 · 一段回忆' })
        return
      }
    } catch {
      /* 用户取消或不支持 */
    }
    download()
  }

  return (
    <div className="screen screen-scroll">
      <div className="topbar">
        <button className="back-link" onClick={onDone}>
          ← 完成
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <h1 className="title">你的回忆贴纸</h1>
        <p className="subtitle" style={{ marginTop: 8 }}>
          可以保存下来，或分享到社交媒体。
        </p>
      </div>

      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
        {url ? (
          <img
            src={url}
            alt="回忆卡片"
            style={{
              width: '78%',
              borderRadius: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 60px rgba(139,124,246,0.18)',
            }}
          />
        ) : (
          <div className="hint" style={{ padding: 60 }}>
            贴纸显影中…
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn" style={{ flex: 1 }} onClick={download} disabled={!url}>
          保存图片
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => void share()} disabled={!url}>
          分享
        </button>
      </div>
    </div>
  )
}

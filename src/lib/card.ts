import type { Entry } from '../types'
import { moodLabel, moodPalette } from '../components/moodEmotionModel'

const W = 1080
const H = 1350

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      lines.push('')
      continue
    }
    let line = ''
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > maxWidth) {
        lines.push(line)
        line = ch
      } else {
        line += ch
      }
    }
    if (line) lines.push(line)
  }
  return lines
}

/** 把一条回忆渲染成可分享的贴纸卡片，返回 PNG dataURL */
export function renderCard(entry: Entry): string {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const [c1, c2, c3] = moodPalette(entry.mood.valence, entry.mood.emotionId)

  // 底色
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0d0c22')
  bg.addColorStop(0.55, '#090818')
  bg.addColorStop(1, '#06060f')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 顶部光晕
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.16, 40, W * 0.5, H * 0.16, 520)
  glow.addColorStop(0, `${c1}90`)
  glow.addColorStop(0.5, `${c2}38`)
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H * 0.6)

  // 星星
  for (let i = 0; i < 130; i++) {
    const x = Math.random() * W
    const y = Math.random() * H
    const r = Math.random() * 2.2 + 0.5
    ctx.globalAlpha = Math.random() * 0.6 + 0.15
    ctx.fillStyle = '#dcd6ff'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 情绪球
  const ox = W * 0.5
  const oy = H * 0.2
  const orb = ctx.createRadialGradient(ox - 30, oy - 34, 12, ox, oy, 110)
  orb.addColorStop(0, c3)
  orb.addColorStop(0.55, c1)
  orb.addColorStop(1, c2)
  ctx.save()
  ctx.shadowColor = c1
  ctx.shadowBlur = 90
  ctx.fillStyle = orb
  ctx.beginPath()
  ctx.arc(ox, oy, 105, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 标题（时间标记）
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(240,236,255,0.96)'
  ctx.font = '500 64px "Songti SC", "Noto Serif SC", serif'
  const heading = entry.kind === 'past' ? entry.timeMark ?? '过去的某一天' : '此刻'
  ctx.fillText(heading, W / 2, H * 0.36)

  // 情绪词
  const labelText = [moodLabel(entry.mood.valence, entry.mood.emotionId), ...entry.mood.labels].join(' · ')
  if (labelText) {
    ctx.font = '30px "PingFang SC", sans-serif'
    ctx.fillStyle = 'rgba(220,214,255,0.6)'
    ctx.fillText(labelText, W / 2, H * 0.36 + 62)
  }

  // 正文面板
  const body = entry.diary || entry.note || '这一刻，被安静地收藏了。'
  const px = 96
  const pw = W - px * 2
  ctx.font = '34px "Songti SC", "Noto Serif SC", serif'
  const allLines = wrapText(ctx, body, pw - 96)
  const lineH = 62
  const maxLines = 10
  const lines = allLines.slice(0, maxLines)
  if (allLines.length > maxLines) lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'
  const panelH = lines.length * lineH + 120
  const py = H * 0.44

  ctx.fillStyle = 'rgba(255,255,255,0.055)'
  roundRect(ctx, px, py, pw, panelH, 40)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'
  ctx.lineWidth = 2
  roundRect(ctx, px, py, pw, panelH, 40)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(236,232,255,0.88)'
  lines.forEach((l, i) => {
    ctx.fillText(l, px + 48, py + 88 + i * lineH)
  })

  // 底部落款
  const date = new Date(entry.createdAt)
  const dateStr = `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · 记于回响`
  ctx.textAlign = 'center'
  ctx.font = '26px "PingFang SC", sans-serif'
  ctx.fillStyle = 'rgba(220,214,255,0.45)'
  ctx.fillText(dateStr, W / 2, H - 110)

  ctx.font = '24px "PingFang SC", sans-serif'
  ctx.fillStyle = 'rgba(220,214,255,0.3)'
  ctx.fillText('E C H O E S', W / 2, H - 64)

  return canvas.toDataURL('image/png')
}

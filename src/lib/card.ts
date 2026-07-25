import type { Entry, MoodId, MoodState } from '../types.ts'
import { moodLabel, moodPalette } from '../components/moodEmotionModel.ts'
import {
  getMoodOrbAsset,
  MOOD_ORB_SHEET_PANEL_COUNT,
  MOOD_ORB_VIEWPORT_HEIGHT,
  MOOD_ORB_VIEWPORT_WIDTH,
  moodOrbSheetLeftPercent,
} from '../components/moodOrbAssets.ts'

const W = 1080
const H = 1350

export const CARD_THEME = Object.freeze({
  backgroundTop: '#11111d',
  backgroundMid: '#070810',
  backgroundBottom: '#020308',
  silver: '#d9dce7',
  silverBright: '#f0f1f6',
  lavender: '#aaa4c4',
  panel: 'rgba(19, 19, 32, 0.82)',
  panelBorder: 'rgba(218, 218, 232, 0.20)',
  bodyText: 'rgba(232, 231, 239, 0.90)',
  secondaryText: 'rgba(202, 199, 218, 0.62)',
  faintText: 'rgba(188, 186, 204, 0.42)',
})

export interface CardMoodArtwork {
  readonly sheet: string
  readonly sourceXRatio: number
  readonly sourceWidthRatio: number
  readonly sourceYRatio: 0
  readonly sourceHeightRatio: 1
}

export interface CardRenderContract {
  readonly palette: readonly [string, string, string]
  readonly artwork: CardMoodArtwork | null
  readonly moodTintAlpha: number
}

export interface RenderCardOptions {
  signal?: AbortSignal
}

/**
 * 与 MoodPlanetImage 的 CSS 三联图裁切保持同一数学契约。
 * 归一化坐标让 Canvas 可在图片加载后按其真实像素尺寸取图。
 */
export function cardMoodArtwork(emotionId?: MoodId): CardMoodArtwork | null {
  if (!emotionId) return null

  const asset = getMoodOrbAsset(emotionId)
  return Object.freeze({
    sheet: asset.sheet,
    sourceXRatio: -moodOrbSheetLeftPercent(asset) / (MOOD_ORB_SHEET_PANEL_COUNT * 100),
    sourceWidthRatio: 1 / MOOD_ORB_SHEET_PANEL_COUNT,
    sourceYRatio: 0,
    sourceHeightRatio: 1,
  })
}

/** 卡片渲染的可测纯数据契约；旧记录没有 emotionId 时 artwork 为 null。 */
export function cardRenderContract(mood: MoodState): CardRenderContract {
  return Object.freeze({
    palette: moodPalette(mood.valence, mood.emotionId),
    artwork: cardMoodArtwork(mood.emotionId),
    moodTintAlpha: 0.16,
  })
}

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

function hexAlpha(hex: string, alpha: number): string {
  const normalized = hex.startsWith('#') ? hex.slice(1) : hex
  const value = Number.parseInt(normalized, 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function abortError(): DOMException {
  return new DOMException('Card rendering was aborted', 'AbortError')
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError()
}

function loadImage(src: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal)
    const image = new Image()
    image.decoding = 'async'

    const cleanup = () => {
      image.onload = null
      image.onerror = null
      signal?.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      cleanup()
      image.src = ''
      reject(abortError())
    }

    image.onload = () => {
      cleanup()
      resolve(image)
    }
    image.onerror = () => {
      cleanup()
      reject(new Error(`Unable to load mood artwork: ${src}`))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    image.src = src
  })
}

function drawLegacyOrb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  palette: readonly [string, string, string],
) {
  const [main, deep, light] = palette
  const orb = ctx.createRadialGradient(x - 30, y - 34, 12, x, y, 110)
  orb.addColorStop(0, light)
  orb.addColorStop(0.55, main)
  orb.addColorStop(1, deep)
  ctx.save()
  ctx.shadowColor = hexAlpha(main, 0.28)
  ctx.shadowBlur = 72
  ctx.fillStyle = orb
  ctx.beginPath()
  ctx.arc(x, y, 105, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawMoodArtwork(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  artwork: CardMoodArtwork,
  palette: readonly [string, string, string],
) {
  const viewportWidth = 310
  const viewportHeight = viewportWidth * (MOOD_ORB_VIEWPORT_HEIGHT / MOOD_ORB_VIEWPORT_WIDTH)
  const viewportX = (W - viewportWidth) / 2
  const viewportY = 26
  const sourceX = image.naturalWidth * artwork.sourceXRatio
  const sourceWidth = image.naturalWidth * artwork.sourceWidthRatio
  const sourceY = image.naturalHeight * artwork.sourceYRatio
  const sourceHeight = image.naturalHeight * artwork.sourceHeightRatio

  ctx.save()
  ctx.shadowColor = hexAlpha(palette[0], 0.24)
  ctx.shadowBlur = 64
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    viewportX,
    viewportY,
    viewportWidth,
    viewportHeight,
  )
  ctx.restore()
}

/** 把一条回忆异步渲染成可分享的贴纸卡片，返回 PNG dataURL。 */
export async function renderCard(entry: Entry, options: RenderCardOptions = {}): Promise<string> {
  const { signal } = options
  const contract = cardRenderContract(entry.mood)
  const [c1, c2, c3] = contract.palette
  let moodImage: HTMLImageElement | null = null

  if (contract.artwork) {
    try {
      moodImage = await loadImage(contract.artwork.sheet, signal)
    } catch (error) {
      if (signal?.aborted) throw error
      // 图片偶发加载失败时仍允许用户导出；旧版情绪球是安全降级。
    }
  }
  throwIfAborted(signal)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 深空银紫底色，情绪色只作为克制的局部染色。
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, CARD_THEME.backgroundTop)
  bg.addColorStop(0.56, CARD_THEME.backgroundMid)
  bg.addColorStop(1, CARD_THEME.backgroundBottom)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const silverGlow = ctx.createRadialGradient(W * 0.5, H * 0.17, 24, W * 0.5, H * 0.17, 510)
  silverGlow.addColorStop(0, 'rgba(218, 220, 234, 0.20)')
  silverGlow.addColorStop(0.46, 'rgba(139, 130, 174, 0.12)')
  silverGlow.addColorStop(1, 'rgba(3, 4, 10, 0)')
  ctx.fillStyle = silverGlow
  ctx.fillRect(0, 0, W, H * 0.62)

  const moodGlow = ctx.createRadialGradient(W * 0.5, H * 0.19, 54, W * 0.5, H * 0.19, 380)
  moodGlow.addColorStop(0, hexAlpha(c1, contract.moodTintAlpha))
  moodGlow.addColorStop(0.55, hexAlpha(c2, contract.moodTintAlpha * 0.45))
  moodGlow.addColorStop(1, hexAlpha(c3, 0))
  ctx.fillStyle = moodGlow
  ctx.fillRect(0, 0, W, H * 0.52)

  // 银白星点使用确定性分布，避免同一回忆每次导出产生视觉漂移。
  for (let i = 0; i < 138; i++) {
    const x = ((i * 233 + 71) % 1081) / 1080 * W
    const y = ((i * i * 47 + i * 61 + 29) % 1351) / 1350 * H
    const r = 0.55 + ((i * 17) % 13) / 10
    ctx.globalAlpha = 0.18 + ((i * 29) % 47) / 100
    ctx.fillStyle = i % 7 === 0 ? CARD_THEME.lavender : CARD_THEME.silver
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  const ox = W * 0.5
  const oy = H * 0.2
  const orbField = ctx.createRadialGradient(ox, oy, 88, ox, oy, 160)
  orbField.addColorStop(0, 'rgba(225, 225, 236, 0.07)')
  orbField.addColorStop(0.72, 'rgba(151, 143, 185, 0.06)')
  orbField.addColorStop(1, 'rgba(7, 8, 16, 0)')
  ctx.fillStyle = orbField
  ctx.beginPath()
  ctx.arc(ox, oy, 160, 0, Math.PI * 2)
  ctx.fill()

  if (moodImage && contract.artwork) {
    drawMoodArtwork(ctx, moodImage, contract.artwork, contract.palette)
  } else {
    drawLegacyOrb(ctx, ox, oy, contract.palette)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = CARD_THEME.silverBright
  ctx.font = '500 64px "Songti SC", "Noto Serif SC", serif'
  const heading = entry.kind === 'past' ? entry.timeMark ?? '过去的某一天' : '此刻'
  ctx.fillText(heading, W / 2, H * 0.36)

  const labelText = [moodLabel(entry.mood.valence, entry.mood.emotionId), ...entry.mood.labels].join(' · ')
  if (labelText) {
    ctx.font = '30px "PingFang SC", sans-serif'
    ctx.fillStyle = CARD_THEME.secondaryText
    ctx.fillText(labelText, W / 2, H * 0.36 + 62)
  }

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

  ctx.fillStyle = CARD_THEME.panel
  roundRect(ctx, px, py, pw, panelH, 40)
  ctx.fill()
  ctx.strokeStyle = CARD_THEME.panelBorder
  ctx.lineWidth = 2
  roundRect(ctx, px, py, pw, panelH, 40)
  ctx.stroke()

  const panelSheen = ctx.createLinearGradient(px, py, px + pw, py + panelH)
  panelSheen.addColorStop(0, 'rgba(223, 222, 235, 0.07)')
  panelSheen.addColorStop(0.48, hexAlpha(c1, 0.035))
  panelSheen.addColorStop(1, 'rgba(137, 128, 170, 0.035)')
  ctx.fillStyle = panelSheen
  roundRect(ctx, px + 2, py + 2, pw - 4, panelH - 4, 38)
  ctx.fill()

  ctx.textAlign = 'left'
  ctx.fillStyle = CARD_THEME.bodyText
  lines.forEach((line, index) => {
    ctx.fillText(line, px + 48, py + 88 + index * lineH)
  })

  const date = new Date(entry.createdAt)
  const dateStr = `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日 · 记于回响`
  ctx.textAlign = 'center'
  ctx.font = '26px "PingFang SC", sans-serif'
  ctx.fillStyle = CARD_THEME.faintText
  ctx.fillText(dateStr, W / 2, H - 110)

  ctx.font = '24px "PingFang SC", sans-serif'
  ctx.fillStyle = 'rgba(182, 180, 198, 0.30)'
  ctx.fillText('E C H O E S', W / 2, H - 64)

  throwIfAborted(signal)
  return canvas.toDataURL('image/png')
}

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const home = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const carouselUrl = new URL('../src/components/MoodOrbitCarousel.tsx', import.meta.url)

test('echo mode uses the original raster orbit on both chooser steps', () => {
  assert.match(home, /import \{ MoodOrbitCarousel \}/)
  assert.match(home, /import \{ MoodPlanetImage \}/)
  assert.match(home, /<MoodOrbitCarousel/)
  assert.match(home, /<MoodPlanetImage[\s\S]*moodId=\{echoMood\.id\}/)
})

test('the orbit exposes all fifteen fixed mood controls', async () => {
  const { readFile } = await import('node:fs/promises')
  const carousel = await readFile(carouselUrl, 'utf8')

  assert.match(carousel, /ECHO_MOODS\.map/)
  assert.match(carousel, /className="mood-orbit-step"/)
  assert.match(carousel, /aria-label=\{`选择\$\{mood\.label\}`\}/)
  assert.match(carousel, /const ORB_VIEWPORT_SIZE = 244/)
})

test('the orbit renders only the active mood artwork', async () => {
  const { readFile } = await import('node:fs/promises')
  const carousel = await readFile(carouselUrl, 'utf8')

  assert.match(carousel, /const activeMood = ECHO_MOODS\[activeIndex\]/)
  assert.match(carousel, /<MoodPlanetImage moodId=\{activeMood\.id\}/)
})

test('the home screen owns the collapsed and expanded tick-ring state', () => {
  assert.match(home, /const \[orbitExpanded, setOrbitExpanded\] = useState\(false\)/)
  assert.match(home, /expanded=\{orbitExpanded\}/)
  assert.match(home, /onExpandedChange=\{setOrbitExpanded\}/)
  assert.match(home, /orbitExpanded \? '滑动刻度环，看看还有哪些感受' : '点击星球，展开情绪'/)
})

test('the active planet toggles a text-only orbit without arrow glyphs', async () => {
  const { readFile } = await import('node:fs/promises')
  const carousel = await readFile(carouselUrl, 'utf8')

  assert.match(carousel, /expanded: boolean/)
  assert.match(carousel, /onExpandedChange: \(expanded: boolean\) => void/)
  assert.match(carousel, /className="mood-orbit-toggle"/)
  assert.match(carousel, /aria-expanded=\{expanded\}/)
  assert.match(carousel, /className="mood-orbit-texts"/)
  assert.match(carousel, /moodOrbitTextPose/)
  assert.match(carousel, /moodTickAngle/)
  assert.match(carousel, /moodTickOpacity/)
  assert.doesNotMatch(home, /<span aria-hidden="true">[‹›]<\/span>/)
})

test('keyboard focus follows the circular mood dial instead of drawing a square browser outline', () => {
  assert.match(css, /\.echo-feel-dial:focus-visible\s*\{[^}]*outline:\s*none/s)
  assert.match(css, /\.echo-feel-dial:focus-visible \.mood-orbit-steps::before\s*\{[^}]*border-color:[^}]*box-shadow:/s)
})

test('echo mode removes the abrupt bounce transition contract', () => {
  const combined = `${home}\n${css}`
  for (const forbidden of [
    'echo-orb-drop',
    'echo-orb-bounce',
    'ECHO_MOOD_IMPACT_MS',
    'ECHO_MOOD_BOUNCE_MS',
    'MoodPeek',
  ]) {
    assert.doesNotMatch(combined, new RegExp(forbidden))
  }
  assert.match(css, /520ms cubic-bezier\(0\.22, 0\.72, 0\.18, 1\)/)
})

test('mobile scrolling stays vertical and the single-orb lane does not widen the page', () => {
  assert.match(css, /\.screen-scroll\s*\{[^}]*overflow-x:\s*hidden;[^}]*overscroll-behavior-x:\s*none;/s)
  assert.match(css, /\.mood-orbit-lane\s*\{[^}]*inset:\s*-120px 0;/s)
})

test('the echo confirmation is a short tactile frosted-glass control', () => {
  assert.match(
    css,
    /\.screen--echo-void \.echo-confirm\s*\{[^}]*align-self:\s*center;[^}]*width:\s*min\(52vw, 260px\);[^}]*backdrop-filter:\s*blur\(22px\) saturate\(150%\);/s,
  )
  assert.match(css, /\.screen--echo-void \.echo-confirm::after\s*\{/)
  assert.match(
    css,
    /\.screen--echo-void \.echo-confirm:active\s*\{[^}]*transform:\s*translateY\(1px\) scale\(0\.965\);[^}]*backdrop-filter:\s*blur\(28px\) saturate\(175%\);/s,
  )
})

test('the glass filter is declared once so the production pipeline can preserve the standard property', () => {
  const restingRule = css.match(/\.screen--echo-void \.echo-confirm\s*\{([^}]*)\}/s)?.[1] ?? ''
  const activeRule = css.match(/\.screen--echo-void \.echo-confirm:active\s*\{([^}]*)\}/s)?.[1] ?? ''

  assert.match(restingRule, /backdrop-filter:\s*blur\(22px\) saturate\(150%\);/)
  assert.match(activeRule, /backdrop-filter:\s*blur\(28px\) saturate\(175%\);/)
  assert.doesNotMatch(restingRule, /-webkit-backdrop-filter\s*:/)
  assert.doesNotMatch(activeRule, /-webkit-backdrop-filter\s*:/)
})

test('the old bottom dot row becomes a close-fitting radial tick ring', () => {
  assert.match(css, /\.mood-orbit-steps\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*pointer-events:\s*none;/s)
  assert.match(css, /\.mood-orbit-step\s*\{[^}]*left:\s*50%;[^}]*top:\s*50%;[^}]*width:\s*28px;[^}]*height:\s*28px;/s)
  assert.match(css, /\.mood-orbit-step::before\s*\{[^}]*width:\s*1px;[^}]*height:\s*13px;[^}]*border-radius:\s*999px;/s)
  assert.match(css, /\.mood-orbit-step\[data-active\]::before\s*\{[^}]*height:\s*22px;[^}]*background:\s*rgba\(246, 247, 250, 0\.96\);/s)
  assert.doesNotMatch(css, /grid-template-columns:\s*repeat\(15, 1fr\)/)
})

test('the planet hit target and nearby mood words use restrained crossfade styling', () => {
  assert.match(css, /\.mood-orbit-toggle\s*\{[^}]*width:\s*210px;[^}]*height:\s*210px;[^}]*pointer-events:\s*auto;/s)
  assert.match(css, /\.mood-orbit-texts\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;[^}]*pointer-events:\s*none;/s)
  assert.match(css, /\.mood-orbit-text\s*\{[^}]*font-family:\s*var\(--serif\);[^}]*transition:[^}]*opacity 320ms/s)
  assert.match(css, /\.mood-orbit-text\[data-active\]\s*\{[^}]*font-size:\s*28px;/s)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mood-orbit-text/s)
})

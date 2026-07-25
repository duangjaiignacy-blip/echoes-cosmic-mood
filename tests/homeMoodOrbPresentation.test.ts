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
  assert.match(carousel, /const ORB_VIEWPORT_SIZE = 348/)
})

test('keyboard focus follows the circular mood dial instead of drawing a square browser outline', () => {
  assert.match(css, /\.echo-feel-dial:focus-visible\s*\{[^}]*outline:\s*none/s)
  assert.match(css, /\.echo-feel-dial:focus-visible \.dial-ring\s*\{[^}]*filter:\s*drop-shadow/s)
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

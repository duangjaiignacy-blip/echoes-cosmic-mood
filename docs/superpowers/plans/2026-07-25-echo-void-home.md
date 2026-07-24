# Echo Void Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved black-silver Echoes home demo with a small high-gravity vortex, integrated moon-silver controls, horizontal mood swiping, and vertical orb-bounce feedback while leaving the default URL unchanged.

**Architecture:** Pure helpers classify gestures and wrap seven mood levels; a small React hook converts pointer movement into one committed swipe. `Home` receives an `echoVoid` variant flag from `App`, using the new gesture and bounce state only in demo mode. Existing raw WebGL renderers remain responsible for the background and orb, while scoped CSS supplies typography, layout, fallback visuals, and reduced-motion behavior.

**Tech Stack:** React 19, TypeScript 6, Vite 8, native WebGL 1.0 / GLSL ES 1.00, Node 22 test runner, Playwright CLI.

---

## File structure

- Create `src/components/moodSwipeModel.ts`: deterministic horizontal gesture classification and cyclic mood stepping.
- Create `src/lib/useMoodSwipe.ts`: pointer lifecycle that emits at most one switch per drag.
- Create `tests/moodSwipeModel.test.ts`: pure gesture and transition tests.
- Modify `src/components/moodOrbModel.ts`: add moon-silver demo palettes.
- Modify `tests/moodOrbModel.test.ts`: lock demo palette output.
- Modify `src/components/MoodOrb.tsx`: accept a `tone` variant.
- Modify `src/components/blackHoleGalaxyShader.ts`: replace the large disk with dense deep stars and a fixed tiny vortex.
- Modify `tests/blackHoleGalaxyShader.test.ts`: lock the new shader stages and size constants.
- Modify `src/pages/Home.tsx`: gate swipe/bounce layout behind `echoVoid`.
- Modify `src/App.tsx`: pass the demo flag to `Home`.
- Modify `src/index.css`: scoped typography, layout, button, swipe, bounce, and fallback styling.

### Task 1: Add deterministic mood-swipe behavior

**Files:**
- Create: `tests/moodSwipeModel.test.ts`
- Create: `src/components/moodSwipeModel.ts`
- Create: `src/lib/useMoodSwipe.ts`

- [ ] **Step 1: Write the failing model tests**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ECHO_MOOD_BOUNCE_MS,
  ECHO_MOOD_IMPACT_MS,
  classifyMoodSwipe,
  stepMoodLevel,
} from '../src/components/moodSwipeModel.ts'

test('horizontal swipes dominate vertical movement and map to mood direction', () => {
  assert.equal(classifyMoodSwipe(-60, 8), 1)
  assert.equal(classifyMoodSwipe(60, 8), -1)
  assert.equal(classifyMoodSwipe(30, 2), 0)
  assert.equal(classifyMoodSwipe(60, 58), 0)
})

test('mood levels wrap through all seven options one step at a time', () => {
  assert.equal(stepMoodLevel(0, 1), 1)
  assert.equal(stepMoodLevel(0, -1), -1)
  assert.equal(stepMoodLevel(3, 1), -3)
  assert.equal(stepMoodLevel(-3, -1), 3)
})

test('bounce timing changes the label at impact before the animation ends', () => {
  assert.equal(ECHO_MOOD_IMPACT_MS, 140)
  assert.equal(ECHO_MOOD_BOUNCE_MS, 480)
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/moodSwipeModel.test.ts`.

Expected: `ERR_MODULE_NOT_FOUND` for `moodSwipeModel.ts`.

- [ ] **Step 3: Implement the pure model**

```ts
export type MoodSwipeDirection = -1 | 1

export const ECHO_MOOD_IMPACT_MS = 140
export const ECHO_MOOD_BOUNCE_MS = 480

export function classifyMoodSwipe(
  deltaX: number,
  deltaY: number,
  threshold = 42,
): MoodSwipeDirection | 0 {
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return 0
  return deltaX < 0 ? 1 : -1
}

export function stepMoodLevel(current: number, direction: MoodSwipeDirection): number {
  const normalized = Math.max(-3, Math.min(3, Math.round(current)))
  if (direction === 1 && normalized === 3) return -3
  if (direction === -1 && normalized === -3) return 3
  return normalized + direction
}
```

- [ ] **Step 4: Verify GREEN**

Run `node --test tests/moodSwipeModel.test.ts && npm test`.

Expected: the focused tests and full suite pass.

- [ ] **Step 5: Implement the pointer hook**

```ts
import { useEffect, useRef } from 'react'
import { classifyMoodSwipe, type MoodSwipeDirection } from '../components/moodSwipeModel'

export function useMoodSwipe(onSwipe: (direction: MoodSwipeDirection) => void, disabled = false) {
  const ref = useRef<HTMLDivElement>(null)
  const onSwipeRef = useRef(onSwipe)
  onSwipeRef.current = onSwipe

  useEffect(() => {
    const element = ref.current
    if (!element || disabled) return
    let startX = 0
    let startY = 0
    let tracking = false
    let committed = false

    const down = (event: PointerEvent) => {
      tracking = true
      committed = false
      startX = event.clientX
      startY = event.clientY
      element.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (!tracking || committed) return
      const direction = classifyMoodSwipe(event.clientX - startX, event.clientY - startY)
      if (!direction) return
      committed = true
      onSwipeRef.current(direction)
    }
    const end = (event: PointerEvent) => {
      tracking = false
      try { element.releasePointerCapture(event.pointerId) } catch { /* noop */ }
    }

    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', end)
    element.addEventListener('pointercancel', end)
    return () => {
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', end)
      element.removeEventListener('pointercancel', end)
    }
  }, [disabled])

  return ref
}
```

- [ ] **Step 6: Build and commit**

Run `npm run build && npm run lint`.

```bash
git add src/components/moodSwipeModel.ts src/lib/useMoodSwipe.ts tests/moodSwipeModel.test.ts
git commit -m "feat: add horizontal mood swipe model"
```

### Task 2: Replace the large black hole with a tiny echo vortex

**Files:**
- Modify: `tests/blackHoleGalaxyShader.test.ts`
- Modify: `src/components/blackHoleGalaxyShader.ts`

- [ ] **Step 1: Replace the old shape contract with failing tiny-vortex assertions**

```ts
test('fragment shader builds the approved deep starfield and tiny echo vortex', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float layeredStarField/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float tinyVortex/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float echoStream/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float VORTEX_CORE_RADIUS = 0\.018/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec2 vortexCenter = vec2\(0\.0, 0\.52\)/)
})

test('pointer repulsion affects stars without moving the vortex center', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /layeredStarField\(repelPointer/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /tinyVortex\(uv - vortexCenter/)
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/blackHoleGalaxyShader.test.ts`.

Expected: assertions fail because the old large event horizon and disk are still present.

- [ ] **Step 3: Implement the new shader stages**

Keep the existing public uniforms, noise helpers, hue helper, and pointer helper. Add these constants/functions and compose them in `main`:

```glsl
const float VORTEX_CORE_RADIUS = 0.018;

float layeredStarField(vec2 uv) {
  float cluster = 0.28 + fbm(uv * 2.4) * 0.92;
  float stars = starLayer(uv, 72.0, 2.7);
  stars += starLayer(uv + vec2(0.13, -0.21), 146.0, 19.4) * 0.68;
  stars += starLayer(uv - vec2(0.31, 0.07), 238.0, 41.2) * 0.34;
  return stars * cluster;
}

float tinyVortex(vec2 point) {
  vec2 disk = rotate2d(-0.24) * point;
  vec2 ellipse = vec2(disk.x, disk.y / 0.42);
  float radius = length(ellipse);
  float angle = atan(ellipse.y, ellipse.x);
  float core = 1.0 - smoothstep(VORTEX_CORE_RADIUS, VORTEX_CORE_RADIUS * 1.65, length(point));
  float rim = exp(-abs(radius - 0.036) * 115.0);
  float filaments = pow(0.5 + 0.5 * sin(angle * 7.0 + radius * 190.0 - uTime * uSpeed), 11.0);
  float diskMask = smoothstep(0.022, 0.035, radius) * (1.0 - smoothstep(0.12, 0.165, radius));
  return rim * 1.3 + diskMask * (0.12 + filaments * 0.86) - core;
}

float echoStream(vec2 point) {
  vec2 direction = normalize(vec2(-0.96, 0.28));
  vec2 normal = vec2(-direction.y, direction.x);
  float along = dot(point, direction);
  float across = abs(dot(point, normal));
  float width = 0.018 + abs(along) * 0.095;
  float body = 1.0 - smoothstep(width * 0.25, width, across);
  float fade = 1.0 - smoothstep(0.08, 0.7, abs(along));
  float dust = smoothstep(0.48, 0.8, fbm(point * 31.0 - uTime * 0.08));
  return body * fade * dust;
}
```

In `main`, use a fixed `vec2 vortexCenter = vec2(0.0, 0.52);`, call `layeredStarField(repelPointer(uv, pointer))`, and call `tinyVortex(uv - vortexCenter)` / `echoStream(uv - vortexCenter)` with the unmodified `uv`. Output monochrome graphite/silver with the supplied hue only as a 6% tint.

- [ ] **Step 4: Verify and commit**

Run `npm test && npm run build && npm run lint`.

```bash
git add src/components/blackHoleGalaxyShader.ts tests/blackHoleGalaxyShader.test.ts
git commit -m "feat: render deep stars and tiny echo vortex"
```

### Task 3: Add moon-silver orb colors

**Files:**
- Modify: `tests/moodOrbModel.test.ts`
- Modify: `src/components/moodOrbModel.ts`
- Modify: `src/components/MoodOrb.tsx`

- [ ] **Step 1: Write the failing palette test**

```ts
import { echoMoodColorsF } from '../src/components/moodOrbModel.ts'

test('echoMoodColorsF keeps every mood inside the moon-silver violet-gray family', () => {
  assert.deepEqual(echoMoodColorsF(0), ['#737786', '#272b34', '#c6cad4'])
  assert.deepEqual(echoMoodColorsF(0.5), ['#797884', '#2b2c34', '#cbc8d0'])
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/moodOrbModel.test.ts`.

Expected: import failure because `echoMoodColorsF` does not exist.

- [ ] **Step 3: Add and consume the palette**

Add an `ECHO_PALETTES` record with seven graphite/silver palettes and export `echoMoodColorsF` using the existing interpolation helper. Add `tone?: 'default' | 'echo'` to `MoodOrb`; select `echoMoodColorsF` only when `tone === 'echo'`.

Use these exact neutral values around level zero:

```ts
const ECHO_PALETTES: Record<number, MoodPalette> = {
  [-3]: ['#555e70', '#1b2029', '#aeb8ca'],
  [-2]: ['#626a78', '#20252e', '#b8c0ce'],
  [-1]: ['#6b7180', '#242932', '#c0c6d1'],
  [0]: ['#737786', '#272b34', '#c6cad4'],
  [1]: ['#7f7982', '#2f2d34', '#d0c6cc'],
  [2]: ['#8d7f87', '#383039', '#dacbd1'],
  [3]: ['#9b858a', '#41343c', '#e2d0d3'],
}
```

- [ ] **Step 4: Verify and commit**

Run `npm test && npm run build && npm run lint`.

```bash
git add src/components/moodOrbModel.ts src/components/MoodOrb.tsx tests/moodOrbModel.test.ts
git commit -m "feat: add moon silver echo orb palette"
```

### Task 4: Integrate the approved home layout and bounce interaction

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Verify browser RED states**

Open the default URL and demo URL in owned Playwright session `echo-void-home-20260725-root`. Assert the demo is missing `.screen--echo-void`, `[data-mood-swipe]`, and `.echo-swipe-hint`, while default still has its rotary hint.

- [ ] **Step 2: Pass the isolated variant**

Change `Home` props to include `echoVoid?: boolean`, and render it from `App` as:

```tsx
<Home
  echoVoid={BLACK_HOLE_DEMO}
  entryCount={entries.length}
  onTimeline={() => go({ name: 'timeline' })}
  onNext={(mood) => {
    setDraft({ ...EMPTY_DRAFT, mood })
    go({ name: 'classify' })
  }}
/>
```

- [ ] **Step 3: Add the swipe transition to `Home`**

Keep the default rotary callback unchanged. Add `transitioning`, `bounceDirection`, and timer cleanup. On an accepted swipe, set the bounce class immediately, update `angle` to `stepMoodLevel(level, direction) * 90` after `ECHO_MOOD_IMPACT_MS`, vibrate for 8ms, and clear the animation after `ECHO_MOOD_BOUNCE_MS`. Ignore submissions while transitioning.

Attach `ref={echoVoid ? moodSwipe : feelDial}` to the first-step dial. In echo mode render:

```tsx
<div className="echo-mood-label" aria-live="polite">
  <span aria-hidden="true">‹</span>
  <span>{VALENCE_TEXT[level]}</span>
  <span aria-hidden="true">›</span>
</div>
<div className="dial-hint echo-swipe-hint">
  左右滑动，切换此刻的感受
</div>
```

Pass `tone={echoVoid ? 'echo' : 'default'}` to the first-step `MoodOrb`. Hide the rotating dot only in echo mode. Apply `screen--echo-void`, `echo-feel-title`, `echo-feel-dial`, `echo-orb-bounce`, and `echo-confirm` classes without changing the word-selection branch.

- [ ] **Step 4: Add scoped CSS**

Add rules scoped under `.screen--echo-void`:

```css
.screen--echo-void {
  --echo-silver: rgba(224, 226, 232, 0.88);
  color: var(--echo-silver);
}

.screen--echo-void .eyebrow { font-size: 10px; opacity: 0.68; }
.screen--echo-void .back-link { font-size: 11px; opacity: 0.7; }
.echo-feel-title {
  font-size: clamp(31px, 7.6vw, 40px);
  line-height: 1.32;
  color: rgba(232, 233, 238, 0.92);
  white-space: nowrap;
}
.echo-feel-dial { margin-top: 88px !important; }
.screen--echo-void .dial-ring { opacity: 0.5; }
.screen--echo-void .dial-dot { display: none; }
.echo-mood-label {
  display: grid;
  grid-template-columns: 26px minmax(100px, auto) 26px;
  justify-content: center;
  align-items: center;
  gap: 16px;
  font-family: var(--serif);
  font-size: 30px;
  color: rgba(214, 216, 223, 0.78);
}
.echo-mood-label > :first-child,
.echo-mood-label > :last-child { font-size: 22px; opacity: 0.55; }
.echo-swipe-hint { margin-top: 14px; margin-bottom: 0; font-size: 12px; }
.echo-confirm { margin-top: 46px; }
.screen--echo-void .btn-primary {
  background: linear-gradient(135deg, rgba(70, 73, 84, 0.36), rgba(36, 37, 45, 0.58));
  border-color: rgba(218, 222, 232, 0.42);
  box-shadow: inset 0 1px rgba(255,255,255,0.18), 0 12px 34px rgba(0,0,0,0.42);
}
.echo-orb-bounce.is-bouncing {
  animation: echo-orb-drop 480ms cubic-bezier(0.3, 0.8, 0.25, 1);
}
@keyframes echo-orb-drop {
  0% { transform: translateY(0) scale(1); }
  29% { transform: translateY(18px) scale(1.025, 0.965); }
  62% { transform: translateY(-5px) scale(0.99, 1.015); }
  100% { transform: translateY(0) scale(1); }
}
```

Under reduced motion, replace the bounce animation with a 160ms opacity transition and no transform.

- [ ] **Step 5: Verify browser GREEN and commit**

Verify default remains rotary. In demo mode, drag left/right at least 60px and assert one level change, one bounce animation, the swipe hint, larger title, smoked CTA, and continued CTA navigation.

Run `npm test && npm run build && npm run lint`.

```bash
git add src/App.tsx src/pages/Home.tsx src/index.css
git commit -m "feat: add echo void home interaction"
```

### Task 5: Visual tuning and final delivery

**Files:**
- Potential tuning: `src/components/blackHoleGalaxyShader.ts`
- Potential tuning: `src/index.css`

- [ ] Capture and inspect 445×805 and 1280×900 demo screenshots at original resolution.
- [ ] Confirm the title is single-line and visually larger without touching the top navigation.
- [ ] Confirm the vortex silver footprint is 16–18% of viewport width while the black core is 2–3%.
- [ ] Confirm star density has quiet voids and clustered depth rather than a uniform field.
- [ ] Confirm orb and button use graphite/silver with only restrained violet reflection.
- [ ] Verify one left swipe and one right swipe each change exactly one mood; verify the orb returns to its original bounding box after 480ms.
- [ ] Emulate reduced motion and confirm no orb translation occurs.
- [ ] Dispatch `webglcontextlost` and verify fallback plus enabled CTA.
- [ ] Verify the default URL still has Aurora, Starfield, rotary hint, and no echo-void classes.
- [ ] Run `npm test`, `npm run build`, `npm run lint`, `git diff --check`, and `git status --short`.
- [ ] Commit source/test tuning only; close the owned Playwright session; verify session absence and run Browser Guardian status.
- [ ] Leave the development servers running and report `http://localhost:5173/?bgDemo=black-hole`.

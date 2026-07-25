# Latest Mood Swipe and Starfield Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the latest Milo circular mood chooser directly draggable from the planet or ring with strong restrained feedback, enlarge the interactive stars, and remove the WebGL vortex.

**Architecture:** Keep the current 15-item circular mood model and WebGL renderer. Separate input sensitivity from visual travel in `moodSwipeModel`, lock each pointer gesture to one axis in `useMoodSwipe`, whitelist the central planet button as a drag surface, and simplify the existing shader to a larger multi-scale starfield with no vortex stages.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Node test runner, native Pointer Events, WebGL 1 / GLSL ES 1.00, Playwright CLI.

---

## File structure

- Modify `src/components/moodSwipeModel.ts`: input threshold, drag-axis helpers, drag-surface descriptors, and independent visual travel.
- Modify `src/lib/useMoodSwipe.ts`: axis locking and axis-aware velocity sampling.
- Modify `src/components/MoodOrbitCarousel.tsx`: central planet drag surface and per-mood feedback remount.
- Modify `src/index.css`: stronger planet/tick feedback, reduced-motion handling, star-only CSS fallback.
- Modify `src/components/blackHoleGalaxyShader.ts`: larger stars, stronger pointer displacement, no vortex/stream/core.
- Modify `src/components/blackHoleGalaxyRenderer.ts`: clear interaction on pointer end/cancel.
- Modify the four corresponding test files before production code.

### Task 1: Make swipe math immediate and axis-aware

**Files:**
- Modify: `tests/moodSwipeModel.test.ts`
- Modify: `src/components/moodSwipeModel.ts`

- [ ] **Step 1: Write failing model tests**

Add imports and contracts for the new sensitivity, axis lock, whitelisted planet surface, and visual travel:

```ts
test('short horizontal and vertical swipes move after the axis locks', () => {
  assert.equal(ECHO_MOOD_STEP_PX, 28)
  assert.equal(ECHO_MOOD_AXIS_LOCK_PX, 6)
  assert.equal(chooseMoodDragAxis(5, 1), null)
  assert.equal(chooseMoodDragAxis(-14, 4), 'x')
  assert.equal(chooseMoodDragAxis(3, -14), 'y')
  assert.equal(moodPositionFromDrag(3, -56, 0, 28, 'x'), 5)
  assert.equal(moodPositionFromDrag(3, 0, -56, 28, 'y'), 5)
})

test('the planet button is a drag surface while mood controls stay click-first', () => {
  assert.equal(isMoodDragStartAllowed([
    { tagName: 'SPAN' },
    { tagName: 'BUTTON', allowsMoodDrag: true },
  ]), true)
  assert.equal(isMoodDragStartAllowed([{ tagName: 'SPAN' }, { tagName: 'BUTTON' }]), false)
})

test('visual travel is independent from the short input threshold', () => {
  assert.equal(ECHO_MOOD_ORBIT_TRAVEL_PX, 116)
  const pose = orbitalMoodPose(4, 3.5, 15)
  assert.equal(pose.x, 58)
  assert.equal(pose.y, 5)
  assert.equal(pose.scale, 0.93)
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/moodSwipeModel.test.ts`.

Expected: FAIL because the new constants/helper/descriptor and axis parameter do not exist.

- [ ] **Step 3: Implement the minimal model**

Add these contracts to `moodSwipeModel.ts`:

```ts
export type MoodDragAxis = 'x' | 'y'
export const ECHO_MOOD_STEP_PX = 28
export const ECHO_MOOD_AXIS_LOCK_PX = 6
export const ECHO_MOOD_ORBIT_TRAVEL_PX = 116

export function chooseMoodDragAxis(
  deltaX: number,
  deltaY: number,
  lockPx = ECHO_MOOD_AXIS_LOCK_PX,
): MoodDragAxis | null {
  if (Math.hypot(deltaX, deltaY) < lockPx) return null
  return Math.abs(deltaX) >= Math.abs(deltaY) ? 'x' : 'y'
}

export function isMoodDragStartAllowed(path: readonly MoodDragTargetDescriptor[]): boolean {
  if (path.some((target) => target.allowsMoodDrag === true)) return true
  return !path.some((target) => (
    target.isContentEditable === true
    || (target.tagName ? INTERACTIVE_MOOD_TAGS.has(target.tagName.toLowerCase()) : false)
  ))
}

export function moodPositionFromDrag(
  startPosition: number,
  deltaX: number,
  deltaY: number,
  stepPx = ECHO_MOOD_STEP_PX,
  axis: MoodDragAxis | null = chooseMoodDragAxis(deltaX, deltaY),
): number {
  if (!axis || stepPx <= 0) return startPosition
  return startPosition - (axis === 'x' ? deltaX : deltaY) / stepPx
}
```

Add `allowsMoodDrag?: boolean` to `MoodDragTargetDescriptor`, and update the active pose:

```ts
return {
  visible: true,
  x: distance * ECHO_MOOD_ORBIT_TRAVEL_PX,
  y: absoluteDistance * 10,
  scale: 1 - absoluteDistance * 0.14,
  opacity: 1,
  zIndex: 30,
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run `node --test tests/moodSwipeModel.test.ts`, then commit only the model and its test with `feat: make mood swipe direct and axis aware`.

### Task 2: Enable planet dragging and stronger feedback

**Files:**
- Modify: `tests/homeMoodOrbPresentation.test.ts`
- Modify: `src/lib/useMoodSwipe.ts`
- Modify: `src/components/MoodOrbitCarousel.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing presentation tests**

```ts
test('the visible planet remains clickable and becomes a drag surface', async () => {
  const carousel = await readFile(carouselUrl, 'utf8')
  assert.match(carousel, /data-mood-drag-surface="true"/)
  assert.match(carousel, /key=\{activeMood\.id\}/)
  assert.doesNotMatch(carousel, /const revealOrbit = \(event:[\s\S]*event\.stopPropagation\(\)/)
})

test('dragging visibly energizes the planet and rigid tick ring', () => {
  assert.match(css, /@keyframes echo-mood-impact/)
  assert.match(css, /\.mood-orbit-item > span\s*\{[^}]*animation:\s*echo-mood-impact/s)
  assert.match(css, /\.mood-orbit-carousel\.is-dragging \.mood-orbit-steps::before\s*\{[^}]*transform:\s*scale\(1\.025\)/s)
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/homeMoodOrbPresentation.test.ts`.

Expected: the drag-surface, keyed impact, and CSS assertions FAIL.

- [ ] **Step 3: Lock pointer input to one axis**

In `useMoodSwipe.ts`, import `chooseMoodDragAxis` and `MoodDragAxis`; store samples as `{ x, y, time }`; reset `axis` on pointer down; choose it after movement exceeds 6px; and pass it into `moodPositionFromDrag`:

```ts
let axis: MoodDragAxis | null = null

const move = (event: PointerEvent) => {
  if (event.pointerId !== activePointerId) return
  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY
  axis ??= chooseMoodDragAxis(deltaX, deltaY)
  livePosition = moodPositionFromDrag(startPosition, deltaX, deltaY, stepPx, axis)
  remember(event.clientX, event.clientY, event.timeStamp)
  onPositionChangeRef.current(livePosition, 'dragging')
}
```

At release, use Y velocity when `axis === 'y'`, otherwise X velocity. Include this descriptor field when mapping `composedPath()`:

```ts
allowsMoodDrag: target.dataset.moodDragSurface === 'true',
```

- [ ] **Step 4: Make the planet surface draggable**

In `MoodOrbitCarousel.tsx`, use `pose.y`, key the item by `activeMood.id`, mark `.mood-orbit-toggle` with `data-mood-drag-surface="true"`, and change `revealOrbit` to call `onExpandedChange(true)` without `stopPropagation`. Keep `stopDrag` on mood text and tick buttons.

- [ ] **Step 5: Add restrained visible feedback**

Add:

```css
.mood-orbit-item > span {
  animation: echo-mood-impact 360ms cubic-bezier(0.2, 0.86, 0.2, 1) both;
  transform-origin: center;
}

@keyframes echo-mood-impact {
  0% { transform: scale(0.94); filter: brightness(1.38) saturate(1.08); }
  48% { transform: scale(1.075); filter: brightness(1.2) saturate(1.04); }
  100% { transform: scale(1); filter: none; }
}

.mood-orbit-carousel.is-dragging .mood-orbit-steps::before {
  transform: scale(1.025);
  border-color: rgba(232, 236, 246, 0.34);
  box-shadow: inset 0 0 28px rgba(210, 217, 239, 0.075), 0 0 30px rgba(202, 211, 239, 0.08);
}
```

Add `transform` to the base tick-ring transition and disable both effects in the existing reduced-motion block.

- [ ] **Step 6: Verify and commit**

Run the two mood tests, `npm run build`, and `npm run lint`. Commit only the scoped hook/carousel/CSS/test files with `feat: strengthen mood dial drag feedback`.

### Task 3: Enlarge stars and remove the vortex

**Files:**
- Modify: `tests/blackHoleGalaxyShader.test.ts`
- Modify: `tests/blackHoleGalaxyRenderer.test.ts`
- Modify: `src/components/blackHoleGalaxyShader.ts`
- Modify: `src/components/blackHoleGalaxyRenderer.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Write failing shader and renderer tests**

Replace the vortex contracts with:

```ts
test('shader renders a layered starfield without vortex stages', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float layeredStarField/)
  for (const removed of ['tinyVortex', 'spiralDust', 'echoStream', 'vortexCenter', 'VORTEX_CORE_RADIUS']) {
    assert.doesNotMatch(BLACK_HOLE_FRAGMENT_SHADER, new RegExp(removed))
  }
})

test('stars use a larger core and restrained halo', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float STAR_SIZE_GAIN = 1\.65/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float starCore/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float starHalo/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float POINTER_REPULSION_SCALE = 0\.055/)
})
```

Add a renderer source contract that requires paired `addEventListener` and `removeEventListener` calls for `pointerup` and `pointercancel` using `pointerEnd`.

- [ ] **Step 2: Verify RED**

Run `node --test tests/blackHoleGalaxyShader.test.ts tests/blackHoleGalaxyRenderer.test.ts`.

Expected: FAIL because the vortex still exists and the star/pointer constants and end listeners are absent.

- [ ] **Step 3: Enlarge stars and pointer response**

Replace the vortex core constant with:

```glsl
const float STAR_SIZE_GAIN = 1.65;
const float POINTER_REPULSION_SCALE = 0.055;
```

Use `POINTER_REPULSION_SCALE` inside `repelPointer`. Replace the star core with:

```glsl
float radius = mix(radiusRange.x, radiusRange.y, seed) * STAR_SIZE_GAIN;
float starCore = 1.0 - smoothstep(radius * 0.24, radius * 0.78, distanceToStar);
float starHalo = 1.0 - smoothstep(radius * 0.62, radius * 2.25, distanceToStar);
float star = starCore + starHalo * 0.22;
```

- [ ] **Step 4: Remove all vortex stages**

Delete `tinyVortex`, `spiralDust`, and `echoStream`. Replace the bottom of `main` after computing `stars` with:

```glsl
vec3 coldTint = hueColor(fract(uHueShift / 360.0));
vec3 silver = mix(vec3(0.82, 0.85, 0.91), coldTint, uSaturation * 0.08);
vec3 color = silver * stars * (0.82 + uGlowIntensity * 0.88);
float alpha = clamp(max(max(color.r, color.g), color.b) * 1.38, 0.0, 1.0);
gl_FragColor = vec4(color, alpha);
```

- [ ] **Step 5: Release interaction and simplify fallback**

Add `pointerEnd()` to set `pointerActiveTarget = 0`, then register and remove it for `pointerup` and `pointercancel`. Replace the CSS fallback with three larger radial-gradient star layers over black and no central black-hole gradients.

- [ ] **Step 6: Verify and commit**

Run the two background tests, build, and lint. Commit only shader/renderer/CSS/background-test files with `feat: replace vortex with larger interactive stars`.

### Task 4: Verify latest-version behavior

**Files:** Verify only. Preserve user-owned `index.html`, `src/pages/Home.tsx`, `tests/backgroundAsset.test.ts`, and `tests/brandName.test.ts`.

- [ ] **Step 1: Run all tracked tests**

Run `node --test $(git ls-files 'tests/*.test.ts')`.

Expected: all tracked tests PASS. The pre-existing untracked static-asset test is intentionally outside this command because it conflicts with the approved dynamic WebGL background.

- [ ] **Step 2: Run full checks and record external failures**

Run:

```bash
npm test
npm run build
npm run lint
git diff --check
```

Expected: build, lint, and diff check exit 0. If `npm test` fails only on preserved `backgroundAsset.test.ts`, report that exact external failure without changing the file.

- [ ] **Step 3: Verify in one owned browser session**

Using the Playwright skill, create only `milo-swipe-stars-20260725`, open `http://127.0.0.1:<vite-port>/?bgDemo=black-hole` at 445×805, and verify:

- Center-planet mouse drag and touch drag change the mood.
- A 28–56px horizontal or vertical drag crosses one or two moods.
- Tap-to-expand, direct mood click, and arrow keys still work.
- Planet translation/scale and tick-ring feedback are obvious during drag.
- No vortex, stream, spiral, or dark core remains.
- Multi-scale stars are visibly larger and pointer displacement releases after pointer end.

- [ ] **Step 4: Clean up and inspect the final scope**

Close only `milo-swipe-stars-20260725`; verify it is absent from `playwright-cli --json list --all`; run Browser Guardian status; then run `git status --short` and `git diff --check`. Confirm the two Milo brand edits and both pre-existing untracked tests remain untouched.

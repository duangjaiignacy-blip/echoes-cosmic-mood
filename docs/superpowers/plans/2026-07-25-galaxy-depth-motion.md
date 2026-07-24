# Galaxy Depth Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the supplied React Bits Galaxy-style depth cycling, ambient rotation, deterministic star drift, and smooth interaction to the existing six-layer Echo Void starfield without adding OGL or another canvas.

**Architecture:** Extend only the existing fragment shader. A reusable animated-layer wrapper phases six star populations through a slow zoom/fade cycle, `starLayer` adds seeded sub-cell drift, and `main` rotates a star-only coordinate before pointer repulsion while the vortex continues to use unmodified coordinates.

**Tech Stack:** TypeScript 6, GLSL ES 1.00 / WebGL 1.0, Node 22 test runner, Vite 8, Playwright CLI.

---

## File structure

- Modify `tests/blackHoleGalaxyShader.test.ts`: replace the static six-call contract with an animated six-call contract and lock the depth, drift, rotation, and vortex-isolation stages.
- Modify `src/components/blackHoleGalaxyShader.ts`: add phased layer motion, per-star drift, and a star-only rotation coordinate.
- No dependencies, renderer API, React components, CSS, layout, or default-background files change.

### Task 1: Add motion-specific shader contracts

**Files:**
- Modify: `tests/blackHoleGalaxyShader.test.ts`
- Test: `tests/blackHoleGalaxyShader.test.ts`

- [ ] **Step 1: Update the six-layer contract to count animated calls**

Replace the existing call-count lines with:

```ts
const layerCalls = (BLACK_HOLE_FRAGMENT_SHADER.match(/animatedStarLayer\(/g) ?? []).length - 1
assert.equal(layerCalls, 6)
```

The subtraction excludes the `animatedStarLayer` function definition.

- [ ] **Step 2: Add the failing depth and rotation test**

Append:

```ts
test('star layers cycle through restrained depth and ambient rotation', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float galaxyDepth/)
  assert.match(
    BLACK_HOLE_FRAGMENT_SHADER,
    /fract\(phase \+ uTime \* uStarSpeed \* uSpeed \* 0\.022\)/,
  )
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /mix\(0\.84, 1\.24, depth\)/)
  assert.match(
    BLACK_HOLE_FRAGMENT_SHADER,
    /float starRotation = uTime \* uRotationSpeed \* 0\.18/,
  )
  assert.match(
    BLACK_HOLE_FRAGMENT_SHADER,
    /layeredStarField\(repelPointer\(starUv, pointer\)\)/,
  )
})
```

- [ ] **Step 3: Add the failing drift and vortex-isolation test**

Append:

```ts
test('individual stars drift while the vortex keeps fixed coordinates', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec2 stellarDrift/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /local - offset \* 0\.58 - stellarDrift/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /tinyVortex\(uv - vortexCenter\)/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /spiralDust\(vortexPoint\)/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /echoStream\(vortexPoint\)/)
})
```

- [ ] **Step 4: Verify RED**

Run:

```bash
node --test tests/blackHoleGalaxyShader.test.ts
```

Expected: the animated layer count is `-1` instead of `6`, and the new motion-stage assertions fail because the shader is still static apart from translation and twinkle.

### Task 2: Implement phased Galaxy-style motion

**Files:**
- Modify: `src/components/blackHoleGalaxyShader.ts`
- Test: `tests/blackHoleGalaxyShader.test.ts`

- [ ] **Step 1: Add deterministic per-star drift**

Inside `starLayer`, immediately before `distanceToStar`, add:

```glsl
float driftTime = uTime * uSpeed;
vec2 stellarDrift = vec2(
  sin(driftTime * (0.12 + seed * 0.05) + seed * 19.2),
  cos(driftTime * (0.10 + seed * 0.04) + seed * 23.7)
) * 0.018;
```

Then calculate distance as:

```glsl
float distanceToStar = length(local - offset * 0.58 - stellarDrift);
```

- [ ] **Step 2: Add the depth timing helpers and animated wrapper**

Insert after `starLayer`:

```glsl
float galaxyDepth(float phase) {
  return fract(phase + uTime * uStarSpeed * uSpeed * 0.022);
}

float galaxyDepthFade(float depth) {
  float fadeIn = smoothstep(0.0, 0.14, depth);
  float fadeOut = 1.0 - smoothstep(0.82, 1.0, depth);
  return fadeIn * fadeOut;
}

float animatedStarLayer(
  vec2 uv,
  float scale,
  float layerSeed,
  float population,
  vec2 radiusRange,
  float phase
) {
  float depth = galaxyDepth(phase);
  float zoom = mix(0.84, 1.24, depth);
  float depthGain = mix(0.72, 1.18, depth) * galaxyDepthFade(depth);
  vec2 layerDrift = vec2(
    sin(uTime * uSpeed * 0.055 + layerSeed),
    cos(uTime * uSpeed * 0.043 + layerSeed * 1.37)
  ) * 0.006;
  return starLayer(uv * zoom + layerDrift, scale, layerSeed, population, radiusRange) * depthGain;
}
```

At `starSpeed=0.7` and `speed=1.4`, the `0.022` factor yields a cycle of about 46 seconds.

- [ ] **Step 3: Phase all six existing layers**

Change `microStarDust` to:

```glsl
float microStarDust(vec2 uv) {
  float dust = animatedStarLayer(
    uv + vec2(-0.19, 0.27),
    420.0,
    73.6,
    MICRO_DUST_POPULATION,
    vec2(0.20, 0.38),
    0.0
  ) * 0.20;
  dust += animatedStarLayer(
    uv + vec2(0.37, -0.16),
    332.0,
    91.8,
    MICRO_DUST_POPULATION * 0.82,
    vec2(0.18, 0.34),
    0.5
  ) * 0.24;
  return dust;
}
```

In `layeredStarField`, replace the other four calls with:

```glsl
stars += animatedStarLayer(uv, 214.0, 41.2, 0.105, vec2(0.13, 0.27), 0.1667) * 0.25;
stars += animatedStarLayer(
  uv + vec2(0.13, -0.21),
  132.0,
  19.4,
  0.075,
  vec2(0.10, 0.23),
  0.3333
) * 0.42;
stars += animatedStarLayer(
  uv - vec2(0.31, 0.07),
  72.0,
  7.7,
  0.038,
  vec2(0.07, 0.18),
  0.6667
) * 0.72;
stars += animatedStarLayer(
  uv + vec2(0.08, 0.11),
  34.0,
  2.7,
  0.010,
  vec2(0.045, 0.12),
  0.8333
) * 1.24;
```

- [ ] **Step 4: Rotate only the starfield coordinate**

Replace the translated star coordinate in `main`:

```glsl
float starTime = uTime * uStarSpeed * 0.006;
float stars = layeredStarField(repelPointer(uv + vec2(starTime, -starTime * 0.27), pointer));
```

with:

```glsl
float starRotation = uTime * uRotationSpeed * 0.18;
vec2 starUv = rotate2d(starRotation) * uv;
float stars = layeredStarField(repelPointer(starUv, pointer));
```

Do not change `vortexCenter`, `vortexPoint`, `tinyVortex`, `spiralDust`, or `echoStream` calls.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test tests/blackHoleGalaxyShader.test.ts
npm test
npm run build
```

Expected: the focused suite passes, all 32 project tests pass, and the production build succeeds.

- [ ] **Step 6: Commit the motion implementation**

```bash
git add src/components/blackHoleGalaxyShader.ts tests/blackHoleGalaxyShader.test.ts
git commit -m "feat: add galaxy depth motion"
```

### Task 3: Verify live motion, reduced motion, and visual stability

**Files:**
- Potential evidence-driven tuning: `src/components/blackHoleGalaxyShader.ts`
- Potential contract adjustment after a new RED assertion: `tests/blackHoleGalaxyShader.test.ts`

- [ ] **Step 1: Open one owned Playwright session**

Use `echo-galaxy-motion-20260725-root` and open `http://localhost:5173/?bgDemo=black-hole`. Record this as the only session owned by the task.

- [ ] **Step 2: Prove normal animation changes frames**

At 445×805, take canvas-only screenshots one second apart:

```text
output/playwright/echo-motion-normal-a.png
output/playwright/echo-motion-normal-b.png
```

Run `shasum -a 256` on both files. Expected: different hashes.

- [ ] **Step 3: Prove reduced motion freezes time-driven changes**

Emulate `prefers-reduced-motion: reduce`, reload, wait for the renderer to report `webgl`, and take canvas-only screenshots one second apart:

```text
output/playwright/echo-motion-reduced-a.png
output/playwright/echo-motion-reduced-b.png
```

Expected: identical SHA-256 hashes.

- [ ] **Step 4: Prove pointer repulsion remains active when time is frozen**

With reduced motion still enabled, take one canvas screenshot with the pointer outside the viewport, move the pointer to the center-right of the canvas, wait 500ms for smoothing, and take another screenshot. Expected: different hashes, proving pointer response without time-driven animation.

- [ ] **Step 5: Inspect mobile and desktop compositions**

Capture the complete page at 445×805 and 1280×900. Confirm:

- dense silver star texture remains visible;
- no radial streaks or warp-speed tunnel effect appears;
- the vortex center, orb, title, mood label, hint, and CTA retain their positions;
- normal motion does not introduce blue/purple color or flatten the cluster masks.

- [ ] **Step 6: Verify Demo and default isolation**

Demo evaluation:

```js
({
  background: document.querySelector('[data-black-hole-status]')?.getAttribute('data-black-hole-status'),
  orb: document.querySelector('[data-orb-status]')?.getAttribute('data-orb-status'),
  echo: document.querySelector('.screen--echo-void') !== null,
})
```

Expected: `{ background: 'webgl', orb: 'webgl', echo: true }` with zero console errors.

Default evaluation:

```js
({
  aurora: document.querySelector('.aurora') !== null,
  starfield: document.querySelector('.starfield') !== null,
  blackHole: document.querySelector('.black-hole-galaxy') !== null,
  echo: document.querySelector('.screen--echo-void') !== null,
})
```

Expected: `{ aurora: true, starfield: true, blackHole: false, echo: false }`.

- [ ] **Step 7: Tune only from concrete evidence**

If motion looks too fast, add a failing assertion for a smaller depth or rotation constant before editing. If the density visibly pulses, add a failing assertion for adjusted fade boundaries or depth gains. Do not change vortex functions, foreground UI, renderer settings, or add dependencies.

- [ ] **Step 8: Run final verification and commit any tuning**

```bash
npm test
npm run build
npm run lint
git diff --check
```

Expected: 32 tests pass, build succeeds, lint has no errors (the existing `MoodOrb.tsx` Fast Refresh warning may remain), and there are no whitespace errors.

If tuning changed source or tests:

```bash
git add src/components/blackHoleGalaxyShader.ts tests/blackHoleGalaxyShader.test.ts
git commit -m "refactor: tune galaxy background motion"
```

- [ ] **Step 9: Close and clean the owned browser session**

Close only `echo-galaxy-motion-20260725-root`, verify it is absent from `playwright-cli --json list --all`, run Browser Guardian status, and remove only this task's generated screenshots/logs. Leave the development services running.

### Task 4: Deliver the updated Demo

**Files:**
- No source changes.

- [ ] **Step 1: Confirm repository and Demo state**

```bash
test -z "$(git status --short)"
curl -sS -o /dev/null -w '%{http_code}\n' 'http://localhost:5173/?bgDemo=black-hole'
```

Expected: clean worktree and HTTP `200`.

- [ ] **Step 2: Report exact integration choices**

Report that the React Bits motion mathematics were adapted into the existing WebGL shader, no `ogl` dependency or extra canvas was added, the independent Demo was updated, the default page stayed unchanged, and provide `http://localhost:5173/?bgDemo=black-hole`.

# Dense Silver Starfield Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the independent Echo Void Demo's sparse stars with a dense, six-layer, silver procedural starfield matching the supplied reference while preserving the existing vortex and foreground UI.

**Architecture:** Keep the existing single-draw-call WebGL renderer and public settings unchanged. Refine only the fragment shader's star generation: parameterize per-layer population and radius, build two micro-dust layers plus four depth layers, and modulate them with two low-frequency cluster masks and a nonzero density floor.

**Tech Stack:** TypeScript 6, GLSL ES 1.00 / WebGL 1.0, Node 22 test runner, Vite 8, Playwright CLI.

---

## File structure

- Modify `tests/blackHoleGalaxyShader.test.ts`: lock the six-layer, micro-dust, and dual-cluster shader contract.
- Modify `src/components/blackHoleGalaxyShader.ts`: implement layer-specific star size/population and the dense silver field.
- No renderer, model, React, CSS, layout, or default-background files change.

### Task 1: Add the dense starfield shader contract

**Files:**
- Modify: `tests/blackHoleGalaxyShader.test.ts`
- Test: `tests/blackHoleGalaxyShader.test.ts`

- [ ] **Step 1: Add a failing six-layer density test**

Append this test:

```ts
test('starfield uses six depth layers with micro dust and irregular density masks', () => {
  const layerCalls = BLACK_HOLE_FRAGMENT_SHADER.match(/starLayer\([^;]+\);/g) ?? []

  assert.equal(layerCalls.length, 6)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float microStarDust/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float clusterA/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float clusterB/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float densityFloor = 0\.42/)
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test tests/blackHoleGalaxyShader.test.ts
```

Expected: one failed test because the shader currently contains four layer calls and has no `microStarDust`, `clusterA`, `clusterB`, or `densityFloor` stages.

- [ ] **Step 3: Commit the failing contract only after implementation is GREEN**

Do not commit a red tree. Keep the test change staged only with the implementation in Task 2.

### Task 2: Implement six procedural silver-star layers

**Files:**
- Modify: `src/components/blackHoleGalaxyShader.ts`
- Test: `tests/blackHoleGalaxyShader.test.ts`

- [ ] **Step 1: Parameterize star population and point radius**

Replace the current `starLayer` with:

```glsl
float starLayer(
  vec2 uv,
  float scale,
  float layerSeed,
  float population,
  vec2 radiusRange
) {
  vec2 grid = uv * scale + layerSeed;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float seed = hash21(cell + layerSeed);
  vec2 offset = vec2(seed, hash21(cell + 7.31)) - 0.5;
  float distanceToStar = length(local - offset * 0.58);
  float radius = mix(radiusRange.x, radiusRange.y, seed);
  float star = 1.0 - smoothstep(radius * 0.34, radius, distanceToStar);
  float threshold = 1.0 - clamp(population * uDensity, 0.0, 0.62);
  float twinkle = 1.0 + sin(uTime * (1.15 + seed * 2.6) + seed * 40.0) * uTwinkleIntensity;
  return star * step(threshold, seed) * twinkle;
}
```

- [ ] **Step 2: Add two dim micro-dust layers**

Add directly after `starLayer`:

```glsl
float microStarDust(vec2 uv) {
  float dust = starLayer(
    uv + vec2(-0.19, 0.27),
    420.0,
    73.6,
    0.19,
    vec2(0.18, 0.34)
  ) * 0.13;
  dust += starLayer(
    uv + vec2(0.37, -0.16),
    332.0,
    91.8,
    0.15,
    vec2(0.15, 0.30)
  ) * 0.17;
  return dust;
}
```

- [ ] **Step 3: Replace `layeredStarField` with dual cluster masks and four depth layers**

Use:

```glsl
float layeredStarField(vec2 uv) {
  float clusterA = smoothstep(0.28, 0.74, fbm(uv * 1.72 + vec2(8.4, -3.7)));
  float clusterB = smoothstep(
    0.40,
    0.76,
    fbm(rotate2d(-0.34) * uv * 3.15 + vec2(-4.8, 11.2))
  );
  float densityFloor = 0.42;
  float cluster = densityFloor + clusterA * 0.54 + clusterB * 0.31;

  float stars = microStarDust(uv) * mix(0.78, 1.22, clusterB);
  stars += starLayer(uv, 214.0, 41.2, 0.105, vec2(0.13, 0.27)) * 0.25;
  stars += starLayer(uv + vec2(0.13, -0.21), 132.0, 19.4, 0.075, vec2(0.10, 0.23)) * 0.42;
  stars += starLayer(uv - vec2(0.31, 0.07), 72.0, 7.7, 0.038, vec2(0.07, 0.18)) * 0.72;
  stars += starLayer(uv + vec2(0.08, 0.11), 34.0, 2.7, 0.010, vec2(0.045, 0.12)) * 1.24;
  return stars * cluster;
}
```

These values keep most stars below the foreground text brightness while creating a few readable highlights. The `densityFloor` prevents formerly empty regions from becoming blank, and the two masks avoid a uniform wallpaper pattern.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
node --test tests/blackHoleGalaxyShader.test.ts
npm test
npm run build
```

Expected: the focused shader contract passes, all 30 project tests pass, and Vite completes a production build.

- [ ] **Step 5: Commit the shader implementation**

```bash
git add src/components/blackHoleGalaxyShader.ts tests/blackHoleGalaxyShader.test.ts
git commit -m "feat: densify echo void starfield"
```

### Task 3: Compare the live Demo with the supplied reference

**Files:**
- Potentially modify after visual review: `src/components/blackHoleGalaxyShader.ts`
- Potentially modify contract values after a new RED assertion: `tests/blackHoleGalaxyShader.test.ts`

- [ ] **Step 1: Open one owned Playwright session**

Use the session name `echo-dense-stars-20260725-root`, open `http://localhost:5173/?bgDemo=black-hole`, and record ownership. Do not open more than one session for this task.

- [ ] **Step 2: Capture the mobile rendering**

Resize to 445×805, wait 700ms, and save a viewport screenshot under `output/playwright/echo-dense-stars-mobile.png`.

Inspect the original-resolution image for:

- a continuous field of fine stars across the viewport;
- several visible size and brightness levels;
- irregular clusters plus black breathing space;
- silver/graphite color with no purple or blue cast;
- readable navigation, title, mood label, hint, and CTA;
- unchanged tiny vortex size and position.

- [ ] **Step 3: Capture the desktop rendering**

Resize to 1280×900, wait 700ms, and save `output/playwright/echo-dense-stars-desktop.png`. Confirm the field does not become uniform noise or visually overpower the centered content column.

- [ ] **Step 4: Tune only if a concrete comparison gap remains**

If screenshots still read as sparse, first add a failing assertion for the precise constant or extra stage being changed. Increase micro-layer population or radius before increasing bright-layer intensity. If the field reads as gray noise, reduce micro-layer output weights before lowering the density floor. Do not modify vortex functions, layout, React components, or the default starfield.

- [ ] **Step 5: Verify renderer and isolation states**

In the Demo assert:

```js
({
  background: document.querySelector('[data-black-hole-status]')?.getAttribute('data-black-hole-status'),
  orb: document.querySelector('[data-orb-status]')?.getAttribute('data-orb-status'),
  echo: document.querySelector('.screen--echo-void') !== null,
})
```

Expected: `{ background: 'webgl', orb: 'webgl', echo: true }` and zero console errors.

Open `http://localhost:5173/` in the same session and assert:

```js
({
  aurora: document.querySelector('.aurora') !== null,
  starfield: document.querySelector('.starfield') !== null,
  blackHole: document.querySelector('.black-hole-galaxy') !== null,
  echo: document.querySelector('.screen--echo-void') !== null,
})
```

Expected: `{ aurora: true, starfield: true, blackHole: false, echo: false }`.

- [ ] **Step 6: Run final verification**

```bash
npm test
npm run build
npm run lint
git diff --check
git status --short
```

Expected: 30 tests pass, build succeeds, lint has no errors (the existing `MoodOrb.tsx` Fast Refresh warning may remain), no whitespace errors, and only intentionally generated Playwright artifacts are untracked.

- [ ] **Step 7: Commit any evidence-driven tuning**

If Step 4 changed source or tests:

```bash
git add src/components/blackHoleGalaxyShader.ts tests/blackHoleGalaxyShader.test.ts
git commit -m "refactor: tune dense silver star depth"
```

- [ ] **Step 8: Close and clean the owned browser session**

Close only `echo-dense-stars-20260725-root`, verify it is absent from `playwright-cli --json list --all`, run Browser Guardian status, and remove only this task's generated screenshots/logs. Leave the development services running.

### Task 4: Deliver the updated Demo

**Files:**
- No source changes.

- [ ] **Step 1: Confirm the branch is clean and the Demo responds**

Run:

```bash
test -z "$(git status --short)"
curl -sS -o /dev/null -w '%{http_code}\n' 'http://localhost:5173/?bgDemo=black-hole'
```

Expected: a clean status and HTTP `200`.

- [ ] **Step 2: Report the exact scope**

Report that the independent Demo now uses a denser dynamic silver starfield, the default page remains unchanged, no image assets were generated because the approved approach is procedural WebGL, and provide `http://localhost:5173/?bgDemo=black-hole`.

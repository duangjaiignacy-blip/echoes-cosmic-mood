# Original Mood Orb Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abrupt bounce switch with a continuous circular, stepped mood carousel that uses the approved transparent raster artwork exactly as supplied.

**Architecture:** Register the five transparent three-orb sheets as immutable raster sprites and expose one typed crop mapping for each of the 15 mood IDs. Drive the chooser with one continuous, unbounded track position: pointer movement updates position and active mood at every half-step, release velocity projects a bounded target, and CSS eases the fixed carousel to the nearest integer. Render all states on a circular stepped lane so the current orb and its neighbors move continuously without recoloring, filtering, redrawing, or reshaping the source artwork.

**Tech Stack:** React 19, TypeScript 6, CSS transforms, Pointer Events, Node test runner, Vite, Playwright CLI.

---

## File structure

- Create `src/components/moodOrbAssets.ts`: exact 15-state-to-sheet-and-panel registry.
- Create `src/components/MoodPlanetImage.tsx`: transparent sprite viewport that renders original pixels only.
- Create `src/components/MoodOrbitCarousel.tsx`: five-visible-step circular carousel plus 15 fixed step controls.
- Create `tests/moodOrbAssets.test.ts`: complete stable mapping and source-file checks.
- Modify `src/components/moodSwipeModel.ts`: pure circular position, active region, fling projection and orbital pose helpers.
- Modify `tests/moodSwipeModel.test.ts`: replace bounce timing assertions with continuous carousel behavior tests.
- Modify `src/lib/useMoodSwipe.ts`: pointer tracking, live position updates, recent velocity and natural snap.
- Modify `src/pages/Home.tsx`: raster carousel integration, live label switching, keyboard/dot navigation and removal of bounce timers.
- Modify `src/index.css`: stepped arc layout and drag/snap transitions; remove `echo-orb-drop`.
- Delete `src/components/MoodPeek.tsx`: it redraws the supplied artwork with CSS and is no longer valid.
- Do not modify or stage the unrelated untracked `tests/backgroundAsset.test.ts`.

### Task 1: Lock the exact raster mapping

**Files:**
- Create: `src/components/moodOrbAssets.ts`
- Create: `src/components/MoodPlanetImage.tsx`
- Create: `tests/moodOrbAssets.test.ts`

- [ ] **Step 1: Write the failing asset registry test**

Assert that `MOOD_ORB_ASSETS.map(({ id }) => id)` exactly equals `ECHO_MOODS.map(({ id }) => id)`, every ID is unique, panels repeat `0, 1, 2` for each sheet, every source ends with `-transparent.png`, and the five referenced files exist under `docs/superpowers/concepts/mood-orbs`.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/moodOrbAssets.test.ts`

Expected: `ERR_MODULE_NOT_FOUND` for `moodOrbAssets.ts`.

- [ ] **Step 3: Implement the immutable mapping**

Export:

```ts
export interface MoodOrbAsset {
  id: MoodId
  sheet: string
  panel: 0 | 1 | 2
}

export const MOOD_ORB_ASSETS: readonly MoodOrbAsset[]
export function getMoodOrbAsset(id: MoodId): MoodOrbAsset
```

Use the exact order `very-low, low, heavy, calm, okay, bright, joyful, lonely, sad, angry, afraid, disappointed, anxious, aggrieved, embarrassed` and the matching five transparent sheets. `MoodPlanetImage` must render one overflowing `<img>` at 300% viewport width, translated by `panel * 100%`, with no filter, recolor, blend mode, extra face layer or shape mask.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/moodOrbAssets.test.ts`

Expected: all asset tests pass.

### Task 2: Replace discrete bounce timing with a continuous circular model

**Files:**
- Modify: `src/components/moodSwipeModel.ts`
- Modify: `tests/moodSwipeModel.test.ts`
- Modify: `src/lib/useMoodSwipe.ts`

- [ ] **Step 1: Write failing interaction tests**

Cover the following exact behaviors:

```ts
assert.equal(wrapMoodIndex(-1, 15), 14)
assert.equal(activeMoodIndex(3.49, 15), 3)
assert.equal(activeMoodIndex(3.51, 15), 4)
assert.equal(moodPositionFromDrag(3, -208, 0, 104), 5)
assert.equal(nearestMoodPosition(14, 0, 15), 15)
assert.equal(projectMoodSnap(4.1, -4, 104, 160, 3), 7)
```

Also assert that orbital poses preserve the center at scale `1`, place immediate neighbors on opposite sides and lower steps, hide remote states, and no longer export `ECHO_MOOD_IMPACT_MS` or `ECHO_MOOD_BOUNCE_MS`.

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/moodSwipeModel.test.ts`

Expected: imports for the new continuous helpers fail.

- [ ] **Step 3: Implement the pure model and pointer hook**

Use `104px` per step. Left drag increases continuous position, right drag decreases it. The active region changes at the nearest half-step. On release, project recent horizontal velocity for `160ms`, clamp the projected travel to at most three steps, round to a fixed state, and report settling mode so CSS can animate. Preserve horizontal-intent detection and circular wrapping.

- [ ] **Step 4: Run test to verify GREEN**

Run: `node --test tests/moodSwipeModel.test.ts`

Expected: all continuous carousel tests pass.

### Task 3: Integrate the stepped orbit into Echo Void Home

**Files:**
- Create: `src/components/MoodOrbitCarousel.tsx`
- Modify: `src/pages/Home.tsx`
- Modify: `src/index.css`
- Delete: `src/components/MoodPeek.tsx`

- [ ] **Step 1: Add a failing Home source contract test**

Add assertions to the existing Home presentation test that Echo mode references `MoodOrbitCarousel` and `MoodPlanetImage`, exposes 15 fixed step controls, and contains none of `echo-orb-drop`, `echo-orb-bounce`, `ECHO_MOOD_IMPACT_MS`, `ECHO_MOOD_BOUNCE_MS`, or `MoodPeek`.

- [ ] **Step 2: Run the Home test to verify RED**

Run: `node --test tests/homeMoodOrbPresentation.test.ts`

Expected: the new carousel contract is not yet present.

- [ ] **Step 3: Render the carousel and remove the old transition**

Keep the legacy non-Echo rotary path unchanged. In Echo mode, render every fixed mood as the exact raster component and calculate its circular pose from the continuous position. The center sprite viewport is `348px`; neighbors appear along a stepped arc through translation, uniform scale and opacity only. While dragging, disable transitions; after release or keyboard/dot selection, use a restrained `520ms cubic-bezier(0.22, 0.72, 0.18, 1)` settle. Update the label immediately whenever the position crosses a half-step. Provide slider semantics, left/right keys, 15 labeled step buttons and `prefers-reduced-motion` fallback.

- [ ] **Step 4: Reuse the selected raster on the Echo word step**

Render `MoodPlanetImage` at the smaller word-ring center in Echo mode, keeping the existing `MoodOrb` for the default experience.

- [ ] **Step 5: Run focused verification**

Run: `node --test tests/moodOrbAssets.test.ts tests/moodSwipeModel.test.ts tests/homeMoodOrbPresentation.test.ts && npm run build && npm run lint`

Expected: focused tests, build and lint exit 0.

### Task 4: Validate, publish and deploy

**Files:**
- Verify all files above.
- Do not modify or stage `tests/backgroundAsset.test.ts`.

- [ ] **Step 1: Run the known-clean suite**

Run every `tests/*.test.ts` except `tests/backgroundAsset.test.ts`, followed by `npm run build` and `npm run lint`. All tracked tests must pass and lint must contain no errors.

- [ ] **Step 2: Browser verification**

Start one named Playwright session owned by this turn at `?bgDemo=black-hole`. Verify at 445×805 and 1280×900 that drag motion is continuous, active text changes at half-step, neighboring fixed images remain visible, release decelerates and snaps, first/last states wrap, all 15 original raster moods appear without filters or redraw, keyboard and dot navigation work, reduced motion removes settling animation, and the console has no errors.

- [ ] **Step 3: Browser hygiene**

Close only the owned Playwright session, verify it is absent from `playwright-cli --json list --all`, and run `/Users/mac/Library/Application Support/CodexBrowserGuardian/bin/codex-browser-guardian status`.

- [ ] **Step 4: Publish**

Explicitly stage only plan, source, tests and the five transparent mood sheets; exclude `tests/backgroundAsset.test.ts`. Commit, push `HEAD:main` to remote `publish`, build, and deploy `dist` to the existing Netlify production site.

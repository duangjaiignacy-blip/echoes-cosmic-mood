# Full Dial Drag Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every point inside the Echo Void mood dial start a reliable drag while preserving direct click selection and preventing a completed drag from firing an accidental mood click.

**Architecture:** Declare the existing dial root as the single allowed drag surface and let `useMoodSwipe` observe pointerdown in the capture phase, before descendant buttons can interrupt bubbling. Keep the existing 6px axis lock as the click-versus-drag boundary; a completed axis-locked gesture arms a one-shot captured click guard, while a tap continues to reach the original mood button.

**Tech Stack:** React 19, TypeScript, Pointer Events, Node.js built-in test runner, Vite, oxlint

---

## File map

- Modify `tests/homeMoodOrbPresentation.test.ts`: contract-test the root drag surface, capture listener, and removal of descendant drag blockers.
- Modify `tests/moodSwipeModel.test.ts`: test the pure decision that only a completed axis-locked gesture suppresses a click.
- Modify `src/components/moodSwipeModel.ts`: add the pure click-suppression decision without changing swipe sensitivity.
- Modify `src/pages/Home.tsx`: mark the Echo Void dial root as the unified allowed drag surface.
- Modify `src/components/MoodOrbitCarousel.tsx`: remove pointerdown propagation blockers from tick and text buttons.
- Modify `src/lib/useMoodSwipe.ts`: capture pointerdown at the root and suppress exactly one click after a real drag.

### Task 1: Add failing contracts for a continuous drag surface

**Files:**
- Modify: `tests/homeMoodOrbPresentation.test.ts:6-95`
- Modify: `tests/moodSwipeModel.test.ts:151-164`

- [ ] **Step 1: Add the hook source fixture and full-dial integration test**

In `tests/homeMoodOrbPresentation.test.ts`, add this fixture beside `carouselUrl`:

```ts
const moodSwipeUrl = new URL('../src/lib/useMoodSwipe.ts', import.meta.url)
```

Replace the existing `the visible planet remains clickable and becomes a drag surface` test with:

```ts
test('the complete mood dial is one continuous drag surface', async () => {
  const { readFile } = await import('node:fs/promises')
  const [carousel, moodSwipe] = await Promise.all([
    readFile(carouselUrl, 'utf8'),
    readFile(moodSwipeUrl, 'utf8'),
  ])

  assert.match(home, /data-mood-drag-surface=\{echoVoid \? true : undefined\}/)
  assert.match(carousel, /data-mood-drag-surface="true"/)
  assert.doesNotMatch(carousel, /stopDrag/)
  assert.doesNotMatch(carousel, /onPointerDown=\{stopDrag\}/)
  assert.match(moodSwipe, /const captureOptions = \{ capture: true \} as const/)
  assert.match(moodSwipe, /addEventListener\('pointerdown', down, captureOptions\)/)
  assert.match(moodSwipe, /addEventListener\('click', suppressDraggedClick, captureOptions\)/)
})
```

In the existing `every revealed mood word is a directly selectable button` test, remove:

```ts
  assert.match(carousel, /onPointerDown=\{stopDrag\}/)
```

The remaining assertions continue to protect direct click selection and keyboard semantics.

- [ ] **Step 2: Add a pure click-suppression decision test**

Append this test to `tests/moodSwipeModel.test.ts`:

```ts
test('only a completed axis-locked drag suppresses its follow-up click', () => {
  assert.equal('shouldSuppressMoodClick' in swipeModel, true)
  const shouldSuppressMoodClick = (
    swipeModel as typeof swipeModel & {
      shouldSuppressMoodClick: (axis: 'x' | 'y' | null, cancelled: boolean) => boolean
    }
  ).shouldSuppressMoodClick

  assert.equal(shouldSuppressMoodClick(null, false), false)
  assert.equal(shouldSuppressMoodClick('x', false), true)
  assert.equal(shouldSuppressMoodClick('y', false), true)
  assert.equal(shouldSuppressMoodClick('x', true), false)
})
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
node --test tests/homeMoodOrbPresentation.test.ts tests/moodSwipeModel.test.ts
```

Expected: FAIL because the dial root lacks `data-mood-drag-surface`, carousel buttons still reference `stopDrag`, the hook still listens in bubbling phase and has no captured click guard, and the model has no `shouldSuppressMoodClick` export.

### Task 2: Make the root own every pointer start without breaking clicks

**Files:**
- Modify: `src/components/moodSwipeModel.ts:33-41`
- Modify: `src/pages/Home.tsx:150-165`
- Modify: `src/components/MoodOrbitCarousel.tsx:1-110`
- Modify: `src/lib/useMoodSwipe.ts:1-121`
- Test: `tests/homeMoodOrbPresentation.test.ts`
- Test: `tests/moodSwipeModel.test.ts`

- [ ] **Step 1: Add the pure completed-drag decision**

After `isMoodDragStartAllowed` in `src/components/moodSwipeModel.ts`, add:

```ts
export function shouldSuppressMoodClick(
  axis: MoodDragAxis | null,
  cancelled: boolean,
): boolean {
  return axis !== null && !cancelled
}
```

This deliberately reuses the existing axis lock: `null` means movement never reached 6px, while `x` or `y` means a real drag began.

- [ ] **Step 2: Mark the entire Echo Void dial as an allowed surface**

In the first-step dial element in `src/pages/Home.tsx`, add the drag-surface data attribute immediately after `data-mood-swipe`:

```tsx
            data-mood-swipe={echoVoid ? true : undefined}
            data-mood-drag-surface={echoVoid ? true : undefined}
```

Because this root appears in every descendant's composed path, buttons inside the dial are now intentionally allowed by `isMoodDragStartAllowed`.

- [ ] **Step 3: Remove descendant pointerdown blockers**

In `src/components/MoodOrbitCarousel.tsx`, change the type import to:

```ts
import type { CSSProperties } from 'react'
```

Delete:

```ts
  const stopDrag = (event: PointerEvent<HTMLButtonElement>) => event.stopPropagation()
```

Delete `onPointerDown={stopDrag}` from both `.mood-orbit-text` and `.mood-orbit-step`. Keep their `onClick`, ARIA, and `tabIndex` behavior unchanged. Keep `data-mood-drag-surface="true"` on `.mood-orbit-toggle`; it remains a valid explicit inner surface even though the root now covers the whole dial.

- [ ] **Step 4: Capture pointerdown and arm one-shot click suppression**

Add `shouldSuppressMoodClick` to the existing model imports in `src/lib/useMoodSwipe.ts`:

```ts
  projectMoodSnap,
  shouldSuppressMoodClick,
  type MoodDragAxis,
```

Inside the effect, immediately after `let samples: PointerSample[] = []`, add:

```ts
    const captureOptions = { capture: true } as const
    let suppressClick = false
    let suppressionTimer: number | null = null

    const clearClickSuppression = () => {
      suppressClick = false
      if (suppressionTimer !== null) {
        window.clearTimeout(suppressionTimer)
        suppressionTimer = null
      }
    }

    const armClickSuppression = () => {
      clearClickSuppression()
      suppressClick = true
      suppressionTimer = window.setTimeout(() => {
        suppressClick = false
        suppressionTimer = null
      }, 0)
    }
```

At the beginning of `down`, after validating the primary button but before reading the composed path, clear any stale guard:

```ts
      clearClickSuppression()
```

In `finish`, calculate suppression before resetting `axis`:

```ts
      const suppressFollowupClick = shouldSuppressMoodClick(axis, cancelled)
```

After releasing pointer capture, arm the guard only for a real completed drag:

```ts
      if (suppressFollowupClick) armClickSuppression()
```

Add the captured click handler after `cancel`:

```ts
    const suppressDraggedClick = (event: MouseEvent) => {
      if (!suppressClick) return
      event.preventDefault()
      event.stopPropagation()
      clearClickSuppression()
    }
```

Replace pointerdown registration and cleanup with capture-phase variants, and register the click guard:

```ts
    element.addEventListener('pointerdown', down, captureOptions)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', cancel)
    element.addEventListener('click', suppressDraggedClick, captureOptions)
    return () => {
      element.removeEventListener('pointerdown', down, captureOptions)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', cancel)
      element.removeEventListener('click', suppressDraggedClick, captureOptions)
      clearClickSuppression()
    }
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/homeMoodOrbPresentation.test.ts tests/moodSwipeModel.test.ts
```

Expected: every focused test passes. Existing sensitivity assertions still prove 6px axis lock, 28px per mood, and at most one projected fling step.

- [ ] **Step 6: Inspect the scoped diff**

Run:

```bash
git diff -- src/pages/Home.tsx src/components/MoodOrbitCarousel.tsx src/components/moodSwipeModel.ts src/lib/useMoodSwipe.ts tests/homeMoodOrbPresentation.test.ts tests/moodSwipeModel.test.ts
git diff --check
```

Expected: only full-dial pointer routing, click suppression, and their tests changed; no CSS, visual, starfield, mood asset, or button changes.

### Task 3: Verify every drag origin and deploy

**Files:**
- Verify: `src/pages/Home.tsx`
- Verify: `src/components/MoodOrbitCarousel.tsx`
- Verify: `src/components/moodSwipeModel.ts`
- Verify: `src/lib/useMoodSwipe.ts`
- Verify: `tests/homeMoodOrbPresentation.test.ts`
- Verify: `tests/moodSwipeModel.test.ts`

- [ ] **Step 1: Run every tracked test**

Run:

```bash
node --test $(git ls-files 'tests/*.test.ts')
```

Expected: all tracked tests pass. The unrelated untracked `tests/backgroundAsset.test.ts` remains excluded and untouched.

- [ ] **Step 2: Run production checks**

Run:

```bash
npm run build
npm run lint
git diff --check
```

Expected: build and lint exit 0; `git diff --check` reports no errors. The existing non-fatal `MoodOrb.tsx` Fast Refresh warning may remain unchanged.

- [ ] **Step 3: Verify real pointer behavior in one owned browser session**

When a Playwright session slot is available, create one session named `echo-full-dial-drag-20260725`. At a mobile viewport around `445x805`:

1. Drag horizontally by at least 40px starting from the central planet; the selected mood changes.
2. Drag from top, bottom, left, and right tick hit areas; every origin changes the mood.
3. Expand the labels, then drag from a visible mood word; the mood changes without jumping back on release.
4. Drag from blank ring space; the mood changes.
5. Click a mood tick and a visible word without moving beyond 6px; each still selects directly.
6. Repeat one representative drag with touch input emulation if the CLI supports it; otherwise use pointer-event dispatch with `pointerType: 'touch'` against the same real DOM and verify the selected label changes.

Close only `echo-full-dial-drag-20260725`, verify it is absent from `playwright-cli --json list --all`, and run Browser Guardian status. Do not close or reuse any other task's session.

- [ ] **Step 4: Commit only the implementation scope**

Run:

```bash
git add src/pages/Home.tsx src/components/MoodOrbitCarousel.tsx src/components/moodSwipeModel.ts src/lib/useMoodSwipe.ts tests/homeMoodOrbPresentation.test.ts tests/moodSwipeModel.test.ts
git diff --cached --check
git commit -m "fix: make the full mood dial draggable"
```

Expected: the commit contains exactly six implementation/test files; unrelated untracked work remains untouched.

- [ ] **Step 5: Rebase safety check, push, and verify Pages**

Run:

```bash
git fetch publish main
git rev-list --left-right --count publish/main...HEAD
git push publish HEAD:main
```

Expected: the first rev-list count is `0`; the push fast-forwards `publish/main`. Wait for the matching GitHub Pages workflow to succeed, then verify the deployed URL returns HTTP 200 and contains the implementation commit's asset bundle.

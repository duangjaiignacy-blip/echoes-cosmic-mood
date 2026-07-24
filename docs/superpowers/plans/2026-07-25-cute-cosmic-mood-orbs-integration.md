# Cute Cosmic Mood Orbs Product Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved 15-state cute cosmic mood-orb atlas into the Echo Void Demo while preserving the perfect circular WebGL sphere, existing bounce timing, and the default seven-step rotary experience.

**Architecture:** Add a pure, typed emotion-visual registry keyed by stable mood identifiers. `MoodOrb` keeps rendering the glass body and receives a vector `MoodExpression` overlay whose face, hands, blush, and external marks come from the registry; `Home` cycles through all 15 records only in Echo Void mode and persists the selected identifier alongside the existing valence. Downstream views consume the optional identifier without breaking old stored entries.

**Tech Stack:** React 19, TypeScript 6, inline SVG, CSS animations, native WebGL, Node test runner, Vite, Playwright CLI.

---

## File structure

- Create `src/components/moodEmotionModel.ts`: 15-state registry, stable IDs, palette, expression paths, motion profile, lookup helpers.
- Create `src/components/MoodExpression.tsx`: generic SVG renderer for registry expression data.
- Create `tests/moodEmotionModel.test.ts`: registry completeness, uniqueness, palette, geometry-layer and fallback coverage.
- Modify `src/types.ts`: persist optional `emotionId` without invalidating existing entries.
- Modify `src/components/MoodOrb.tsx`: accept `emotionId`, select discrete palette and render the vector overlay.
- Modify `src/components/moodSwipeModel.ts`: add generic index wrapping for all 15 states.
- Modify `tests/moodSwipeModel.test.ts`: verify the 15-state cycle and wrap direction.
- Modify `src/pages/Home.tsx`: use discrete Echo Void state, label and persisted ID while leaving default rotary behavior unchanged.
- Modify `src/pages/NowNote.tsx`, `src/pages/Detail.tsx`, `src/pages/Timeline.tsx`, `src/lib/guide.ts`, and `src/lib/card.ts`: preserve names and visuals for saved discrete moods.
- Modify `src/index.css`: expression overlay, per-profile restrained motion, crossfade and shape-safe bounce.
- Do not modify or stage the unrelated untracked `tests/backgroundAsset.test.ts`.

### Task 1: Add the complete typed 15-state registry

**Files:**
- Create: `src/components/moodEmotionModel.ts`
- Create: `tests/moodEmotionModel.test.ts`
- Modify: `src/types.ts`

- [ ] **Step 1: Write a failing registry test**

The test must assert this exact stable order:

```ts
const expected = [
  ['very-low', '非常低落', -3],
  ['low', '低落', -2],
  ['heavy', '有些沉', -1],
  ['calm', '平静', 0],
  ['okay', '还不错', 1],
  ['bright', '明亮', 2],
  ['joyful', '雀跃', 3],
  ['lonely', '孤独', -2],
  ['sad', '悲伤', -3],
  ['angry', '愤怒', -2],
  ['afraid', '害怕', -2],
  ['disappointed', '失望', -2],
  ['anxious', '焦虑', -1],
  ['aggrieved', '委屈', -2],
  ['embarrassed', '尴尬', -1],
]
```

Also assert that every record has three valid hex colors, non-empty `eyes`, `mouth`, and `hands` path arrays, a unique expression signature, and a valid motion profile.

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test tests/moodEmotionModel.test.ts`

Expected: `ERR_MODULE_NOT_FOUND` for `moodEmotionModel.ts`.

- [ ] **Step 3: Add the stable type and complete registry**

Add to `src/types.ts`:

```ts
export type MoodId =
  | 'very-low' | 'low' | 'heavy' | 'calm' | 'okay' | 'bright' | 'joyful'
  | 'lonely' | 'sad' | 'angry' | 'afraid' | 'disappointed' | 'anxious'
  | 'aggrieved' | 'embarrassed'

export interface MoodState {
  valence: number
  labels: string[]
  emotionId?: MoodId
}
```

Implement a registry with this public API:

```ts
export type MoodMotion = 'sink' | 'settle' | 'breathe' | 'lift' | 'glow' | 'spark' |
  'withdraw' | 'rain' | 'bristle' | 'shiver' | 'fade' | 'orbit' | 'hold' | 'wobble'

export interface MoodStroke {
  d: string
  layer: 'face' | 'hand' | 'accent' | 'tear' | 'blush'
  fill?: boolean
}

export interface MoodVisual {
  id: MoodId
  label: string
  valence: number
  palette: [string, string, string]
  ink: string
  blush: string
  accent: string
  motion: MoodMotion
  spinOffset: number
  eyes: MoodStroke[]
  brows: MoodStroke[]
  mouth: MoodStroke[]
  hands: MoodStroke[]
  accents: MoodStroke[]
}

export const ECHO_MOODS: readonly MoodVisual[]
export const DEFAULT_ECHO_MOOD_INDEX: number
export function getMoodVisual(id: MoodId): MoodVisual
export function moodLabel(valence: number, id?: MoodId): string
export function moodPalette(valence: number, id?: MoodId): [string, string, string]
```

Populate all 15 records from the approved design table. Every record must have distinct eye/mouth/hand geometry and the palette, motion profile and external accents described in `docs/superpowers/specs/2026-07-25-cute-cosmic-mood-orbs-design.md`.

- [ ] **Step 4: Run the registry test and verify GREEN**

Run: `node --test tests/moodEmotionModel.test.ts`

Expected: all registry tests pass.

- [ ] **Step 5: Commit the registry**

```bash
git add src/types.ts src/components/moodEmotionModel.ts tests/moodEmotionModel.test.ts
git commit -m "feat: add fifteen-state mood visual model"
```

### Task 2: Expand Echo Void swipe selection to all 15 states

**Files:**
- Modify: `src/components/moodSwipeModel.ts`
- Modify: `tests/moodSwipeModel.test.ts`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Write failing wrap tests**

```ts
test('mood indices wrap through all fifteen options one step at a time', () => {
  assert.equal(stepMoodIndex(0, 1, 15), 1)
  assert.equal(stepMoodIndex(0, -1, 15), 14)
  assert.equal(stepMoodIndex(14, 1, 15), 0)
  assert.equal(stepMoodIndex(7, -1, 15), 6)
})
```

- [ ] **Step 2: Run the swipe test and verify RED**

Run: `node --test tests/moodSwipeModel.test.ts`

Expected: import failure because `stepMoodIndex` does not exist.

- [ ] **Step 3: Add minimal index wrapping**

```ts
export function stepMoodIndex(current: number, direction: MoodSwipeDirection, count: number): number {
  if (!Number.isInteger(count) || count < 1) return 0
  return ((Math.round(current) + direction) % count + count) % count
}
```

- [ ] **Step 4: Run the swipe test and verify GREEN**

Run: `node --test tests/moodSwipeModel.test.ts`

Expected: all swipe tests pass.

- [ ] **Step 5: Switch only Echo Void Home to discrete state**

In `Home`, initialize `echoMoodIndex` with `DEFAULT_ECHO_MOOD_INDEX`, derive `echoMood = ECHO_MOODS[echoMoodIndex]`, and at the existing 140ms impact call `stepMoodIndex`. Use `echoMood.label` in the live label, pass `echoMood.id` to both Home mood orbs, and persist `{ valence: echoMood.valence, emotionId: echoMood.id, labels }`. Leave the non-Echo `angle`, rotary handler and seven valence labels unchanged.

- [ ] **Step 6: Commit the selection behavior**

```bash
git add src/components/moodSwipeModel.ts tests/moodSwipeModel.test.ts src/pages/Home.tsx
git commit -m "feat: cycle all mood states in echo demo"
```

### Task 3: Render crisp vector expressions over the unchanged glass sphere

**Files:**
- Create: `src/components/MoodExpression.tsx`
- Modify: `src/components/MoodOrb.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Implement the generic overlay renderer**

`MoodExpression` must render one decorative SVG with `viewBox="-24 -24 248 248"`, `aria-hidden="true"`, and five path classes derived from the registry layers. The 200×200 inner coordinate area maps exactly to the round body while external accents use the 24-unit safe margin. It must not render text glyphs or mutate the orb boundary.

```tsx
import type { CSSProperties } from 'react'

export function MoodExpression({ mood }: { mood: MoodVisual }) {
  const strokes = [...mood.eyes, ...mood.brows, ...mood.mouth, ...mood.hands, ...mood.accents]
  return (
    <svg
      key={mood.id}
      className={`mood-expression mood-expression--${mood.motion}`}
      viewBox="-24 -24 248 248"
      aria-hidden="true"
      style={{ '--mood-ink': mood.ink, '--mood-blush': mood.blush, '--mood-accent': mood.accent } as CSSProperties}
    >
      {strokes.map((stroke, index) => (
        <path key={`${stroke.layer}-${index}`} className={`mood-stroke mood-stroke--${stroke.layer}`} d={stroke.d} />
      ))}
    </svg>
  )
}
```

- [ ] **Step 2: Integrate the overlay into `MoodOrb`**

Add `emotionId?: MoodId`. When it is present, use the registry palette, add `spinOffset`, keep the WebGL and CSS bodies unchanged, and render `MoodExpression` after the body canvas but before the caustic. Do not render an expression for the legacy numeric-only orb.

- [ ] **Step 3: Add the expression and restrained motion CSS**

The CSS must:

- position the SVG at `inset: -12%`, `width/height: 124%`, `z-index: 4`, `overflow: visible`, and `pointer-events: none`;
- use thin rounded navy lines with `vector-effect: non-scaling-stroke`;
- color blush and tears separately;
- crossfade a newly keyed expression over 520ms;
- animate only accents/hands with 4–8 second restrained loops for the 14 motion profiles;
- disable loops and reduce crossfade under `prefers-reduced-motion`;
- change `echo-orb-drop` to translation plus uniform scaling only, removing `scale(x, y)` so the circular silhouette never deforms.

- [ ] **Step 4: Run build and lint**

Run: `npm run build && npm run lint`

Expected: build exits 0; lint has zero errors.

- [ ] **Step 5: Commit the visual layer**

```bash
git add src/components/MoodExpression.tsx src/components/MoodOrb.tsx src/index.css
git commit -m "feat: overlay cute expressions on cosmic moods"
```

### Task 4: Preserve discrete mood identity downstream

**Files:**
- Modify: `src/pages/NowNote.tsx`
- Modify: `src/pages/Detail.tsx`
- Modify: `src/pages/Timeline.tsx`
- Modify: `src/lib/guide.ts`
- Modify: `src/lib/card.ts`
- Create: `tests/guideMood.test.ts`

- [ ] **Step 1: Add a failing downstream label test**

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { moodWord } from '../src/lib/guide.ts'

test('moodWord preserves a named discrete emotion and legacy valence fallback', () => {
  assert.equal(moodWord(-2, 'angry'), '愤怒')
  assert.equal(moodWord(-2), '低落')
})
```

- [ ] **Step 2: Run the downstream label test and verify RED**

Run: `node --test tests/guideMood.test.ts`

Expected: TypeScript/runtime assertion failure because `moodWord` does not yet consume the optional identifier.

- [ ] **Step 3: Update consumers**

- Pass `emotionId={mood.emotionId}` to `MoodOrb` in `NowNote` and `Detail`.
- Use `moodLabel(e.mood.valence, e.mood.emotionId)` in timeline/detail/guide copy.
- Use `moodPalette(entry.mood.valence, entry.mood.emotionId)` for generated card and timeline accent colors.
- Preserve all old numeric-only entry behavior.

- [ ] **Step 4: Run focused tests, build and lint**

Run: `node --test tests/moodEmotionModel.test.ts tests/moodSwipeModel.test.ts tests/guideMood.test.ts && npm run build && npm run lint`

Expected: focused tests, build and lint pass.

- [ ] **Step 5: Commit downstream compatibility**

```bash
git add src/pages/NowNote.tsx src/pages/Detail.tsx src/pages/Timeline.tsx src/lib/guide.ts src/lib/card.ts tests/guideMood.test.ts
git commit -m "feat: preserve named moods across echoes flow"
```

### Task 5: Validate behavior and appearance in-browser

**Files:**
- Verify all files above.
- Do not modify `tests/backgroundAsset.test.ts`.

- [ ] **Step 1: Run the complete available verification set**

Run the project suite and then the known-clean suite excluding the unrelated untracked background asset test:

```bash
npm test
node --test $(find tests -maxdepth 1 -name '*.test.ts' ! -name 'backgroundAsset.test.ts' -type f | sort)
npm run build
npm run lint
```

Record the existing two failures from `tests/backgroundAsset.test.ts` separately; all tracked and newly added tests must pass.

- [ ] **Step 2: Start a named local server and browser session**

Use a named Playwright session owned by this turn. Open `?bgDemo=black-hole` at both 445×805 and 1280×900.

- [ ] **Step 3: Check all 15 states**

Swipe left 15 times and verify: exact label order, one state per gesture, 140ms impact update, no missed/duplicate states, same-size perfect circular body, distinct face/hand/accent story, and legibility at 188px. Capture screenshots of at least calm, joyful, sad, angry, anxious, aggrieved, and embarrassed.

- [ ] **Step 4: Check interaction isolation and accessibility**

Verify default URL still uses the seven-step rotary mode, CTA continues to the next screen, reduced motion removes shape/movement loops, the overlay is decorative, and the browser console has no errors.

- [ ] **Step 5: Close only the owned browser session**

Use Playwright CLI `close`, confirm it disappears from `playwright-cli --json list --all`, and run the Codex Browser Guardian status command.

- [ ] **Step 6: Final commit if visual corrections were required**

```bash
git add src tests
git commit -m "fix: refine mood atlas integration"
```

Do not create an empty commit when no correction is needed.

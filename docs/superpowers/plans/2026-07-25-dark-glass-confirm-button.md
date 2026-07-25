# Dark Glass Confirm Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Echo Void confirmation control as a transparent dark-glass capsule whose blurred starfield, silver refractive rim, subtle sheen, and tactile states match the approved reference direction.

**Architecture:** Keep the React markup and interaction untouched. Strengthen the existing CSS contract test first, then replace only the Echo Void `.echo-confirm` visual layer in `src/index.css`; use the button surface plus `::before` and `::after` as three independent glass layers and add a reduced-motion fallback.

**Tech Stack:** React 19, CSS, Node.js built-in test runner, TypeScript/Vite, oxlint

---

## File map

- Modify `tests/homeMoodOrbPresentation.test.ts`: define the exact dark-glass material and reduced-motion contracts before implementation.
- Modify `src/index.css`: implement the transparent capsule, refractive rim, sheen, hover/active/focus states, and motion fallback.
- No React, WebGL, data-flow, dependency, or asset changes.

### Task 1: Replace the old frosted-button contract with the approved dark-glass contract

**Files:**
- Modify: `tests/homeMoodOrbPresentation.test.ts:121-141`

- [ ] **Step 1: Write the failing dark-glass material test**

Replace the two existing confirmation-button tests with:

```ts
test('the echo confirmation reads as transparent dark glass over the starfield', () => {
  assert.match(
    css,
    /\.screen--echo-void \.echo-confirm\s*\{[^}]*align-self:\s*center;[^}]*width:\s*min\(52vw, 260px\);[^}]*border-color:\s*rgba\(222, 229, 242, 0\.38\);[^}]*background:\s*rgba\(12, 15, 23, 0\.3\);[^}]*backdrop-filter:\s*blur\(30px\) saturate\(165%\) brightness\(82%\);/s,
  )
  assert.match(
    css,
    /\.screen--echo-void \.echo-confirm\s*\{[^}]*box-shadow:[^}]*inset 0 1px 0 rgba\(255, 255, 255, 0\.34\)[^}]*inset 0 -1px 0 rgba\(2, 5, 11, 0\.58\)[^}]*0 14px 34px rgba\(0, 0, 0, 0\.44\)/s,
  )
  assert.match(css, /\.screen--echo-void \.echo-confirm::before\s*\{[^}]*pointer-events:\s*none;[^}]*box-shadow:/s)
  assert.match(css, /\.screen--echo-void \.echo-confirm::after\s*\{[^}]*pointer-events:\s*none;[^}]*animation:\s*echo-glass-sheen 7\.5s/s)
})

test('the dark-glass control has restrained hover, tactile press, and motion-safe sheen', () => {
  assert.match(css, /\.screen--echo-void \.echo-confirm:hover\s*\{[^}]*border-color:\s*rgba\(235, 240, 250, 0\.5\);/s)
  assert.match(
    css,
    /\.screen--echo-void \.echo-confirm:active\s*\{[^}]*transform:\s*translateY\(1px\) scale\(0\.965\);[^}]*backdrop-filter:\s*blur\(34px\) saturate\(175%\) brightness\(88%\);/s,
  )
  assert.match(css, /@keyframes echo-glass-sheen\s*\{/)
  assert.match(
    css,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.screen--echo-void \.echo-confirm::before,[\s\S]*\.screen--echo-void \.echo-confirm::after\s*\{[^}]*animation:\s*none;[^}]*transition:\s*none;/s,
  )
})

test('the glass filter stays standard-property-only in the component override', () => {
  const restingRule = css.match(/\.screen--echo-void \.echo-confirm\s*\{([^}]*)\}/s)?.[1] ?? ''
  const activeRule = css.match(/\.screen--echo-void \.echo-confirm:active\s*\{([^}]*)\}/s)?.[1] ?? ''

  assert.match(restingRule, /backdrop-filter:\s*blur\(30px\) saturate\(165%\) brightness\(82%\);/)
  assert.match(activeRule, /backdrop-filter:\s*blur\(34px\) saturate\(175%\) brightness\(88%\);/)
  assert.doesNotMatch(restingRule, /-webkit-backdrop-filter\s*:/)
  assert.doesNotMatch(activeRule, /-webkit-backdrop-filter\s*:/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/homeMoodOrbPresentation.test.ts
```

Expected: FAIL in the three new dark-glass tests because the current CSS still uses `rgba(45, 47, 57, 0.44)`, `blur(22px)`, one local pseudo layer, and no `echo-glass-sheen` animation.

### Task 2: Implement the three-layer dark-glass capsule

**Files:**
- Modify: `src/index.css:1095-1185`
- Test: `tests/homeMoodOrbPresentation.test.ts`

- [ ] **Step 1: Replace the Echo Void confirmation rules**

Replace the current `.screen--echo-void .echo-confirm` block and its local pseudo/state blocks with:

```css
.screen--echo-void .echo-confirm {
  align-self: center;
  width: min(52vw, 260px);
  min-height: 50px;
  padding: 13px 20px;
  isolation: isolate;
  border-color: rgba(222, 229, 242, 0.38);
  background: rgba(12, 15, 23, 0.3);
  color: rgba(244, 246, 250, 0.94);
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(30px) saturate(165%) brightness(82%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -1px 0 rgba(2, 5, 11, 0.58),
    inset 10px 0 20px rgba(239, 244, 255, 0.025),
    0 14px 34px rgba(0, 0, 0, 0.44),
    0 0 0 1px rgba(115, 128, 157, 0.07),
    0 0 24px rgba(128, 143, 177, 0.08);
  touch-action: manipulation;
  transition:
    transform 180ms cubic-bezier(0.22, 0.72, 0.18, 1),
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease,
    backdrop-filter 220ms ease;
}

.screen--echo-void .echo-confirm::before {
  content: '';
  position: absolute;
  inset: 1px;
  z-index: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.08), transparent 24% 72%, rgba(125, 139, 172, 0.04)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.11), transparent 38%);
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.14),
    inset -1px -1px 0 rgba(1, 3, 8, 0.36);
  opacity: 0.82;
  transition: opacity 220ms ease, box-shadow 220ms ease;
}

.screen--echo-void .echo-confirm::after {
  content: '';
  position: absolute;
  inset: -35% -18%;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 26% 34%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.035) 24%, transparent 48%),
    linear-gradient(108deg, transparent 30%, rgba(255, 255, 255, 0.075) 44%, rgba(255, 255, 255, 0.02) 54%, transparent 68%);
  opacity: 0.68;
  transform: translate3d(-12%, -2%, 0) rotate(-2deg);
  animation: echo-glass-sheen 7.5s ease-in-out infinite alternate;
  transition: opacity 220ms ease;
}

.screen--echo-void .echo-confirm:hover {
  border-color: rgba(235, 240, 250, 0.5);
  background: rgba(15, 18, 27, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 0 -1px 0 rgba(2, 5, 11, 0.6),
    inset 11px 0 22px rgba(239, 244, 255, 0.035),
    0 16px 38px rgba(0, 0, 0, 0.48),
    0 0 0 1px rgba(137, 151, 181, 0.09),
    0 0 28px rgba(143, 158, 193, 0.11);
}

.screen--echo-void .echo-confirm:hover::before {
  opacity: 1;
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.2),
    inset -1px -1px 0 rgba(1, 3, 8, 0.4);
}

.screen--echo-void .echo-confirm:active {
  transform: translateY(1px) scale(0.965);
  border-color: rgba(244, 247, 253, 0.54);
  background: rgba(20, 23, 33, 0.38);
  backdrop-filter: blur(34px) saturate(175%) brightness(88%);
  box-shadow:
    inset 0 2px 8px rgba(255, 255, 255, 0.18),
    inset 0 -2px 10px rgba(0, 2, 7, 0.48),
    0 6px 16px rgba(0, 0, 0, 0.4),
    0 0 24px rgba(157, 171, 204, 0.12);
}

.screen--echo-void .echo-confirm:active::before {
  opacity: 1;
  box-shadow:
    inset 0 2px 7px rgba(255, 255, 255, 0.14),
    inset 0 -2px 7px rgba(0, 2, 8, 0.42);
}

.screen--echo-void .echo-confirm:active::after {
  opacity: 0.9;
}

.screen--echo-void .echo-confirm:focus-visible {
  outline: 1px solid rgba(241, 244, 252, 0.82);
  outline-offset: 4px;
}

@keyframes echo-glass-sheen {
  from { transform: translate3d(-12%, -2%, 0) rotate(-2deg); }
  to { transform: translate3d(12%, 2%, 0) rotate(2deg); }
}
```

- [ ] **Step 2: Add the reduced-motion override to the existing media query**

Append this rule inside the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .screen--echo-void .echo-confirm::before,
  .screen--echo-void .echo-confirm::after {
    animation: none;
    transition: none;
  }
```

- [ ] **Step 3: Run the focused test and verify GREEN**

Run:

```bash
node --test tests/homeMoodOrbPresentation.test.ts
```

Expected: all tests in `homeMoodOrbPresentation.test.ts` pass.

- [ ] **Step 4: Inspect the scoped diff**

Run:

```bash
git diff -- tests/homeMoodOrbPresentation.test.ts src/index.css
git diff --check -- tests/homeMoodOrbPresentation.test.ts src/index.css
```

Expected: only the approved button contract and Echo Void button rules changed; no whitespace errors.

### Task 3: Verify visually, regressions, and production output

**Files:**
- Verify: `src/index.css`
- Verify: `tests/homeMoodOrbPresentation.test.ts`

- [ ] **Step 1: Run all tracked tests**

Run:

```bash
node --test $(git ls-files 'tests/*.test.ts')
```

Expected: all tracked tests pass. This intentionally excludes the unrelated untracked `tests/backgroundAsset.test.ts`.

- [ ] **Step 2: Run production checks**

Run:

```bash
npm run build
npm run lint
git diff --check
```

Expected: build and lint exit 0; `git diff --check` reports no errors. Existing non-fatal Fast Refresh warnings in `MoodOrb.tsx` may remain unchanged.

- [ ] **Step 3: Verify in a real browser when a clean session slot is available**

Use one newly named Playwright session owned by this task. At a mobile viewport around `445x805` and a desktop viewport around `1280x900`, confirm:

- the sparse stars remain visible through the button but are substantially blurred;
- the capsule is dark and transparent, not a gray solid fill;
- the cool rim, upper-left highlight, inner dark edge, and slow sheen read as glass without green chromatic edges;
- hover, press, focus, and reduced-motion behavior remain legible;
- text stays clear and the page has no horizontal overflow.

Close only this task's session, verify it disappears from `playwright-cli --json list --all`, and run Browser Guardian status.

- [ ] **Step 4: Commit only this task's implementation files**

Run:

```bash
git add src/index.css tests/homeMoodOrbPresentation.test.ts
git diff --cached --check
git commit -m "style: refine dark glass confirm button"
```

Expected: the commit contains exactly the CSS implementation and its contract tests; unrelated untracked assets and task documents remain untouched.

- [ ] **Step 5: Push and verify GitHub Pages**

Run:

```bash
git push publish HEAD:main
```

Expected: `publish/main` advances to the implementation commit; the Pages deployment succeeds and the deployed URL returns HTTP 200.

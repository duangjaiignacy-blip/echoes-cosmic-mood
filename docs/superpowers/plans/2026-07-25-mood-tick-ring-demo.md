# Mood Tick Ring Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bottom mood dots with a 15-step radial tick ring whose nearby text labels crossfade after the user expands the control.

**Architecture:** Keep the existing continuous swipe position and raster mood assets. Add one pure text-pose model, render ticks and labels inside `MoodOrbitCarousel`, and keep the collapsed/expanded state in `Home` so the interaction remains isolated from later screens.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, Vite.

---

### Task 1: Define radial text behavior

**Files:**
- Modify: `src/components/moodSwipeModel.ts`
- Test: `tests/moodSwipeModel.test.ts`

- [ ] Add failing tests proving the current word is fully visible, immediate neighbors are partially visible only when expanded, remote words are hidden, and the current tick resolves to the lower focus angle.
- [ ] Run `node --test tests/moodSwipeModel.test.ts` and confirm the new tests fail because `moodOrbitTextPose` is missing.
- [ ] Implement `moodOrbitTextPose` and `moodTickAngle` as pure functions using circular distance from the existing continuous position.
- [ ] Re-run `node --test tests/moodSwipeModel.test.ts` and confirm all model tests pass.

### Task 2: Render the 15-tick interactive ring

**Files:**
- Modify: `src/components/MoodOrbitCarousel.tsx`
- Modify: `src/pages/Home.tsx`
- Test: `tests/homeMoodOrbPresentation.test.ts`

- [ ] Add failing source-contract tests for `expanded`, `onExpandedChange`, exactly 15 mapped tick buttons, a text-orbit layer, and the absence of arrow glyphs in the Echo mood label.
- [ ] Run `node --test tests/homeMoodOrbPresentation.test.ts` and confirm the new assertions fail.
- [ ] Add the central expand button and radial tick/text markup while preserving the existing active mood artwork and selection callbacks.
- [ ] Add `orbitExpanded` state in `Home`, pass it to the carousel, open it when a tick is selected, and update the hint copy.
- [ ] Re-run `node --test tests/homeMoodOrbPresentation.test.ts` and confirm the presentation tests pass.

### Task 3: Apply the refined cosmic motion styling

**Files:**
- Modify: `src/index.css`
- Test: `tests/homeMoodOrbPresentation.test.ts`

- [ ] Add failing CSS assertions for the close-fitting radial ring, selected tick, faded text states, central invisible hit target, and reduced-motion transitions.
- [ ] Run the focused presentation test and confirm it fails on missing styles.
- [ ] Replace the bottom dot-row CSS with the radial 15-tick ring and add restrained opacity/scale transitions for the text labels.
- [ ] Re-run the focused test and confirm it passes.

### Task 4: Verify and publish the demo

**Files:**
- Verify only: all tracked implementation files

- [ ] Run `node --test tests/moodSwipeModel.test.ts tests/homeMoodOrbPresentation.test.ts`.
- [ ] Run `npm run lint` and `npm run build -- --base=/echoes-cosmic-mood/`.
- [ ] Use a named Playwright session at 513×769 to verify collapsed, expanded, drag, selection, console errors and horizontal overflow.
- [ ] Close only the named session, verify it is absent from `playwright-cli --json list --all`, and run Browser Guardian status.
- [ ] Stage only the spec, plan and tracked Demo files; commit, push to `publish/main`, watch the Pages workflow, and confirm the public URL returns the updated Demo.


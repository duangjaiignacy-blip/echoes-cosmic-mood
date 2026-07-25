# Starfield Density Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce perceived WebGL star density while preserving the current large stars, brightness, depth motion, pointer response, and vortex-free background.

**Architecture:** Keep the renderer and global settings unchanged. Name and lower only the shader population constants for micro dust and two middle-distance layers, leaving the two foreground layers untouched.

**Tech Stack:** TypeScript, GLSL ES 1.00, Node test runner, Vite, Playwright CLI.

---

### Task 1: Lock the sparse population contract

**Files:**
- Modify: `tests/blackHoleGalaxyShader.test.ts`
- Modify: `src/components/blackHoleGalaxyShader.ts`

- [ ] Update the shader contract test to require:

```ts
assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float MICRO_DUST_POPULATION = 0\.16/)
assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float FINE_STAR_POPULATION = 0\.079/)
assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const float MID_STAR_POPULATION = 0\.056/)
```

- [ ] Run `node --test tests/blackHoleGalaxyShader.test.ts` and confirm it fails on the old `0.26` micro-dust constant.

- [ ] Add these shader constants:

```glsl
const float MICRO_DUST_POPULATION = 0.16;
const float FINE_STAR_POPULATION = 0.079;
const float MID_STAR_POPULATION = 0.056;
```

Use `FINE_STAR_POPULATION` for the `scale 214.0` layer and `MID_STAR_POPULATION` for the `scale 132.0` layer. Do not change the `72.0` and `34.0` foreground populations.

- [ ] Rerun the focused test and confirm it passes.

### Task 2: Verify and publish

**Files:** Verification and Git metadata only.

- [ ] Run all tracked tests with `node --test $(git ls-files 'tests/*.test.ts')`.
- [ ] Run `npm run build`, `npm run lint`, and `git diff --check`.
- [ ] In one named Playwright session, capture the 445×805 `?bgDemo=black-hole` page and confirm more black negative space with the large stars retained.
- [ ] Close only that browser session and run Browser Guardian status.
- [ ] Commit the scoped shader, test, specification, and plan changes.
- [ ] Push `HEAD:main` to `publish`, wait for GitHub Pages, and verify the public URL returns HTTP 200 with title `Milo-米洛`.

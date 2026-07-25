# Milo-米洛 Emotion Gravity Poster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce one polished vertical Milo-米洛 “情绪引力场” concept poster that combines the approved editorial typography, black-silver singularity background, and real project assets.

**Architecture:** Generate only the black-silver vortex backdrop with the image tool, then assemble a deterministic HTML/CSS poster over it. The compositor uses the existing calm mood-orb sheet and Demo QR so the project identity and Chinese copy stay exact; Chromium renders the final 2480 × 3508 PNG.

**Tech Stack:** Built-in image generation, HTML/CSS, existing Milo PNG assets, Vite, Playwright/Chromium, macOS image inspection.

---

### Task 1: Generate the background plate

**Files:**
- Create: `output/posters/concepts/emotion-gravity/assets/emotion-gravity-background.png`

- [ ] **Step 1: Generate a text-free vertical background using both references**

Use the built-in image generator with the two user-provided reference images and this exact direction:

```text
Create a new portrait A-series poster background plate. Reference image 1 contributes only restrained editorial negative space and paper-grain sophistication. Reference image 2 contributes only the black-silver hand-drawn singularity, streaming star-dust lines, and immense gravitational depth. Build a huge luminous silver vortex entering from the upper-left and curving toward the lower center. Keep the upper 20 percent and lower 15 percent quiet enough for typography. Near the lower-middle, open a dark circular pocket where a lavender emotion planet will be composited later. Deep black, charcoal, graphite, moon-silver, cold white; subtle tactile paper grain. No typography, no letters, no logo, no planet, no character, no person, no green hill, no watermark, no signature, no frame, no neon rainbow colors. Original composition, not a copy of either reference.
```

- [ ] **Step 2: Save the generated plate into the concept folder**

Create the asset folder if needed, then copy the selected generated PNG to the exact path above without overwriting any existing approved poster.

- [ ] **Step 3: Inspect the plate**

Open the image at high detail. Require: portrait composition, strong silver flow, quiet typography zones, no text, no people, no copied watermark, and a dark central pocket.

### Task 2: Assemble the Milo poster source

**Files:**
- Create: `output/posters/concepts/emotion-gravity/source/poster.html`
- Create: `output/posters/concepts/emotion-gravity/source/poster.css`

- [ ] **Step 1: Create the semantic poster HTML**

Use these exact content blocks and asset paths:

```html
<main class="poster">
  <img class="gravity-background" src="../assets/emotion-gravity-background.png" alt="" />
  <header class="masthead">
    <span>Milo-米洛</span><span>FEEL</span><span>REMEMBER</span><span>AI 情绪回忆日记</span>
  </header>
  <section class="title-lockup">
    <span class="kicker">THE FEELING REMEMBERS BEFORE YOU DO</span>
    <h1><span>情绪</span><span>回响</span></h1>
    <div class="title-axis"><span>“ 看见情绪的来处 ”</span><b>EMOTIONAL ECHO</b><span>“ 回到过去的一天 ”</span></div>
  </section>
  <section class="planet-stage" aria-label="平静情绪星球与十五段情绪环">
    <div class="dial"></div>
    <div class="calm-planet"><img src="../../../../../docs/superpowers/concepts/mood-orbs/02-calm-okay-bright-transparent.png" alt="平静情绪星球" /></div>
    <span class="mood calm">平静</span><span class="mood anxious">焦虑</span><span class="mood joyful">喜悦</span><span class="mood nostalgic">怀念</span>
  </section>
  <section class="manifesto">
    <strong>从此刻的情绪，回到过去的某一天。</strong>
    <span>让 AI 陪你看见情绪的来处，把那一天写成日记。</span>
  </section>
  <footer>
    <div class="facts"><span>15 种情绪</span><span>AI 温柔引导</span><span>本地保存</span></div>
    <div class="qr"><span>扫码体验 Milo</span><img src="../../../assets/demo-qr.png" alt="Milo Demo 二维码" /></div>
  </footer>
</main>
```

- [ ] **Step 2: Create the isolated poster CSS**

Define a 2480 × 3508 canvas, Songti title stack, thin silver axes, the generated background at full bleed, a 15-segment conic dial, the first sprite panel cropped with `img { width: 300%; left: -11%; }`, restrained violet glow, bottom manifesto, facts, and a black-on-white QR using `filter: invert(1)`. Keep all layout rules scoped under `.poster` and do not modify the existing A/B/C poster system.

- [ ] **Step 3: Verify source content**

Run:

```bash
rg -n "Milo-米洛|情绪回响|从此刻的情绪|15 种情绪|demo-qr" output/posters/concepts/emotion-gravity/source
```

Expected: every approved project phrase and asset reference appears once in the HTML.

### Task 3: Render the concept PNG

**Files:**
- Create: `output/posters/concepts/emotion-gravity/milo-emotion-gravity-concept.png`
- Create: `output/playwright/milo-emotion-gravity-render-20260725/playwright-cli.json`

- [ ] **Step 1: Start the existing Vite project**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5175
```

Expected: Vite serves the worktree at `http://127.0.0.1:5175`.

- [ ] **Step 2: Create an isolated Playwright render configuration**

```json
{
  "browser": {
    "launchOptions": { "headless": true },
    "contextOptions": {
      "viewport": { "width": 2480, "height": 3508 },
      "deviceScaleFactor": 1
    }
  }
}
```

- [ ] **Step 3: Render the poster element**

Open the concept HTML in the named session `milo-emotion-gravity-render-20260725`, snapshot the page, confirm the `.poster` bounds are 2480 × 3508, and take an element screenshot to the final concept PNG.

- [ ] **Step 4: Check image dimensions**

Run:

```bash
sips -g pixelWidth -g pixelHeight output/posters/concepts/emotion-gravity/milo-emotion-gravity-concept.png
```

Expected: `pixelWidth: 2480` and `pixelHeight: 3508`.

### Task 4: Visual verification and cleanup

**Files:**
- Verify: `output/posters/concepts/emotion-gravity/milo-emotion-gravity-concept.png`

- [ ] **Step 1: Inspect the full poster**

Require: legible exact Chinese, no clipping, the real calm planet, a rigid 15-segment ring, visible black-silver vortex, and a scannable QR.

- [ ] **Step 2: Make at most one targeted correction**

If needed, change only the single failed layer (background crop, title spacing, planet size, or footer contrast), re-render, and re-check.

- [ ] **Step 3: Close only this task's browser session**

Close `milo-emotion-gravity-render-20260725`, verify it disappears from `playwright-cli --json list --all`, leave unrelated sessions untouched, and run Codex Browser Guardian status.

- [ ] **Step 4: Report the final artifact**

Return the PNG inline and provide its absolute workspace path. State that the background came from the built-in image generator while the typography and Milo elements were composed from project assets.

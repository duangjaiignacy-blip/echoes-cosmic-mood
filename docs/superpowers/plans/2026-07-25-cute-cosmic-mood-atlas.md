# Cute Cosmic Mood Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate, inspect, and preserve five consistent triptych boards covering the approved 15-state cute cosmic mood-orb atlas.

**Architecture:** Use the built-in image generation tool once per distinct triptych, always referencing the latest approved cute circular-orb concept as the material and expression anchor. Persist each accepted preview under `docs/superpowers/concepts/mood-orbs/`; do not modify application code or integrate the images into the Demo during this concept-review phase.

**Tech Stack:** Built-in `image_gen`, local filesystem inspection, raster concept boards.

---

## File structure

- Create `docs/superpowers/concepts/mood-orbs/01-very-low-low-heavy.png`: 非常低落 / 低落 / 有些沉.
- Create `docs/superpowers/concepts/mood-orbs/02-calm-okay-bright.png`: 平静 / 还不错 / 明亮.
- Create `docs/superpowers/concepts/mood-orbs/03-joyful-lonely-sad.png`: 雀跃 / 孤独 / 悲伤.
- Create `docs/superpowers/concepts/mood-orbs/04-angry-afraid-disappointed.png`: 愤怒 / 害怕 / 失望.
- Create `docs/superpowers/concepts/mood-orbs/05-anxious-aggrieved-embarrassed.png`: 焦虑 / 委屈 / 尴尬.
- Do not modify or stage the unrelated untracked `tests/backgroundAsset.test.ts` file.

## Shared generation token

Every prompt must repeat these invariants:

```text
Use the latest approved corrective triptych as the primary style and material reference: cute thin dark-navy hand-drawn expressions, tiny hands, blush and external emotion marks integrated with luminous cosmic glass.
All three core bodies are identical-size mathematically perfect circular spheres with smooth unbroken boundaries. No silhouette deformation, horns, ears, dents, stretching, pear shape, or teardrop body.
Shared material: bright translucent cosmic glass, soft moon-silver rim light, pastel inner illumination, subtle nebula and micro-stars, near-pure black dense starfield backdrop.
Faces use thin rounded imperfect ink lines, mild asymmetry, small gesture details, and readable emotional storytelling. Avoid generic emoji stickers, thick black lines, mechanical symmetry, realistic human features, plastic toys, text, logos, and watermarks.
Composition: three equal circles left-to-right, straight-on, centered vertically, identical scale, generous separation, no labels or text.
```

### Task 1: Generate the low-valence triptych

**Files:**
- Create: `docs/superpowers/concepts/mood-orbs/01-very-low-low-heavy.png`

- [ ] **Step 1: Generate the board with this complete mood content**

```text
Left — 非常低落: deep indigo and graphite with very dim blue; nearly closed uneven eyes, tiny trembling mouth, small hands wrapping the lower front; most internal light has sunk to the bottom; sparse slow stars; two dim detached droplets and a faint broken lower halo.
Center — 低落: slate blue and dusty lavender; lowered eyes, small downturned mouth, blush, hands resting low; cool cloud bank below center; one tear and two short downward lines outside.
Right — 有些沉: smoky violet-gray and moon silver; half-lidded eyes, short flat mouth, one hand supporting the cheek; dense fog band moving down; a small weighted arc and one soft sigh curve outside.
The three faces must differ clearly in eye openness, gesture, and intensity while remaining related as a low-valence family.
```

- [ ] **Step 2: Inspect the output**

Confirm all three boundaries are perfect circles, the three states are distinguishable without labels, facial lines remain thin, and no text or watermark appears.

- [ ] **Step 3: Persist the accepted generated file**

Copy the built-in output non-destructively to:

```text
docs/superpowers/concepts/mood-orbs/01-very-low-low-heavy.png
```

### Task 2: Generate the positive-middle triptych

**Files:**
- Create: `docs/superpowers/concepts/mood-orbs/02-calm-okay-bright.png`

- [ ] **Step 1: Generate the board with this complete mood content**

```text
Left — 平静: pearl silver and pale lavender-blue; gently closed asymmetric eyes, tiny relaxed lopsided smile, blush, small hands resting softly; smooth horizontal nebula waves; two slow breathing curves and one complete faint halo.
Center — 还不错: silver rose and muted lilac; soft open eyes, small warm smile, one tiny waving hand; inner cloud band lifting; one small sparkle and one gentle orbit dot outside.
Right — 明亮: warm pearl, pale gold and silver; curved happy eyes, clear smile, light blush, two open tiny hands; upward expanding inner light; three small four-point sparkles and a complete brighter halo.
The progression must read as calm → gently positive → luminous without turning into three identical smiling faces.
```

- [ ] **Step 2: Inspect the output**

Confirm the positive progression is visible through eye openness, hand gesture, warmth, star brightness, and halo intensity while every sphere remains the same circle.

- [ ] **Step 3: Persist the accepted generated file**

```text
docs/superpowers/concepts/mood-orbs/02-calm-okay-bright.png
```

### Task 3: Generate joyful, lonely, and sad states

**Files:**
- Create: `docs/superpowers/concepts/mood-orbs/03-joyful-lonely-sad.png`

- [ ] **Step 1: Generate the board with this complete mood content**

```text
Left — 雀跃: rose gold, peach and warm white; lively uneven eyes, cute open delighted mouth, strong blush, both tiny hands raised; buoyant nebula curls; orbiting dots, tiny confetti sparks and upward motion curves.
Center — 孤独: dusty pink, muted lavender and gray; small face placed slightly lower, watery eyes, arms hugging the front; one isolated internal star cluster with extra empty space; incomplete halo and distant dots retreating outward.
Right — 悲伤: cool sky blue, lilac and silver; drooping uneven eyes, trembling mouth, two tears, one tiny hand holding a tissue; cloud gathered at the bottom with fine internal rain; detached droplets and short rain trails outside.
Loneliness and sadness must not reuse the same face or gesture: loneliness is self-hugging and empty; sadness is crying and seeking comfort.
```

- [ ] **Step 2: Inspect the output**

Confirm joyful energy remains cute rather than manic, loneliness reads through space and self-hugging, and sadness reads through tissue and tears.

- [ ] **Step 3: Persist the accepted generated file**

```text
docs/superpowers/concepts/mood-orbs/03-joyful-lonely-sad.png
```

### Task 4: Generate anger, fear, and disappointment

**Files:**
- Create: `docs/superpowers/concepts/mood-orbs/04-angry-afraid-disappointed.png`

- [ ] **Step 1: Generate the board with this complete mood content**

```text
Left — 愤怒: coral red, ember orange and charcoal; small intense eyes, thin inward brows, puffed blushing cheeks, compact wobbly frown, two cute clenched hands; turbulent converging inner currents; one anger mark, two sparks and short vibration lines outside. Angry but adorable, never frightening.
Center — 害怕: pale amber, cream and graphite; wide mismatched eyes, small open mouth, hands close to cheeks; internal light contracted toward the center; three sweat drops and two non-text motion strokes outside.
Right — 失望: desaturated cyan and blue-gray; closed downward eyes, small sighing mouth, one hand holding a tissue low; diagonal drizzle across a dim internal cloud; slanted rain lines and one fading sparkle outside.
Anger is confrontational energy, fear is startled contraction, and disappointment is quiet collapse; keep their faces and postures clearly different.
```

- [ ] **Step 2: Inspect the output**

Confirm anger stays lovable, fear does not look merely surprised, disappointment does not duplicate sadness, and no external mark changes the circular boundary.

- [ ] **Step 3: Persist the accepted generated file**

```text
docs/superpowers/concepts/mood-orbs/04-angry-afraid-disappointed.png
```

### Task 5: Generate anxiety, grievance, and embarrassment

**Files:**
- Create: `docs/superpowers/concepts/mood-orbs/05-anxious-aggrieved-embarrassed.png`

- [ ] **Step 1: Generate the board with this complete mood content**

```text
Left — 焦虑: pale mint, gray-green and silver; worried uneven eyes, small zigzag mouth, hands touching cheeks; thin internal currents circling without settling; loose scribble halo, sweat beads and restless motion lines outside.
Center — 委屈: powder blue, soft lilac and pink blush; large watery eyes, tiny puckered lower lip, hands held tightly at the chest; bright liquid-like stars pooled behind the eyes; two round tear bubbles and a small uneven halo outside. Cute restrained grievance, not ordinary sadness.
Right — 尴尬: orchid pink, muted magenta and silver; sidelong asymmetric eyes, tiny awkward open mouth, strong blush hatching, hands held close; inner light shifted sideways; three sweat marks, wobbling orbit line and awkward motion ticks outside.
Anxiety is restless, grievance is watery and held-in, embarrassment is sideways and blush-led.
```

- [ ] **Step 2: Inspect the output**

Confirm each face is unique, the three palettes remain part of the shared system, and all hands and marks stay small enough for a 188px product orb.

- [ ] **Step 3: Persist the accepted generated file**

```text
docs/superpowers/concepts/mood-orbs/05-anxious-aggrieved-embarrassed.png
```

### Task 6: Validate and deliver the complete atlas

**Files:**
- Verify: `docs/superpowers/concepts/mood-orbs/*.png`

- [ ] **Step 1: Verify the file set**

Run:

```bash
find docs/superpowers/concepts/mood-orbs -maxdepth 1 -name '*.png' -type f | sort
```

Expected: exactly the five named PNG files.

- [ ] **Step 2: Verify dimensions and readability**

Inspect every board at original resolution and at a downscaled preview where each orb is approximately 188px wide. Confirm perfect circular boundaries, thin readable expressions, no text, no watermark, no clipped accessories, and consistent material/highlight direction.

- [ ] **Step 3: Commit only the concept atlas**

```bash
git add docs/superpowers/concepts/mood-orbs
git commit -m "design: add cute cosmic mood atlas"
```

Do not stage unrelated changes.

- [ ] **Step 4: Report the review mapping**

Present all five boards inline with their left-to-right mood labels, note that they are concept-review assets rather than integrated product assets, and ask which individual moods need expression refinements before implementation planning.

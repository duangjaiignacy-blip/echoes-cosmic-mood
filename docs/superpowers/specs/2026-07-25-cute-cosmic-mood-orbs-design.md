# Cute Cosmic Mood Orbs Design

## Goal

Create a complete emotional visual system for the center mood orb. Every state keeps the same perfect circular glass-sphere body while color, internal nebula, hand-drawn facial expression, tiny hands, and external emotion marks change to make the feeling immediately readable and genuinely cute.

The approved style combines the current premium cosmic-glass material with the warmth and expressive specificity of the supplied pastel emotion reference.

## Non-Negotiable Shape Rule

- Every core orb is a mathematically perfect circle with the same diameter.
- The circular boundary remains smooth, continuous, and unchanged in every emotion.
- No squeezing, stretching, pear shapes, teardrop bodies, horns, ears, dents, or silhouette deformation.
- Tears, sweat, sparks, breathing curves, scribbles, and gesture lines may float outside the circle.
- Tiny line-drawn hands may sit on the surface or extend slightly beyond it, but they cannot alter the core boundary.

## Shared Visual Language

### Material

- Translucent moon-glass shell with a restrained white rim light.
- Internal micro-stars and a soft nebula layer remain visible in every state.
- Pastel inner illumination keeps dark-navy expression lines readable.
- The result should feel comforting and premium, not like a plastic toy or a generic emoji sticker.

### Expression drawing

- Thin dark-navy ink with rounded ends and mild line-weight variation.
- Slight asymmetry and hand-drawn imperfection are desirable.
- Small eyes, blush hatching, tears, sweat, tissue, hands, and motion marks create an emotional story.
- Avoid bold mechanical symmetry, thick black sticker lines, realistic human features, and exaggerated meme faces.

### Motion vocabulary

- Internal nebula direction communicates emotional energy.
- External marks reinforce the expression without changing the circle.
- Each mood has a restrained loop lasting several seconds; no constant frantic movement.
- Reduced-motion mode uses a static expression and color crossfade only.

## Complete 15-State Atlas

| Mood | Core palette | Face and hands | Internal state | External accents |
|---|---|---|---|---|
| 非常低落 | deep indigo, graphite, dim blue | eyes nearly closed, tiny trembling mouth, hands wrapping the lower front | most light sinks to the bottom; stars are sparse and slow | two very dim descending droplets and a faint broken lower halo |
| 低落 | slate blue, dusty lavender | lowered eyes, small downturned mouth, hands resting low | cool cloud settles below the center | one tear and two short downward lines |
| 有些沉 | smoky violet-gray, moon silver | half-lidded eyes, short flat mouth, one hand supporting the cheek | dense fog band moves slowly downward | a small weighted arc and one soft sigh line |
| 平静 | pearl silver, pale lavender-blue | gently closed uneven eyes, tiny relaxed smile, blush, hands resting softly | smooth horizontal cloud waves and evenly distributed stars | two slow breathing curves and one complete faint halo |
| 还不错 | silver rose, muted lilac | open soft eyes, small lopsided smile, one tiny waving hand | cloud band lifts slightly; stars brighten near the center | one small sparkle and a gentle orbit dot |
| 明亮 | warm pearl, pale gold, silver | curved happy eyes, clear smile, light blush, hands open | inner light expands upward with clean star glints | three small four-point sparkles and a complete bright halo |
| 雀跃 | rose gold, peach, warm white | lively eyes, open delighted mouth, two raised tiny hands | buoyant nebula curls rise in short pulses | orbiting dots, tiny confetti sparks, two upward motion curves |
| 孤独 | dusty pink, muted lavender, gray | small face placed slightly low, watery eyes, arms hugging the front | one isolated star cluster surrounded by more empty space | an incomplete halo and several distant retreating dots |
| 悲伤 | cool sky blue, lilac, silver | drooping uneven eyes, trembling mouth, two tears, one hand holding a tissue | cloud gathers at the bottom and fine rain falls inside | detached droplets and two short rain trails |
| 愤怒 | coral red, ember orange, charcoal | narrow eyes, thin inward brows, puffed cheeks, compact wobbly frown, clenched tiny hands | turbulent red currents converge toward the center | one hand-drawn anger mark, two sparks, short vibration lines |
| 害怕 | pale amber, cream, graphite | wide uneven eyes, small open mouth, hands near cheeks | light contracts toward the center and flickers | three sweat drops and two thin exclamation-like motion strokes without text glyphs |
| 失望 | desaturated cyan, blue-gray | closed downward eyes, small sighing mouth, one hand holding a tissue low | diagonal drizzle crosses a dim cloud bank | short slanted rain lines and one fading sparkle |
| 焦虑 | pale mint, gray-green, silver | worried eyes, small zigzag mouth, hands touching cheeks | several thin currents circle without settling | loose scribble halo, two sweat beads, short restless motion lines |
| 委屈 | powder blue, soft lilac, pink blush | large watery eyes, tiny puckered lower lip, hands held tightly at the chest | bright liquid-like stars pool behind the eyes | two round tear bubbles and a small uneven halo |
| 尴尬 | orchid pink, muted magenta, silver | sidelong uneven eyes, tiny awkward open mouth, strong blush, hands held close | inner light shifts sideways and pauses | three sweat marks, one wobbling orbit line, small awkward motion ticks |

## Intensity Relationships

The first seven states retain the product's current low-to-high valence progression. The eight named emotions are discrete expressive states rather than positions on that single scale.

- Very low / low / heavy states differ mainly by brightness, eye openness, and downward weight.
- Calm / okay / bright / joyful increase openness, warmth, upward motion, and external sparkles.
- Anger, fear, and anxiety are high-arousal negative states with clearly different energy patterns.
- Loneliness, sadness, disappointment, and grievance are low-arousal negative states differentiated by gesture and social meaning.
- Embarrassment uses sideways attention, blush, and sweat rather than sadness cues.

## Product Integration Architecture

When implementation is approved:

- Keep the existing WebGL `MoodOrb` as the circular glass and nebula renderer.
- Add an emotion-visual model keyed by stable mood identifiers rather than relying only on numeric valence.
- Render facial lines and tiny hands as a vector overlay above the canvas so expressions remain crisp at 188px and can be adjusted without modifying the glass shader.
- Render external accents in a separate clipped-safe overlay around the circle; accents are decorative and pointer-inert.
- Drive internal palette, nebula direction, pulse intensity, face paths, accents, and motion profile from one mood-state record.
- Preserve the current 140ms impact change and 480ms bounce; at impact, crossfade the face and palette while the nebula settles over approximately 700ms.
- Keep the first implementation isolated to the Echo Void Demo until the complete atlas is approved in-browser.

## Concept-Review Deliverables

Before writing product code, generate five consistent triptych boards, each containing three equal circular mood orbs:

1. 非常低落 / 低落 / 有些沉
2. 平静 / 还不错 / 明亮
3. 雀跃 / 孤独 / 悲伤
4. 愤怒 / 害怕 / 失望
5. 焦虑 / 委屈 / 尴尬

The boards contain no baked-in labels; labels remain listed alongside the images during review. This prevents generated text errors and keeps eventual UI copy editable.

## Verification Criteria

- All 15 core silhouettes are identical perfect circles.
- Each emotion is recognizable without a written label in a blind visual comparison.
- Adjacent valence states look related but meaningfully distinct.
- Anger, fear, anxiety, sadness, grievance, and disappointment do not reuse the same face.
- Expression lines remain readable when each orb is reduced to the product's 188px display size.
- External accents never overlap neighboring spheres or foreground UI.
- The full set uses one consistent glass material, ink style, highlight direction, and facial scale.
- No generated board contains text, logos, watermarks, deformed bodies, thick generic emoji marks, or realistic human features.

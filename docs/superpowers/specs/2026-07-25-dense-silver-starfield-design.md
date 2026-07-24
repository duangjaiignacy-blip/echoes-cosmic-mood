# Dense Silver Starfield Design

## Goal

Increase the independent Echo Void Demo's background-star density to match the supplied black-hole reference: a deep near-black field filled with layered silver micro-stars, sparse bright anchors, and locally clustered stellar dust. Preserve the existing tiny vortex, foreground orb, typography, controls, interactions, and default URL.

## Scope

- Apply only to `?bgDemo=black-hole` through the existing black-hole WebGL renderer.
- Do not add or replace a static background image.
- Do not alter the current vortex geometry, position, or brightness in this pass.
- Do not alter the mood orb, layout, typography, CTA, swipe interaction, or reduced-motion behavior.
- Do not alter the Aurora/Starfield background rendered at the default URL.

## Visual Direction

The reference uses density variation rather than a uniform scatter. The implementation will use six procedural star layers:

1. A dense field of sub-pixel silver dust that remains visible without becoming gray noise.
2. Two fine background layers at different scales and seeds.
3. Two medium layers that create readable depth and uneven clusters.
4. A sparse highlight layer with a small number of brighter, larger stars.

Most stars remain dim graphite-silver. Bright anchors occupy only a small fraction of the field. Low-frequency noise creates denser stellar lanes and calmer black pockets, with a nonzero density floor so quiet regions are no longer empty.

## Rendering Architecture

- Keep the existing `starLayer` and `layeredStarField` shader boundary.
- Extend `starLayer` with per-layer radius and threshold controls so each layer has a distinct scale and population.
- Add a dedicated micro-dust stage for the smallest high-density points.
- Combine two low-frequency cluster masks so the field has irregular depth rather than one obvious cloud shape.
- Continue applying pointer repulsion only to the starfield coordinates.
- Keep the existing settings and renderer API unchanged unless shader compilation requires a narrowly scoped addition.

## Performance

- Remain a single full-screen WebGL draw call.
- Use deterministic procedural hashes; no textures, network assets, or generated bitmaps.
- Preserve the existing DPR cap and reduced-motion time freeze.
- Avoid additional framebuffers, blending passes, or CPU particle arrays.

## Verification

- Add failing shader-contract tests for six distinct layers, the micro-dust stage, and clustered density masks before implementation.
- Verify all unit tests, TypeScript build, lint, and `git diff --check`.
- Inspect screenshots at 445×805 and 1280×900.
- Compare against the reference for: substantially higher density, several star sizes, silver-only color, local clustering, and retained black breathing space.
- Confirm the background and orb report `webgl`, the console has zero errors, and the default URL remains unchanged.

## Acceptance Criteria

- The Demo no longer reads as sparse at first glance.
- Fine stars form a continuous deep-space texture without turning the background into flat gray grain.
- Medium and bright stars create visible depth and density variation.
- Text and controls remain legible, with no bright cluster competing directly behind the main title.
- The small vortex stays the same visual size and remains secondary to the overall depth.
- The default URL remains visually and behaviorally unchanged.

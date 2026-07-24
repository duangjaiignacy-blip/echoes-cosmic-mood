# Galaxy Depth Motion Design

## Goal

Bring the supplied React Bits `Galaxy` motion language into the existing dense silver Echo Void starfield without importing the component or adding another WebGL canvas. The independent Demo should gain a slow sense of stars travelling through depth, subtle global rotation, per-star drift, twinkle, and smooth pointer repulsion while preserving the current visual design.

## Chosen Approach

Adapt the motion mathematics into the existing raw WebGL shader. Keep the current renderer, uniforms, six-layer density system, silver palette, tiny vortex, fallback, and foreground UI. Do not add the `ogl` dependency.

This keeps one draw call and one WebGL context, avoids competing star systems, and allows the motion to respect the current clustered density masks.

## Scope

- Apply only to `?bgDemo=black-hole` through `BlackHoleGalaxy`.
- Animate only the starfield coordinates and per-star offsets.
- Keep the tiny vortex, spiral dust, and echo stream on their current fixed coordinates.
- Keep the foreground mood orb, typography, CTA, swipe interaction, and layout unchanged.
- Keep the default Aurora/Starfield page unchanged.
- Preserve all existing WebGL fallback and lifecycle behavior.

## Motion Model

### Layered depth cycle

Each of the six star layers receives a unique phase. The phase advances slowly and wraps from 1 back to 0. During the cycle:

- the layer scale expands from approximately 0.84 to 1.24, creating a restrained approach toward the viewer;
- brightness rises after the far boundary and fades before the near boundary, hiding the wrap;
- phases remain evenly distributed so the total field density stays stable.

At the current settings, one full depth cycle should take roughly 40–55 seconds. The effect should feel like space breathing, not a warp-speed tunnel.

### Global rotation

Rotate only the starfield coordinate around the viewport center. Use the existing `uRotationSpeed` at a reduced effective multiplier so the motion is visible over several seconds but does not make the UI feel tilted or unstable.

### Per-star drift and twinkle

Use each star cell's deterministic seed to add a very small two-axis oscillation before distance evaluation. Keep the existing independent twinkle stage and vary its timing by seed. Drift must remain below the size of a star cell and cannot smear stars into streaks.

### Pointer behavior

Retain the existing renderer-side pointer smoothing and shader-side repulsion. Apply repulsion after the slow global starfield rotation so the response remains local to the pointer. The vortex remains unaffected.

### Reduced motion

The renderer already freezes `uTime` when `prefers-reduced-motion: reduce` matches. The new depth, rotation, drift, and twinkle all derive from `uTime`, so they stop automatically while the static starfield remains visible and pointer behavior stays usable.

## Rendering Boundaries

- Add small shader helpers for triangular/smoothed depth timing and animated layer composition.
- Keep `starLayer` responsible for one deterministic cell population.
- Keep `layeredStarField` responsible for density masks and combining exactly six phased layers.
- In `main`, transform a star-only coordinate, then pass it through pointer repulsion and `layeredStarField`.
- Continue sending unmodified `uv - vortexCenter` to `tinyVortex`, `spiralDust`, and `echoStream`.

## Performance

- One fullscreen draw call and one WebGL context.
- No OGL, textures, framebuffers, CPU particles, or additional DOM canvas.
- Reuse existing uniforms and DPR cap.
- Avoid adding noise octaves; the motion uses arithmetic and existing hashes.

## Verification

- Add failing shader-contract tests for phased depth motion, star-only rotation, deterministic drift, and fixed vortex coordinates.
- Verify focused tests, all project tests, production build, lint, and whitespace.
- Record the starfield canvas at two separated timestamps and confirm the rendered frame changes while the vortex center and foreground layout remain fixed.
- Verify pointer movement changes the starfield response without moving the vortex.
- Emulate reduced motion and confirm sampled frames remain stable over time.
- Inspect 445×805 and 1280×900 screenshots for retained density, readability, and the absence of tunnel-like over-scaling.
- Confirm zero console errors and unchanged default URL isolation.

## Acceptance Criteria

- The starfield visibly but gently travels through depth when observed for several seconds.
- Rotation reads as ambient drift rather than obvious spinning.
- Individual stars drift and twinkle without streaking.
- The dense silver/graphite appearance remains consistent with the approved reference direction.
- The tiny vortex stays fixed in size, position, and motion character.
- Reduced-motion mode stops all time-driven background movement.
- The default page remains visually and behaviorally unchanged.

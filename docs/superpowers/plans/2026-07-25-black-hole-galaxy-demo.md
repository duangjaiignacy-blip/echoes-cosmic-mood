# Echoes Black Hole Galaxy Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a query-parameter-only dynamic black-hole galaxy background demo that preserves the existing default Echoes background and product interactions.

**Architecture:** A tested model owns the supplied Galaxy settings, demo URL detection, DPR cap, and pointer normalization. A raw WebGL renderer draws a full-screen procedural event horizon, silver accretion disk, upper-left particle stream, and interactive star layers; a thin React component owns its lifecycle and `App` selects it only for `?bgDemo=black-hole`.

**Tech Stack:** React 19, TypeScript 6, Vite 8, native WebGL 1.0 / GLSL ES 1.00, Node 22 built-in test runner, Playwright CLI.

---

## File structure

- Create `src/components/blackHoleGalaxyModel.ts`: settings, demo-query detection, DPR cap, and pointer normalization.
- Create `src/components/blackHoleGalaxyShader.ts`: full-screen vertex shader and procedural black-hole fragment shader.
- Create `src/components/blackHoleGalaxyRenderer.ts`: WebGL setup, animation, pointer smoothing, resize, reduced motion, and cleanup.
- Create `src/components/BlackHoleGalaxy.tsx`: React lifecycle and CSS fallback boundary.
- Modify `src/App.tsx`: render the demo background only when `bgDemo=black-hole`; preserve the existing background otherwise.
- Modify `src/index.css`: full-screen canvas, readability veil, and CSS black-hole fallback.
- Create `tests/blackHoleGalaxyModel.test.ts`: deterministic model behavior.
- Create `tests/blackHoleGalaxyShader.test.ts`: shader interface and shape-stage contract.
- Create `tests/blackHoleGalaxyRenderer.test.ts`: buffer sizing and unavailable-WebGL fallback.

### Task 1: Establish the demo settings and URL model

**Files:**
- Create: `tests/blackHoleGalaxyModel.test.ts`
- Create: `src/components/blackHoleGalaxyModel.ts`

- [ ] **Step 1: Write the failing model tests**

Create `tests/blackHoleGalaxyModel.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  BLACK_HOLE_GALAXY_SETTINGS,
  capBackgroundDpr,
  isBlackHoleGalaxyDemo,
  normalizePointer,
} from '../src/components/blackHoleGalaxyModel.ts'

test('demo detection enables only the explicit black-hole query value', () => {
  assert.equal(isBlackHoleGalaxyDemo('?bgDemo=black-hole'), true)
  assert.equal(isBlackHoleGalaxyDemo('?bgDemo=galaxy'), false)
  assert.equal(isBlackHoleGalaxyDemo(''), false)
})

test('settings preserve the supplied Galaxy motion values', () => {
  assert.deepEqual(BLACK_HOLE_GALAXY_SETTINGS, {
    starSpeed: 0.7,
    density: 1.7,
    hueShift: 140,
    speed: 1.4,
    glowIntensity: 0.45,
    saturation: 0.15,
    mouseRepulsion: true,
    repulsionStrength: 2,
    twinkleIntensity: 0.4,
    rotationSpeed: 0.1,
    transparent: true,
  })
})

test('background DPR is capped at 1.5', () => {
  assert.equal(capBackgroundDpr(0.5), 1)
  assert.equal(capBackgroundDpr(2), 1.5)
})

test('pointer normalization converts DOM coordinates to bottom-left WebGL space', () => {
  const rect = { left: 10, top: 20, width: 200, height: 100 }
  assert.deepEqual(normalizePointer(110, 45, rect), [0.5, 0.75])
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/blackHoleGalaxyModel.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `blackHoleGalaxyModel.ts`.

- [ ] **Step 3: Implement the model**

Create `src/components/blackHoleGalaxyModel.ts`:

```ts
export interface BlackHoleGalaxySettings {
  starSpeed: number
  density: number
  hueShift: number
  speed: number
  glowIntensity: number
  saturation: number
  mouseRepulsion: boolean
  repulsionStrength: number
  twinkleIntensity: number
  rotationSpeed: number
  transparent: boolean
}

export const BLACK_HOLE_GALAXY_SETTINGS: BlackHoleGalaxySettings = {
  starSpeed: 0.7,
  density: 1.7,
  hueShift: 140,
  speed: 1.4,
  glowIntensity: 0.45,
  saturation: 0.15,
  mouseRepulsion: true,
  repulsionStrength: 2,
  twinkleIntensity: 0.4,
  rotationSpeed: 0.1,
  transparent: true,
}

export function isBlackHoleGalaxyDemo(search: string): boolean {
  return new URLSearchParams(search).get('bgDemo') === 'black-hole'
}

export function capBackgroundDpr(dpr: number): number {
  return Math.max(1, Math.min(1.5, dpr))
}

export function normalizePointer(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): [number, number] {
  return [
    Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
    Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)),
  ]
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run `npm test && npm run build && npm run lint`. Expected: tests PASS; build and lint exit 0 with only the existing Fast Refresh warning.

```bash
git add src/components/blackHoleGalaxyModel.ts tests/blackHoleGalaxyModel.test.ts
git commit -m "test: define black hole galaxy demo settings"
```

### Task 2: Add the procedural black-hole shader

**Files:**
- Create: `tests/blackHoleGalaxyShader.test.ts`
- Create: `src/components/blackHoleGalaxyShader.ts`

- [ ] **Step 1: Write the failing shader contract**

Create `tests/blackHoleGalaxyShader.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { BLACK_HOLE_FRAGMENT_SHADER, BLACK_HOLE_VERTEX_SHADER } from '../src/components/blackHoleGalaxyShader.ts'

test('shader exposes every settings and interaction uniform', () => {
  assert.match(BLACK_HOLE_VERTEX_SHADER, /attribute vec2 aPosition/)
  for (const name of [
    'uResolution', 'uTime', 'uPointer', 'uPointerActive', 'uStarSpeed', 'uDensity',
    'uHueShift', 'uSpeed', 'uGlowIntensity', 'uSaturation', 'uRepulsionStrength',
    'uTwinkleIntensity', 'uRotationSpeed',
  ]) {
    assert.match(BLACK_HOLE_FRAGMENT_SHADER, new RegExp(`uniform .* ${name};`))
  }
})

test('fragment shader contains the reference-image shape stages', () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float eventHorizon/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float accretionDisk/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float particleStream/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /float starLayer/)
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec2 repelPointer/)
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/blackHoleGalaxyShader.test.ts`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `blackHoleGalaxyShader.ts`.

- [ ] **Step 3: Implement the shader**

Create `src/components/blackHoleGalaxyShader.ts` with these complete stages and public constants:

```ts
export const BLACK_HOLE_VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const BLACK_HOLE_FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerActive;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform float uRepulsionStrength;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  for (int octave = 0; octave < 5; octave++) {
    value += noise2(p) * amplitude;
    p = p * 2.03 + vec2(17.2, 9.4);
    amplitude *= 0.5;
  }
  return value;
}

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

vec3 hueColor(float hue) {
  return 0.5 + 0.5 * cos(6.2831853 * (hue + vec3(0.0, 0.333, 0.667)));
}

vec2 repelPointer(vec2 uv, vec2 pointer) {
  vec2 delta = uv - pointer;
  float distanceToPointer = max(length(delta), 0.025);
  float influence = exp(-distanceToPointer * 8.0) * uPointerActive;
  return uv + normalize(delta) * influence * uRepulsionStrength * 0.035;
}

float starLayer(vec2 uv, float scale, float layerSeed) {
  vec2 grid = uv * scale + layerSeed;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float seed = hash21(cell + layerSeed);
  vec2 offset = vec2(seed, hash21(cell + 7.31)) - 0.5;
  float distanceToStar = length(local - offset * 0.65);
  float radius = mix(0.035, 0.085, seed);
  float star = 1.0 - smoothstep(0.0, radius, distanceToStar);
  float threshold = 1.0 - 0.035 * uDensity;
  float twinkle = 1.0 + sin(uTime * (1.5 + seed * 3.0) + seed * 40.0) * uTwinkleIntensity;
  return star * step(threshold, seed) * twinkle;
}

float eventHorizon(vec2 point, float radius) {
  return 1.0 - smoothstep(radius * 0.92, radius * 1.08, length(point));
}

float accretionDisk(vec2 point, float radius) {
  vec2 disk = rotate2d(-0.314159 - uTime * uRotationSpeed * 0.12) * point;
  vec2 elliptical = vec2(disk.x, disk.y / 0.34);
  float r = length(elliptical);
  float angle = atan(elliptical.y, elliptical.x);
  float inner = radius * 1.12;
  float outer = radius * 5.2;
  float mask = smoothstep(inner, inner + 0.035, r) * (1.0 - smoothstep(outer * 0.72, outer, r));
  float flow = angle * 9.0 + r * 135.0 - uTime * uSpeed * 2.2;
  float strands = pow(0.5 + 0.5 * sin(flow + fbm(elliptical * 7.0) * 9.0), 9.0);
  float hotRing = exp(-abs(r - radius * 1.5) * 28.0);
  float front = mix(0.55, 1.0, 1.0 - smoothstep(-0.16, 0.18, disk.y));
  return mask * front * (0.12 + strands * 0.9 + hotRing * 1.4);
}

float particleStream(vec2 point, float radius) {
  vec2 direction = normalize(vec2(-0.72, 0.69));
  vec2 normal = vec2(-direction.y, direction.x);
  float along = dot(point - direction * radius * 0.6, direction);
  float across = abs(dot(point, normal));
  float coneWidth = radius * 0.45 + max(along, 0.0) * 0.18;
  float cone = 1.0 - smoothstep(coneWidth * 0.25, coneWidth, across);
  float lengthFade = smoothstep(0.0, radius * 0.5, along) * (1.0 - smoothstep(radius * 2.0, radius * 7.5, along));
  float dust = smoothstep(0.42, 0.82, fbm(point * 24.0 - uTime * uSpeed * 0.18));
  return cone * lengthFade * dust;
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 scale = vec2(aspect, 1.0);
  vec2 uv = (vUv * 2.0 - 1.0) * scale;
  vec2 center = vec2(0.0, -0.06);
  vec2 point = uv - center;
  float landscape = smoothstep(0.8, 1.45, aspect);
  float radius = mix(0.12, 0.18, landscape);

  vec2 pointer = (uPointer * 2.0 - 1.0) * scale;
  vec2 interactiveUv = repelPointer(uv, pointer);
  vec2 lensPoint = interactiveUv - center;
  float lensDistance = max(length(lensPoint), radius * 0.75);
  vec2 lensedUv = interactiveUv + normalize(lensPoint) * radius * radius * 0.12 / lensDistance;

  float starTime = uTime * uStarSpeed * 0.012;
  float stars = starLayer(lensedUv + vec2(starTime, -starTime * 0.4), 58.0, 3.1);
  stars += starLayer(lensedUv - vec2(starTime * 0.35, starTime), 112.0, 17.7) * 0.65;

  float disk = accretionDisk(point, radius);
  float stream = particleStream(point, radius);
  float horizon = eventHorizon(point, radius);
  float rim = exp(-abs(length(point) - radius * 1.08) * 48.0);

  vec3 coldTint = hueColor(fract(uHueShift / 360.0));
  vec3 silver = mix(vec3(1.0), coldTint, uSaturation);
  vec3 color = silver * stars * (0.65 + uGlowIntensity);
  color += mix(vec3(0.62, 0.68, 0.78), silver, 0.55) * stream * 0.55;
  color += silver * disk * (0.72 + uGlowIntensity * 0.85);
  color += vec3(0.72, 0.78, 0.9) * rim * uGlowIntensity * 0.3;
  color *= 1.0 - horizon;

  float alpha = clamp(max(max(color.r, color.g), color.b) * 1.45, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`
```

- [ ] **Step 4: Verify GREEN and commit**

Run `node --test tests/blackHoleGalaxyShader.test.ts && npm test`.

```bash
git add src/components/blackHoleGalaxyShader.ts tests/blackHoleGalaxyShader.test.ts
git commit -m "feat: add procedural black hole galaxy shader"
```

### Task 3: Implement the full-screen renderer

**Files:**
- Create: `tests/blackHoleGalaxyRenderer.test.ts`
- Create: `src/components/blackHoleGalaxyRenderer.ts`

- [ ] **Step 1: Write failing renderer tests**

Create `tests/blackHoleGalaxyRenderer.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { BLACK_HOLE_GALAXY_SETTINGS } from '../src/components/blackHoleGalaxyModel.ts'
import {
  createBlackHoleGalaxyRenderer,
  resizeBlackHoleBuffer,
} from '../src/components/blackHoleGalaxyRenderer.ts'

test('resizeBlackHoleBuffer caps full-screen DPR at 1.5', () => {
  const canvas = { clientWidth: 100, clientHeight: 50, width: 0, height: 0 } as HTMLCanvasElement
  assert.equal(resizeBlackHoleBuffer(canvas, 2), true)
  assert.equal(canvas.width, 150)
  assert.equal(canvas.height, 75)
  assert.equal(resizeBlackHoleBuffer(canvas, 2), false)
})

test('renderer falls back when WebGL is unavailable', () => {
  let failed = false
  const canvas = { getContext: () => null } as unknown as HTMLCanvasElement
  const renderer = createBlackHoleGalaxyRenderer(
    canvas,
    BLACK_HOLE_GALAXY_SETTINGS,
    () => undefined,
    () => { failed = true },
  )
  assert.equal(renderer, null)
  assert.equal(failed, true)
})
```

- [ ] **Step 2: Verify RED**

Run `node --test tests/blackHoleGalaxyRenderer.test.ts`.

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement renderer lifecycle**

Create `src/components/blackHoleGalaxyRenderer.ts`:

```ts
import { compileShader } from './glassyOrbRenderer.ts'
import { BLACK_HOLE_FRAGMENT_SHADER, BLACK_HOLE_VERTEX_SHADER } from './blackHoleGalaxyShader.ts'
import {
  capBackgroundDpr,
  normalizePointer,
  type BlackHoleGalaxySettings,
} from './blackHoleGalaxyModel.ts'

export interface BlackHoleGalaxyRenderer {
  destroy(): void
}

export function resizeBlackHoleBuffer(canvas: HTMLCanvasElement, dpr: number): boolean {
  const ratio = capBackgroundDpr(dpr)
  const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
  const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
  if (canvas.width === width && canvas.height === height) return false
  canvas.width = width
  canvas.height = height
  return true
}

export function createBlackHoleGalaxyRenderer(
  canvas: HTMLCanvasElement,
  settings: BlackHoleGalaxySettings,
  onReady: () => void,
  onFailure: (error?: unknown) => void,
): BlackHoleGalaxyRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: settings.transparent,
    antialias: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) {
    onFailure(new Error('WebGL unavailable'))
    return null
  }

  let vertexShader: WebGLShader | null = null
  let fragmentShader: WebGLShader | null = null
  let program: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null

  try {
    vertexShader = compileShader(gl, gl.VERTEX_SHADER, BLACK_HOLE_VERTEX_SHADER)
    fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, BLACK_HOLE_FRAGMENT_SHADER)
    program = gl.createProgram()
    if (!program) throw new Error('Unable to allocate black-hole program')
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Unable to link black-hole program')
    }
    buffer = gl.createBuffer()
    if (!buffer) throw new Error('Unable to allocate black-hole buffer')
  } catch (error) {
    if (buffer) gl.deleteBuffer(buffer)
    if (program) gl.deleteProgram(program)
    if (vertexShader) gl.deleteShader(vertexShader)
    if (fragmentShader) gl.deleteShader(fragmentShader)
    onFailure(error)
    return null
  }

  const activeVertexShader = vertexShader!
  const activeFragmentShader = fragmentShader!
  const activeProgram = program!
  const activeBuffer = buffer!
  const attribute = gl.getAttribLocation(activeProgram, 'aPosition')
  const uniform = (name: string) => {
    const location = gl.getUniformLocation(activeProgram, name)
    if (location === null) throw new Error(`Missing black-hole uniform: ${name}`)
    return location
  }

  let uniforms: Record<string, WebGLUniformLocation>
  try {
    if (attribute < 0) throw new Error('Missing black-hole attribute: aPosition')
    uniforms = Object.fromEntries([
      'uResolution', 'uTime', 'uPointer', 'uPointerActive', 'uStarSpeed', 'uDensity',
      'uHueShift', 'uSpeed', 'uGlowIntensity', 'uSaturation', 'uRepulsionStrength',
      'uTwinkleIntensity', 'uRotationSpeed',
    ].map((name) => [name, uniform(name)]))
    gl.bindBuffer(gl.ARRAY_BUFFER, activeBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    gl.useProgram(activeProgram)
    gl.enableVertexAttribArray(attribute)
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
  } catch (error) {
    gl.deleteBuffer(activeBuffer)
    gl.deleteProgram(activeProgram)
    gl.deleteShader(activeVertexShader)
    gl.deleteShader(activeFragmentShader)
    onFailure(error)
    return null
  }

  let targetPointer: [number, number] = [0.5, 0.5]
  let smoothPointer: [number, number] = [0.5, 0.5]
  let targetActive = 0
  let smoothActive = 0
  let animationSeconds = 0
  let previousFrame = performance.now()
  let frameId = 0
  let ready = false
  let destroyed = false
  let resizeObserver: ResizeObserver | null = null
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  function pointerMove(event: PointerEvent) {
    targetPointer = normalizePointer(event.clientX, event.clientY, canvas.getBoundingClientRect())
    targetActive = settings.mouseRepulsion ? 1 : 0
  }

  function pointerLeave() {
    targetActive = 0
  }

  function stopRuntime() {
    cancelAnimationFrame(frameId)
    resizeObserver?.disconnect()
    window.removeEventListener('pointermove', pointerMove)
    window.removeEventListener('pointerleave', pointerLeave)
    canvas.removeEventListener('webglcontextlost', contextLost)
  }

  function fail(error?: unknown) {
    if (destroyed) return
    destroyed = true
    stopRuntime()
    onFailure(error)
  }

  function contextLost(event: Event) {
    event.preventDefault()
    fail(new Error('Black-hole WebGL context lost'))
  }

  window.addEventListener('pointermove', pointerMove)
  window.addEventListener('pointerleave', pointerLeave)
  canvas.addEventListener('webglcontextlost', contextLost)
  resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => resizeBlackHoleBuffer(canvas, window.devicePixelRatio))
  resizeObserver?.observe(canvas)

  const render = (now: number) => {
    if (destroyed) return
    const delta = Math.min(0.05, Math.max(0, now - previousFrame) / 1000)
    previousFrame = now
    if (!reducedMotion.matches) animationSeconds += delta
    smoothPointer = [
      smoothPointer[0] + (targetPointer[0] - smoothPointer[0]) * 0.05,
      smoothPointer[1] + (targetPointer[1] - smoothPointer[1]) * 0.05,
    ]
    smoothActive += (targetActive - smoothActive) * 0.05
    resizeBlackHoleBuffer(canvas, window.devicePixelRatio)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(activeProgram)
    gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height)
    gl.uniform1f(uniforms.uTime, animationSeconds)
    gl.uniform2f(uniforms.uPointer, smoothPointer[0], smoothPointer[1])
    gl.uniform1f(uniforms.uPointerActive, smoothActive)
    gl.uniform1f(uniforms.uStarSpeed, settings.starSpeed)
    gl.uniform1f(uniforms.uDensity, settings.density)
    gl.uniform1f(uniforms.uHueShift, settings.hueShift)
    gl.uniform1f(uniforms.uSpeed, settings.speed)
    gl.uniform1f(uniforms.uGlowIntensity, settings.glowIntensity)
    gl.uniform1f(uniforms.uSaturation, settings.saturation)
    gl.uniform1f(uniforms.uRepulsionStrength, settings.repulsionStrength)
    gl.uniform1f(uniforms.uTwinkleIntensity, settings.twinkleIntensity)
    gl.uniform1f(uniforms.uRotationSpeed, settings.rotationSpeed)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    if (!ready) {
      ready = true
      onReady()
    }
    frameId = requestAnimationFrame(render)
  }
  frameId = requestAnimationFrame(render)

  return {
    destroy() {
      if (destroyed) return
      destroyed = true
      stopRuntime()
      gl.deleteBuffer(activeBuffer)
      gl.deleteProgram(activeProgram)
      gl.deleteShader(activeVertexShader)
      gl.deleteShader(activeFragmentShader)
    },
  }
}
```

- [ ] **Step 4: Verify GREEN and commit**

Run `npm test && npm run build && npm run lint`.

```bash
git add src/components/blackHoleGalaxyRenderer.ts tests/blackHoleGalaxyRenderer.test.ts
git commit -m "feat: add black hole galaxy renderer"
```

### Task 4: Add the isolated React demo mode

**Files:**
- Create: `src/components/BlackHoleGalaxy.tsx`
- Modify: `src/App.tsx:1-75`
- Modify: `src/index.css:36-105`

- [ ] **Step 1: Verify browser RED states**

With the development server running from this worktree, use the owned session `echoes-black-hole-demo-20260725-root`.

Run the default URL and assert `.black-hole-galaxy` is absent. Open `http://localhost:5173/?bgDemo=black-hole` and assert `.black-hole-galaxy canvas[data-black-hole-status=webgl]` is absent before integration.

- [ ] **Step 2: Create the React boundary**

Create `src/components/BlackHoleGalaxy.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react'
import { BLACK_HOLE_GALAXY_SETTINGS } from './blackHoleGalaxyModel'
import {
  createBlackHoleGalaxyRenderer,
  type BlackHoleGalaxyRenderer,
} from './blackHoleGalaxyRenderer'

type RendererStatus = 'pending' | 'webgl' | 'fallback'

export function BlackHoleGalaxy() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BlackHoleGalaxyRenderer | null>(null)
  const [status, setStatus] = useState<RendererStatus>('pending')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    rendererRef.current = createBlackHoleGalaxyRenderer(
      canvas,
      BLACK_HOLE_GALAXY_SETTINGS,
      () => setStatus('webgl'),
      (error) => {
        setStatus('fallback')
        if (import.meta.env.DEV) console.warn('[BlackHoleGalaxy] WebGL fallback', error)
      },
    )
    return () => {
      rendererRef.current?.destroy()
      rendererRef.current = null
    }
  }, [])

  return (
    <div className="black-hole-galaxy" data-black-hole-container={status} aria-hidden="true">
      <canvas
        ref={canvasRef}
        className={`black-hole-galaxy-canvas ${status === 'webgl' ? 'is-ready' : ''}`}
        data-black-hole-status={status}
      />
      <div className={`black-hole-galaxy-fallback ${status === 'webgl' ? 'is-hidden' : ''}`} />
    </div>
  )
}
```

- [ ] **Step 3: Gate the demo in App**

At module runtime compute:

```ts
import { BlackHoleGalaxy } from './components/BlackHoleGalaxy'
import { isBlackHoleGalaxyDemo } from './components/blackHoleGalaxyModel'

const BLACK_HOLE_DEMO = isBlackHoleGalaxyDemo(window.location.search)
```

Replace the existing stage opening and its two background children with:

```tsx
<div className={`stage ${BLACK_HOLE_DEMO ? 'stage--black-hole-demo' : ''}`}>
  {BLACK_HOLE_DEMO ? (
    <BlackHoleGalaxy />
  ) : (
    <>
      <div className="aurora" />
      <Starfield />
    </>
  )}
```

Leave every existing `{screen.name === ...}` block directly after this conditional and keep the existing closing `</div>`.

- [ ] **Step 4: Add exact demo CSS**

Add to the background section of `src/index.css`:

```css
.stage--black-hole-demo {
  background: #000;
}

.stage--black-hole-demo::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.12), transparent 34%, rgba(0, 0, 0, 0.2)),
    radial-gradient(circle at 50% 47%, transparent 0 26%, rgba(0, 0, 0, 0.16) 72%);
}

.black-hole-galaxy,
.black-hole-galaxy-canvas,
.black-hole-galaxy-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.black-hole-galaxy {
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #000;
}

.black-hole-galaxy-canvas {
  display: block;
  opacity: 0;
  transition: opacity 500ms ease;
}

.black-hole-galaxy-canvas.is-ready {
  opacity: 1;
}

.black-hole-galaxy-fallback {
  opacity: 1;
  transition: opacity 500ms ease;
  background:
    radial-gradient(circle at 50% 47%, #000 0 7%, transparent 7.8%),
    radial-gradient(ellipse 30% 10% at 50% 47%, transparent 38%, rgba(225, 231, 242, 0.78) 43%, rgba(118, 130, 154, 0.2) 58%, transparent 72%),
    #000;
}

.black-hole-galaxy-fallback.is-hidden {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .black-hole-galaxy-canvas,
  .black-hole-galaxy-fallback {
    transition: none;
  }
}
```

- [ ] **Step 5: Verify browser GREEN states and commit**

Verify the default URL still has Aurora + Starfield and no black-hole canvas. Verify the demo URL has one `webgl` black-hole canvas, no Aurora/Starfield, no console errors, and working home controls.

Run `npm test && npm run build && npm run lint`.

```bash
git add src/components/BlackHoleGalaxy.tsx src/App.tsx src/index.css
git commit -m "feat: add isolated black hole background demo"
```

### Task 5: Tune and deliver the Demo

**Files:**
- Potential visual-tuning modification: `src/components/blackHoleGalaxyShader.ts`
- Potential visual-tuning modification: `src/index.css`
- Temporary artifacts only: `output/playwright/black-hole-demo-mobile.png`, `output/playwright/black-hole-demo-desktop.png`

- [ ] Capture 445×805 and 1280×900 demo screenshots and inspect at original resolution.
- [ ] Tune one shader cause at a time until the image clearly contains a circular black event horizon, an `18°` silver-white accretion disk, an upper-left particle stream, sparse layered stars, and large black negative space.
- [ ] Move the pointer across the demo and verify particle pixels change while the event-horizon center does not move.
- [ ] Compare normal and reduced-motion frames; reduced-motion must be substantially more stable.
- [ ] Dispatch `webglcontextlost`; verify fallback opacity 1, canvas opacity 0, and the primary product button remains enabled.
- [ ] Run `npm test`, `npm run build`, `npm run lint`, `git diff --check`, and `git status --short`.
- [ ] Commit only source/test tuning; do not commit screenshots or Playwright artifacts.
- [ ] Close only `echoes-black-hole-demo-20260725-root`, verify it is absent from `playwright-cli --json list --all`, and run Browser Guardian status.
- [ ] Leave the development server running and report `http://localhost:5173/?bgDemo=black-hole`; do not promote the demo to the default URL.

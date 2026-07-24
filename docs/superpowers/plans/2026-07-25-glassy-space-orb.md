# Echoes Glassy Space Orb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only the Echoes home-screen mood sphere with a procedural WebGL cosmic glass sphere while preserving the existing rotary gesture, emotion palette, pulse feedback, layout, copy, and CSS fallback.

**Architecture:** Keep `MoodOrb` as the React boundary and move deterministic color, DPR, spin, and pulse calculations into a tested model module. A raw WebGL renderer owns shader compilation, uniforms, resize handling, animation, context-loss cleanup, and reduced-motion behavior; `MoodOrb` only feeds props into that renderer and swaps to the existing CSS orb when WebGL is unavailable.

**Tech Stack:** React 19, TypeScript 6, Vite 8, native WebGL 1.0 / GLSL ES 1.00, Node 22 built-in test runner, Playwright CLI.

---

## File structure

- Create `src/components/moodOrbModel.ts`: emotion palettes and pure render-parameter helpers.
- Create `src/components/glassyOrbShader.ts`: vertex and fragment shader source only.
- Create `src/components/glassyOrbRenderer.ts`: WebGL lifecycle and animation loop only.
- Modify `src/components/MoodOrb.tsx`: React lifecycle, renderer status, and existing CSS fallback markup.
- Modify `src/index.css`: WebGL canvas stacking, fade-over, fallback visibility, and reduced-motion styles.
- Create `tests/moodOrbModel.test.ts`: pure parameter behavior.
- Create `tests/glassyOrbShader.test.ts`: shader interface and visual-feature contract.
- Create `tests/glassyOrbRenderer.test.ts`: drawing-buffer sizing, compile failure cleanup, and unavailable-WebGL fallback.
- Modify `package.json`: add the Node test command; do not add a runtime or test dependency.

## Visual source-of-truth preparation

- [ ] **Step 1: Generate one standalone implementation reference before coding**

Use the `imagegen` skill with the user's screenshot and the inspected Recent Design key frames included as references. Use this exact direction:

```text
Create a single square implementation reference for the sphere only, not a new page.
Preserve the Echoes product's circular rotary dial, top white dial indicator, and dark-purple emotion palette.
Inside the dial, render a transparent glossy glass sphere containing a deep purple moving galaxy:
layered violet nebula clouds, bright galactic cores, many sharp stars at varied scales,
a transparent thick shell, restrained RGB prismatic fragments around the rim,
soft upper-left specular reflection, deep lower-right absorption, and a faint violet halo.
Match the supplied Glassy Space Sphere reference closely. No text, no button, no extra UI,
no opaque black square behind the sphere, and no replacement of the dial interaction.
The result must be readable as a WebGL implementation target at 540x540.
```

- [ ] **Step 2: Inspect the generated reference at original resolution**

Record these implementation facts before continuing: sphere-to-canvas ratio, brightest core position, darkest quadrant, dominant nebula arc, rim thickness, RGB fringe density, star size range, halo radius, and highlight softness. If any of those are unclear, generate a fresh standalone sphere reference rather than cropping the first result.

### Task 1: Establish the tested orb parameter model

**Files:**
- Create: `tests/moodOrbModel.test.ts`
- Create: `src/components/moodOrbModel.ts`
- Modify: `package.json`
- Modify: `src/components/MoodOrb.tsx:1-37`

- [ ] **Step 1: Add the test command and write the failing model test**

Add this script to `package.json`:

```json
"test": "node --test tests/*.test.ts"
```

Create `tests/moodOrbModel.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  capRenderDpr,
  hexToRgb01,
  moodColors,
  moodColorsF,
  pulseStrength,
  spinDegreesToRadians,
} from '../src/components/moodOrbModel.ts'

test('moodColors clamps and rounds integer emotion levels', () => {
  assert.deepEqual(moodColors(-99), ['#3b4370', '#232849', '#6a7ab0'])
  assert.deepEqual(moodColors(99), ['#e8b8c8', '#b57d94', '#ffe3c4'])
  assert.deepEqual(moodColors(0.6), ['#9c8ad0', '#66549e', '#cfc0ee'])
})

test('moodColorsF interpolates continuously between adjacent levels', () => {
  assert.deepEqual(moodColorsF(0.5), ['#8d84c8', '#5a5196', '#c1baeb'])
})

test('hexToRgb01 produces normalized WebGL color channels', () => {
  assert.deepEqual(hexToRgb01('#ff8040'), [1, 128 / 255, 64 / 255])
})

test('render helpers cap DPR, convert spin, and decay pulse deterministically', () => {
  assert.equal(capRenderDpr(0.5), 1)
  assert.equal(capRenderDpr(3), 2)
  assert.equal(spinDegreesToRadians(180), Math.PI)
  assert.equal(pulseStrength(0), 1)
  assert.equal(pulseStrength(225), 0.5)
  assert.equal(pulseStrength(450), 0)
  assert.equal(pulseStrength(900), 0)
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/components/moodOrbModel.ts`.

- [ ] **Step 3: Implement the minimal model module**

Create `src/components/moodOrbModel.ts`:

```ts
export type MoodPalette = [string, string, string]

const PALETTES: Record<number, MoodPalette> = {
  [-3]: ['#3b4370', '#232849', '#6a7ab0'],
  [-2]: ['#4a548c', '#2c3158', '#7d8ac0'],
  [-1]: ['#5f68a8', '#3a4173', '#95a0d6'],
  [0]: ['#7d7ec0', '#4d4e8e', '#b3b4e8'],
  [1]: ['#9c8ad0', '#66549e', '#cfc0ee'],
  [2]: ['#c79ed2', '#8f68a0', '#f0d4ec'],
  [3]: ['#e8b8c8', '#b57d94', '#ffe3c4'],
}

function hexToRgb255(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ]
}

function mixHex(a: string, b: string, amount: number): string {
  const from = hexToRgb255(a)
  const to = hexToRgb255(b)
  const mixed = from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount))
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function moodColors(valence: number): MoodPalette {
  return PALETTES[Math.max(-3, Math.min(3, Math.round(valence)))]
}

export function moodColorsF(valence: number): MoodPalette {
  const clamped = Math.max(-3, Math.min(3, valence))
  const lower = Math.floor(clamped)
  const upper = Math.min(3, lower + 1)
  const amount = clamped - lower
  return PALETTES[lower].map((color, index) => mixHex(color, PALETTES[upper][index], amount)) as MoodPalette
}

export function hexToRgb01(hex: string): [number, number, number] {
  return hexToRgb255(hex).map((channel) => channel / 255) as [number, number, number]
}

export function capRenderDpr(dpr: number): number {
  return Math.max(1, Math.min(2, dpr))
}

export function spinDegreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function pulseStrength(elapsedMs: number): number {
  return Math.max(0, 1 - elapsedMs / 450)
}
```

Remove the palette and interpolation helpers from `MoodOrb.tsx` and import them instead:

```ts
import { moodColorsF } from './moodOrbModel'
export { moodColors } from './moodOrbModel'
```

- [ ] **Step 4: Run tests, build, and lint to verify GREEN**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all model tests PASS; build and lint exit 0.

- [ ] **Step 5: Commit the model refactor**

```bash
git add package.json src/components/MoodOrb.tsx src/components/moodOrbModel.ts tests/moodOrbModel.test.ts
git commit -m "test: cover mood orb render parameters"
```

### Task 2: Add the procedural cosmic-glass shader

**Files:**
- Create: `tests/glassyOrbShader.test.ts`
- Create: `src/components/glassyOrbShader.ts`

- [ ] **Step 1: Write the failing shader-contract test**

Create `tests/glassyOrbShader.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { FRAGMENT_SHADER, VERTEX_SHADER } from '../src/components/glassyOrbShader.ts'

test('shader exposes every renderer attribute and uniform', () => {
  assert.match(VERTEX_SHADER, /attribute vec2 aPosition/)
  for (const uniform of ['uResolution', 'uTime', 'uSpin', 'uPulse', 'uColorMain', 'uColorDeep', 'uColorLight']) {
    assert.match(FRAGMENT_SHADER, new RegExp(`uniform .* ${uniform};`))
  }
})

test('fragment shader contains nebula, stars, Fresnel glass, and prismatic rim stages', () => {
  assert.match(FRAGMENT_SHADER, /float nebulaDensity/)
  assert.match(FRAGMENT_SHADER, /float starLayer/)
  assert.match(FRAGMENT_SHADER, /float fresnel/)
  assert.match(FRAGMENT_SHADER, /vec3 prism/)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/glassyOrbShader.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `glassyOrbShader.ts`.

- [ ] **Step 3: Add the complete shader source**

Create `src/components/glassyOrbShader.ts` with a pass-through vertex shader and a fragment shader using these exact public names. Keep the feature functions named so the contract test stays meaningful:

```ts
export const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSpin;
uniform float uPulse;
uniform vec3 uColorMain;
uniform vec3 uColorDeep;
uniform vec3 uColorLight;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3(vec3 p) {
  vec3 cell = floor(p);
  vec3 local = fract(p);
  local = local * local * (3.0 - 2.0 * local);
  float n000 = hash31(cell);
  float n100 = hash31(cell + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(cell + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(cell + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(cell + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(cell + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(cell + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(cell + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, local.x), mix(n010, n110, local.x), local.y),
    mix(mix(n001, n101, local.x), mix(n011, n111, local.x), local.y),
    local.z
  );
}

float fbm(vec3 p) {
  float value = 0.0;
  float weight = 0.55;
  for (int octave = 0; octave < 5; octave++) {
    value += weight * noise3(p);
    p = p * 2.03 + vec3(17.1, 9.2, 13.7);
    weight *= 0.5;
  }
  return value;
}

float nebulaDensity(vec3 point) {
  float cloud = fbm(point * 2.15 + vec3(uTime * 0.035, -uTime * 0.022, uTime * 0.018));
  float folded = abs(point.y + 0.18 * sin(point.x * 4.0 + uTime * 0.24));
  float band = exp(-folded * 6.2) * (1.0 - smoothstep(0.08, 1.15, length(point.xy)));
  return smoothstep(0.34, 0.8, cloud) * 0.7 + band;
}

float starLayer(vec2 uv, float scale, float threshold) {
  vec2 cell = floor(uv * scale);
  vec2 local = fract(uv * scale) - 0.5;
  float seed = hash21(cell);
  vec2 offset = vec2(seed, hash21(cell + 19.73)) - 0.5;
  float distanceToStar = length(local - offset * 0.64);
  float star = (1.0 - smoothstep(0.0, 0.07, distanceToStar)) * step(threshold, seed);
  return star * (0.5 + 1.4 * hash21(cell + 4.1));
}

mat2 rotation(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

void main() {
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 p = (vUv * 2.0 - 1.0) * aspect / 0.92;
  float radiusSquared = dot(p, p);
  float edgeAlpha = 1.0 - smoothstep(0.94, 1.0, radiusSquared);
  if (edgeAlpha <= 0.001) discard;

  float z = sqrt(max(0.0, 1.0 - radiusSquared));
  vec3 normal = normalize(vec3(p, z));
  vec3 rotated = normal;
  rotated.xy = rotation(uSpin + uTime * 0.075) * rotated.xy;
  rotated.yz = rotation(-0.22 + sin(uTime * 0.09) * 0.08) * rotated.yz;

  float density = nebulaDensity(rotated);
  float core = exp(-22.0 * dot(rotated.xy - vec2(-0.12, 0.04), rotated.xy - vec2(-0.12, 0.04)));
  vec2 starUv = rotated.xy / max(0.28, 0.42 + rotated.z);
  float stars = starLayer(starUv + uTime * 0.0015, 24.0, 0.88);
  stars += starLayer(starUv - uTime * 0.001, 53.0, 0.965) * 0.75;

  vec3 color = uColorDeep * (0.10 + density * 0.34);
  color += uColorMain * density * 0.72;
  color += uColorLight * (core * 1.45 + stars * 1.35);
  color += uColorLight * uPulse * (0.12 + core * 0.35);

  float fresnel = pow(1.0 - z, 3.1);
  float rimAngle = atan(p.y, p.x);
  float fracture = pow(max(0.0, sin(rimAngle * 13.0 + fbm(normal * 5.0) * 8.0)), 18.0);
  vec3 prism = 0.5 + 0.5 * cos(6.2831853 * (vec3(0.02, 0.35, 0.68) + rimAngle * 0.18));
  color += prism * fracture * fresnel * 1.15;

  vec3 lightDirection = normalize(vec3(-0.48, 0.62, 0.62));
  float specular = pow(max(dot(normal, lightDirection), 0.0), 54.0);
  float softReflection = pow(max(dot(normal, normalize(vec3(-0.62, 0.34, 0.71))), 0.0), 8.0);
  color += vec3(1.0, 0.98, 1.0) * specular * 1.15;
  color += uColorLight * softReflection * 0.18;
  color += mix(uColorMain, uColorLight, 0.55) * fresnel * 0.24;
  color *= 0.82 + z * 0.2;
  color *= 1.0 - max(0.0, -p.y) * 0.18;

  gl_FragColor = vec4(color, edgeAlpha);
}
`
```

- [ ] **Step 4: Run the shader contract and full test suite**

Run:

```bash
node --test tests/glassyOrbShader.test.ts
npm test
```

Expected: both shader tests and all model tests PASS.

- [ ] **Step 5: Commit the shader**

```bash
git add src/components/glassyOrbShader.ts tests/glassyOrbShader.test.ts
git commit -m "feat: add procedural cosmic glass shader"
```

### Task 3: Implement the WebGL renderer lifecycle

**Files:**
- Create: `tests/glassyOrbRenderer.test.ts`
- Create: `src/components/glassyOrbRenderer.ts`

- [ ] **Step 1: Write failing renderer helper and fallback tests**

Create `tests/glassyOrbRenderer.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  compileShader,
  createGlassyOrbRenderer,
  resizeDrawingBuffer,
} from '../src/components/glassyOrbRenderer.ts'

test('resizeDrawingBuffer uses capped DPR and only mutates changed dimensions', () => {
  const canvas = { clientWidth: 188, clientHeight: 188, width: 0, height: 0 } as HTMLCanvasElement
  assert.equal(resizeDrawingBuffer(canvas, 3), true)
  assert.equal(canvas.width, 376)
  assert.equal(canvas.height, 376)
  assert.equal(resizeDrawingBuffer(canvas, 3), false)
})

test('compileShader deletes a shader and reports its compiler log on failure', () => {
  let deleted = false
  const gl = {
    COMPILE_STATUS: 1,
    createShader: () => ({}),
    shaderSource: () => undefined,
    compileShader: () => undefined,
    getShaderParameter: () => false,
    getShaderInfoLog: () => 'bad fragment shader',
    deleteShader: () => { deleted = true },
  } as unknown as WebGLRenderingContext

  assert.throws(() => compileShader(gl, 7, 'source'), /bad fragment shader/)
  assert.equal(deleted, true)
})

test('createGlassyOrbRenderer returns null and invokes fallback when WebGL is unavailable', () => {
  let failed = false
  const canvas = { getContext: () => null } as unknown as HTMLCanvasElement
  const renderer = createGlassyOrbRenderer(canvas, () => undefined, () => { failed = true })
  assert.equal(renderer, null)
  assert.equal(failed, true)
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
node --test tests/glassyOrbRenderer.test.ts
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `glassyOrbRenderer.ts`.

- [ ] **Step 3: Implement the renderer**

Create `src/components/glassyOrbRenderer.ts`. The implementation must expose the tested helpers, create one WebGL context and quad buffer, compile the two shader stages, cache all locations, render with `requestAnimationFrame`, cap DPR at 2, pause automatic time under reduced motion, animate pulse brightness for 450ms, and destroy every owned browser resource.

Use these interfaces and public function signatures exactly:

```ts
import { FRAGMENT_SHADER, VERTEX_SHADER } from './glassyOrbShader'
import {
  capRenderDpr,
  hexToRgb01,
  pulseStrength,
  spinDegreesToRadians,
  type MoodPalette,
} from './moodOrbModel'

export interface OrbRenderInput {
  palette: MoodPalette
  spin: number
  pulse: boolean
}

export interface GlassyOrbRenderer {
  update(input: OrbRenderInput): void
  destroy(): void
}

export function resizeDrawingBuffer(canvas: HTMLCanvasElement, dpr: number): boolean {
  const ratio = capRenderDpr(dpr)
  const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
  const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
  if (canvas.width === width && canvas.height === height) return false
  canvas.width = width
  canvas.height = height
  return true
}

export function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Unable to allocate WebGL shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Unknown shader compile failure'
    gl.deleteShader(shader)
    throw new Error(log)
  }
  return shader
}

export function createGlassyOrbRenderer(
  canvas: HTMLCanvasElement,
  onReady: () => void,
  onFailure: (error?: unknown) => void,
): GlassyOrbRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
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
    vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    program = gl.createProgram()
    if (!program) throw new Error('Unable to allocate WebGL program')
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Unknown program link failure')
    }
    buffer = gl.createBuffer()
    if (!buffer) throw new Error('Unable to allocate WebGL buffer')
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
  let attribute = -1
  let uniforms: {
    resolution: WebGLUniformLocation
    time: WebGLUniformLocation
    spin: WebGLUniformLocation
    pulse: WebGLUniformLocation
    main: WebGLUniformLocation
    deep: WebGLUniformLocation
    light: WebGLUniformLocation
  }

  try {
    attribute = gl.getAttribLocation(activeProgram, 'aPosition')
    if (attribute < 0) throw new Error('Missing WebGL attribute: aPosition')
    const uniform = (name: string) => {
      const location = gl.getUniformLocation(activeProgram, name)
      if (location === null) throw new Error(`Missing WebGL uniform: ${name}`)
      return location
    }
    uniforms = {
      resolution: uniform('uResolution'),
      time: uniform('uTime'),
      spin: uniform('uSpin'),
      pulse: uniform('uPulse'),
      main: uniform('uColorMain'),
      deep: uniform('uColorDeep'),
      light: uniform('uColorLight'),
    }
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

  let input: OrbRenderInput = { palette: ['#7d7ec0', '#4d4e8e', '#b3b4e8'], spin: 0, pulse: false }
  let pulseStarted = -1
  let animationSeconds = 0
  let previousFrame = performance.now()
  let frameId = 0
  let ready = false
  let destroyed = false
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let resizeObserver: ResizeObserver | null = null

  function stopRuntime() {
    cancelAnimationFrame(frameId)
    resizeObserver?.disconnect()
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
    fail(new Error('WebGL context lost'))
  }
  canvas.addEventListener('webglcontextlost', contextLost)

  resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => resizeDrawingBuffer(canvas, window.devicePixelRatio))
  resizeObserver?.observe(canvas)

  const render = (now: number) => {
    if (destroyed) return
    const deltaSeconds = Math.min(0.05, Math.max(0, now - previousFrame) / 1000)
    previousFrame = now
    if (!reducedMotion.matches) animationSeconds += deltaSeconds
    resizeDrawingBuffer(canvas, window.devicePixelRatio)

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(activeProgram)
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
    gl.uniform1f(uniforms.time, animationSeconds)
    gl.uniform1f(uniforms.spin, spinDegreesToRadians(input.spin))
    gl.uniform1f(uniforms.pulse, pulseStarted < 0 ? 0 : pulseStrength(now - pulseStarted))
    gl.uniform3fv(uniforms.main, hexToRgb01(input.palette[0]))
    gl.uniform3fv(uniforms.deep, hexToRgb01(input.palette[1]))
    gl.uniform3fv(uniforms.light, hexToRgb01(input.palette[2]))
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    if (!ready) {
      ready = true
      onReady()
    }
    frameId = requestAnimationFrame(render)
  }
  frameId = requestAnimationFrame(render)

  return {
    update(next) {
      if (next.pulse && !input.pulse) pulseStarted = performance.now()
      input = next
    },
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

- [ ] **Step 4: Run tests, build, and lint to verify GREEN**

Run:

```bash
node --test tests/glassyOrbRenderer.test.ts
npm test
npm run build
npm run lint
```

Expected: all tests PASS; build and lint exit 0 without warnings introduced by the new files.

- [ ] **Step 5: Commit the renderer**

```bash
git add src/components/glassyOrbRenderer.ts tests/glassyOrbRenderer.test.ts
git commit -m "feat: add WebGL glassy orb renderer"
```

### Task 4: Integrate WebGL into MoodOrb and preserve the CSS fallback

**Files:**
- Modify: `src/components/MoodOrb.tsx:1-96`
- Modify: `src/index.css:234-349`

- [ ] **Step 1: Verify the browser acceptance check is RED before integration**

Reuse the owned Playwright session `echoes-glassy-orb-20260725-root`, select the localhost tab, reload, and run:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" --session echoes-glassy-orb-20260725-root tab-select 1
"$PWCLI" --session echoes-glassy-orb-20260725-root reload
"$PWCLI" --session echoes-glassy-orb-20260725-root eval "document.querySelector('canvas[data-orb-renderer=webgl]') !== null"
```

Expected: `false`, because the current `MoodOrb` has no WebGL canvas.

- [ ] **Step 2: Replace MoodOrb with a thin renderer host plus the existing fallback**

Refactor `src/components/MoodOrb.tsx` so it:

- imports `useEffect`, `useRef`, and `useState`;
- imports `createGlassyOrbRenderer` and `moodColorsF`;
- exports `moodColors` from `moodOrbModel` to preserve existing consumers;
- creates exactly one canvas;
- calls `renderer.update({ palette, spin, pulse })` whenever those props change;
- sets status to `webgl` only after the first successful draw;
- sets status to `fallback` on initialization, compilation, linking, or context loss;
- keeps the current CSS orb markup intact inside `.corb-fallback`.

Use this component structure:

```tsx
import { useEffect, useRef, useState } from 'react'
import { createGlassyOrbRenderer, type GlassyOrbRenderer } from './glassyOrbRenderer'
import { moodColorsF } from './moodOrbModel'
export { moodColors } from './moodOrbModel'

interface Props {
  valence: number
  size?: number
  spin?: number
  pulse?: boolean
}

type RendererStatus = 'pending' | 'webgl' | 'fallback'

export function MoodOrb({ valence, size = 200, spin = 0, pulse = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<GlassyOrbRenderer | null>(null)
  const [rendererStatus, setRendererStatus] = useState<RendererStatus>('pending')
  const palette = moodColorsF(valence)
  const [main, deep, light] = palette

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    rendererRef.current = createGlassyOrbRenderer(
      canvas,
      () => setRendererStatus('webgl'),
      (error) => {
        setRendererStatus('fallback')
        if (import.meta.env.DEV) console.warn('[MoodOrb] WebGL fallback', error)
      },
    )
    return () => {
      rendererRef.current?.destroy()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    rendererRef.current?.update({ palette, spin, pulse })
  }, [main, deep, light, spin, pulse])

  return (
    <div
      className={`corb ${pulse ? 'corb-pulse' : ''}`}
      data-orb-status={rendererStatus}
      style={{ width: size, height: size }}
    >
      <div
        className="corb-halo"
        style={{ background: `radial-gradient(circle, ${main}77 0%, ${deep}33 45%, transparent 70%)` }}
      />

      <canvas
        ref={canvasRef}
        className={`corb-canvas ${rendererStatus === 'webgl' ? 'is-ready' : ''}`}
        data-orb-renderer={rendererStatus}
        aria-hidden="true"
      />

      <div className={`corb-fallback ${rendererStatus === 'webgl' ? 'is-hidden' : ''}`} aria-hidden="true">
        <div
          className="corb-body"
          style={{
            background: `radial-gradient(circle at 34% 30%, ${light}, ${main} 52%, ${deep} 88%)`,
            boxShadow: [
              `0 0 60px ${main}66`,
              `0 0 130px ${deep}44`,
              `inset -18px -26px 50px ${deep}dd`,
              'inset 14px 18px 42px rgba(255,255,255,0.18)',
              'inset 0 0 12px rgba(255,255,255,0.10)',
            ].join(', '),
          }}
        >
          <div className="corb-nebula-spin" style={{ transform: `rotate(${spin}deg)` }}>
            <div
              className="corb-nebula"
              style={{
                background: `conic-gradient(from 40deg, ${main}00, ${light}66 90deg, ${main}00 160deg, ${deep}88 240deg, ${main}00 330deg)`,
              }}
            />
          </div>
          <div className="corb-depth" style={{ background: `radial-gradient(circle at 50% 78%, ${deep}cc, transparent 55%)` }} />
          <div className="corb-refract" style={{ background: `radial-gradient(circle at 70% 62%, ${light}44, transparent 42%)` }} />
          <div className="corb-spec" />
          <div className="corb-spec2" style={{ background: `radial-gradient(ellipse, ${light}88, transparent 65%)` }} />
          <div className="corb-arc" />
        </div>
      </div>

      <div className="corb-caustic" style={{ background: `radial-gradient(ellipse, ${main}55, transparent 65%)` }} />
    </div>
  )
}
```

- [ ] **Step 3: Add canvas stacking and fallback transitions**

Add these declarations to the orb section of `src/index.css`:

```css
.corb-canvas,
.corb-fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.corb-canvas {
  z-index: 2;
  display: block;
  opacity: 0;
  pointer-events: none;
  transition: opacity 500ms ease;
}

.corb-canvas.is-ready {
  opacity: 1;
}

.corb-fallback {
  z-index: 1;
  opacity: 1;
  transition: opacity 500ms ease;
}

.corb-fallback.is-hidden {
  opacity: 0;
}

.corb-halo,
.corb-caustic {
  z-index: 0;
}

@media (prefers-reduced-motion: reduce) {
  .corb,
  .corb-nebula {
    animation: none;
  }

  .corb-canvas,
  .corb-fallback {
    transition: none;
  }
}
```

- [ ] **Step 4: Run automated verification**

Run:

```bash
npm test
npm run build
npm run lint
```

Expected: all tests PASS; build and lint exit 0.

- [ ] **Step 5: Verify the real WebGL acceptance check is GREEN**

Run:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" --session echoes-glassy-orb-20260725-root reload
"$PWCLI" --session echoes-glassy-orb-20260725-root eval "document.querySelector('canvas[data-orb-renderer=webgl]') !== null"
"$PWCLI" --session echoes-glassy-orb-20260725-root console error
```

Expected: the evaluation returns `true`; the error console contains no new WebGL, React, or shader error.

- [ ] **Step 6: Commit the integration**

```bash
git add src/components/MoodOrb.tsx src/index.css
git commit -m "feat: render mood orb with WebGL"
```

### Task 5: Tune fidelity and verify the complete interaction

**Files:**
- Potential visual-tuning modification: `src/components/glassyOrbShader.ts`
- Potential visual-tuning modification: `src/index.css`
- Create as temporary verification artifacts only: `output/playwright/glassy-orb-mobile.png`, `output/playwright/glassy-orb-desktop.png`

- [ ] **Step 1: Capture the 445×805 mobile state**

Run:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
mkdir -p output/playwright
"$PWCLI" --session echoes-glassy-orb-20260725-root resize 445 805
"$PWCLI" --session echoes-glassy-orb-20260725-root screenshot --filename output/playwright/glassy-orb-mobile.png
```

Inspect the screenshot at original resolution. Compare against the reference key frames and the generated implementation reference for: sphere diameter, transparent background, purple cloud depth, brightest core placement, star density, specular softness, lower-right absorption, rim thickness, and sparse RGB prismatic fragments.

- [ ] **Step 2: Verify rotary interaction with a real pointer gesture**

Take a fresh snapshot, use the current `.dial` ref, drag clockwise by roughly one quarter turn, then re-snapshot. Verify all four outcomes:

1. The white dial dot moves clockwise.
2. The emotion label changes away from `平静`.
3. The canvas remains `data-orb-renderer="webgl"`.
4. A screenshot shows the sphere palette and galaxy orientation changed without layout shift.

- [ ] **Step 3: Verify reduced motion and fallback**

Use Playwright `run-code` only for browser-emulation state that the CLI has no direct command for. Emulate `reducedMotion: 'reduce'`, reload, wait one second, and verify the canvas remains WebGL while automatic time stops. Separately dispatch `webglcontextlost` on the canvas and verify `data-orb-status="fallback"` and the CSS sphere remains visible.

- [ ] **Step 4: Capture a desktop state and check responsiveness**

Resize to 1280×900, capture `output/playwright/glassy-orb-desktop.png`, and verify the 300px dial, 188px sphere, headline, status label, hint, and button retain their existing centered relationship with no horizontal overflow.

- [ ] **Step 5: Run the final verification suite**

Run:

```bash
npm test
npm run build
npm run lint
git diff --check
git status --short
```

Expected: all tests PASS; build and lint exit 0; `git diff --check` emits nothing; only intentional source changes and temporary Playwright artifacts are listed.

- [ ] **Step 6: Commit visual tuning if source files changed**

```bash
git add src/components/glassyOrbShader.ts src/index.css
git commit -m "style: tune glassy orb fidelity"
```

Skip this commit only if neither source file changed during comparison.

- [ ] **Step 7: Close only the owned browser session and verify browser hygiene**

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" --session echoes-glassy-orb-20260725-root close
"$PWCLI" --json list --all
"/Users/mac/Library/Application Support/CodexBrowserGuardian/bin/codex-browser-guardian" status
```

Expected: `echoes-glassy-orb-20260725-root` is absent from the session list; the unrelated `echo-ark-call-20260724` session is untouched; Browser Guardian reports status without requiring manual global cleanup.

## Final handoff checklist

- [ ] Confirm no reference video was copied into the repository.
- [ ] Confirm the public `MoodOrb` props and `moodColors` export remain compatible.
- [ ] Confirm emotion drag, haptic pulse, color interpolation, and CSS fallback still work.
- [ ] Confirm WebGL uses one canvas, DPR is capped at 2, and all resources are destroyed on unmount.
- [ ] Confirm tests, build, lint, browser console, mobile screenshot, desktop screenshot, reduced motion, context loss, and session cleanup were all freshly verified.

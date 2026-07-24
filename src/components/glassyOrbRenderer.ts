import { FRAGMENT_SHADER, VERTEX_SHADER } from './glassyOrbShader.ts'
import {
  capRenderDpr,
  hexToRgb01,
  pulseStrength,
  spinDegreesToRadians,
  type MoodPalette,
} from './moodOrbModel.ts'

export interface OrbRenderInput {
  palette: MoodPalette
  spin: number
  pulse: boolean
  silverTone: boolean
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

  const activeVertexShader = vertexShader
  const activeFragmentShader = fragmentShader
  const activeProgram = program
  const activeBuffer = buffer
  let attribute = -1
  let uniforms: {
    resolution: WebGLUniformLocation
    time: WebGLUniformLocation
    spin: WebGLUniformLocation
    pulse: WebGLUniformLocation
    main: WebGLUniformLocation
    deep: WebGLUniformLocation
    light: WebGLUniformLocation
    silverTone: WebGLUniformLocation
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
      silverTone: uniform('uSilverTone'),
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

  let input: OrbRenderInput = {
    palette: ['#7d7ec0', '#4d4e8e', '#b3b4e8'],
    spin: 0,
    pulse: false,
    silverTone: false,
  }
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
    gl.uniform1f(uniforms.silverTone, input.silverTone ? 1 : 0)
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

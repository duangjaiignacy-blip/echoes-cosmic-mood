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

const float VORTEX_CORE_RADIUS = 0.018;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
    f.y
  );
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

float layeredStarField(vec2 uv) {
  float quietRegions = smoothstep(0.24, 0.78, fbm(uv * 2.15 + vec2(8.4, -3.7)));
  float cluster = 0.16 + quietRegions * 1.08;
  float stars = starLayer(uv, 66.0, 2.7);
  stars += starLayer(uv + vec2(0.13, -0.21), 132.0, 19.4) * 0.68;
  stars += starLayer(uv - vec2(0.31, 0.07), 224.0, 41.2) * 0.34;
  return stars * cluster;
}

float tinyVortex(vec2 point) {
  vec2 disk = rotate2d(-0.24) * point;
  vec2 ellipse = vec2(disk.x, disk.y / 0.42);
  float radius = length(ellipse);
  float angle = atan(ellipse.y, ellipse.x);
  float rim = exp(-abs(radius - 0.034) * 128.0);
  float flow = angle * 7.0 + radius * 206.0 - uTime * (uSpeed * 0.82 + uRotationSpeed * 5.0);
  float filaments = pow(0.5 + 0.5 * sin(flow + fbm(ellipse * 18.0) * 7.0), 12.0);
  float diskMask = smoothstep(0.023, 0.034, radius) * (1.0 - smoothstep(0.086, 0.118, radius));
  return rim * 1.2 + diskMask * (0.1 + filaments * 0.92);
}

float echoStream(vec2 point) {
  vec2 direction = normalize(vec2(-0.96, 0.28));
  vec2 normal = vec2(-direction.y, direction.x);
  float along = dot(point, direction);
  float across = abs(dot(point, normal));
  float width = 0.014 + abs(along) * 0.075;
  float body = 1.0 - smoothstep(width * 0.24, width, across);
  float fade = 1.0 - smoothstep(0.055, 0.64, abs(along));
  float leftBias = mix(0.34, 1.0, smoothstep(-0.08, 0.3, along));
  float dust = smoothstep(0.47, 0.78, fbm(point * 31.0 - uTime * uSpeed * 0.08));
  float threads = pow(0.5 + 0.5 * sin(across * 540.0 - along * 31.0 + uTime * 0.34), 13.0);
  return body * fade * leftBias * (dust * 0.7 + threads * 0.3);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 scale = vec2(aspect, 1.0);
  vec2 uv = (vUv * 2.0 - 1.0) * scale;
  vec2 pointer = (uPointer * 2.0 - 1.0) * scale;
  float starTime = uTime * uStarSpeed * 0.006;
  float stars = layeredStarField(repelPointer(uv + vec2(starTime, -starTime * 0.27), pointer));

  vec2 vortexCenter = vec2(0.0, 0.52);
  vec2 vortexPoint = uv - vortexCenter;
  float vortex = tinyVortex(uv - vortexCenter);
  float stream = echoStream(vortexPoint);
  float core = 1.0 - smoothstep(VORTEX_CORE_RADIUS, VORTEX_CORE_RADIUS * 1.7, length(vortexPoint));
  vec3 coldTint = hueColor(fract(uHueShift / 360.0));
  vec3 silver = mix(vec3(0.82, 0.85, 0.91), coldTint, uSaturation * 0.08);
  vec3 color = silver * stars * (0.72 + uGlowIntensity * 0.72);
  color += silver * stream * (0.24 + uGlowIntensity * 0.36);
  color += mix(silver, vec3(1.0), 0.62) * vortex * (0.68 + uGlowIntensity * 0.7);
  color *= 1.0 - core;

  float alpha = clamp(max(max(color.r, color.g), color.b) * 1.32, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`

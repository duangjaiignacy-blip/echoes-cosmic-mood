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
  float flow = angle * (5.0 + uDensity * 2.35) + r * (90.0 + uDensity * 26.0) - uTime * uSpeed * 2.2;
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

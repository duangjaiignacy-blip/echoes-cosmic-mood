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
  vec2 corePoint = rotated.xy - vec2(-0.12, 0.04);
  float core = exp(-22.0 * dot(corePoint, corePoint));
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

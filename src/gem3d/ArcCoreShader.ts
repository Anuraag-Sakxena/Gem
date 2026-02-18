/**
 * ArcCoreShader V4 — Bright premium inner glow.
 *
 * Strong pulsing core light inside the gem:
 *   - White-hot center fading to tier color at edges
 *   - Single-frequency gentle pulse
 *   - One-octave noise for organic variation
 *   - Fresnel rim brightening
 *
 * V3→V4: Significantly boosted output intensity.
 * The arc core should be CLEARLY visible inside the gem —
 * a warm inner light that makes the gem feel alive.
 *
 * Renders with AdditiveBlending — illuminates from within.
 */

import * as THREE from 'three';

const ARC_CORE_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const ARC_CORE_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

// Simple 3D noise
float hash(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19);
  return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec3(1.0, 0.0, 0.0));
  float c = hash(i + vec3(0.0, 1.0, 0.0));
  float d = hash(i + vec3(1.0, 1.0, 0.0));
  float e = hash(i + vec3(0.0, 0.0, 1.0));
  float ff = hash(i + vec3(1.0, 0.0, 1.0));
  float g = hash(i + vec3(0.0, 1.0, 1.0));
  float h = hash(i + vec3(1.0, 1.0, 1.0));

  return mix(
    mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
    mix(mix(e, ff, f.x), mix(g, h, f.x), f.y),
    f.z
  );
}

void main() {
  // Fresnel: glow brighter at edges
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - abs(dot(vNormal, viewDir));
  fresnel = pow(fresnel, 1.5);

  // Gentle pulse
  float pulse = 0.8 + 0.2 * sin(uTime * 2.0);

  // Single-octave noise for organic variation
  vec3 noiseCoord = vec3(vUv * 2.5, uTime * 0.2);
  float n = noise3D(noiseCoord) * 0.25 + 0.75;

  // Smooth radial concentration — wider, brighter
  float dist = length(vUv - 0.5);
  float radial = 1.0 - dist * 1.2;
  radial = max(radial, 0.0);
  radial = pow(radial, 0.5);

  // White-hot center spike — brighter, wider
  float hotCenter = 1.0 - dist * 2.5;
  hotCenter = max(hotCenter, 0.0);
  hotCenter = pow(hotCenter, 1.5);

  // Combine — boosted output
  float intensity = (fresnel * 0.35 + radial * 0.65) * pulse * n * uIntensity;

  // Color: white center → tier color at edges
  vec3 hotWhite = vec3(1.0, 0.98, 0.94);
  vec3 color = mix(uColor, hotWhite, hotCenter * 0.85);
  color = mix(color, uColor * 1.4, fresnel * 0.2);

  // Much stronger output than V3 (was 3.0 * 0.85 → now 4.5 * 0.9)
  gl_FragColor = vec4(color * intensity * 4.5, intensity * 0.9);
}
`;

/**
 * Create the arc reactor core material.
 *
 * @param color - Base color (usually tier's glow color)
 * @param intensity - Overall brightness (0.5–2.5)
 */
export function createArcCoreMaterial(
  color: string,
  intensity: number = 1.0,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: ARC_CORE_VERTEX,
    fragmentShader: ARC_CORE_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

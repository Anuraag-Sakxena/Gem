/**
 * AuraShader — Custom GLSL ShaderMaterial for premium gem aura/glow.
 *
 * This is the "different language" visual layer: GLSL shaders running inside
 * the React Native app via expo-gl + Three.js. Creates radial, pulsing,
 * noise-driven glow and curved light streaks behind the gem.
 *
 * Two shaders:
 *   1. Aura — radial gradient + 2D noise + pulse + inner core + holographic hints
 *   2. Streaks — curved sine-wave light lines that drift slowly
 */

import * as THREE from 'three';

// ─── Aura Shader ──────────────────────────────────────────────────────────────

const auraVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const auraFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uIntensity;
  uniform float uPulseSpeed;

  varying vec2 vUv;

  // Fast 2D value noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);

    // Radial falloff — soft outer glow
    float glow = 1.0 - smoothstep(0.0, 0.48, dist);
    glow = pow(glow, 1.6);

    // Noise-based variation (slow drifting patterns)
    float n1 = noise(center * 4.0 + uTime * 0.25);
    float n2 = noise(center * 7.0 - uTime * 0.18);
    glow *= 0.82 + 0.18 * n1;

    // Slow organic pulse
    float pulse = 0.90 + 0.10 * sin(uTime * uPulseSpeed);
    glow *= pulse;

    // Subtle radial light streaks (6-fold symmetry)
    float angle = atan(center.y, center.x);
    float streaks = 0.92 + 0.08 * sin(angle * 6.0 + uTime * 0.4);
    glow *= streaks;

    // Color: blend primary → secondary based on distance
    vec3 color = mix(uColor, uColor2, smoothstep(0.0, 0.4, dist));

    // Bright inner core
    float core = 1.0 - smoothstep(0.0, 0.12, dist);
    core = pow(core, 2.5);
    color += vec3(1.0) * core * 0.4;

    // Holographic edge shimmer (subtle iridescence)
    float holo = noise(center * 14.0 + uTime * 0.35) * 0.06;
    color += vec3(holo * n2, holo * (1.0 - n2), holo * n1);

    float alpha = glow * uIntensity;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createAuraMaterial(
  color: string,
  color2: string,
  intensity: number = 0.5,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: auraVertexShader,
    fragmentShader: auraFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uColor2: { value: new THREE.Color(color2) },
      uIntensity: { value: intensity },
      uPulseSpeed: { value: 0.7 },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

// ─── Light Streak Shader ──────────────────────────────────────────────────────

const streakVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const streakFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv - 0.5;

    // Curved light streaks — sine waves of different frequencies
    float s1 = smoothstep(0.012, 0.0, abs(uv.y - 0.12 * sin(uv.x * 6.28 + uTime * 0.35)));
    float s2 = smoothstep(0.009, 0.0, abs(uv.y + 0.08 * sin(uv.x * 5.0 - uTime * 0.28 + 1.5)));
    float s3 = smoothstep(0.007, 0.0, abs(uv.y - 0.06 * cos(uv.x * 7.5 + uTime * 0.42 + 3.0)));
    float s4 = smoothstep(0.005, 0.0, abs(uv.y + 0.04 * sin(uv.x * 9.0 + uTime * 0.2 + 5.0)));

    float streaks = s1 + s2 * 0.7 + s3 * 0.5 + s4 * 0.3;

    // Radial fade — streaks fade at edges
    float fade = 1.0 - smoothstep(0.28, 0.48, length(uv));
    streaks *= fade;

    float alpha = streaks * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function createStreakMaterial(
  color: string,
  intensity: number = 0.3,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: streakVertexShader,
    fragmentShader: streakFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

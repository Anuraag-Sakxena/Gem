/**
 * GemView V9 — Premium Dark Glass.
 *
 * Design philosophy: Think Apple product photography.
 * The gem is the ONLY bright thing. Everything else is void.
 * No starfield. No dust particles. No overlapping glow layers.
 * Just clean material + clean lighting + clean reflections.
 *
 * Visual layers (back to front):
 *   1. Background: near-black void (#050505)
 *   2. Ground light pool: subtle tier-colored circle beneath gem
 *   3. Contact shadow: small dark ellipse
 *   4. Gem mesh: MeshPhysicalMaterial + envMap + transmission
 *   5. Soft aura: single fresnel glow sphere
 *   6. Arc core: smooth pulsing inner light (no hex grid, no rings)
 *   7. 2 orbiting sweep lights (moving specular highlights)
 *
 * V8→V9 changes:
 *   - Removed starfield (800 points) + dust (120 points) — too busy
 *   - Removed mid glow + outer haze + bloom (3 overlapping layers → 1 clean aura)
 *   - Removed hex grid + energy rings from arc core (noisy on mobile)
 *   - Removed pitch spring (true 360° rotation, no limits)
 *   - Simplified env map (fewer objects = cleaner reflections)
 *   - Added ground light pool (gem casts light onto dark surface)
 *   - Reduced sweep lights from 3 to 2
 *   - Fixed material safety (opacity=1 when transmission active)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { createGemGeometry, GemShapeKey } from './geometries';
import { TIER_MATERIALS, safeMaterial } from './materials';
import { NOIR_LIGHTS } from './lighting';
import { createArcCoreMaterial } from './ArcCoreShader';
import { fitCameraToObject } from './fitCamera';
import { getShapeProfile } from './shapeProfiles';
import { TierKey } from '../engine/tierProfiles';

// ─── Pre-allocated temp objects (zero GC in render loop) ────────────────────

const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);

// ─── Quaternion-based Rotation State ────────────────────────────────────────

export interface RotationState {
  /** Quaternion components — gimbal-lock-free orientation */
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  /** Angular velocity (world-space rad/frame) */
  vx: number;
  vy: number;
  isDragging: boolean;
  /** Whether auto-rotate is paused after user interaction */
  autoRotatePaused: boolean;
  /** Timestamp of last user interaction (for auto-rotate resume delay) */
  lastInteractionTime: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LERP_SPEED = 0.06;
const DAMPING = 0.965;                    // velocity decay per frame
const AUTO_ROTATE_SPEED = 0.003;          // rad/frame
const AUTO_ROTATE_RESUME_DELAY = 800;     // ms

// ─── Procedural Environment Map (simplified studio) ─────────────────────────

function createEnvironmentMap(renderer: THREE.WebGLRenderer): THREE.Texture | null {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileCubemapShader();

    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color('#020202');

    // Primary ceiling softbox — creates the main specular highlight
    const softbox = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshBasicMaterial({ color: '#FFF4E8', side: THREE.DoubleSide }),
    );
    softbox.position.set(0, 6, 0);
    softbox.rotation.x = Math.PI / 2;
    envScene.add(softbox);

    // Horizontal strip light — creates specular streaks across facets
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 0.15),
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide }),
    );
    strip.position.set(0, 1, -6);
    envScene.add(strip);

    // Vertical strip light — perpendicular cross-highlights
    const vstrip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 8),
      new THREE.MeshBasicMaterial({ color: '#E0EEFF', side: THREE.DoubleSide }),
    );
    vstrip.position.set(-5.5, 1, -2);
    vstrip.rotation.y = Math.PI / 3;
    envScene.add(vstrip);

    // Cool floor undertone
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ color: '#080810', side: THREE.DoubleSide }),
    );
    floor.position.set(0, -6, 0);
    floor.rotation.x = -Math.PI / 2;
    envScene.add(floor);

    // 4 accent spheres — sparkle fire points in facets
    const sphereGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const accents: [string, [number, number, number]][] = [
      ['#FFFFFF', [1.5, 5.5, 1]],
      ['#FFE0C0', [-2, 4.5, -2]],
      ['#D0E0FF', [3, 2.5, -3]],
      ['#FFF0D0', [-3, 3.5, 2.5]],
    ];
    for (const [color, pos] of accents) {
      const s = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color }));
      s.position.set(...pos);
      envScene.add(s);
    }

    const envMap = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
    pmrem.dispose();

    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    return envMap;
  } catch (e) {
    if (__DEV__) console.warn('[GemView] EnvMap generation failed:', e);
    return null;
  }
}

// ─── Aura Shader (single clean fresnel glow) ───────────────────────────────

const AURA_VERTEX = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const AURA_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = 1.0 - abs(dot(vNormal, viewDir));
  fresnel = pow(fresnel, 2.5);
  float pulse = 0.85 + 0.15 * sin(uTime * 1.5);
  float alpha = fresnel * uIntensity * pulse * 0.3;
  gl_FragColor = vec4(uColor * 1.2, alpha);
}
`;

// ─── Ground Light Pool Shader ───────────────────────────────────────────────

const GROUND_GLOW_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GROUND_GLOW_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;

varying vec2 vUv;

void main() {
  float dist = length(vUv - 0.5) * 2.0;
  float falloff = 1.0 - smoothstep(0.0, 1.0, dist);
  falloff = pow(falloff, 2.5);
  float breath = 0.92 + 0.08 * sin(uTime * 0.5);
  float alpha = falloff * uIntensity * breath * 0.07;
  gl_FragColor = vec4(uColor * 0.6, alpha);
}
`;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  tierKey: TierKey;
  shape?: GemShapeKey;
  size?: number;
  viewWidth?: number;
  viewHeight?: number;
  rotationState: RotationState;
  gemScale?: number;
  autoRotate?: boolean;
  enableFloat?: boolean;
  paused?: boolean;
  onReady?: () => void;
  onError?: () => void;
  onFrame?: () => void;
}

/** Global diagnostics — read by DiagnosticsScreen */
export const gemDiagnostics = {
  glReady: false,
  lastFrameTime: 0,
  frameCount: 0,
  fps: 0,
  drawCalls: 0,
  triangles: 0,
  rendererInfo: '',
  safeMode: false,
  errors: [] as string[],
};

let _fpsFrames = 0;
let _fpsLastTime = 0;

// ─── Component ──────────────────────────────────────────────────────────────

export const GemView: React.FC<Props> = React.memo(({
  tierKey,
  shape = 'brilliant',
  size = 220,
  viewWidth,
  viewHeight,
  rotationState,
  gemScale = 1,
  autoRotate = true,
  enableFloat = true,
  paused = false,
  onReady,
  onError,
  onFrame,
}) => {
  const w = viewWidth ?? size;
  const h = viewHeight ?? size;

  // Three.js object refs
  const animFrameRef = useRef<number>(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);

  // Arc core refs
  const arcCoreRef = useRef<THREE.Mesh | null>(null);
  const arcCoreMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Environment refs
  const envMapRef = useRef<THREE.Texture | null>(null);

  // Aura ref (single clean glow)
  const auraRef = useRef<THREE.Mesh | null>(null);
  const auraMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // Ground light pool
  const groundGlowRef = useRef<THREE.Mesh | null>(null);
  const groundGlowMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // 2 orbiting sweep lights
  const sweepLightsRef = useRef<THREE.PointLight[]>([]);

  // Prop refs (for animation loop closure)
  const tierKeyRef = useRef(tierKey);
  const shapeRef = useRef(shape);
  const gemScaleRef = useRef(gemScale);
  const autoRotateRef = useRef(autoRotate);
  const enableFloatRef = useRef(enableFloat);
  const pausedRef = useRef(paused);
  const onFrameRef = useRef(onFrame);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  // Material interpolation targets
  const targetColorRef = useRef(new THREE.Color());
  const targetEmissiveRef = useRef(new THREE.Color());
  const targetGlowColorRef = useRef(new THREE.Color());
  const targetMatRef = useRef<ReturnType<typeof safeMaterial> | null>(null);
  const isLerpingRef = useRef(false);

  // Keep prop refs current
  useEffect(() => { tierKeyRef.current = tierKey; }, [tierKey]);
  useEffect(() => { shapeRef.current = shape; }, [shape]);
  useEffect(() => { gemScaleRef.current = gemScale; }, [gemScale]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { enableFloatRef.current = enableFloat; }, [enableFloat]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { onFrameRef.current = onFrame; }, [onFrame]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // ── Material update → smooth interpolation ──
  useEffect(() => {
    if (!materialRef.current) return;
    const mat = safeMaterial(TIER_MATERIALS[tierKey]);
    targetColorRef.current.set(mat.color);
    targetEmissiveRef.current.set(mat.emissive);
    targetGlowColorRef.current.set(mat.glowColor);
    targetMatRef.current = mat;
    isLerpingRef.current = true;

    // Update arc core
    if (arcCoreMaterialRef.current) {
      (arcCoreMaterialRef.current.uniforms.uColor as { value: THREE.Color }).value.set(mat.glowColor);
      arcCoreMaterialRef.current.uniforms.uIntensity.value = mat.glowIntensity;
    }

    // Update aura
    if (auraMatRef.current) {
      (auraMatRef.current.uniforms.uColor as { value: THREE.Color }).value.set(mat.glowColor);
      auraMatRef.current.uniforms.uIntensity.value = mat.glowIntensity;
    }

    // Update ground light pool
    if (groundGlowMatRef.current) {
      (groundGlowMatRef.current.uniforms.uColor as { value: THREE.Color }).value.set(mat.glowColor);
      groundGlowMatRef.current.uniforms.uIntensity.value = mat.glowIntensity;
    }
  }, [tierKey]);

  // ── Geometry update → immediate swap + reframe camera using shape profile ──
  useEffect(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const profile = getShapeProfile(shape);
    const oldGeom = meshRef.current.geometry;
    meshRef.current.geometry = createGemGeometry(shape, gemScale * profile.baseScale);
    oldGeom.dispose();
    fitCameraToObject(cameraRef.current, meshRef.current, profile.cameraPadding, profile.yOffset);
  }, [shape, gemScale]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = 0;
      }
      if (envMapRef.current) {
        envMapRef.current.dispose();
        envMapRef.current = null;
      }
      if (auraRef.current) {
        auraRef.current.geometry.dispose();
        (auraRef.current.material as THREE.Material).dispose();
      }
      if (groundGlowRef.current) {
        groundGlowRef.current.geometry.dispose();
        (groundGlowRef.current.material as THREE.Material).dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      gemDiagnostics.glReady = false;
    };
  }, []);

  // ── GL Context (fires ONCE) ──
  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glRef.current = gl;
    const preset = NOIR_LIGHTS;

    try {
      // ─ Renderer ─
      const renderer = new THREE.WebGLRenderer({
        canvas: {
          width: gl.drawingBufferWidth,
          height: gl.drawingBufferHeight,
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
          clientHeight: gl.drawingBufferHeight,
          clientWidth: gl.drawingBufferWidth,
        } as unknown as HTMLCanvasElement,
        context: gl as unknown as WebGLRenderingContext,
        alpha: false,
      });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio(1);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.8;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(new THREE.Color(preset.bgColor), 1);
      rendererRef.current = renderer;

      // Capture renderer info
      const glInfo = renderer.getContext().getExtension('WEBGL_debug_renderer_info');
      if (glInfo) {
        const vendor = renderer.getContext().getParameter(glInfo.UNMASKED_VENDOR_WEBGL);
        const rendererStr = renderer.getContext().getParameter(glInfo.UNMASKED_RENDERER_WEBGL);
        gemDiagnostics.rendererInfo = `${vendor} / ${rendererStr}`;
      } else {
        gemDiagnostics.rendererInfo = 'WebGL (no debug info)';
      }

      // ─ Scene ─
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // ─ Procedural Environment Map ─
      const envMap = createEnvironmentMap(renderer);
      if (envMap) {
        scene.environment = envMap;
        envMapRef.current = envMap;
      }

      // ─ Camera ─
      const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
      const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
      camera.position.set(0, 0.12, 4.0);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // ─ Lights (5-point noir rig) ─
      const ambient = new THREE.AmbientLight(preset.ambient.color, preset.ambient.intensity);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(preset.key.color, preset.key.intensity);
      keyLight.position.set(...preset.key.position);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(preset.fill.color, preset.fill.intensity);
      fillLight.position.set(...preset.fill.position);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(preset.rim.color, preset.rim.intensity);
      rimLight.position.set(...preset.rim.position);
      scene.add(rimLight);

      const accentLight = new THREE.PointLight(preset.accent.color, preset.accent.intensity, 10, 2);
      accentLight.position.set(...preset.accent.position);
      scene.add(accentLight);

      // ─ Shape profile ─
      const shapeProfile = getShapeProfile(shapeRef.current);

      // ─ Gem Material ─
      const matConfig = safeMaterial(TIER_MATERIALS[tierKeyRef.current]);
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(matConfig.color),
        emissive: new THREE.Color(matConfig.emissive),
        emissiveIntensity: matConfig.emissiveIntensity,
        metalness: matConfig.metalness,
        roughness: matConfig.roughness,
        clearcoat: matConfig.clearcoat,
        clearcoatRoughness: matConfig.clearcoatRoughness,
        transparent: true,
        opacity: matConfig.opacity,
        envMapIntensity: matConfig.envMapIntensity,
        transmission: matConfig.transmission,
        ior: matConfig.ior,
        thickness: matConfig.thickness,
        side: THREE.DoubleSide,
      });
      materialRef.current = material;

      // ─ Gem Mesh ─
      const geometry = createGemGeometry(shapeRef.current, gemScaleRef.current * shapeProfile.baseScale);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      meshRef.current = mesh;

      // Apply initial orientation from shape profile
      const [ax, ay, az, angle] = shapeProfile.initialOrientation;
      const axisLen = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
      _q1.setFromAxisAngle(
        new THREE.Vector3(ax / axisLen, ay / axisLen, az / axisLen),
        angle,
      );
      mesh.quaternion.copy(_q1);
      // Write to rotation state so gesture system is in sync
      rotationState.qx = _q1.x;
      rotationState.qy = _q1.y;
      rotationState.qz = _q1.z;
      rotationState.qw = _q1.w;

      fitCameraToObject(camera, mesh, shapeProfile.cameraPadding, shapeProfile.yOffset);

      // ─ Arc Core (inside gem, smooth glow) ─
      const arcCoreGeom = new THREE.SphereGeometry(0.38, 32, 32);
      const arcCoreMat = createArcCoreMaterial(matConfig.glowColor, matConfig.glowIntensity);
      const arcCore = new THREE.Mesh(arcCoreGeom, arcCoreMat);
      scene.add(arcCore);
      arcCoreRef.current = arcCore;
      arcCoreMaterialRef.current = arcCoreMat;

      // ─ Aura (single clean fresnel glow around gem) ─
      const auraGeom = new THREE.SphereGeometry(0.85, 24, 24);
      const auraMat = new THREE.ShaderMaterial({
        vertexShader: AURA_VERTEX,
        fragmentShader: AURA_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(matConfig.glowColor) },
          uIntensity: { value: matConfig.glowIntensity },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.FrontSide,
      });
      const aura = new THREE.Mesh(auraGeom, auraMat);
      scene.add(aura);
      auraRef.current = aura;
      auraMatRef.current = auraMat;

      // ─ Ground Light Pool (gem casts light downward) ─
      const groundGeom = new THREE.CircleGeometry(2.0, 32);
      const groundMat = new THREE.ShaderMaterial({
        vertexShader: GROUND_GLOW_VERTEX,
        fragmentShader: GROUND_GLOW_FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(matConfig.glowColor) },
          uIntensity: { value: matConfig.glowIntensity },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const groundGlow = new THREE.Mesh(groundGeom, groundMat);
      groundGlow.rotation.x = -Math.PI / 2;
      groundGlow.position.y = -1.35;
      scene.add(groundGlow);
      groundGlowRef.current = groundGlow;
      groundGlowMatRef.current = groundMat;

      // ─ 2 Orbiting Sweep Lights ─
      const sweepConfigs: [string, number, number][] = [
        ['#FFFFFF', 0.8, 8],   // white, bright
        ['#FFE0C0', 0.5, 6],   // warm, medium
      ];
      const sweepLights: THREE.PointLight[] = [];
      for (const [color, intensity, range] of sweepConfigs) {
        const light = new THREE.PointLight(color, intensity, range, 2);
        scene.add(light);
        sweepLights.push(light);
      }
      sweepLightsRef.current = sweepLights;

      // ─ Contact Shadow ─
      const shadowGeom = new THREE.PlaneGeometry(1.4, 0.7);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.04,
      });
      const shadow = new THREE.Mesh(shadowGeom, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = -1.2;
      scene.add(shadow);

      // ─── Animation Loop ─────────────────────────────────────────────────
      const clock = new THREE.Clock();
      clock.start();
      _fpsFrames = 0;
      _fpsLastTime = performance.now();

      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);

        if (pausedRef.current) return;

        const t = clock.getElapsedTime();
        const rs = rotationState;

        // ── Material interpolation ──
        if (isLerpingRef.current && targetMatRef.current && materialRef.current) {
          const m = materialRef.current;
          const target = targetMatRef.current;
          const spd = LERP_SPEED;

          m.color.lerp(targetColorRef.current, spd);
          m.emissive.lerp(targetEmissiveRef.current, spd);
          m.emissiveIntensity += (target.emissiveIntensity - m.emissiveIntensity) * spd;
          m.metalness += (target.metalness - m.metalness) * spd;
          m.roughness += (target.roughness - m.roughness) * spd;
          m.clearcoat += (target.clearcoat - m.clearcoat) * spd;
          m.clearcoatRoughness += (target.clearcoatRoughness - m.clearcoatRoughness) * spd;
          m.opacity += (target.opacity - m.opacity) * spd;
          m.transmission += (target.transmission - m.transmission) * spd;
          m.ior += (target.ior - m.ior) * spd;
          m.thickness += (target.thickness - m.thickness) * spd;

          if (Math.abs(m.metalness - target.metalness) < 0.003) {
            m.color.copy(targetColorRef.current);
            m.emissive.copy(targetEmissiveRef.current);
            m.emissiveIntensity = target.emissiveIntensity;
            m.metalness = target.metalness;
            m.roughness = target.roughness;
            m.clearcoat = target.clearcoat;
            m.clearcoatRoughness = target.clearcoatRoughness;
            m.opacity = target.opacity;
            m.transmission = target.transmission;
            m.ior = target.ior;
            m.thickness = target.thickness;
            isLerpingRef.current = false;
            targetMatRef.current = null;
          }
        }

        // ── Quaternion rotation — true 360°, no pitch limits ──
        _q1.set(rs.qx, rs.qy, rs.qz, rs.qw);

        if (!rs.isDragging) {
          // Delayed auto-rotate resume
          const timeSinceInteraction = Date.now() - rs.lastInteractionTime;
          if (rs.autoRotatePaused && timeSinceInteraction > AUTO_ROTATE_RESUME_DELAY) {
            rs.autoRotatePaused = false;
          }

          // Auto-rotate around world Y
          if (autoRotateRef.current && !rs.autoRotatePaused) {
            _q2.setFromAxisAngle(_axisY, AUTO_ROTATE_SPEED);
            _q1.premultiply(_q2);
          }

          // Velocity inertia with asymptotic decay
          if (Math.abs(rs.vx) > 0.00001 || Math.abs(rs.vy) > 0.00001) {
            _q2.setFromAxisAngle(_axisY, rs.vy);
            _q1.premultiply(_q2);
            _q2.setFromAxisAngle(_axisX, rs.vx);
            _q1.premultiply(_q2);
            rs.vx *= DAMPING;
            rs.vy *= DAMPING;
          }

          rs.qx = _q1.x;
          rs.qy = _q1.y;
          rs.qz = _q1.z;
          rs.qw = _q1.w;
        }

        const floatY = enableFloatRef.current ? Math.sin(t * 0.7) * 0.06 : 0;

        // ── Apply to gem mesh ──
        if (meshRef.current) {
          meshRef.current.quaternion.set(rs.qx, rs.qy, rs.qz, rs.qw);
          meshRef.current.position.y = floatY;
        }

        // ── Arc core follows gem ──
        if (arcCoreRef.current) {
          arcCoreRef.current.quaternion.set(rs.qx, rs.qy, rs.qz, rs.qw);
          arcCoreRef.current.position.y = floatY;
        }
        if (arcCoreMaterialRef.current) {
          arcCoreMaterialRef.current.uniforms.uTime.value = t;
        }

        // ── Aura follows gem ──
        if (auraRef.current) {
          auraRef.current.quaternion.set(rs.qx, rs.qy, rs.qz, rs.qw);
          auraRef.current.position.y = floatY;
          if (auraMatRef.current) {
            auraMatRef.current.uniforms.uTime.value = t;
          }
        }

        // ── Ground light pool (static, subtle breathing) ──
        if (groundGlowMatRef.current) {
          groundGlowMatRef.current.uniforms.uTime.value = t;
        }

        // ── 2 sweep lights orbit ──
        const sweepLights = sweepLightsRef.current;
        if (sweepLights.length === 2) {
          // Light 0: slow wide orbit
          const a0 = t * 0.4;
          sweepLights[0].position.set(
            Math.cos(a0) * 2.5,
            Math.sin(t * 0.5) * 0.6 + floatY + 0.5,
            Math.sin(a0) * 2.5,
          );
          sweepLights[0].intensity = 0.6 + 0.3 * Math.sin(t * 1.8);

          // Light 1: medium orbit, opposite phase
          const a1 = t * 0.6 + Math.PI;
          sweepLights[1].position.set(
            Math.cos(a1) * 2.0,
            Math.sin(t * 0.4 + 1.5) * 0.5 + floatY - 0.2,
            Math.sin(a1) * 2.0,
          );
          sweepLights[1].intensity = 0.4 + 0.25 * Math.sin(t * 2.5 + 1.0);
        }

        // ── Camera micro-breathing ──
        camera.position.x = Math.sin(t * 0.23) * 0.012;
        camera.position.y = shapeProfile.yOffset + Math.cos(t * 0.31) * 0.008;

        renderer.render(scene, camera);
        gl.endFrameEXP();

        // ── Diagnostics ──
        const now = performance.now();
        gemDiagnostics.lastFrameTime = Date.now();
        gemDiagnostics.frameCount++;
        _fpsFrames++;
        if (now - _fpsLastTime >= 1000) {
          gemDiagnostics.fps = Math.round(_fpsFrames * 1000 / (now - _fpsLastTime));
          gemDiagnostics.drawCalls = renderer.info.render.calls;
          gemDiagnostics.triangles = renderer.info.render.triangles;
          _fpsFrames = 0;
          _fpsLastTime = now;
        }

        if (onFrameRef.current) onFrameRef.current();
      };

      animate();
      gemDiagnostics.glReady = true;
      gemDiagnostics.safeMode = false;
      onReadyRef.current?.();

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (__DEV__) console.warn('[GemView] Primary setup failed, entering SafeRenderMode:', msg);
      gemDiagnostics.errors.push(msg);

      // ─── SafeRenderMode — guaranteed-visible fallback ───
      try {
        const safeRenderer = new THREE.WebGLRenderer({
          canvas: {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
            style: {},
            addEventListener: () => {},
            removeEventListener: () => {},
            clientHeight: gl.drawingBufferHeight,
            clientWidth: gl.drawingBufferWidth,
          } as unknown as HTMLCanvasElement,
          context: gl as unknown as WebGLRenderingContext,
          alpha: false,
        });
        safeRenderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        safeRenderer.setPixelRatio(1);
        safeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        safeRenderer.toneMappingExposure = 1.4;
        safeRenderer.setClearColor(new THREE.Color('#060606'), 1);
        rendererRef.current = safeRenderer;

        const safeScene = new THREE.Scene();
        sceneRef.current = safeScene;

        const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
        const safeCamera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
        safeCamera.position.set(0, 0.15, 4.0);
        safeCamera.lookAt(0, 0, 0);
        cameraRef.current = safeCamera;

        safeScene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const safeKey = new THREE.DirectionalLight(0xffffff, 1.2);
        safeKey.position.set(3, 5, 4);
        safeScene.add(safeKey);
        const safeRim = new THREE.PointLight(0xffffff, 1.0);
        safeRim.position.set(0, -1, 3);
        safeScene.add(safeRim);

        const safeMat = new THREE.MeshStandardMaterial({
          color: 0xcccccc,
          emissive: 0x333333,
          emissiveIntensity: 0.3,
          metalness: 0.1,
          roughness: 0.4,
          side: THREE.DoubleSide,
        });

        const safeGeometry = createGemGeometry(shapeRef.current, gemScaleRef.current);
        const safeMesh = new THREE.Mesh(safeGeometry, safeMat);
        safeScene.add(safeMesh);
        meshRef.current = safeMesh;

        safeMesh.quaternion.set(
          rotationState.qx,
          rotationState.qy,
          rotationState.qz,
          rotationState.qw,
        );

        fitCameraToObject(safeCamera, safeMesh, 1.5, 0.15);

        const safeClock = new THREE.Clock();
        safeClock.start();
        const safeAnimate = () => {
          animFrameRef.current = requestAnimationFrame(safeAnimate);
          if (pausedRef.current) return;

          const rs = rotationState;

          _q1.set(rs.qx, rs.qy, rs.qz, rs.qw);
          if (!rs.isDragging) {
            const timeSinceInteraction = Date.now() - rs.lastInteractionTime;
            if (rs.autoRotatePaused && timeSinceInteraction > AUTO_ROTATE_RESUME_DELAY) {
              rs.autoRotatePaused = false;
            }

            if (autoRotateRef.current && !rs.autoRotatePaused) {
              _q2.setFromAxisAngle(_axisY, AUTO_ROTATE_SPEED);
              _q1.premultiply(_q2);
            }
            if (Math.abs(rs.vx) > 0.00001 || Math.abs(rs.vy) > 0.00001) {
              _q2.setFromAxisAngle(_axisY, rs.vy);
              _q1.premultiply(_q2);
              _q2.setFromAxisAngle(_axisX, rs.vx);
              _q1.premultiply(_q2);
              rs.vx *= DAMPING;
              rs.vy *= DAMPING;
            }
            rs.qx = _q1.x;
            rs.qy = _q1.y;
            rs.qz = _q1.z;
            rs.qw = _q1.w;
          }

          safeMesh.quaternion.set(rs.qx, rs.qy, rs.qz, rs.qw);
          safeMesh.position.y = enableFloatRef.current
            ? Math.sin(safeClock.getElapsedTime() * 0.7) * 0.06
            : 0;

          safeRenderer.render(safeScene, safeCamera);
          gl.endFrameEXP();

          gemDiagnostics.lastFrameTime = Date.now();
          gemDiagnostics.frameCount++;
          if (onFrameRef.current) onFrameRef.current();
        };

        safeAnimate();
        gemDiagnostics.glReady = true;
        gemDiagnostics.safeMode = true;
        gemDiagnostics.errors.push('SafeRenderMode active');
        if (__DEV__) console.log('[GemView] SafeRenderMode active');
        onReadyRef.current?.();
      } catch (safeErr) {
        const safeMsg = safeErr instanceof Error ? safeErr.message : String(safeErr);
        gemDiagnostics.errors.push(`SafeRenderMode failed: ${safeMsg}`);
        onErrorRef.current?.();
      }
    }
  }, []); // Empty deps — fires once

  return (
    <View style={[styles.container, { width: w, height: h }]}>
      <GLView
        style={{ width: w, height: h }}
        onContextCreate={onContextCreate}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

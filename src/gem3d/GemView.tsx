/**
 * GemView V16 — Luxury Engravings + Light/Dark Modes + Scene Re-Lighting.
 *
 * V15→V16 changes:
 *   - ADDED:   Procedural engraving system via onBeforeCompile shader injection.
 *              Gold filigree, emerald inlays, platinum accents, sapphire micro-inlays
 *              all computed procedurally in object-space — no UVs needed.
 *   - ADDED:   Engraving uniforms lerped alongside material properties for smooth
 *              tier transitions (same LERP_SPEED = 0.06).
 *   - ADDED:   Time-based subtle shimmer on engravings (very subtle, premium feel).
 *   - KEPT:    Everything from V15 — background modes, scene re-lighting, full
 *              lighting rig, PMREM, material lerping, rotation, diagnostics.
 *
 * Philosophy: Studio product photography. Royal, rich, elegant, very precious.
 * Premium, buttery, Apple-level transitions. No flickers, no sudden jumps.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { GLView } from 'expo-gl';
import type { ExpoWebGLRenderingContext } from 'expo-gl';
import * as THREE from 'three';
import { createGemGeometry, GemShapeKey } from './geometries';
import { TIER_MATERIALS, safeMaterial } from './materials';
import { STUDIO_LIGHTS } from './lighting';
import { createStudioEnvironment } from './studioEnv';
import { createContactShadow } from './shadowCatcher';
import { createBackgroundQuad, BackgroundQuad } from './backgroundQuad';
import { fitCameraToObject } from './fitCamera';
import { getShapeProfile } from './shapeProfiles';
import { createArcCoreMaterial } from './ArcCoreShader';
import { TierKey } from '../engine/tierProfiles';
import type { BackgroundMode } from '../store/useGemStore';
import { GEM_FLAGS } from './featureFlags';
import { LUXURY_SPECS } from './luxurySpecs';
import {
  applyEngravingShader,
  createEngravingTargets,
  type EngravingUniforms,
  type EngravingTargets,
} from './engravingShader';

// ─── Pre-allocated temp objects (zero GC in render loop) ────────────────────

const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _axisX = new THREE.Vector3(1, 0, 0);
const _axisY = new THREE.Vector3(0, 1, 0);

// ─── Quaternion-based Rotation State ────────────────────────────────────────

export interface RotationState {
  qx: number; qy: number; qz: number; qw: number;
  vx: number; vy: number;
  isDragging: boolean;
  autoRotatePaused: boolean;
  lastInteractionTime: number;
}

/** Gesture input via Reanimated shared values (worklet → JS thread bridge) */
export interface GestureInput {
  dragging: SharedValue<boolean>;
  transX: SharedValue<number>;
  transY: SharedValue<number>;
  velX: SharedValue<number>;
  velY: SharedValue<number>;
}

// ─── Tuning Constants ───────────────────────────────────────────────────────

const LERP_SPEED = 0.06;           // material transition speed
const SCENE_LERP_SPEED = 0.035;    // scene re-lighting speed (slower = more cinematic)
const DAMPING = 0.965;
const AUTO_ROTATE_SPEED = 0.003;
const AUTO_ROTATE_RESUME_DELAY = 800;

// expo-gl drawingBuffer already includes device pixel ratio — always use 1 here
const RENDERER_PIXEL_RATIO = 1;

// Adaptive quality thresholds (diagnostics only — expo-gl pixel ratio is fixed)
const FPS_THRESHOLD_DOWN = 45;
const FPS_THRESHOLD_UP = 55;

// Smooth camera transition on shape change
const CAMERA_LERP_SPEED = 0.045;

// Gesture processing (moved from GemRenderer3D — runs in animation loop on JS thread)
const PAN_SENSITIVITY = 0.012;
const VELOCITY_SMOOTHING = 0.3;
const VELOCITY_SCALE_X = 0.00006;
const VELOCITY_SCALE_Y = 0.00005;
const MAX_FLING_VELOCITY = 0.04;

// SSAA anti-aliasing: render at higher resolution, downsample for edge smoothing.
// Eliminates facet shimmer during rotation without MSAA (which expo-gl can't do).
const SSAA_SCALE = 1.5;

// ─── Scene Lighting Targets for Light & Dark Modes ──────────────────────────

interface SceneTargets {
  exposure: number;
  ambientIntensity: number;
  ambientColor: THREE.Color;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  fillIntensity: number;
  contactShadowOpacity: number;
}

const DARK_SCENE: SceneTargets = {
  exposure: 1.85,
  ambientIntensity: 0.6,
  ambientColor: new THREE.Color('#403848'),
  hemiSkyColor: new THREE.Color('#403848'),
  hemiGroundColor: new THREE.Color('#201820'),
  hemiIntensity: 0.5,
  fillIntensity: 1.8,
  contactShadowOpacity: 0.35,
};

const LIGHT_SCENE: SceneTargets = {
  exposure: 2.1,
  ambientIntensity: 0.65,
  ambientColor: new THREE.Color('#D0C8B8'),
  hemiSkyColor: new THREE.Color('#F0E8E0'),
  hemiGroundColor: new THREE.Color('#D0C8C0'),
  hemiIntensity: 0.55,
  fillIntensity: 2.0,
  contactShadowOpacity: 0.15,
};

function getSceneTargets(mode: BackgroundMode): SceneTargets {
  return mode === 'light' ? LIGHT_SCENE : DARK_SCENE;
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  tierKey: TierKey;
  shape?: GemShapeKey;
  size?: number;
  viewWidth?: number;
  viewHeight?: number;
  rotationState: RotationState;
  gestureInput?: GestureInput;
  gemScale?: number;
  autoRotate?: boolean;
  enableFloat?: boolean;
  paused?: boolean;
  backgroundMode?: BackgroundMode;
  onReady?: () => void;
  onError?: () => void;
  onFrame?: () => void;
}

// ─── Tier-Aware Lighting Helpers ────────────────────────────────────────────

/**
 * Dark gem fill boost: prevents dark-colored gems from collapsing into
 * dark backgrounds. Returns a fill light multiplier (1.0 = no boost).
 */
function computeDarkGemFillBoost(tierKey: TierKey): number {
  if (!GEM_FLAGS.darkGemFillBoost) return 1.0;
  const mat = TIER_MATERIALS[tierKey];
  const c = new THREE.Color(mat.color);
  const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  // Dark gems (L < 0.5) get stronger fill; max 1.3x at L=0
  return L < 0.5 ? 1.0 + (0.5 - L) * 0.6 : 1.0;
}

/**
 * Light gem exposure clamp: prevents bright gems from washing out
 * in light mode. Returns the adjusted exposure value.
 */
function computeLightModeExposure(tierKey: TierKey, base: number): number {
  if (!GEM_FLAGS.lightGemExposureClamp) return base;
  const mat = TIER_MATERIALS[tierKey];
  const c = new THREE.Color(mat.color);
  const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  // Bright gems (L > 0.7) get slightly lower exposure (max -0.09)
  // Dark gems (L < 0.3) get slightly higher exposure (max +0.045)
  if (L > 0.7) return base - (L - 0.7) * 0.3;
  if (L < 0.3) return base + (0.3 - L) * 0.15;
  return base;
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
  pixelRatio: 1,
  qualityMode: 'standard' as 'standard' | 'hd',
  darkGemBoost: 0,
  cameraLerping: false,
  errors: [] as string[],
  // Quality verification diagnostics (dev-only)
  ssaaScale: 1,
  drawingBufferWidth: 0,
  drawingBufferHeight: 0,
  lowQualityActive: false,
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
  gestureInput,
  gemScale = 1,
  autoRotate = true,
  enableFloat = true,
  paused = false,
  backgroundMode = 'dark',
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
  const ssaaTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);

  // Background + shadow refs
  const bgQuadRef = useRef<BackgroundQuad | null>(null);
  const contactShadowRef = useRef<THREE.Mesh | null>(null);

  // Aura glow + ground light pool refs
  const auraMeshRef = useRef<THREE.Mesh | null>(null);
  const auraMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const groundPoolRef = useRef<THREE.Mesh | null>(null);
  const groundPoolMatRef = useRef<THREE.ShaderMaterial | null>(null);

  // Scene light refs (needed for re-lighting animation)
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Environment refs
  const envMapRef = useRef<THREE.Texture | null>(null);

  // Prop refs (for animation loop closure)
  const tierKeyRef = useRef(tierKey);
  const shapeRef = useRef(shape);
  const gemScaleRef = useRef(gemScale);
  const autoRotateRef = useRef(autoRotate);
  const enableFloatRef = useRef(enableFloat);
  const pausedRef = useRef(paused);
  const backgroundModeRef = useRef(backgroundMode);
  const onFrameRef = useRef(onFrame);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  // Material interpolation targets
  const targetColorRef = useRef(new THREE.Color());
  const targetEmissiveRef = useRef(new THREE.Color());
  const targetAttenuationColorRef = useRef(new THREE.Color());
  const targetMatRef = useRef<ReturnType<typeof safeMaterial> | null>(null);
  const isLerpingRef = useRef(false);

  // Engraving system refs (luxury engravings via shader injection)
  const engravingUniformsRef = useRef<EngravingUniforms | null>(null);
  const targetEngravingRef = useRef<EngravingTargets | null>(null);

  // Scene re-lighting targets (for mode transition animation)
  const sceneTargetsRef = useRef<SceneTargets>(getSceneTargets(backgroundMode));
  const isSceneLerpingRef = useRef(false);

  // Smooth camera lerp targets (shape change)
  const cameraTargetZ = useRef<number | null>(null);
  const cameraTargetY = useRef<number | null>(null);

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
    targetAttenuationColorRef.current.set(mat.attenuationColor);
    targetMatRef.current = mat;
    isLerpingRef.current = true;

    // Set engraving targets for the new tier (lerped in animation loop)
    targetEngravingRef.current = createEngravingTargets(LUXURY_SPECS[tierKey]);

    // Update aura glow color and intensity for new tier
    if (auraMatRef.current) {
      auraMatRef.current.uniforms.uColor.value.set(mat.glowColor);
      auraMatRef.current.uniforms.uIntensity.value = mat.glowIntensity;
    }

    // Update ground light pool color for new tier
    if (groundPoolMatRef.current) {
      groundPoolMatRef.current.uniforms.uColor.value.set(mat.glowColor);
      groundPoolMatRef.current.uniforms.uIntensity.value = mat.glowIntensity * 0.6;
    }

    // Update background auto-contrast and tier-aware lighting for the new tier
    if (bgQuadRef.current) {
      bgQuadRef.current.setTargetColors(tierKey, backgroundModeRef.current);
    }

    // Recompute tier-aware scene targets
    const mode = backgroundModeRef.current;
    const baseTargets = getSceneTargets(mode);
    const tierAwareTargets = { ...baseTargets };
    if (mode === 'dark') {
      tierAwareTargets.fillIntensity = baseTargets.fillIntensity * computeDarkGemFillBoost(tierKey);
      gemDiagnostics.darkGemBoost = tierAwareTargets.fillIntensity - baseTargets.fillIntensity;
    } else {
      tierAwareTargets.exposure = computeLightModeExposure(tierKey, baseTargets.exposure);
      gemDiagnostics.darkGemBoost = 0;
    }
    sceneTargetsRef.current = tierAwareTargets;
    isSceneLerpingRef.current = true;
  }, [tierKey]);

  // ── Background mode change → scene re-lighting ──
  useEffect(() => {
    backgroundModeRef.current = backgroundMode;
    if (!rendererRef.current) return;

    // Set new scene lighting targets (with tier-aware adjustments)
    const baseTargets = getSceneTargets(backgroundMode);
    const tierAwareTargets = { ...baseTargets };
    if (backgroundMode === 'dark') {
      tierAwareTargets.fillIntensity = baseTargets.fillIntensity * computeDarkGemFillBoost(tierKeyRef.current);
      gemDiagnostics.darkGemBoost = tierAwareTargets.fillIntensity - baseTargets.fillIntensity;
    } else {
      tierAwareTargets.exposure = computeLightModeExposure(tierKeyRef.current, baseTargets.exposure);
      gemDiagnostics.darkGemBoost = 0;
    }
    sceneTargetsRef.current = tierAwareTargets;
    isSceneLerpingRef.current = true;

    // Set new background quad color targets
    if (bgQuadRef.current) {
      bgQuadRef.current.setTargetColors(tierKeyRef.current, backgroundMode);
    }
  }, [backgroundMode]);

  // ── Geometry update → immediate swap + smooth camera reframe ──
  useEffect(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const profile = getShapeProfile(shape);
    const outerScale = gemScale * profile.baseScale;

    const oldGeom = meshRef.current.geometry;
    meshRef.current.geometry = createGemGeometry(shape, outerScale);
    oldGeom.dispose();

    if (GEM_FLAGS.smoothCameraLerp) {
      // Compute where camera SHOULD be, but lerp there instead of snapping
      const tempCam = cameraRef.current.clone();
      fitCameraToObject(tempCam, meshRef.current, profile.cameraPadding, profile.yOffset);
      cameraTargetZ.current = tempCam.position.z;
      cameraTargetY.current = profile.yOffset;
      gemDiagnostics.cameraLerping = true;
    } else {
      fitCameraToObject(cameraRef.current, meshRef.current, profile.cameraPadding, profile.yOffset);
    }
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
      if (bgQuadRef.current) {
        bgQuadRef.current.dispose();
        bgQuadRef.current = null;
      }
      if (contactShadowRef.current) {
        contactShadowRef.current.geometry.dispose();
        const csMat = contactShadowRef.current.material as THREE.MeshBasicMaterial;
        if (csMat.map) csMat.map.dispose();
        csMat.dispose();
      }
      if (auraMeshRef.current) {
        auraMeshRef.current.geometry.dispose();
        (auraMeshRef.current.material as THREE.Material).dispose();
      }
      if (groundPoolRef.current) {
        groundPoolRef.current.geometry.dispose();
        (groundPoolRef.current.material as THREE.Material).dispose();
      }
      if (ssaaTargetRef.current) {
        ssaaTargetRef.current.dispose();
        ssaaTargetRef.current = null;
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
    const studio = STUDIO_LIGHTS;
    const initialScene = getSceneTargets(backgroundModeRef.current);

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
        antialias: false,   // CRITICAL: expo-gl doesn't implement renderbufferStorageMultisample
        stencil: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setPixelRatio(RENDERER_PIXEL_RATIO);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = initialScene.exposure;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(new THREE.Color('#050505'), 1);
      renderer.shadowMap.enabled = false;

      rendererRef.current = renderer;

      // Diagnostics
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

      // ─ Screen-space Background Quad (auto-contrast, mode-aware) ─
      const bgQuad = createBackgroundQuad(tierKeyRef.current, backgroundModeRef.current);
      scene.add(bgQuad.mesh);
      bgQuadRef.current = bgQuad;

      // ─ Studio Environment Map (PMREM) ─
      const envMap = createStudioEnvironment(renderer);
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

      // ─ Studio Lighting Rig (initialized to current mode) ─

      const ambient = new THREE.AmbientLight(
        initialScene.ambientColor.clone(),
        initialScene.ambientIntensity,
      );
      scene.add(ambient);
      ambientLightRef.current = ambient;

      const hemiLight = new THREE.HemisphereLight(
        initialScene.hemiSkyColor.clone(),
        initialScene.hemiGroundColor.clone(),
        initialScene.hemiIntensity,
      );
      scene.add(hemiLight);
      hemiLightRef.current = hemiLight;

      const keyLight = new THREE.DirectionalLight(studio.key.color, studio.key.intensity);
      keyLight.position.set(...studio.key.position);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(studio.fill.color, initialScene.fillIntensity);
      fillLight.position.set(...studio.fill.position);
      scene.add(fillLight);
      fillLightRef.current = fillLight;

      const rimLight = new THREE.DirectionalLight(studio.rim.color, studio.rim.intensity);
      rimLight.position.set(...studio.rim.position);
      scene.add(rimLight);

      const kickerLight = new THREE.PointLight(studio.kicker.color, studio.kicker.intensity, 12, 2);
      kickerLight.position.set(...studio.kicker.position);
      scene.add(kickerLight);

      const bounceLight = new THREE.DirectionalLight(studio.bounce.color, studio.bounce.intensity);
      bounceLight.position.set(...studio.bounce.position);
      scene.add(bounceLight);

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
        transparent: false,
        opacity: 1.0,
        envMapIntensity: matConfig.envMapIntensity,
        transmission: matConfig.transmission,
        ior: matConfig.ior,
        thickness: matConfig.thickness,
        attenuationColor: new THREE.Color(matConfig.attenuationColor),
        attenuationDistance: matConfig.attenuationDistance,
        specularIntensity: matConfig.specularIntensity,
        dispersion: GEM_FLAGS.gemDispersion ? matConfig.dispersion : 0,
        side: THREE.DoubleSide,
      });
      materialRef.current = material;

      // ─ Luxury Engravings (shader injection — BEFORE first render) ─
      const luxSpec = LUXURY_SPECS[tierKeyRef.current];
      const engravingUniforms = applyEngravingShader(material, luxSpec);
      engravingUniformsRef.current = engravingUniforms;

      // ─ Gem Mesh ─
      const outerScale = gemScaleRef.current * shapeProfile.baseScale;
      const geometry = createGemGeometry(shapeRef.current, outerScale);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 2;
      scene.add(mesh);
      meshRef.current = mesh;

      const [ax, ay, az, angle] = shapeProfile.initialOrientation;
      const axisLen = Math.sqrt(ax * ax + ay * ay + az * az) || 1;
      _q1.setFromAxisAngle(
        new THREE.Vector3(ax / axisLen, ay / axisLen, az / axisLen),
        angle,
      );
      mesh.quaternion.copy(_q1);
      rotationState.qx = _q1.x;
      rotationState.qy = _q1.y;
      rotationState.qz = _q1.z;
      rotationState.qw = _q1.w;

      fitCameraToObject(camera, mesh, shapeProfile.cameraPadding, shapeProfile.yOffset);

      // ─ Contact Shadow ─
      const contactShadow = createContactShadow();
      (contactShadow.material as THREE.MeshBasicMaterial).opacity = initialScene.contactShadowOpacity;
      scene.add(contactShadow);
      contactShadowRef.current = contactShadow;

      // ─ Aura Glow Sphere (inner light — makes the gem feel ALIVE) ─
      // A slightly smaller sphere inside the gem, rendered with AdditiveBlending.
      // Uses the ArcCore shader for pulsing, organic inner glow.
      const auraMat = createArcCoreMaterial(matConfig.glowColor, matConfig.glowIntensity);
      const auraGeo = new THREE.SphereGeometry(outerScale * 0.55, 24, 24);
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.renderOrder = 1; // render before gem (inside)
      scene.add(auraMesh);
      auraMeshRef.current = auraMesh;
      auraMatRef.current = auraMat;

      // ─ Ground Light Pool (tier-colored radiance beneath gem) ─
      // A flat circle below the gem that glows with the tier's color.
      // Gives the gem a "floating on light" presence — like a spotlight pedestal.
      const poolGeo = new THREE.CircleGeometry(1.5, 32);
      const poolMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(matConfig.glowColor) },
          uIntensity: { value: matConfig.glowIntensity * 0.6 },
        },
        vertexShader: [
          'varying vec2 vUv;',
          'void main() {',
          '  vUv = uv;',
          '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
          '}',
        ].join('\n'),
        fragmentShader: [
          'uniform vec3 uColor;',
          'uniform float uIntensity;',
          'varying vec2 vUv;',
          'void main() {',
          '  float dist = length(vUv - 0.5) * 2.0;',
          '  float falloff = 1.0 - dist * dist;',
          '  falloff = max(falloff, 0.0);',
          '  falloff = pow(falloff, 2.5);',
          '  gl_FragColor = vec4(uColor * uIntensity * falloff, falloff * 0.8);',
          '}',
        ].join('\n'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const poolMesh = new THREE.Mesh(poolGeo, poolMat);
      poolMesh.rotation.x = -Math.PI / 2;
      poolMesh.position.y = -1.25;
      poolMesh.renderOrder = 0;
      scene.add(poolMesh);
      groundPoolRef.current = poolMesh;
      groundPoolMatRef.current = poolMat;

      // ─── SSAA Anti-Aliasing Pipeline ───────────────────────────────────
      // Renders scene at 1.25x resolution then downsamples to screen via
      // bilinear filtering. Eliminates facet shimmer and edge aliasing
      // during rotation — the root cause of "pixelated while scrolling".
      // expo-gl does NOT support renderbufferStorageMultisample (MSAA),
      // so SSAA via render-target downsampling is the correct mobile AA.
      let ssaaTarget: THREE.WebGLRenderTarget | null = null;
      let ssaaCopyScene: THREE.Scene | null = null;
      let ssaaCopyCamera: THREE.OrthographicCamera | null = null;

      if (GEM_FLAGS.ssaaEnabled) {
        const rtW = Math.round(gl.drawingBufferWidth * SSAA_SCALE);
        const rtH = Math.round(gl.drawingBufferHeight * SSAA_SCALE);
        ssaaTarget = new THREE.WebGLRenderTarget(rtW, rtH, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          depthBuffer: true,
          stencilBuffer: false,
        });
        ssaaTargetRef.current = ssaaTarget;

        const copyMat = new THREE.ShaderMaterial({
          uniforms: { tDiffuse: { value: ssaaTarget.texture } },
          vertexShader: [
            'varying vec2 vUv;',
            'void main() {',
            '  vUv = uv;',
            '  gl_Position = vec4(position.xy, 0.0, 1.0);',
            '}',
          ].join('\n'),
          fragmentShader: [
            'uniform sampler2D tDiffuse;',
            'varying vec2 vUv;',
            'void main() {',
            '  gl_FragColor = texture2D(tDiffuse, vUv);',
            '}',
          ].join('\n'),
          depthTest: false,
          depthWrite: false,
          toneMapped: false, // Already tone-mapped in the SSAA target
        });

        const quadGeom = new THREE.PlaneGeometry(2, 2);
        const quadMesh = new THREE.Mesh(quadGeom, copyMat);
        ssaaCopyScene = new THREE.Scene();
        ssaaCopyScene.add(quadMesh);
        ssaaCopyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        gemDiagnostics.ssaaScale = SSAA_SCALE;
      }

      // ─── Animation Loop ─────────────────────────────────────────────────
      const clock = new THREE.Clock();
      clock.start();
      _fpsFrames = 0;
      _fpsLastTime = performance.now();

      // Track drawingBuffer dimensions for size sync
      // (catches navigation transitions, device rotation, late layout changes)
      let lastDbW = gl.drawingBufferWidth;
      let lastDbH = gl.drawingBufferHeight;

      // Gesture processing state (reads shared values → computes quaternion deltas)
      let prevGestureX = 0;
      let prevGestureY = 0;
      let wasDragging = false;
      let smoothVxLocal = 0;
      let smoothVyLocal = 0;

      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);

        if (pausedRef.current) return;

        const t = clock.getElapsedTime();
        const rs = rotationState;

        // Update engraving time uniform (for subtle shimmer animation)
        if (engravingUniformsRef.current) {
          engravingUniformsRef.current.uEngravingTime.value = t;
        }

        // Update aura glow animation
        if (auraMatRef.current) {
          auraMatRef.current.uniforms.uTime.value = t;
        }

        // Sync aura mesh position with gem float
        if (auraMeshRef.current && meshRef.current) {
          auraMeshRef.current.position.copy(meshRef.current.position);
          auraMeshRef.current.quaternion.copy(meshRef.current.quaternion);
        }

        // ── Material interpolation (smooth tier transitions) ──
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
          m.envMapIntensity += (target.envMapIntensity - m.envMapIntensity) * spd;
          m.transmission += (target.transmission - m.transmission) * spd;
          m.ior += (target.ior - m.ior) * spd;
          m.thickness += (target.thickness - m.thickness) * spd;
          m.attenuationColor.lerp(targetAttenuationColorRef.current, spd);
          m.attenuationDistance += (target.attenuationDistance - m.attenuationDistance) * spd;
          m.specularIntensity += (target.specularIntensity - m.specularIntensity) * spd;
          if (GEM_FLAGS.gemDispersion) {
            m.dispersion += (target.dispersion - m.dispersion) * spd;
          }

          // Lerp engraving uniforms alongside material properties
          if (engravingUniformsRef.current && targetEngravingRef.current) {
            const eu = engravingUniformsRef.current;
            const te = targetEngravingRef.current;
            eu.uEngravingIntensity.value += (te.intensity - eu.uEngravingIntensity.value) * spd;
            eu.uPatternDensity.value += (te.density - eu.uPatternDensity.value) * spd;
            eu.uInlayColor1.value.lerp(te.color1, spd);
            eu.uInlayColor2.value.lerp(te.color2, spd);
            eu.uInlayBlend.value += (te.blend - eu.uInlayBlend.value) * spd;
            eu.uNormalDepth.value += (te.normalDepth - eu.uNormalDepth.value) * spd;
            eu.uInlayMetalness.value += (te.metalness - eu.uInlayMetalness.value) * spd;
            eu.uInlayRoughness.value += (te.roughness - eu.uInlayRoughness.value) * spd;
            eu.uEmissiveBoost.value += (te.emissive - eu.uEmissiveBoost.value) * spd;
          }

          if (Math.abs(m.metalness - target.metalness) < 0.003) {
            m.color.copy(targetColorRef.current);
            m.emissive.copy(targetEmissiveRef.current);
            m.emissiveIntensity = target.emissiveIntensity;
            m.metalness = target.metalness;
            m.roughness = target.roughness;
            m.clearcoat = target.clearcoat;
            m.clearcoatRoughness = target.clearcoatRoughness;
            m.envMapIntensity = target.envMapIntensity;
            m.transmission = target.transmission;
            m.ior = target.ior;
            m.thickness = target.thickness;
            m.attenuationColor.copy(targetAttenuationColorRef.current);
            m.attenuationDistance = target.attenuationDistance;
            m.specularIntensity = target.specularIntensity;
            if (GEM_FLAGS.gemDispersion) {
              m.dispersion = target.dispersion;
            }

            // Snap engraving uniforms to targets
            if (engravingUniformsRef.current && targetEngravingRef.current) {
              const eu = engravingUniformsRef.current;
              const te = targetEngravingRef.current;
              eu.uEngravingIntensity.value = te.intensity;
              eu.uPatternDensity.value = te.density;
              eu.uInlayColor1.value.copy(te.color1);
              eu.uInlayColor2.value.copy(te.color2);
              eu.uInlayBlend.value = te.blend;
              eu.uNormalDepth.value = te.normalDepth;
              eu.uInlayMetalness.value = te.metalness;
              eu.uInlayRoughness.value = te.roughness;
              eu.uEmissiveBoost.value = te.emissive;
              targetEngravingRef.current = null;
            }

            isLerpingRef.current = false;
            targetMatRef.current = null;
          }
        }

        // ── Scene re-lighting animation (smooth mode transitions) ──
        // The ENTIRE studio re-lights: exposure, ambient, hemisphere, fill,
        // contact shadow, and background quad all animate together at
        // SCENE_LERP_SPEED for a cinematic "re-lit" feel.
        if (isSceneLerpingRef.current) {
          const st = sceneTargetsRef.current;
          const sspd = SCENE_LERP_SPEED;

          renderer.toneMappingExposure += (st.exposure - renderer.toneMappingExposure) * sspd;

          if (ambientLightRef.current) {
            ambientLightRef.current.intensity += (st.ambientIntensity - ambientLightRef.current.intensity) * sspd;
            ambientLightRef.current.color.lerp(st.ambientColor, sspd);
          }

          if (hemiLightRef.current) {
            hemiLightRef.current.intensity += (st.hemiIntensity - hemiLightRef.current.intensity) * sspd;
            hemiLightRef.current.color.lerp(st.hemiSkyColor, sspd);
            hemiLightRef.current.groundColor.lerp(st.hemiGroundColor, sspd);
          }

          if (fillLightRef.current) {
            fillLightRef.current.intensity += (st.fillIntensity - fillLightRef.current.intensity) * sspd;
          }

          if (contactShadowRef.current) {
            const csMat = contactShadowRef.current.material as THREE.MeshBasicMaterial;
            csMat.opacity += (st.contactShadowOpacity - csMat.opacity) * sspd;
          }

          let bgStillLerping = false;
          if (bgQuadRef.current) {
            bgStillLerping = bgQuadRef.current.lerpColors(sspd);
          }

          const exposureDiff = Math.abs(renderer.toneMappingExposure - st.exposure);
          if (exposureDiff < 0.005 && !bgStillLerping) {
            renderer.toneMappingExposure = st.exposure;
            if (ambientLightRef.current) {
              ambientLightRef.current.intensity = st.ambientIntensity;
              ambientLightRef.current.color.copy(st.ambientColor);
            }
            if (hemiLightRef.current) {
              hemiLightRef.current.intensity = st.hemiIntensity;
              hemiLightRef.current.color.copy(st.hemiSkyColor);
              hemiLightRef.current.groundColor.copy(st.hemiGroundColor);
            }
            if (fillLightRef.current) fillLightRef.current.intensity = st.fillIntensity;
            if (contactShadowRef.current) {
              (contactShadowRef.current.material as THREE.MeshBasicMaterial).opacity = st.contactShadowOpacity;
            }
            isSceneLerpingRef.current = false;
          }
        }

        // ── Process gesture input (reads shared values from UI thread) ──
        if (gestureInput) {
          const nowDragging = gestureInput.dragging.value;
          if (nowDragging && !wasDragging) {
            rs.isDragging = true;
            rs.autoRotatePaused = true;
            rs.vx = 0;
            rs.vy = 0;
            smoothVxLocal = 0;
            smoothVyLocal = 0;
            prevGestureX = gestureInput.transX.value;
            prevGestureY = gestureInput.transY.value;
          } else if (nowDragging) {
            const curX = gestureInput.transX.value;
            const curY = gestureInput.transY.value;
            const dx = curX - prevGestureX;
            const dy = curY - prevGestureY;
            prevGestureX = curX;
            prevGestureY = curY;

            _q1.set(rs.qx, rs.qy, rs.qz, rs.qw);
            _q2.setFromAxisAngle(_axisY, dx * PAN_SENSITIVITY);
            _q1.premultiply(_q2);
            _q2.setFromAxisAngle(_axisX, dy * PAN_SENSITIVITY);
            _q1.premultiply(_q2);
            _q1.normalize();
            rs.qx = _q1.x;
            rs.qy = _q1.y;
            rs.qz = _q1.z;
            rs.qw = _q1.w;

            const rawVy = gestureInput.velX.value * VELOCITY_SCALE_X;
            const rawVx = gestureInput.velY.value * VELOCITY_SCALE_Y;
            smoothVxLocal = smoothVxLocal * (1 - VELOCITY_SMOOTHING) + rawVx * VELOCITY_SMOOTHING;
            smoothVyLocal = smoothVyLocal * (1 - VELOCITY_SMOOTHING) + rawVy * VELOCITY_SMOOTHING;
          } else if (!nowDragging && wasDragging) {
            rs.isDragging = false;
            rs.lastInteractionTime = Date.now();
            rs.vx = smoothVxLocal;
            rs.vy = smoothVyLocal;
            const vMag = Math.sqrt(rs.vx * rs.vx + rs.vy * rs.vy);
            if (vMag > MAX_FLING_VELOCITY) {
              const scale = MAX_FLING_VELOCITY / vMag;
              rs.vx *= scale;
              rs.vy *= scale;
            }
          }
          wasDragging = nowDragging;
        }

        // ── Quaternion rotation (auto-rotate + inertia, only when not dragging) ──
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

        const floatY = enableFloatRef.current ? Math.sin(t * 0.7) * 0.06 : 0;

        if (meshRef.current) {
          meshRef.current.quaternion.set(rs.qx, rs.qy, rs.qz, rs.qw);
          meshRef.current.position.y = floatY;
        }

        // ── Smooth camera transition (shape changes) ──
        if (cameraTargetZ.current !== null) {
          const dz = cameraTargetZ.current - camera.position.z;
          camera.position.z += dz * CAMERA_LERP_SPEED;
          if (Math.abs(dz) < 0.005) {
            camera.position.z = cameraTargetZ.current;
            cameraTargetZ.current = null;
            gemDiagnostics.cameraLerping = false;
          }
        }

        camera.position.x = Math.sin(t * 0.23) * 0.012;
        const baseY = cameraTargetY.current ?? shapeProfile.yOffset;
        camera.position.y = baseY + Math.cos(t * 0.31) * 0.008;

        // ── DrawingBuffer size sync (navigation transitions, device rotation) ──
        const dbw = gl.drawingBufferWidth;
        const dbh = gl.drawingBufferHeight;
        if (dbw !== lastDbW || dbh !== lastDbH) {
          renderer.setSize(dbw, dbh);
          // Keep SSAA target in sync with drawingBuffer
          if (ssaaTarget) {
            ssaaTarget.setSize(
              Math.round(dbw * SSAA_SCALE),
              Math.round(dbh * SSAA_SCALE),
            );
          }
          const oldAspect = lastDbW / (lastDbH || 1);
          const newAspect = dbw / (dbh || 1);
          camera.aspect = newAspect;
          camera.updateProjectionMatrix();
          // Re-fit camera if aspect ratio changed meaningfully (>2%)
          if (Math.abs(newAspect - oldAspect) / Math.max(oldAspect, 0.01) > 0.02 && meshRef.current) {
            const curProfile = getShapeProfile(shapeRef.current);
            fitCameraToObject(camera, meshRef.current, curProfile.cameraPadding, curProfile.yOffset);
            cameraTargetZ.current = null;
            cameraTargetY.current = null;
            gemDiagnostics.cameraLerping = false;
          }
          lastDbW = dbw;
          lastDbH = dbh;
        }

        // ── Render (SSAA supersample → downsample, or direct) ──
        // Quality is IDENTICAL during scrolling and idle — no degradation.
        if (ssaaTarget && ssaaCopyScene && ssaaCopyCamera) {
          renderer.setRenderTarget(ssaaTarget);
          renderer.render(scene, camera);
          renderer.setRenderTarget(null);
          renderer.render(ssaaCopyScene, ssaaCopyCamera);
        } else {
          renderer.render(scene, camera);
        }
        gl.endFrameEXP();

        // Diagnostics
        const now = performance.now();
        gemDiagnostics.lastFrameTime = Date.now();
        gemDiagnostics.frameCount++;
        _fpsFrames++;
        if (now - _fpsLastTime >= 1000) {
          gemDiagnostics.fps = Math.round(_fpsFrames * 1000 / (now - _fpsLastTime));
          gemDiagnostics.drawCalls = renderer.info.render.calls;
          gemDiagnostics.triangles = renderer.info.render.triangles;

          // Adaptive quality tracking (diagnostics only — expo-gl cannot change
          // pixel ratio at runtime; drawingBuffer is fixed at device DPR).
          // IMPORTANT: Never call renderer.setPixelRatio() after context creation
          // on expo-gl — it causes a viewport/drawingBuffer mismatch that crops
          // the render ("zoomed in" bug).
          if (GEM_FLAGS.adaptivePixelRatio) {
            if (gemDiagnostics.fps > 0 && gemDiagnostics.fps < FPS_THRESHOLD_DOWN) {
              gemDiagnostics.qualityMode = 'standard';
            } else if (gemDiagnostics.fps > FPS_THRESHOLD_UP) {
              gemDiagnostics.qualityMode = 'hd';
            }
          }

          // Quality diagnostics (dev-only logging — proves quality is locked)
          gemDiagnostics.drawingBufferWidth = gl.drawingBufferWidth;
          gemDiagnostics.drawingBufferHeight = gl.drawingBufferHeight;
          gemDiagnostics.lowQualityActive = false;
          if (__DEV__) {
            console.log(
              `[GemView Quality] ${gemDiagnostics.fps}fps | ` +
              `db:${gl.drawingBufferWidth}×${gl.drawingBufferHeight} | ` +
              `ssaa:${ssaaTarget ? SSAA_SCALE + 'x' : 'off'} | ` +
              `pr:${RENDERER_PIXEL_RATIO} | dispersion:${GEM_FLAGS.gemDispersion ? 'on' : 'off'}`
            );
          }

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
          antialias: false,
          stencil: false,
          powerPreference: 'high-performance',
        });
        safeRenderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
        safeRenderer.setPixelRatio(RENDERER_PIXEL_RATIO);
        safeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
        safeRenderer.toneMappingExposure = 1.2;
        safeRenderer.setClearColor(new THREE.Color('#080808'), 1);
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
          rotationState.qx, rotationState.qy,
          rotationState.qz, rotationState.qw,
        );

        fitCameraToObject(safeCamera, safeMesh, 1.5, 0.15);

        const safeClock = new THREE.Clock();
        safeClock.start();
        let safePrevGX = 0;
        let safePrevGY = 0;
        let safeWasDragging = false;
        let safeSmoothVx = 0;
        let safeSmoothVy = 0;
        const safeAnimate = () => {
          animFrameRef.current = requestAnimationFrame(safeAnimate);
          if (pausedRef.current) return;

          const rs = rotationState;

          // ── Process gesture input (safe mode) ──
          if (gestureInput) {
            const nowDragging = gestureInput.dragging.value;
            if (nowDragging && !safeWasDragging) {
              rs.isDragging = true;
              rs.autoRotatePaused = true;
              rs.vx = 0; rs.vy = 0;
              safeSmoothVx = 0; safeSmoothVy = 0;
              safePrevGX = gestureInput.transX.value;
              safePrevGY = gestureInput.transY.value;
            } else if (nowDragging) {
              const curX = gestureInput.transX.value;
              const curY = gestureInput.transY.value;
              const dx = curX - safePrevGX;
              const dy = curY - safePrevGY;
              safePrevGX = curX;
              safePrevGY = curY;
              _q1.set(rs.qx, rs.qy, rs.qz, rs.qw);
              _q2.setFromAxisAngle(_axisY, dx * PAN_SENSITIVITY);
              _q1.premultiply(_q2);
              _q2.setFromAxisAngle(_axisX, dy * PAN_SENSITIVITY);
              _q1.premultiply(_q2);
              _q1.normalize();
              rs.qx = _q1.x; rs.qy = _q1.y;
              rs.qz = _q1.z; rs.qw = _q1.w;
              const rawVy = gestureInput.velX.value * VELOCITY_SCALE_X;
              const rawVx = gestureInput.velY.value * VELOCITY_SCALE_Y;
              safeSmoothVx = safeSmoothVx * (1 - VELOCITY_SMOOTHING) + rawVx * VELOCITY_SMOOTHING;
              safeSmoothVy = safeSmoothVy * (1 - VELOCITY_SMOOTHING) + rawVy * VELOCITY_SMOOTHING;
            } else if (!nowDragging && safeWasDragging) {
              rs.isDragging = false;
              rs.lastInteractionTime = Date.now();
              rs.vx = safeSmoothVx;
              rs.vy = safeSmoothVy;
              const vMag = Math.sqrt(rs.vx * rs.vx + rs.vy * rs.vy);
              if (vMag > MAX_FLING_VELOCITY) {
                const scale = MAX_FLING_VELOCITY / vMag;
                rs.vx *= scale; rs.vy *= scale;
              }
            }
            safeWasDragging = nowDragging;
          }

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
            rs.qx = _q1.x; rs.qy = _q1.y;
            rs.qz = _q1.z; rs.qw = _q1.w;
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
  }, []);

  return (
    <View style={[styles.container, { width: w, height: h }]}>
      <GLView
        style={{ width: w, height: h }}
        onContextCreate={onContextCreate}
        msaaSamples={0}
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

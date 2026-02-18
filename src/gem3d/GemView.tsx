/**
 * GemView V15 — Light/Dark Background Modes + Scene Re-Lighting Animation.
 *
 * V14→V15 changes:
 *   - ADDED:   backgroundMode prop ('light' | 'dark') with smooth animated transition
 *   - ADDED:   Scene re-lighting system — when switching modes, the ENTIRE studio
 *              re-lights: background, exposure, ambient, hemisphere, fill, contact shadow
 *              all animate together on a single timeline for a premium "cinematic" feel
 *   - ADDED:   Light mode scene values: brighter exposure, warm pearl ambient, softer
 *              vignette, reduced contact shadow for pearl backgrounds
 *   - CHANGED: Background quad now takes mode parameter for auto-contrast
 *   - KEPT:    Everything else — full lighting rig, PMREM, material lerping, rotation
 *
 * The transition approach:
 *   When the user toggles Light <-> Dark, we DON'T just swap colors. Instead,
 *   we smoothly animate EVERY scene parameter in the rAF loop (exposure, ambient
 *   intensity/color, hemisphere sky/ground colors, fill intensity, contact shadow
 *   opacity, background quad gradient). This creates the feel of the whole studio
 *   being re-lit — like a photographer switching from a dark void backdrop to a
 *   pearl sweep. The lerp speed is intentionally slower than material changes
 *   (0.035 vs 0.06) so it feels deliberate and cinematic.
 *
 * Philosophy: Studio product photography. Premium, buttery, Apple-level transitions.
 * No flickers, no sudden jumps, no frame drops.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
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
import { TierKey } from '../engine/tierProfiles';
import type { BackgroundMode } from '../store/useGemStore';

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

// ─── Tuning Constants ───────────────────────────────────────────────────────

const LERP_SPEED = 0.06;           // material transition speed
const SCENE_LERP_SPEED = 0.035;    // scene re-lighting speed (slower = more cinematic)
const DAMPING = 0.965;
const AUTO_ROTATE_SPEED = 0.003;
const AUTO_ROTATE_RESUME_DELAY = 800;

// expo-gl drawingBuffer already includes device pixel ratio — always use 1 here
const RENDERER_PIXEL_RATIO = 1;

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
  exposure: 1.35,
  ambientIntensity: 0.4,
  ambientColor: new THREE.Color('#2A2530'),
  hemiSkyColor: new THREE.Color('#2A2530'),
  hemiGroundColor: new THREE.Color('#181515'),
  hemiIntensity: 0.35,
  fillIntensity: 1.0,
  contactShadowOpacity: 0.3,
};

const LIGHT_SCENE: SceneTargets = {
  exposure: 1.55,
  ambientIntensity: 0.5,
  ambientColor: new THREE.Color('#C8BEB0'),
  hemiSkyColor: new THREE.Color('#E8E4DE'),
  hemiGroundColor: new THREE.Color('#C8C2BA'),
  hemiIntensity: 0.45,
  fillIntensity: 1.2,
  contactShadowOpacity: 0.12,
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
  gemScale?: number;
  autoRotate?: boolean;
  enableFloat?: boolean;
  paused?: boolean;
  backgroundMode?: BackgroundMode;
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

  // Background + shadow refs
  const bgQuadRef = useRef<BackgroundQuad | null>(null);
  const contactShadowRef = useRef<THREE.Mesh | null>(null);

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

  // Scene re-lighting targets (for mode transition animation)
  const sceneTargetsRef = useRef<SceneTargets>(getSceneTargets(backgroundMode));
  const isSceneLerpingRef = useRef(false);

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

    // Update background auto-contrast for the new tier (with current mode)
    if (bgQuadRef.current) {
      bgQuadRef.current.setTargetColors(tierKey, backgroundModeRef.current);
      isSceneLerpingRef.current = true;
    }
  }, [tierKey]);

  // ── Background mode change → scene re-lighting ──
  useEffect(() => {
    backgroundModeRef.current = backgroundMode;
    if (!rendererRef.current) return;

    // Set new scene lighting targets
    sceneTargetsRef.current = getSceneTargets(backgroundMode);
    isSceneLerpingRef.current = true;

    // Set new background quad color targets
    if (bgQuadRef.current) {
      bgQuadRef.current.setTargetColors(tierKeyRef.current, backgroundMode);
    }
  }, [backgroundMode]);

  // ── Geometry update → immediate swap + reframe camera ──
  useEffect(() => {
    if (!meshRef.current || !cameraRef.current) return;
    const profile = getShapeProfile(shape);
    const outerScale = gemScale * profile.baseScale;

    const oldGeom = meshRef.current.geometry;
    meshRef.current.geometry = createGemGeometry(shape, outerScale);
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
        side: THREE.DoubleSide,
      });
      materialRef.current = material;

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

        // ── Quaternion rotation ──
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

        camera.position.x = Math.sin(t * 0.23) * 0.012;
        camera.position.y = shapeProfile.yOffset + Math.cos(t * 0.31) * 0.008;

        renderer.render(scene, camera);
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

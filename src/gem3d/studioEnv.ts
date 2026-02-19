/**
 * studioEnv.ts V2 — Procedural PMREM studio environment builder.
 *
 * V1→V2: Dramatically brighter and more wrapping.
 *
 * Problem with V1: env background was #050505 (near-black), meaning 80%+
 * of the environment cubemap returned black. Darker tiers (Apex, Prime)
 * had nothing to reflect → appeared as dark blobs.
 *
 * V2 strategy — "Pinterest jeweler studio":
 *   - Environment BACKGROUND raised to dark-warm gray (#18161A)
 *     Still dark (gem is the hero) but enough to provide ambient fill
 *     in reflections so dark-colored gems remain readable.
 *   - LARGER, BRIGHTER softbox → smoother, wider specular highlights
 *   - SECOND fill panel (front-low) → wraps light under the gem
 *   - WIDER strip lights → more surface area = broader streaks on facets
 *   - MORE accent spheres (6 → was 4) distributed around full hemisphere
 *   - Front bounce panel → prevents face-on facets from going black
 *
 * The PMREM result is used as scene.environment, giving the gem
 * image-based lighting (IBL) with realistic studio reflections.
 *
 * WHY procedural: We can't load HDR files easily in expo-gl.
 */

import * as THREE from 'three';
import { GEM_FLAGS } from './featureFlags';

/**
 * Build a procedural studio environment and return a PMREM texture.
 * Caller owns the returned texture and must dispose it on cleanup.
 *
 * @returns PMREM Texture, or null if generation fails.
 */
export function createStudioEnvironment(
  renderer: THREE.WebGLRenderer,
): THREE.Texture | null {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileCubemapShader();

    const envScene = new THREE.Scene();
    // Dark-warm gray — NOT pure black. Provides ambient reflection fill
    // so dark-colored gems still have something to reflect.
    envScene.background = new THREE.Color('#18161A');

    // ── Large ceiling softbox ──
    // Primary specular highlight. Very large = smooth, broad, premium reflection.
    const softboxGeo = new THREE.PlaneGeometry(20, 20);
    const softbox = new THREE.Mesh(
      softboxGeo,
      new THREE.MeshBasicMaterial({ color: '#FFFAF0', side: THREE.DoubleSide }),
    );
    softbox.position.set(0, 6, 0);
    softbox.rotation.x = Math.PI / 2;
    envScene.add(softbox);

    // ── Front bounce panel ──
    // Catches light from the softbox and bounces it back into face-on facets.
    // Without this, facets pointing at the camera reflect only black.
    const frontBounceGeo = new THREE.PlaneGeometry(10, 6);
    const frontBounce = new THREE.Mesh(
      frontBounceGeo,
      new THREE.MeshBasicMaterial({ color: '#3A3838', side: THREE.DoubleSide }),
    );
    frontBounce.position.set(0, 0, 6);
    envScene.add(frontBounce);

    // ── Floor fill panel ──
    // Subtle — prevents gem undersides from going pitch black.
    const floorGeo = new THREE.PlaneGeometry(14, 14);
    const floor = new THREE.Mesh(
      floorGeo,
      new THREE.MeshBasicMaterial({ color: '#2A2828', side: THREE.DoubleSide }),
    );
    floor.position.set(0, -4, 0);
    floor.rotation.x = -Math.PI / 2;
    envScene.add(floor);

    // ── Second fill panel (front-low) ──
    // Wraps light underneath the gem. Prevents dark underbelly.
    const fillGeo = new THREE.PlaneGeometry(8, 4);
    const fill = new THREE.Mesh(
      fillGeo,
      new THREE.MeshBasicMaterial({ color: '#484040', side: THREE.DoubleSide }),
    );
    fill.position.set(0, -2, 4);
    fill.rotation.x = Math.PI / 6;
    envScene.add(fill);

    // ── Back wall ──
    // Warm tone prevents pure-black reflections behind gem.
    const backGeo = new THREE.PlaneGeometry(20, 14);
    const back = new THREE.Mesh(
      backGeo,
      new THREE.MeshBasicMaterial({ color: '#1E1A18', side: THREE.DoubleSide }),
    );
    back.position.set(0, 0, -8);
    envScene.add(back);

    // ── Left wall ──
    // Subtle side fill for left-facing facets.
    const leftGeo = new THREE.PlaneGeometry(14, 14);
    const left = new THREE.Mesh(
      leftGeo,
      new THREE.MeshBasicMaterial({ color: '#1C1A1E', side: THREE.DoubleSide }),
    );
    left.position.set(-8, 0, 0);
    left.rotation.y = Math.PI / 2;
    envScene.add(left);

    // ── Right wall ──
    const rightGeo = new THREE.PlaneGeometry(14, 14);
    const right = new THREE.Mesh(
      rightGeo,
      new THREE.MeshBasicMaterial({ color: '#1E1C1A', side: THREE.DoubleSide }),
    );
    right.position.set(8, 0, 0);
    right.rotation.y = -Math.PI / 2;
    envScene.add(right);

    // ── Horizontal strip light ──
    // Wider and brighter than V1. Creates broad specular streak across facets.
    const hStripGeo = new THREE.PlaneGeometry(22, 0.4);
    const hStrip = new THREE.Mesh(
      hStripGeo,
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide }),
    );
    hStrip.position.set(0, 2.5, -5);
    envScene.add(hStrip);

    // ── Second horizontal strip (lower) ──
    // Cross-streak at different height for more facet breakup.
    const hStrip2Geo = new THREE.PlaneGeometry(18, 0.25);
    const hStrip2 = new THREE.Mesh(
      hStrip2Geo,
      new THREE.MeshBasicMaterial({ color: '#F0E8FF', side: THREE.DoubleSide }),
    );
    hStrip2.position.set(0, -0.5, -5.5);
    envScene.add(hStrip2);

    // ── Left vertical strip ──
    // Wider for smoother reflections.
    const vStripGeo = new THREE.PlaneGeometry(0.3, 12);
    const vStrip = new THREE.Mesh(
      vStripGeo,
      new THREE.MeshBasicMaterial({ color: '#E8F0FF', side: THREE.DoubleSide }),
    );
    vStrip.position.set(-5, 1, -3);
    vStrip.rotation.y = Math.PI / 5;
    envScene.add(vStrip);

    // ── Right vertical strip ──
    const rStripGeo = new THREE.PlaneGeometry(0.3, 12);
    const rStrip = new THREE.Mesh(
      rStripGeo,
      new THREE.MeshBasicMaterial({ color: '#FFF0E0', side: THREE.DoubleSide }),
    );
    rStrip.position.set(5, 1, -2);
    rStrip.rotation.y = -Math.PI / 5;
    envScene.add(rStrip);

    // ── Accent spheres ──
    // 6 distributed around hemisphere for sparkle/fire in facet reflections.
    const sphereGeo = new THREE.SphereGeometry(0.5, 8, 8);
    const accents: [string, [number, number, number]][] = [
      ['#FFFFFF', [2, 5.5, 1.5]],     // top-right bright
      ['#FFE8D0', [-2, 5, -1.5]],     // warm fill
      ['#D8E8FF', [3.5, 3, -3]],      // cool right
      ['#FFF0D0', [-3.5, 3.5, 2]],    // warm left
      ['#FFFFFF', [0, 5.8, -2]],       // top center
      ['#F0E0FF', [-1, 4, 3.5]],      // front warm
    ];
    for (const [color, pos] of accents) {
      const s = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color }),
      );
      s.position.set(...pos);
      envScene.add(s);
    }

    // ── Knife-edge strip lights (facet edge micro-contrast) ──
    // Ultra-thin strips at different angles create sharp specular lines
    // that define individual facet edges — like real studio photography.
    // No runtime cost: these are baked into the cubemap at init time.
    if (GEM_FLAGS.edgeHighlights) {
      const knifeGeo = new THREE.PlaneGeometry(16, 0.08);
      const knifeMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });

      const knife1 = new THREE.Mesh(knifeGeo, knifeMat);
      knife1.position.set(0, 4.5, -4);
      knife1.rotation.x = Math.PI / 12;
      envScene.add(knife1);

      const knife2Geo = new THREE.PlaneGeometry(16, 0.08);
      const knife2Mat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });
      const knife2 = new THREE.Mesh(knife2Geo, knife2Mat);
      knife2.position.set(0, 1.5, -5.5);
      knife2.rotation.z = Math.PI / 8;
      envScene.add(knife2);
    }

    // Generate PMREM cubemap from the studio scene
    const envMap = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
    pmrem.dispose();

    // Dispose all geometry/materials from the env scene (no longer needed)
    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    return envMap;
  } catch (e) {
    if (__DEV__) console.warn('[studioEnv] Environment generation failed:', e);
    return null;
  }
}

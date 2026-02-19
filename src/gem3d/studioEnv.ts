/**
 * studioEnv.ts V3 — Procedural PMREM studio environment builder.
 *
 * V2→V3: Much brighter for Royal Vivid material overhaul.
 *
 * Changes:
 *   - Environment background raised (#18161A → #28242E) — more ambient fill
 *   - Ceiling softbox MUCH brighter (#FFFAF0 → #FFFFFF, larger 24×24)
 *   - Front bounce panel brighter (#3A3838 → #585050)
 *   - Floor fill brighter (#2A2828 → #403838)
 *   - Fill panel brighter (#484040 → #686060)
 *   - Strip lights brighter and wider
 *   - 8 accent spheres (was 6) — more sparkle points
 *   - Added second set of off-axis knife-edge strips
 *
 * The PMREM result is used as scene.environment, giving the gem
 * image-based lighting (IBL) with realistic studio reflections.
 */

import * as THREE from 'three';
import { GEM_FLAGS } from './featureFlags';

/**
 * Build a procedural studio environment and return a PMREM texture.
 * Caller owns the returned texture and must dispose it on cleanup.
 */
export function createStudioEnvironment(
  renderer: THREE.WebGLRenderer,
): THREE.Texture | null {
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileCubemapShader();

    const envScene = new THREE.Scene();
    // Brighter warm-gray — provides stronger ambient reflection fill
    envScene.background = new THREE.Color('#28242E');

    // ── Large ceiling softbox (BRIGHTER, LARGER) ──
    const softboxGeo = new THREE.PlaneGeometry(24, 24);
    const softbox = new THREE.Mesh(
      softboxGeo,
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide }),
    );
    softbox.position.set(0, 6, 0);
    softbox.rotation.x = Math.PI / 2;
    envScene.add(softbox);

    // ── Front bounce panel (BRIGHTER) ──
    const frontBounceGeo = new THREE.PlaneGeometry(12, 8);
    const frontBounce = new THREE.Mesh(
      frontBounceGeo,
      new THREE.MeshBasicMaterial({ color: '#585050', side: THREE.DoubleSide }),
    );
    frontBounce.position.set(0, 0, 6);
    envScene.add(frontBounce);

    // ── Floor fill panel (BRIGHTER) ──
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floor = new THREE.Mesh(
      floorGeo,
      new THREE.MeshBasicMaterial({ color: '#403838', side: THREE.DoubleSide }),
    );
    floor.position.set(0, -4, 0);
    floor.rotation.x = -Math.PI / 2;
    envScene.add(floor);

    // ── Second fill panel (front-low, BRIGHTER) ──
    const fillGeo = new THREE.PlaneGeometry(10, 5);
    const fill = new THREE.Mesh(
      fillGeo,
      new THREE.MeshBasicMaterial({ color: '#686060', side: THREE.DoubleSide }),
    );
    fill.position.set(0, -2, 4);
    fill.rotation.x = Math.PI / 6;
    envScene.add(fill);

    // ── Back wall (WARMER) ──
    const backGeo = new THREE.PlaneGeometry(24, 16);
    const back = new THREE.Mesh(
      backGeo,
      new THREE.MeshBasicMaterial({ color: '#2A2428', side: THREE.DoubleSide }),
    );
    back.position.set(0, 0, -8);
    envScene.add(back);

    // ── Left wall ──
    const leftGeo = new THREE.PlaneGeometry(16, 16);
    const left = new THREE.Mesh(
      leftGeo,
      new THREE.MeshBasicMaterial({ color: '#282430', side: THREE.DoubleSide }),
    );
    left.position.set(-8, 0, 0);
    left.rotation.y = Math.PI / 2;
    envScene.add(left);

    // ── Right wall ──
    const rightGeo = new THREE.PlaneGeometry(16, 16);
    const right = new THREE.Mesh(
      rightGeo,
      new THREE.MeshBasicMaterial({ color: '#2A2824', side: THREE.DoubleSide }),
    );
    right.position.set(8, 0, 0);
    right.rotation.y = -Math.PI / 2;
    envScene.add(right);

    // ── Horizontal strip light (WIDER, BRIGHTER) ──
    const hStripGeo = new THREE.PlaneGeometry(26, 0.6);
    const hStrip = new THREE.Mesh(
      hStripGeo,
      new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide }),
    );
    hStrip.position.set(0, 2.5, -5);
    envScene.add(hStrip);

    // ── Second horizontal strip (lower) ──
    const hStrip2Geo = new THREE.PlaneGeometry(22, 0.35);
    const hStrip2 = new THREE.Mesh(
      hStrip2Geo,
      new THREE.MeshBasicMaterial({ color: '#FFF0FF', side: THREE.DoubleSide }),
    );
    hStrip2.position.set(0, -0.5, -5.5);
    envScene.add(hStrip2);

    // ── Left vertical strip (WIDER) ──
    const vStripGeo = new THREE.PlaneGeometry(0.5, 14);
    const vStrip = new THREE.Mesh(
      vStripGeo,
      new THREE.MeshBasicMaterial({ color: '#E8F0FF', side: THREE.DoubleSide }),
    );
    vStrip.position.set(-5, 1, -3);
    vStrip.rotation.y = Math.PI / 5;
    envScene.add(vStrip);

    // ── Right vertical strip ──
    const rStripGeo = new THREE.PlaneGeometry(0.5, 14);
    const rStrip = new THREE.Mesh(
      rStripGeo,
      new THREE.MeshBasicMaterial({ color: '#FFF0E0', side: THREE.DoubleSide }),
    );
    rStrip.position.set(5, 1, -2);
    rStrip.rotation.y = -Math.PI / 5;
    envScene.add(rStrip);

    // ── Accent spheres (8 — more sparkle points) ──
    const sphereGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const accents: [string, [number, number, number]][] = [
      ['#FFFFFF', [2, 5.5, 1.5]],       // top-right bright
      ['#FFE8D0', [-2, 5, -1.5]],       // warm fill
      ['#D8E8FF', [3.5, 3, -3]],        // cool right
      ['#FFF0D0', [-3.5, 3.5, 2]],      // warm left
      ['#FFFFFF', [0, 5.8, -2]],         // top center
      ['#F0E0FF', [-1, 4, 3.5]],        // front warm
      ['#FFE0E0', [4, 4.5, 0]],         // warm right-upper
      ['#E0E8FF', [-4, 4.5, -1.5]],     // cool left-upper
    ];
    for (const [color, pos] of accents) {
      const s = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({ color }),
      );
      s.position.set(...pos);
      envScene.add(s);
    }

    // ── Knife-edge strip lights ──
    if (GEM_FLAGS.edgeHighlights) {
      const knifeGeo = new THREE.PlaneGeometry(18, 0.10);
      const knifeMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });

      const knife1 = new THREE.Mesh(knifeGeo, knifeMat);
      knife1.position.set(0, 4.5, -4);
      knife1.rotation.x = Math.PI / 12;
      envScene.add(knife1);

      const knife2Geo = new THREE.PlaneGeometry(18, 0.10);
      const knife2Mat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', side: THREE.DoubleSide });
      const knife2 = new THREE.Mesh(knife2Geo, knife2Mat);
      knife2.position.set(0, 1.5, -5.5);
      knife2.rotation.z = Math.PI / 8;
      envScene.add(knife2);

      // Additional off-axis knife strips for more facet definition
      const knife3Geo = new THREE.PlaneGeometry(14, 0.08);
      const knife3 = new THREE.Mesh(knife3Geo, knifeMat.clone());
      knife3.position.set(-3, 3.5, -4.5);
      knife3.rotation.z = Math.PI / 6;
      envScene.add(knife3);

      const knife4Geo = new THREE.PlaneGeometry(14, 0.08);
      const knife4 = new THREE.Mesh(knife4Geo, knifeMat.clone());
      knife4.position.set(3, 3, -4);
      knife4.rotation.z = -Math.PI / 7;
      envScene.add(knife4);
    }

    // Generate PMREM cubemap from the studio scene
    const envMap = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
    pmrem.dispose();

    // Dispose all geometry/materials from the env scene
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

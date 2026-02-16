/**
 * fitCameraToObject — Frame any gem shape perfectly in view.
 *
 * V2: Accepts per-shape overrides for padding and yOffset
 * so different shapes fill the viewport differently.
 */

import * as THREE from 'three';

const _box = new THREE.Box3();
const _size = new THREE.Vector3();

/**
 * Reposition camera Z so the mesh fills the viewport with padding.
 *
 * @param camera - PerspectiveCamera to adjust
 * @param mesh - The gem mesh to frame
 * @param padding - Multiplier (1.0 = tight fit, 1.6 = comfortable padding)
 * @param yOffset - Vertical offset for camera target (default 0.15)
 */
export function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  mesh: THREE.Mesh,
  padding: number = 1.5,
  yOffset: number = 0.15,
): void {
  mesh.geometry.computeBoundingBox();
  _box.setFromObject(mesh);
  _box.getSize(_size);

  const maxDim = Math.max(_size.x, _size.y, _size.z);
  if (maxDim === 0) return;

  const fovRad = camera.fov * (Math.PI / 180);
  const aspect = camera.aspect;

  const distV = (maxDim / 2) / Math.tan(fovRad / 2);
  const distH = (maxDim / 2) / (Math.tan(fovRad / 2) * aspect);
  const distance = Math.max(distV, distH) * padding;

  camera.position.set(0, yOffset, distance);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
}

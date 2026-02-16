/**
 * GemMesh — The 3D gem mesh with material, auto-rotation, and float animation.
 * Runs inside an R3F Canvas. Uses useFrame for smooth animation.
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createGemGeometry, GemShapeKey } from './geometries';
import { TIER_MATERIALS } from './materials';
import { TierKey } from '../engine/tierProfiles';

interface RotationState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging: boolean;
}

interface Props {
  tierKey: TierKey;
  shape: GemShapeKey;
  rotationState: RotationState;
  /** Scale multiplier (1 = default) */
  gemScale?: number;
  /** Enable continuous auto-rotation */
  autoRotate?: boolean;
  /** Enable float bobbing animation */
  float?: boolean;
}

export const GemMesh: React.FC<Props> = ({
  tierKey,
  shape,
  rotationState,
  gemScale = 1,
  autoRotate = true,
  float: enableFloat = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mat = TIER_MATERIALS[tierKey];

  // Memoize geometry so it doesn't rebuild every frame
  const geometry = useMemo(() => createGemGeometry(shape, gemScale), [shape, gemScale]);

  // Color objects memoized from hex strings
  const color = useMemo(() => new THREE.Color(mat.color), [mat.color]);
  const emissive = useMemo(() => new THREE.Color(mat.emissive), [mat.emissive]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const rs = rotationState;

    if (!rs.isDragging) {
      // Auto-rotate
      if (autoRotate) {
        rs.y += 0.004;
      }
      // Apply inertia decay
      rs.y += rs.vy;
      rs.x += rs.vx;
      rs.vy *= 0.94;
      rs.vx *= 0.94;
    }

    // Clamp X rotation
    rs.x = Math.max(-0.6, Math.min(0.6, rs.x));

    mesh.rotation.x = rs.x;
    mesh.rotation.y = rs.y;

    // Float bob
    if (enableFloat) {
      mesh.position.y = Math.sin(t * 0.7) * 0.06;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={mat.emissiveIntensity}
        metalness={mat.metalness}
        roughness={mat.roughness}
        clearcoat={mat.clearcoat}
        clearcoatRoughness={mat.clearcoatRoughness}
        transparent
        opacity={mat.opacity}
        envMapIntensity={mat.envMapIntensity}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

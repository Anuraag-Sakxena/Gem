/**
 * GemScene — Complete Three.js scene with lights, gem, glow, and shadow.
 * Assembled inside a Canvas. Accepts theme for lighting preset.
 */

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GemMesh } from './GemMesh';
import { getLightPreset, ThemeLighting } from './lighting';
import { TIER_MATERIALS } from './materials';
import { TierKey } from '../engine/tierProfiles';
import { GemShapeKey } from './geometries';

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
  theme: ThemeLighting;
  rotationState: RotationState;
  interactive?: boolean;
  gemScale?: number;
}

/** Soft glow sphere behind the gem */
const GlowSphere: React.FC<{ color: string; intensity: number }> = ({ color, intensity }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(t * 0.6) * 0.08;
      meshRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.3]}>
      <sphereGeometry args={[1.2, 16, 16]} />
      <meshBasicMaterial
        color={glowColor}
        transparent
        opacity={intensity * 0.35}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

/** Soft contact shadow under the gem */
const ContactShadow: React.FC<{ opacity: number }> = ({ opacity }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
    <planeGeometry args={[2.2, 1.4]} />
    <meshBasicMaterial
      color="#000000"
      transparent
      opacity={opacity}
    />
  </mesh>
);

export const GemScene: React.FC<Props> = ({
  tierKey,
  shape,
  theme,
  rotationState,
  interactive = true,
  gemScale = 1,
}) => {
  const lights = getLightPreset(theme);
  const mat = TIER_MATERIALS[tierKey];
  const isPreview = theme === 'preview';

  return (
    <>
      {/* Lights */}
      <ambientLight color={lights.ambient.color} intensity={lights.ambient.intensity} />
      <directionalLight
        color={lights.key.color}
        intensity={lights.key.intensity}
        position={lights.key.position}
      />
      <directionalLight
        color={lights.fill.color}
        intensity={lights.fill.intensity}
        position={lights.fill.position}
      />
      <directionalLight
        color={lights.rim.color}
        intensity={lights.rim.intensity}
        position={lights.rim.position}
      />
      {!isPreview && (
        <pointLight
          color={lights.accent.color}
          intensity={lights.accent.intensity}
          position={lights.accent.position}
          distance={8}
          decay={2}
        />
      )}

      {/* Glow behind gem */}
      {!isPreview && mat.glowIntensity > 0.05 && (
        <GlowSphere color={mat.glowColor} intensity={mat.glowIntensity} />
      )}

      {/* The gem */}
      <GemMesh
        tierKey={tierKey}
        shape={shape}
        rotationState={rotationState}
        gemScale={gemScale}
        autoRotate={true}
        float={!isPreview}
      />

      {/* Contact shadow */}
      {!isPreview && (
        <ContactShadow opacity={theme === 'noir' ? 0.25 : 0.08} />
      )}
    </>
  );
};

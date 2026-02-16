/**
 * Variant D — "Particle Forge"
 * 24 particles fade in scattered across a cube-like volume →
 * swirl and condense toward center → snap into tight cluster →
 * brief explosion outward → contract to nothing → gem materializes.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { easing } from '../../motion';
import { hapticLight, hapticMedium, hapticHeavy } from '../../utils/haptics';

const PARTICLE_COUNT = 24;
const CUBE_EXTENT = 100; // ±100px spread

/** Pre-compute deterministic random positions per particle index. */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
  return x - Math.floor(x);
}

function initialPos(index: number) {
  return {
    x: (seededRandom(index * 3 + 1) * 2 - 1) * CUBE_EXTENT,
    y: (seededRandom(index * 3 + 2) * 2 - 1) * CUBE_EXTENT,
  };
}

// ── Particle sub-component ──────────────────────────────────────

interface ParticleProps {
  index: number;
  color: string;
  active: boolean;
  phase: 'idle' | 'scatter' | 'condense' | 'explode';
}

const Particle: React.FC<ParticleProps> = React.memo(
  ({ index, color, active, phase }) => {
    const origin = useMemo(() => initialPos(index), [index]);
    const size = 3 + seededRandom(index * 7) * 2; // 3–5px

    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const op = useSharedValue(0);
    const sc = useSharedValue(0);

    useEffect(() => {
      const stagger = index * 35;

      if (!active) {
        // Reset all values immediately
        tx.value = 0;
        ty.value = 0;
        op.value = 0;
        sc.value = 0;
        return;
      }

      if (phase === 'scatter') {
        // Phase 1: Fade in at random cube positions
        tx.value = withDelay(stagger, withTiming(origin.x, { duration: 600, easing: easing.decelerate }));
        ty.value = withDelay(stagger, withTiming(origin.y, { duration: 600, easing: easing.decelerate }));
        op.value = withDelay(stagger, withTiming(0.7, { duration: 500 }));
        sc.value = withDelay(stagger, withTiming(1, { duration: 400, easing: easing.emphasized }));
      }

      if (phase === 'condense') {
        // Phase 2: Swirl inward — briefly offset then converge to center
        const swirlX = origin.x * 0.4 + (seededRandom(index * 11) - 0.5) * 60;
        const swirlY = origin.y * 0.4 + (seededRandom(index * 13) - 0.5) * 60;
        const dur = 900 + index * 15;

        tx.value = withSequence(
          withTiming(swirlX, { duration: 400, easing: easing.gentle }),
          withTiming(0, { duration: dur, easing: easing.accelerate }),
        );
        ty.value = withSequence(
          withTiming(swirlY, { duration: 400, easing: easing.gentle }),
          withTiming(0, { duration: dur, easing: easing.accelerate }),
        );
        op.value = withTiming(1, { duration: 300 });
        sc.value = withTiming(0.6, { duration: dur + 400, easing: easing.standard });
      }

      if (phase === 'explode') {
        // Phase 3: Brief outward burst then contract to nothing
        // Tightened: all particles invisible before materialize fires
        const burstX = (seededRandom(index * 17) * 2 - 1) * 60;
        const burstY = (seededRandom(index * 19) * 2 - 1) * 60;

        tx.value = withSequence(
          withTiming(burstX, { duration: 150, easing: easing.decelerate }),
          withTiming(0, { duration: 250, easing: easing.accelerate }),
        );
        ty.value = withSequence(
          withTiming(burstY, { duration: 150, easing: easing.decelerate }),
          withTiming(0, { duration: 250, easing: easing.accelerate }),
        );
        op.value = withDelay(150, withTiming(0, { duration: 250 }));
        sc.value = withDelay(150, withTiming(0, { duration: 250 }));
      }
    }, [active, phase]);

    const style = useAnimatedStyle(() => ({
      opacity: op.value,
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { scale: sc.value },
      ],
    }));

    return (
      <Animated.View
        style={[
          styles.particle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          style,
        ]}
      />
    );
  },
);

// ── Main component ──────────────────────────────────────────────

interface Props {
  active: boolean;
  color: string;
  glowColor: string;
  onMaterialize: () => void;
  onFlash: () => void;
}

export const VariantParticleForge: React.FC<Props> = React.memo(({
  active,
  color,
  glowColor,
  onMaterialize,
  onFlash,
}) => {
  const [phase, setPhase] = React.useState<'idle' | 'scatter' | 'condense' | 'explode'>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return;
    }

    // Phase 1 (0–1.2s): Particles scatter into cube volume
    hapticLight();
    setPhase('scatter');

    // Phase 2 (1.2–2.5s): Particles swirl and condense toward center
    const t1 = setTimeout(() => {
      hapticMedium();
      setPhase('condense');
    }, 1200);

    // Phase 3 (2.3–2.9s): Snap cluster then explode/contract (started earlier to finish before materialize)
    const t2 = setTimeout(() => {
      hapticHeavy();
      setPhase('explode');
    }, 2300);

    // Materialize gem — after explode finishes (2300+400=2700ms, opacity 2300+400=2700ms)
    const t3 = setTimeout(() => onMaterialize(), 2800);

    // Flash
    const t4 = setTimeout(() => onFlash(), 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active]);

  if (!active && phase === 'idle') return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <Particle
            key={i}
            index={i}
            color={i % 3 === 0 ? glowColor : color}
            active={active}
            phase={phase}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
});

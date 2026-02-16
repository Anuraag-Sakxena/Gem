/**
 * GemParticles V2 — floating micro dust around the gem.
 * More organic motion with varied sizes and drift patterns.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { TierProfile } from '../engine/tierProfiles';
import { easing } from '../motion';

interface Props {
  tier: TierProfile;
  size: number;
}

interface ParticleData {
  id: number;
  angle: number;
  radius: number;
  dotSize: number;
  delay: number;
  duration: number;
  driftDir: number;
}

const Dot: React.FC<{ p: ParticleData; tier: TierProfile; containerSize: number }> = React.memo(
  ({ p, tier, containerSize }) => {
    const opacity = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const offsetX = useSharedValue(0);

    useEffect(() => {
      opacity.value = withDelay(
        p.delay,
        withRepeat(
          withSequence(
            withTiming(0.65, { duration: p.duration * 0.35, easing: easing.gentle }),
            withTiming(0, { duration: p.duration * 0.65, easing: easing.gentle }),
          ),
          -1,
          false,
        ),
      );
      offsetY.value = withDelay(
        p.delay,
        withRepeat(
          withTiming(-18 * tier.particleDrift, { duration: p.duration, easing: easing.gentle }),
          -1,
          true,
        ),
      );
      offsetX.value = withDelay(
        p.delay,
        withRepeat(
          withTiming(6 * p.driftDir * tier.particleDrift, { duration: p.duration * 1.3, easing: easing.gentle }),
          -1,
          true,
        ),
      );
    }, [tier.key]);

    const cx = containerSize / 2 + Math.cos(p.angle) * p.radius;
    const cy = containerSize / 2 + Math.sin(p.angle) * p.radius;

    const animStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: offsetY.value }, { translateX: offsetX.value }],
    }));

    return (
      <Animated.View
        style={[
          styles.particle,
          {
            left: cx - p.dotSize / 2,
            top: cy - p.dotSize / 2,
            width: p.dotSize,
            height: p.dotSize,
            borderRadius: p.dotSize / 2,
            backgroundColor: tier.glowColor,
          },
          animStyle,
        ]}
      />
    );
  },
);

export const GemParticles: React.FC<Props> = React.memo(({ tier, size }) => {
  const particles = useMemo(() => {
    const count = Math.min(tier.particleCount, 28);
    const arr: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.6,
        radius: size * 0.28 + Math.random() * size * 0.22,
        dotSize: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 2500,
        duration: 2500 + Math.random() * 2000,
        driftDir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    return arr;
  }, [tier.key, size]);

  if (tier.particleCount === 0) return null;

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {particles.map((p) => (
        <Dot key={p.id} p={p} tier={tier} containerSize={size} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  particle: { position: 'absolute' },
});

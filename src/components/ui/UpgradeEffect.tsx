/**
 * UpgradeEffect — luxury "elevation ceremony" overlay for tier upgrades.
 * Renders an expanding aura ring + particle burst on top of the gem.
 * Absolutely positioned, pointerEvents="none".
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated';
import { easing } from '../../motion';

const PARTICLE_COUNT = 12;

interface ParticleProps {
  index: number;
  color: string;
  size: number;
  progress: SharedValue<number>;
}

const UpgradeParticle: React.FC<ParticleProps> = React.memo(({ index, color, size, progress }) => {
  const angle = (Math.PI * 2 * index) / PARTICLE_COUNT;
  const dist = size * 0.55;

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: Math.max(0, 1 - p * 1.5),
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p },
        { scale: 1 - p * 0.6 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color },
        style,
      ]}
    />
  );
});

interface Props {
  active: boolean;
  color: string;
  size: number;
}

export const UpgradeEffect: React.FC<Props> = React.memo(({ active, color, size }) => {
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const particleIndices = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  useEffect(() => {
    if (!active) return;

    // Reset
    ringScale.value = 0.3;
    ringOpacity.value = 0;
    particleProgress.value = 0;
    flashOpacity.value = 0;

    // Aura ring expansion
    ringScale.value = withTiming(2.8, { duration: 700, easing: easing.decelerate });
    ringOpacity.value = withSequence(
      withTiming(0.55, { duration: 120 }),
      withTiming(0, { duration: 580, easing: easing.decelerate }),
    );

    // Particle burst
    particleProgress.value = withDelay(50, withTiming(1, { duration: 650, easing: easing.decelerate }));

    // Subtle center flash
    flashOpacity.value = withSequence(
      withTiming(0.25, { duration: 80 }),
      withTiming(0, { duration: 400, easing: easing.decelerate }),
    );
  }, [active]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  if (!active) return null;

  const ringSize = size * 0.5;

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {/* Center flash */}
      <Animated.View
        style={[
          styles.flash,
          { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, backgroundColor: color },
          flashStyle,
        ]}
      />

      {/* Aura ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: color,
          },
          ringStyle,
        ]}
      />

      {/* Particle burst */}
      {particleIndices.map((i) => (
        <UpgradeParticle
          key={i}
          index={i}
          color={color}
          size={size}
          progress={particleProgress}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  flash: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});

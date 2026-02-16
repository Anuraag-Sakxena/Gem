/**
 * GemAuraRings V2 — concentric pulsing rings around the gem.
 */

import React, { useEffect } from 'react';
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

const Ring: React.FC<{ index: number; tier: TierProfile; size: number }> = React.memo(
  ({ index, tier, size }) => {
    const scale = useSharedValue(0.85);
    const opacity = useSharedValue(0);

    useEffect(() => {
      const dur = 3500 / tier.shimmerSpeed;
      const delay = index * 500;

      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1.0 + index * 0.12, { duration: dur, easing: easing.gentle }),
            withTiming(0.88 + index * 0.08, { duration: dur, easing: easing.gentle }),
          ),
          -1,
          true,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.22 - index * 0.06, { duration: dur, easing: easing.gentle }),
            withTiming(0.06, { duration: dur, easing: easing.gentle }),
          ),
          -1,
          true,
        ),
      );
    }, [tier.key]);

    const ringSize = size + (index + 1) * 28;
    const animStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    return (
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: tier.glowColor,
            left: (size - ringSize) / 2,
            top: (size - ringSize) / 2,
          },
          animStyle,
        ]}
        pointerEvents="none"
      />
    );
  },
);

export const GemAuraRings: React.FC<Props> = React.memo(({ tier, size }) => {
  if (tier.auraRings === 0) return null;
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {Array.from({ length: tier.auraRings }).map((_, i) => (
        <Ring key={i} index={i} tier={tier} size={size} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  ring: { position: 'absolute', borderWidth: 0.8 },
});

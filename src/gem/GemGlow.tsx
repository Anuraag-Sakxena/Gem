/**
 * GemGlow V2 — radial pulsing glow + pedestal glow.
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TierProfile } from '../engine/tierProfiles';
import { easing } from '../motion';

interface Props {
  tier: TierProfile;
  size: number;
}

export const GemGlow: React.FC<Props> = React.memo(({ tier, size }) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(tier.glowIntensity * 0.5);

  useEffect(() => {
    const dur = 3500 / tier.shimmerSpeed;
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: dur, easing: easing.gentle }),
        withTiming(1.0, { duration: dur, easing: easing.gentle }),
      ),
      -1,
      true,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(tier.glowIntensity * 0.65, { duration: dur, easing: easing.gentle }),
        withTiming(tier.glowIntensity * 0.3, { duration: dur, easing: easing.gentle }),
      ),
      -1,
      true,
    );
  }, [tier.key]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const glowSize = size + tier.glowRadius * 2;

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: tier.glowColor,
          marginLeft: -tier.glowRadius,
          marginTop: -tier.glowRadius,
        },
        glowStyle,
      ]}
      pointerEvents="none"
    />
  );
});

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
});

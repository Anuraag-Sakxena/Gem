/**
 * GemCrownBeams V2 — light beams radiating from the gem (Apex/One tiers).
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

const Beam: React.FC<{
  index: number;
  total: number;
  tier: TierProfile;
  size: number;
}> = React.memo(({ index, total, tier, size }) => {
  const opacity = useSharedValue(0);
  const scaleY = useSharedValue(0.5);

  useEffect(() => {
    const dur = 2800 / tier.shimmerSpeed;
    const delay = (index / total) * 1200;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: dur * 0.4, easing: easing.gentle }),
          withTiming(0.03, { duration: dur * 0.6, easing: easing.gentle }),
        ),
        -1,
        true,
      ),
    );
    scaleY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.0, { duration: dur, easing: easing.decelerate }),
          withTiming(0.55, { duration: dur, easing: easing.accelerate }),
        ),
        -1,
        true,
      ),
    );
  }, [tier.key]);

  const angle = (360 / total) * index;
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.beam,
        {
          left: size / 2 - 0.5,
          top: 0,
          height: size * 0.55,
          backgroundColor: tier.glowColor,
          transform: [{ translateY: -size * 0.28 }, { rotate: `${angle}deg` }],
          transformOrigin: `0.5px ${size * 0.28}px`,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
});

export const GemCrownBeams: React.FC<Props> = React.memo(({ tier, size }) => {
  if (tier.crownBeams === 0) return null;
  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      {Array.from({ length: tier.crownBeams }).map((_, i) => (
        <Beam key={i} index={i} total={tier.crownBeams} tier={tier} size={size} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { position: 'absolute' },
  beam: { position: 'absolute', width: 1, borderRadius: 0.5 },
});

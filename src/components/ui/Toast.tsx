/**
 * Toast — animated "Elevated" notification that fades in/out.
 * Shows when tier changes and auto-dismisses.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TIER_PROFILES } from '../../engine/tierProfiles';
import { useGemStore } from '../../store/useGemStore';
import { typography } from '../../theme/typography';
import { radii, spacing, shadows, palette } from '../../theme/tokens';
import { easing, duration } from '../../motion';

export const Toast: React.FC = React.memo(() => {
  const show = useGemStore((s) => s.showUpgradeToast);
  const tierKey = useGemStore((s) => s.currentTier);
  const dismiss = useGemStore((s) => s.dismissUpgradeToast);
  const theme = useGemStore((s) => s.getTheme());
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (show) {
      // Animate in
      translateY.value = withTiming(0, { duration: duration.moderate, easing: easing.emphasized });
      opacity.value = withTiming(1, { duration: duration.normal, easing: easing.standard });

      // Auto dismiss after 2.5s
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: duration.moderate, easing: easing.standard });
        translateY.value = withDelay(
          duration.fast,
          withTiming(-80, { duration: duration.moderate, easing: easing.accelerate }),
        );
        setTimeout(dismiss, duration.moderate + duration.fast);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [show]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!show) return null;

  const tier = TIER_PROFILES[tierKey];

  return (
    <Animated.View
      style={[
        styles.container,
        shadows.md,
        { top: insets.top + spacing.sm },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <View style={[styles.inner, { backgroundColor: theme.surfaceColor }]}>
        <View style={[styles.dot, { backgroundColor: tier.primaryColor }]} />
        <Text style={[styles.text, { color: theme.textPrimary }]}>
          Elevated to {tier.name}
        </Text>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing['3xl'],
    right: spacing['3xl'],
    zIndex: 1000,
    alignItems: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.titleSmall,
  },
});

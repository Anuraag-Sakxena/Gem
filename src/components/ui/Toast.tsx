/**
 * Toast V2 — animated "Elevated" notification with race-condition fix.
 *
 * Uses `toastTierKey` from store (not `currentTier`) so rapid tier changes
 * always show the correct tier name. Cancels previous timer on re-trigger.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TIER_PROFILES } from '../../engine/tierProfiles';
import { useGemStore } from '../../store/useGemStore';
import { typography } from '../../theme/typography';
import { radii, spacing, shadows, palette } from '../../theme/tokens';
import { easing, duration } from '../../motion';
import { hapticSuccess } from '../../utils/haptics';

const AUTO_DISMISS_MS = 2500;

export const Toast: React.FC = React.memo(() => {
  const show = useGemStore((s) => s.showUpgradeToast);
  const toastTierKey = useGemStore((s) => s.toastTierKey);
  const dismiss = useGemStore((s) => s.dismissUpgradeToast);
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timers on re-trigger (prevents stale dismiss)
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (animTimerRef.current) {
      clearTimeout(animTimerRef.current);
      animTimerRef.current = null;
    }

    if (show && toastTierKey) {
      // Haptic feedback on appear
      hapticSuccess();

      // Animate in — slide down + fade in simultaneously
      translateY.value = withTiming(0, {
        duration: duration.moderate,
        easing: easing.emphasized,
      });
      opacity.value = withTiming(1, {
        duration: duration.normal,
        easing: easing.standard,
      });

      // Auto dismiss
      dismissTimerRef.current = setTimeout(() => {
        // Animate out — slide up + fade out simultaneously
        opacity.value = withTiming(0, {
          duration: duration.moderate,
          easing: easing.standard,
        });
        translateY.value = withDelay(
          duration.fast,
          withTiming(-80, {
            duration: duration.moderate,
            easing: easing.accelerate,
          }),
        );
        animTimerRef.current = setTimeout(dismiss, duration.moderate + duration.fast);
      }, AUTO_DISMISS_MS);
    } else {
      // Reset position when hidden
      translateY.value = -80;
      opacity.value = 0;
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [show, toastTierKey]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!show || !toastTierKey) return null;

  const tier = TIER_PROFILES[toastTierKey];

  return (
    <Animated.View
      style={[
        styles.container,
        shadows.md,
        { top: insets.top + spacing.sm },
        animStyle,
      ]}
      pointerEvents="none"
      accessible
      accessibilityLabel={`Elevated to ${tier.name}`}
      accessibilityRole="alert"
    >
      <View style={styles.inner}>
        <View style={[styles.dot, { backgroundColor: tier.primaryColor }]} />
        <Text style={styles.text}>
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
    backgroundColor: '#1A1A18',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.titleSmall,
    color: '#F2F0ED',
  },
});

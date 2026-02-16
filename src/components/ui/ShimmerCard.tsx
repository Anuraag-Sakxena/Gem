/**
 * ShimmerCard V2 — animated gradient shimmer on a card.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { radii, spacing, shadows } from '../../theme/tokens';
import { useGemStore } from '../../store/useGemStore';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  shimmerColor?: string;
  active?: boolean;
}

export const ShimmerCard: React.FC<Props> = React.memo(
  ({ children, style, shimmerColor, active = false }) => {
    const theme = useGemStore((s) => s.getTheme());
    const progress = useSharedValue(0);

    useEffect(() => {
      if (active) {
        progress.value = withRepeat(
          withTiming(1, { duration: 2500, easing: Easing.linear }),
          -1,
          false,
        );
      } else {
        progress.value = 0;
      }
    }, [active]);

    const shimmerStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: interpolate(progress.value, [0, 1], [-250, 250]) }],
      opacity: active ? 0.25 : 0,
    }));

    const color = shimmerColor ?? theme.accent;

    return (
      <View
        style={[
          styles.container,
          shadows.sm,
          {
            backgroundColor: theme.cardBackground,
            borderColor: active ? color : theme.cardBorder,
            borderWidth: active ? 1.5 : 0.5,
          },
          style,
        ]}
      >
        {children}
        <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', `${color}30`, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    padding: spacing.lg,
    position: 'relative',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: 180,
  },
});

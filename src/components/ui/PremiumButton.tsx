/**
 * PremiumButton V3 — tactile button with spring scale, haptics, loading state.
 *
 * Changes from V2:
 *   - Loading state variant (ActivityIndicator for async actions)
 *   - Disabled state fully prevents tap (not just visual opacity)
 *   - Removed theme prop drilling — hardcoded noir palette
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { hapticLight } from '../../utils/haptics';
import { spring } from '../../motion';
import { typography } from '../../theme/typography';
import { radii, spacing, palette, opacity as opacityTokens } from '../../theme/tokens';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const PremiumButton: React.FC<Props> = React.memo(
  ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    style,
    textStyle,
    disabled,
    loading,
    fullWidth,
  }) => {
    const scale = useSharedValue(1);
    const pressOpacity = useSharedValue(1);
    const isDisabled = disabled || loading;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: isDisabled ? opacityTokens.disabled : pressOpacity.value,
    }));

    const tapGesture = Gesture.Tap()
      .onBegin(() => {
        if (!isDisabled) {
          scale.value = withSpring(0.96, spring.snappy);
          pressOpacity.value = withSpring(0.88, spring.snappy);
        }
      })
      .onFinalize(() => {
        scale.value = withSpring(1, spring.snappy);
        pressOpacity.value = withSpring(1, spring.snappy);
      })
      .onEnd(() => {
        if (!isDisabled) {
          hapticLight();
          onPress();
        }
      })
      .runOnJS(true);

    const sizeConfig = SIZE_MAP[size];
    const colors = getColors(variant);

    return (
      <GestureDetector gesture={tapGesture}>
        <Animated.View
          style={[
            styles.container,
            sizeConfig.container,
            {
              backgroundColor: colors.bg,
              borderWidth: variant === 'ghost' ? 1 : 0,
              borderColor: colors.border,
            },
            fullWidth && { alignSelf: 'stretch' },
            animatedStyle,
            style,
          ]}
          accessible
          accessibilityLabel={loading ? `${title}, loading` : title}
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled }}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.text}
              style={sizeConfig.text}
            />
          ) : (
            <Text
              style={[styles.text, sizeConfig.text, { color: colors.text }, textStyle]}
            >
              {title}
            </Text>
          )}
        </Animated.View>
      </GestureDetector>
    );
  },
);

const getColors = (variant: string) => {
  switch (variant) {
    case 'secondary':
      return { bg: 'rgba(255,255,255,0.06)', text: '#F2F0ED', border: 'rgba(255,255,255,0.08)' };
    case 'ghost':
      return { bg: 'transparent', text: palette.warmGray400, border: 'rgba(255,255,255,0.08)' };
    case 'accent':
      return { bg: palette.gold400, text: '#0A0A09', border: palette.gold400 };
    default:
      return { bg: '#F2F0ED', text: '#0A0A09', border: '#F2F0ED' };
  }
};

const SIZE_MAP = {
  small: {
    container: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.sm } as ViewStyle,
    text: { ...typography.labelSmall } as TextStyle,
  },
  medium: {
    container: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radii.md } as ViewStyle,
    text: { ...typography.labelMedium } as TextStyle,
  },
  large: {
    container: { paddingHorizontal: spacing['3xl'], paddingVertical: spacing.lg, borderRadius: radii.lg } as ViewStyle,
    text: { ...typography.labelLarge } as TextStyle,
  },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  text: {
    textAlign: 'center',
  },
});

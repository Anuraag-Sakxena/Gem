/**
 * PremiumButton V2 — tactile button with spring scale, haptics, tokens.
 */

import React from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { hapticLight } from '../../utils/haptics';
import { spring } from '../../motion';
import { typography } from '../../theme/typography';
import { radii, spacing, opacity as opacityTokens } from '../../theme/tokens';
import { useGemStore } from '../../store/useGemStore';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
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
    fullWidth,
  }) => {
    const theme = useGemStore((s) => s.getTheme());
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const tapGesture = Gesture.Tap()
      .onBegin(() => {
        scale.value = withSpring(0.96, spring.snappy);
      })
      .onFinalize(() => {
        scale.value = withSpring(1, spring.snappy);
      })
      .onEnd(() => {
        if (!disabled) {
          hapticLight();
          onPress();
        }
      })
      .runOnJS(true);

    const sizeConfig = SIZE_MAP[size];
    const colors = getColors(variant, theme);

    return (
      <GestureDetector gesture={tapGesture}>
        <Animated.View
          style={[
            styles.container,
            sizeConfig.container,
            {
              opacity: disabled ? opacityTokens.disabled : opacityTokens.full,
              backgroundColor: colors.bg,
              borderWidth: variant === 'ghost' ? 1 : 0,
              borderColor: colors.border,
            },
            fullWidth && { alignSelf: 'stretch' },
            animatedStyle,
            style,
          ]}
        >
          <Text
            style={[styles.text, sizeConfig.text, { color: colors.text }, textStyle]}
          >
            {title}
          </Text>
        </Animated.View>
      </GestureDetector>
    );
  },
);

const getColors = (variant: string, theme: ReturnType<typeof useGemStore.getState>['getTheme'] extends () => infer R ? R : never) => {
  switch (variant) {
    case 'secondary':
      return { bg: theme.cardBackground, text: theme.textPrimary, border: theme.cardBorder };
    case 'ghost':
      return { bg: 'transparent', text: theme.textSecondary, border: theme.cardBorder };
    case 'accent':
      return { bg: theme.accent, text: theme.buttonText, border: theme.accent };
    default:
      return { bg: theme.buttonBackground, text: theme.buttonText, border: theme.buttonBackground };
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

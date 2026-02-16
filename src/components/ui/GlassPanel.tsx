/**
 * GlassPanel V2 — frosted glass card with consistent tokens.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { radii, spacing, shadows } from '../../theme/tokens';
import { useGemStore } from '../../store/useGemStore';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassPanel: React.FC<Props> = React.memo(({ children, style }) => {
  const theme = useGemStore((s) => s.getTheme());

  return (
    <View
      style={[
        styles.container,
        shadows.sm,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 0.5,
    overflow: 'hidden',
    padding: spacing.xl,
  },
});

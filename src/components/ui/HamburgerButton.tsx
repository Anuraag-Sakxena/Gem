/**
 * HamburgerButton — minimal three-line menu icon, Apple-style.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { hitSlop, spacing, palette } from '../../theme/tokens';
import { useGemStore } from '../../store/useGemStore';

interface Props {
  onPress: () => void;
  color?: string;
}

export const HamburgerButton: React.FC<Props> = React.memo(
  ({ onPress, color }) => {
    const theme = useGemStore((s) => s.getTheme());
    const barColor = color ?? theme.textMuted;

    return (
      <Pressable
        onPress={onPress}
        hitSlop={hitSlop.lg}
        style={styles.container}
      >
        <View style={[styles.bar, { backgroundColor: barColor }]} />
        <View style={[styles.bar, { backgroundColor: barColor }]} />
        <View style={[styles.bar, { backgroundColor: barColor }]} />
      </Pressable>
    );
  },
);

const BAR_WIDTH = 22;
const BAR_HEIGHT = 1.5;

const styles = StyleSheet.create({
  container: {
    width: spacing['3xl'],
    height: spacing['3xl'],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs + 1,
  },
  bar: {
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
  },
});

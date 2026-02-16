/**
 * BackButton — consistent back navigation with haptics.
 */

import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useGemStore } from '../../store/useGemStore';
import { typography } from '../../theme/typography';
import { hapticLight } from '../../utils/haptics';
import { hitSlop, spacing } from '../../theme/tokens';

interface Props {
  onPress: () => void;
  label?: string;
}

export const BackButton: React.FC<Props> = React.memo(({ onPress, label = 'Back' }) => {
  const theme = useGemStore((s) => s.getTheme());

  return (
    <Pressable
      onPress={() => { hapticLight(); onPress(); }}
      hitSlop={hitSlop.md}
      style={styles.container}
    >
      <Text style={[styles.text, { color: theme.textSecondary }]}>
        {`\u2190  ${label}`}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  text: {
    ...typography.bodyMedium,
  },
});

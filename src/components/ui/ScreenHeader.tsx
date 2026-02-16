/**
 * ScreenHeader — consistent header with back button and title.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BackButton } from './BackButton';
import { useGemStore } from '../../store/useGemStore';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/tokens';

interface Props {
  title: string;
  onBack: () => void;
}

export const ScreenHeader: React.FC<Props> = React.memo(({ title, onBack }) => {
  const theme = useGemStore((s) => s.getTheme());

  return (
    <View style={styles.container}>
      <BackButton onPress={onBack} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineMedium,
    letterSpacing: 0.5,
  },
  spacer: {
    width: 48,
  },
});

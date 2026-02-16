/**
 * ScreenBackground V2 — full-screen gradient background with safe area.
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGemStore } from '../../store/useGemStore';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  overrideColors?: readonly [string, string, string];
}

export const ScreenBackground: React.FC<Props> = React.memo(
  ({ children, style, overrideColors }) => {
    const theme = useGemStore((s) => s.getTheme());
    const insets = useSafeAreaInsets();

    return (
      <LinearGradient
        colors={[...(overrideColors ?? theme.backgroundColors)]}
        style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }, style]}
      >
        {children}
      </LinearGradient>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1 },
});

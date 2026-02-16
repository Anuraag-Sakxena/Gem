/**
 * FullscreenMenu — glassmorphic overlay with navigation items.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useGemStore } from '../../store/useGemStore';
import { typography } from '../../theme/typography';
import { spacing, palette, hitSlop } from '../../theme/tokens';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}

const MENU_ITEMS: { label: string; route?: keyof RootStackParamList; action?: 'toggleDemoPanel' }[] = [
  { label: 'Reveal', route: 'Reveal' },
  { label: 'Elevate', route: 'TierLadder' },
  { label: 'Profile', route: 'Profile' },
  { label: 'Verify', route: 'Verification' },
  { label: 'Plan B', route: 'PlanB' },
  { label: 'Diagnostics', route: 'Diagnostics' },
  { label: 'Settings', action: 'toggleDemoPanel' },
];

export const FullscreenMenu: React.FC<Props> = React.memo(({ navigation }) => {
  const showMenu = useGemStore((s) => s.showMenu);
  const toggleMenu = useGemStore((s) => s.toggleMenu);
  const toggleDemoPanel = useGemStore((s) => s.toggleDemoPanel);

  if (!showMenu) return null;

  const handleItemPress = (item: (typeof MENU_ITEMS)[number]) => {
    toggleMenu();
    if (item.action === 'toggleDemoPanel') {
      toggleDemoPanel();
    } else if (item.route) {
      navigation.navigate(item.route);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={styles.overlay}
    >
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Close button */}
      <Pressable
        onPress={toggleMenu}
        hitSlop={hitSlop.lg}
        style={styles.closeButton}
      >
        <Text style={styles.closeText}>{'X'}</Text>
      </Pressable>

      {/* Menu items */}
      <View style={styles.menuContent}>
        {MENU_ITEMS.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              onPress={() => handleItemPress(item)}
              style={({ pressed }) => [
                styles.menuRow,
                pressed && styles.menuRowPressed,
              ]}
            >
              <Text style={styles.menuLabel}>{item.label}</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: spacing['5xl'],
    right: spacing['2xl'],
    zIndex: 1001,
    width: spacing['4xl'],
    height: spacing['4xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    ...typography.headlineLarge,
    color: palette.white,
    fontWeight: '300',
  },
  menuContent: {
    width: '100%',
    paddingHorizontal: spacing['4xl'],
  },
  menuRow: {
    paddingVertical: spacing.xl,
  },
  menuRowPressed: {
    opacity: 0.5,
  },
  menuLabel: {
    ...typography.displaySmall,
    color: palette.white,
    letterSpacing: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.warmGray500,
  },
});

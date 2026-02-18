/**
 * FullscreenMenu V2 — glassmorphic overlay with staggered animations.
 *
 * Changes from V1:
 *   - Staggered FadeInDown for menu items
 *   - Accessibility labels and roles on all items
 *   - Proper styled close icon (not text 'X')
 *   - Safe area insets for close button positioning
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { useGemStore } from '../../store/useGemStore';
import { typography } from '../../theme/typography';
import { spacing, palette, hitSlop } from '../../theme/tokens';
import { hapticLight } from '../../utils/haptics';

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

const STAGGER_DELAY = 50;

export const FullscreenMenu: React.FC<Props> = React.memo(({ navigation }) => {
  const insets = useSafeAreaInsets();
  const showMenu = useGemStore((s) => s.showMenu);
  const toggleMenu = useGemStore((s) => s.toggleMenu);
  const toggleDemoPanel = useGemStore((s) => s.toggleDemoPanel);

  if (!showMenu) return null;

  const handleItemPress = (item: (typeof MENU_ITEMS)[number]) => {
    hapticLight();
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

      {/* Close button — styled lines forming X */}
      <Pressable
        onPress={() => { hapticLight(); toggleMenu(); }}
        hitSlop={hitSlop.lg}
        style={[styles.closeButton, { top: insets.top + spacing.md }]}
        accessible
        accessibilityLabel="Close menu"
        accessibilityRole="button"
      >
        <View style={styles.closeIcon}>
          <View style={[styles.closeLine, styles.closeLineLeft]} />
          <View style={[styles.closeLine, styles.closeLineRight]} />
        </View>
      </Pressable>

      {/* Menu items */}
      <View style={styles.menuContent}>
        {MENU_ITEMS.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 && <View style={styles.divider} />}
            <Animated.View entering={FadeInDown.delay(100 + index * STAGGER_DELAY).duration(350)}>
              <Pressable
                onPress={() => handleItemPress(item)}
                style={({ pressed }) => [
                  styles.menuRow,
                  pressed && styles.menuRowPressed,
                ]}
                accessible
                accessibilityLabel={`Navigate to ${item.label}`}
                accessibilityRole="button"
              >
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            </Animated.View>
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
    right: spacing['2xl'],
    zIndex: 1001,
    width: spacing['4xl'],
    height: spacing['4xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 22,
    height: 1.5,
    backgroundColor: palette.white,
    borderRadius: 1,
  },
  closeLineLeft: {
    transform: [{ rotate: '45deg' }],
  },
  closeLineRight: {
    transform: [{ rotate: '-45deg' }],
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
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});

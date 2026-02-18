/**
 * HomeScreen V9 — Full-screen gem with accessible UI overlay.
 *
 * Each screen owns its own GemRenderer3D instance.
 * The shared-renderer approach was reverted because native-stack
 * uses UINavigationController (iOS) — React z-index does NOT
 * pierce through native screen containers.
 *
 * Layout (back to front):
 *   1. GemRenderer3D — full-screen 3D gem, reads tier/shape from store
 *   2. UpgradeEffect — particle burst on tier change
 *   3. UI Layer — header (tier label + shape, serial, hamburger), bottom pill
 *   4. FullscreenMenu + GemDetailsSheet — modal overlays
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GemRenderer3D } from '../gem3d/GemRenderer3D';
import { UpgradeEffect } from '../components/ui/UpgradeEffect';
import { FullscreenMenu } from '../components/ui/FullscreenMenu';
import { GemDetailsSheet } from '../components/ui/GemDetailsSheet';
import { useGemStore } from '../store/useGemStore';
import { TIER_PROFILES } from '../engine/tierProfiles';
import { maskSerial } from '../engine/gemConfig';
import { typography } from '../theme/typography';
import { spacing, hitSlop } from '../theme/tokens';
import { hapticLight } from '../utils/haptics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SHAPE_DISPLAY_NAMES: Record<string, string> = {
  brilliant: 'Brilliant Cut',
  princess: 'Princess Cut',
  emerald: 'Emerald Cut',
  cushion: 'Cushion Cut',
  pear: 'Pear Drop',
  marquise: 'Marquise',
  oval: 'Oval',
  heart: 'Heart',
  trillion: 'Trillion',
  hexagon: 'Hexagon',
  prism: 'Prism',
  shard: 'Shard',
  kite: 'Kite',
  star: 'Star',
  cube: 'Cube',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tierKey = useGemStore((s) => s.currentTier);
  const gemShape = useGemStore((s) => s.gemShape);
  const serial = useGemStore((s) => s.serial);
  const backgroundMode = useGemStore((s) => s.backgroundMode);
  const toggleMenu = useGemStore((s) => s.toggleMenu);
  const toggleGemDetails = useGemStore((s) => s.toggleGemDetails);
  const tier = TIER_PROFILES[tierKey];
  const isLight = backgroundMode === 'light';

  // Upgrade ceremony
  const prevTierRef = useRef(tierKey);
  const [upgradeActive, setUpgradeActive] = useState(false);
  const [upgradeColor, setUpgradeColor] = useState('#FFFFFF');

  useEffect(() => {
    if (prevTierRef.current !== tierKey) {
      prevTierRef.current = tierKey;
      setUpgradeColor(TIER_PROFILES[tierKey].glowColor);
      setUpgradeActive(true);
      const timeout = setTimeout(() => setUpgradeActive(false), 900);
      return () => clearTimeout(timeout);
    }
  }, [tierKey]);

  const handleHamburger = useCallback(() => {
    hapticLight();
    toggleMenu();
  }, [toggleMenu]);

  const handleGemDetails = useCallback(() => {
    hapticLight();
    toggleGemDetails();
  }, [toggleGemDetails]);

  const shapeName = SHAPE_DISPLAY_NAMES[gemShape] ?? gemShape;

  return (
    <View style={[styles.root, isLight && styles.rootLight]}>
      {/* Full-screen 3D gem — ALWAYS renders, reads from store */}
      <View style={styles.gemLayer} accessible={false}>
        <GemRenderer3D
          tierKey={tierKey}
          shape={gemShape}
          size={320}
          viewWidth={SCREEN_W}
          viewHeight={SCREEN_H}
          interactive={true}
          backgroundMode={backgroundMode}
        />
      </View>

      {/* Upgrade effect overlay */}
      <UpgradeEffect
        active={upgradeActive}
        color={upgradeColor}
        size={320}
      />

      {/* UI overlays — transparent, float on top of gem */}
      <View style={styles.uiLayer} pointerEvents="box-none">
        {/* Header: tier + serial center, hamburger right */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
          pointerEvents="box-none"
        >
          <View style={styles.headerRow} pointerEvents="box-none">
            <View style={styles.flex1} />
            <View
              style={styles.headerCenter}
              accessible
              accessibilityLabel={`${tier.name} tier, ${shapeName}, serial ${maskSerial(serial)}`}
              accessibilityRole="header"
            >
              <Text style={[styles.tierLabel, isLight && styles.tierLabelLight]}>
                {tier.name.toUpperCase()}
              </Text>
              <Text style={[styles.shapeLabel, isLight && styles.shapeLabelLight]}>
                {shapeName}
              </Text>
              <Text style={[styles.serialLabel, isLight && styles.serialLabelLight]}>
                {maskSerial(serial)}
              </Text>
            </View>
            <View style={styles.flex1End}>
              <Pressable
                onPress={handleHamburger}
                hitSlop={hitSlop.lg}
                style={styles.hamburger}
                accessible
                accessibilityLabel="Open menu"
                accessibilityRole="button"
              >
                <View style={[styles.hamburgerLine, isLight && styles.hamburgerLineLight]} />
                <View style={[styles.hamburgerLine, isLight && styles.hamburgerLineLight]} />
                <View style={[styles.hamburgerLine, isLight && styles.hamburgerLineLight]} />
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Spacer pushes button to bottom — pointerEvents none so touches pass to gem */}
        <View style={styles.spacer} pointerEvents="none" />

        {/* Gem Details pill button */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={[styles.bottomArea, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <Pressable
            onPress={handleGemDetails}
            style={({ pressed }) => [
              styles.detailsButton,
              isLight && styles.detailsButtonLight,
              pressed && styles.detailsButtonPressed,
            ]}
            accessible
            accessibilityLabel="View gem details"
            accessibilityRole="button"
          >
            <Text style={[styles.detailsButtonText, isLight && styles.detailsButtonTextLight]}>Gem Details</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Overlays */}
      <FullscreenMenu navigation={navigation as any} />
      <GemDetailsSheet />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A09',
  },
  rootLight: {
    backgroundColor: '#E8E4DE',
  },
  gemLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: { flex: 1 },
  flex1End: { flex: 1, alignItems: 'flex-end' },
  headerCenter: {
    alignItems: 'center',
    gap: 2,
  },
  tierLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 4,
    fontSize: 11,
  },
  tierLabelLight: {
    color: 'rgba(0,0,0,0.45)',
  },
  shapeLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.5,
    fontSize: 9,
  },
  shapeLabelLight: {
    color: 'rgba(0,0,0,0.3)',
  },
  serialLabel: {
    ...typography.mono,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    letterSpacing: 2,
  },
  serialLabelLight: {
    color: 'rgba(0,0,0,0.25)',
  },
  hamburger: {
    width: 24,
    height: 20,
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  hamburgerLine: {
    width: 20,
    height: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 1,
  },
  hamburgerLineLight: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  spacer: { flex: 1 },
  bottomArea: {
    alignItems: 'center',
  },
  detailsButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  detailsButtonLight: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderColor: 'rgba(0,0,0,0.12)',
  },
  detailsButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8,
  },
  detailsButtonText: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    fontSize: 14,
  },
  detailsButtonTextLight: {
    color: 'rgba(0,0,0,0.6)',
  },
});

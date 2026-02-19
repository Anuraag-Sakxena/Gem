/**
 * GemDetailsSheet V4 — bottom sheet with gem details, luxury labels, and Light/Dark toggle.
 *
 * Changes from V3:
 *   - Added engraving and inlay labels from luxury specs (per-tier)
 *
 * Changes from V2:
 *   - Apple-style segmented Light/Dark background toggle with animated sliding indicator
 *   - Toggle persists via Zustand store (MMKV-backed)
 *   - Haptic feedback on toggle
 */

import React, { useState } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useGemStore } from '../../store/useGemStore';
import type { BackgroundMode } from '../../store/useGemStore';
import { TIER_PROFILES } from '../../engine/tierProfiles';
import { LUXURY_SPECS } from '../../gem3d/luxurySpecs';
import { maskSerial } from '../../engine/gemConfig';
import { typography } from '../../theme/typography';
import { spacing, palette, radii, hitSlop, borders } from '../../theme/tokens';
import { hapticLight, hapticSelection } from '../../utils/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

// ─── Segmented Toggle (Apple-style) ─────────────────────────────────────────

const TOGGLE_WIDTH = 200;
const TOGGLE_HEIGHT = 34;
const TOGGLE_PADDING = 2;
const INDICATOR_WIDTH = (TOGGLE_WIDTH - TOGGLE_PADDING * 2) / 2;

const SegmentedToggle: React.FC<{
  value: BackgroundMode;
  onChange: (mode: BackgroundMode) => void;
}> = React.memo(({ value, onChange }) => {
  const translateX = useSharedValue(value === 'light' ? 0 : INDICATOR_WIDTH);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handlePress = (mode: BackgroundMode) => {
    if (mode === value) return;
    hapticSelection();
    translateX.value = withSpring(mode === 'light' ? 0 : INDICATOR_WIDTH, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
    onChange(mode);
  };

  return (
    <View style={segStyles.track}>
      <Animated.View style={[segStyles.indicator, indicatorStyle]} />
      <Pressable
        onPress={() => handlePress('light')}
        style={segStyles.segment}
        accessible
        accessibilityLabel="Light background"
        accessibilityRole="button"
      >
        <Text style={[
          segStyles.segmentText,
          value === 'light' && segStyles.segmentTextActive,
        ]}>Light</Text>
      </Pressable>
      <Pressable
        onPress={() => handlePress('dark')}
        style={segStyles.segment}
        accessible
        accessibilityLabel="Dark background"
        accessibilityRole="button"
      >
        <Text style={[
          segStyles.segmentText,
          value === 'dark' && segStyles.segmentTextActive,
        ]}>Dark</Text>
      </Pressable>
    </View>
  );
});

const segStyles = StyleSheet.create({
  track: {
    width: TOGGLE_WIDTH,
    height: TOGGLE_HEIGHT,
    borderRadius: TOGGLE_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: TOGGLE_PADDING,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    left: TOGGLE_PADDING,
    width: INDICATOR_WIDTH,
    height: TOGGLE_HEIGHT - TOGGLE_PADDING * 2,
    borderRadius: (TOGGLE_HEIGHT - TOGGLE_PADDING * 2) / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  segmentText: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  segmentTextActive: {
    color: 'rgba(255,255,255,0.9)',
  },
});

const SHAPE_DISPLAY: Record<string, string> = {
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

export const GemDetailsSheet: React.FC = React.memo(() => {
  const currentTier = useGemStore((s) => s.currentTier);
  const serial = useGemStore((s) => s.serial);
  const gemShape = useGemStore((s) => s.gemShape);
  const showGemDetails = useGemStore((s) => s.showGemDetails);
  const toggleGemDetails = useGemStore((s) => s.toggleGemDetails);
  const backgroundMode = useGemStore((s) => s.backgroundMode);
  const setBackgroundMode = useGemStore((s) => s.setBackgroundMode);
  const [shareShown, setShareShown] = useState(false);

  if (!showGemDetails) return null;

  const tierProfile = TIER_PROFILES[currentTier];
  const luxurySpec = LUXURY_SPECS[currentTier];
  const shapeName = SHAPE_DISPLAY[gemShape] ?? gemShape;

  const handleShare = () => {
    hapticLight();
    setShareShown(true);
    setTimeout(() => setShareShown(false), 2500);
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(400).springify().damping(16).stiffness(120)}
      exiting={SlideOutDown.duration(250)}
      style={styles.wrapper}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={toggleGemDetails} />

      {/* Sheet */}
      <View style={styles.sheet}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Frosted glass drag handle (iOS standard) */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Close button */}
        <Pressable
          onPress={toggleGemDetails}
          hitSlop={hitSlop.md}
          style={styles.closeButton}
          accessible
          accessibilityLabel="Close gem details"
          accessibilityRole="button"
        >
          <Text style={styles.closeText}>Done</Text>
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.header}>Gem Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tier</Text>
            <View style={styles.tierValue}>
              <View style={[styles.tierDot, { backgroundColor: tierProfile.primaryColor }]} />
              <Text style={styles.detailValue}>{tierProfile.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serial</Text>
            <Text style={[styles.detailValue, typography.mono]}>
              {maskSerial(serial)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shape</Text>
            <Text style={styles.detailValue}>{shapeName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rarity</Text>
            <Text style={styles.detailValue}>{tierProfile.supply}</Text>
          </View>

          <View style={styles.divider} />

          {luxurySpec.engravingLabel !== 'None' && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Engraving</Text>
                <Text style={styles.detailValue}>{luxurySpec.engravingLabel}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {luxurySpec.inlayLabel !== 'None' && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Inlay</Text>
                <Text style={styles.detailValue}>{luxurySpec.inlayLabel}</Text>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Background mode toggle */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Background</Text>
            <SegmentedToggle value={backgroundMode} onChange={setBackgroundMode} />
          </View>

          <View style={styles.divider} />

          {/* Share button / confirmation */}
          {shareShown ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={styles.shareConfirm}
            >
              <Text style={styles.shareConfirmText}>
                Sharing will be available in a future update
              </Text>
            </Animated.View>
          ) : (
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.shareButtonPressed,
              ]}
              accessible
              accessibilityLabel="Share gem preview"
              accessibilityRole="button"
            >
              <Text style={styles.shareButtonText}>Share Preview</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 950,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    zIndex: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeText: {
    ...typography.titleMedium,
    color: palette.gold400,
  },
  content: {
    flex: 1,
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
  },
  header: {
    ...typography.headlineLarge,
    color: palette.white,
    marginBottom: spacing['2xl'],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: palette.warmGray400,
  },
  detailValue: {
    ...typography.bodyLarge,
    color: palette.white,
    fontWeight: '500',
  },
  tierValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  shareButton: {
    marginTop: spacing['2xl'],
    alignSelf: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    borderWidth: borders.thin,
    borderColor: palette.warmGray500,
  },
  shareButtonPressed: {
    opacity: 0.5,
  },
  shareButtonText: {
    ...typography.labelMedium,
    color: palette.white,
  },
  shareConfirm: {
    marginTop: spacing['2xl'],
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  shareConfirmText: {
    ...typography.caption,
    color: palette.warmGray500,
    textAlign: 'center',
  },
});

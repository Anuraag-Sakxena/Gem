/**
 * GemDetailsSheet — bottom sheet with gem details and glassmorphism.
 */

import React from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useGemStore } from '../../store/useGemStore';
import { TIER_PROFILES } from '../../engine/tierProfiles';
import { maskSerial } from '../../engine/gemConfig';
import { typography } from '../../theme/typography';
import { spacing, palette, radii, hitSlop, borders } from '../../theme/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;

export const GemDetailsSheet: React.FC = React.memo(() => {
  const currentTier = useGemStore((s) => s.currentTier);
  const serial = useGemStore((s) => s.serial);
  const gemShape = useGemStore((s) => s.gemShape);
  const showGemDetails = useGemStore((s) => s.showGemDetails);
  const toggleGemDetails = useGemStore((s) => s.toggleGemDetails);

  if (!showGemDetails) return null;

  const tierProfile = TIER_PROFILES[currentTier];
  const shapeName = gemShape.charAt(0).toUpperCase() + gemShape.slice(1);

  const handleShare = () => {
    Alert.alert('Share Preview', 'Sharing will be available in a future update.');
  };

  return (
    <Animated.View
      entering={SlideInDown.duration(350).springify().damping(18)}
      exiting={SlideOutDown.duration(250)}
      style={styles.wrapper}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={toggleGemDetails} />

      {/* Sheet */}
      <View style={styles.sheet}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Close button */}
        <Pressable
          onPress={toggleGemDetails}
          hitSlop={hitSlop.md}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>Done</Text>
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.header}>Gem Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tier</Text>
            <Text style={styles.detailValue}>{tierProfile.name}</Text>
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

          {/* Share button */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.shareButton,
              pressed && styles.shareButtonPressed,
            ]}
          >
            <Text style={styles.shareButtonText}>Share Preview</Text>
          </Pressable>
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.warmGray600,
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
});

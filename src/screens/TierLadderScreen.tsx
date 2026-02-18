/**
 * TierLadderScreen V4 — FlatList with 3D gem previews per tier.
 *
 * Uses FlatList instead of ScrollView for virtualization.
 * Removed theme prop drilling — hardcoded noir palette.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ListRenderItemInfo } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ScreenBackground, ShimmerCard, PremiumButton, ScreenHeader } from '../components/ui';
import { TierPreview } from '../gem3d';
import { useGemStore } from '../store/useGemStore';
import { TIER_PROFILES, TIER_ORDER, TierKey } from '../engine/tierProfiles';
import { typography } from '../theme/typography';
import { spacing, radii, palette } from '../theme/tokens';
import { hapticSuccess } from '../utils/haptics';
import { stagger } from '../motion';

type Props = NativeStackScreenProps<RootStackParamList, 'TierLadder'>;

const TierCard: React.FC<{
  tierKey: TierKey;
  index: number;
  isActive: boolean;
  onUnlock: (key: TierKey) => void;
  gemShape: string;
}> = React.memo(({ tierKey, index, isActive, onUnlock, gemShape }) => {
  const tier = TIER_PROFILES[tierKey];

  return (
    <Animated.View entering={FadeInDown.delay(index * stagger.normal).duration(450)}>
      <ShimmerCard
        active={isActive}
        shimmerColor={tier.primaryColor}
        style={isActive ? { borderColor: tier.primaryColor } : undefined}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.tierDot, { backgroundColor: tier.primaryColor }]} />
              <Text
                style={styles.tierName}
                accessible
                accessibilityLabel={`${tier.name} tier${isActive ? ', currently active' : ''}`}
              >
                {tier.name}
              </Text>
              {isActive && (
                <View style={[styles.activeBadge, { backgroundColor: tier.primaryColor }]}>
                  <Text style={styles.activeBadgeText}>CURRENT</Text>
                </View>
              )}
            </View>
            <Text style={styles.tierPrice}>
              {tier.price}
            </Text>
            <Text style={styles.tierSupply}>
              {tier.supply}
            </Text>
          </View>

          {/* 3D gem preview */}
          <View style={styles.miniGem}>
            <TierPreview tierKey={tierKey} shape={gemShape} size={56} />
          </View>
        </View>

        <Text style={styles.tierDesc}>
          {tier.description}
        </Text>

        {!isActive && (
          <PremiumButton
            title="DEMO UNLOCK"
            onPress={() => onUnlock(tierKey)}
            variant="ghost"
            size="small"
            style={styles.unlockBtn}
          />
        )}
      </ShimmerCard>
    </Animated.View>
  );
});

export const TierLadderScreen: React.FC<Props> = ({ navigation }) => {
  const currentTier = useGemStore((s) => s.currentTier);
  const setTier = useGemStore((s) => s.setTier);
  const gemShape = useGemStore((s) => s.gemShape);

  const handleUnlock = useCallback(
    (key: TierKey) => {
      hapticSuccess();
      setTier(key);
    },
    [setTier],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<TierKey>) => (
      <TierCard
        tierKey={item}
        index={index}
        isActive={item === currentTier}
        onUnlock={handleUnlock}
        gemShape={gemShape}
      />
    ),
    [currentTier, handleUnlock, gemShape],
  );

  const keyExtractor = useCallback((item: TierKey) => item, []);

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <ScreenHeader title="Tier Hierarchy" onBack={() => navigation.goBack()} />

        <FlatList
          data={TIER_ORDER}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={5}
          maxToRenderPerBatch={3}
          windowSize={7}
        />
      </View>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing['4xl'],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tierDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tierName: {
    ...typography.titleLarge,
    color: '#F2F0ED',
  },
  activeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  activeBadgeText: {
    ...typography.labelSmall,
    color: '#FFFFFF',
    fontSize: 8,
    letterSpacing: 0.8,
  },
  tierPrice: {
    ...typography.bodyMedium,
    color: palette.warmGray400,
    marginTop: spacing.xxs,
  },
  tierSupply: {
    ...typography.caption,
    color: palette.warmGray600,
    marginTop: spacing.xxs,
  },
  miniGem: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierDesc: {
    ...typography.bodySmall,
    color: palette.warmGray600,
    marginTop: spacing.sm,
  },
  unlockBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
});

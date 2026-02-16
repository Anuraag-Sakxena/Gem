/**
 * TierLadderScreen V3 — refined hierarchy with 3D gem previews per tier.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ScreenBackground, ShimmerCard, PremiumButton, ScreenHeader } from '../components/ui';
import { TierPreview } from '../gem3d';
import { useGemStore } from '../store/useGemStore';
import { TIER_PROFILES, TIER_ORDER, TierKey } from '../engine/tierProfiles';
import { typography } from '../theme/typography';
import { spacing, radii } from '../theme/tokens';
import { hapticSuccess } from '../utils/haptics';
import { stagger } from '../motion';
import { AppTheme } from '../theme/themes';

type Props = NativeStackScreenProps<RootStackParamList, 'TierLadder'>;

const TierCard: React.FC<{
  tierKey: TierKey;
  index: number;
  isActive: boolean;
  onUnlock: (key: TierKey) => void;
  theme: AppTheme;
  gemShape: string;
}> = React.memo(({ tierKey, index, isActive, onUnlock, theme, gemShape }) => {
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
              <Text style={[styles.tierName, { color: theme.textPrimary }]}>
                {tier.name}
              </Text>
              {isActive ? (
                <View style={[styles.activeBadge, { backgroundColor: tier.primaryColor }]}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.tierPrice, { color: theme.textSecondary }]}>
              {tier.price}
            </Text>
            <Text style={[styles.tierSupply, { color: theme.textMuted }]}>
              {tier.supply}
            </Text>
          </View>

          {/* 3D gem preview */}
          <View style={styles.miniGem}>
            <TierPreview tierKey={tierKey} shape={gemShape} size={56} />
          </View>
        </View>

        <Text style={[styles.tierDesc, { color: theme.textMuted }]}>
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
  const theme = useGemStore((s) => s.getTheme());

  const handleUnlock = useCallback(
    (key: TierKey) => {
      hapticSuccess();
      setTier(key);
    },
    [setTier],
  );

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <ScreenHeader title="Tier Hierarchy" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {TIER_ORDER.map((key, index) => (
            <TierCard
              key={key}
              tierKey={key}
              index={index}
              isActive={key === currentTier}
              onUnlock={handleUnlock}
              theme={theme}
              gemShape={gemShape}
            />
          ))}
          <View style={{ height: spacing['4xl'] }} />
        </ScrollView>
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
  scroll: { flex: 1 },
  scrollContent: { gap: spacing.md },
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
    marginTop: spacing.xxs,
  },
  tierSupply: {
    ...typography.caption,
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
    marginTop: spacing.sm,
  },
  unlockBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
});

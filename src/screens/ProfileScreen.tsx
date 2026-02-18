/**
 * ProfileScreen V3 — public/private toggle with persisted state.
 *
 * Changes from V2:
 *   - Profile state is persisted (toggle survives restart)
 *   - Gem shape displayed in profile card
 *   - Accessibility on switch toggle
 *   - Removed theme prop drilling — hardcoded noir palette
 */

import React from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ScreenBackground, GlassPanel, ScreenHeader } from '../components/ui';
import { useGemStore } from '../store/useGemStore';
import { TIER_PROFILES } from '../engine/tierProfiles';
import { maskSerial } from '../engine/gemConfig';
import { typography } from '../theme/typography';
import { spacing, palette } from '../theme/tokens';
import { hapticSelection } from '../utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

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

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const profile = useGemStore((s) => s.profile);
  const togglePublic = useGemStore((s) => s.togglePublicProfile);
  const tierKey = useGemStore((s) => s.currentTier);
  const serial = useGemStore((s) => s.serial);
  const gemShape = useGemStore((s) => s.gemShape);
  const tier = TIER_PROFILES[tierKey];

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />

        {/* Avatar */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>
            {profile.username}
          </Text>
        </Animated.View>

        {/* Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <GlassPanel style={styles.togglePanel}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>
                  Public Profile
                </Text>
                <Text style={styles.toggleDesc}>
                  Allow others to see your gem status
                </Text>
              </View>
              <Switch
                value={profile.isPublic}
                onValueChange={() => { hapticSelection(); togglePublic(); }}
                trackColor={{ false: palette.warmGray300, true: palette.gold400 }}
                thumbColor={palette.white}
                accessible
                accessibilityLabel="Public profile toggle"
                accessibilityRole="switch"
                accessibilityState={{ checked: profile.isPublic }}
              />
            </View>
          </GlassPanel>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={FadeInDown.delay(320).duration(450)} style={styles.previewSection}>
          {profile.isPublic ? (
            <GlassPanel>
              <Text style={styles.cardTitle}>
                PUBLIC PROFILE PREVIEW
              </Text>

              <ProfileRow label="Tier">
                <View style={styles.tierBadge}>
                  <View style={[styles.tierDot, { backgroundColor: tier.primaryColor }]} />
                  <Text style={styles.rowValue}>{tier.name}</Text>
                </View>
              </ProfileRow>

              <Divider />
              <ProfileRow label="Shape">
                <Text style={styles.rowValue}>{SHAPE_DISPLAY[gemShape] ?? gemShape}</Text>
              </ProfileRow>

              <Divider />
              <ProfileRow label="Region">
                <Text style={styles.rowValue}>{profile.region}</Text>
              </ProfileRow>

              <Divider />
              <ProfileRow label="Holder Since">
                <Text style={styles.rowValue}>{profile.holderSince}</Text>
              </ProfileRow>

              <Divider />
              <ProfileRow label="Rarity">
                <Text style={styles.rowValueAccent}>
                  {tier.supplyCount ? `Top ${tier.supplyCount}` : 'Open'}
                </Text>
              </ProfileRow>

              <Divider />
              <ProfileRow label="Serial">
                <Text style={styles.serialValue}>
                  {maskSerial(serial)}
                </Text>
              </ProfileRow>
            </GlassPanel>
          ) : (
            <GlassPanel style={styles.hiddenCard}>
              <Text style={styles.hiddenIcon}>{'\u25C7'}</Text>
              <Text style={styles.hiddenText}>Profile Hidden</Text>
              <Text style={styles.hiddenSubtext}>
                Toggle public to preview your gem card
              </Text>
            </GlassPanel>
          )}
        </Animated.View>
      </View>
    </ScreenBackground>
  );
};

const ProfileRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <View style={styles.cardRow}>
    <Text style={styles.rowLabel}>{label}</Text>
    {children}
  </View>
);

const Divider: React.FC = () => (
  <View style={styles.divider} />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,169,110,0.15)',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '300',
    color: palette.gold400,
  },
  username: {
    ...typography.headlineSmall,
    color: '#F2F0ED',
  },
  togglePanel: {
    marginBottom: spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    ...typography.titleMedium,
    color: '#F2F0ED',
  },
  toggleDesc: {
    ...typography.caption,
    color: palette.warmGray600,
    marginTop: spacing.xxs,
  },
  previewSection: { flex: 1 },
  cardTitle: {
    ...typography.labelSmall,
    color: palette.warmGray600,
    marginBottom: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    ...typography.bodySmall,
    color: palette.warmGray600,
  },
  rowValue: {
    ...typography.titleSmall,
    color: '#F2F0ED',
  },
  rowValueAccent: {
    ...typography.titleSmall,
    color: palette.gold400,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  serialValue: {
    ...typography.mono,
    color: palette.warmGray400,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  hiddenCard: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  hiddenIcon: {
    fontSize: 36,
    color: palette.warmGray600,
    marginBottom: spacing.md,
  },
  hiddenText: {
    ...typography.headlineSmall,
    color: palette.warmGray600,
    marginBottom: spacing.xs,
  },
  hiddenSubtext: {
    ...typography.caption,
    color: palette.warmGray600,
  },
});

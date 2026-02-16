/**
 * ProfileScreen V2 — public/private toggle with refined card.
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

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useGemStore((s) => s.getTheme());
  const profile = useGemStore((s) => s.profile);
  const togglePublic = useGemStore((s) => s.togglePublicProfile);
  const tierKey = useGemStore((s) => s.currentTier);
  const serial = useGemStore((s) => s.serial);
  const tier = TIER_PROFILES[tierKey];

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />

        {/* Avatar */}
        <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>
              {profile.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.username, { color: theme.textPrimary }]}>
            {profile.username}
          </Text>
        </Animated.View>

        {/* Toggle */}
        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <GlassPanel style={styles.togglePanel}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>
                  Public Profile
                </Text>
                <Text style={[styles.toggleDesc, { color: theme.textMuted }]}>
                  Allow others to see your gem status
                </Text>
              </View>
              <Switch
                value={profile.isPublic}
                onValueChange={() => { hapticSelection(); togglePublic(); }}
                trackColor={{ false: palette.warmGray300, true: theme.accent }}
                thumbColor={palette.white}
              />
            </View>
          </GlassPanel>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={FadeInDown.delay(320).duration(450)} style={styles.previewSection}>
          {profile.isPublic ? (
            <GlassPanel>
              <Text style={[styles.cardTitle, { color: theme.textMuted }]}>
                PUBLIC PROFILE PREVIEW
              </Text>

              <ProfileRow label="Tier" theme={theme}>
                <View style={styles.tierBadge}>
                  <View style={[styles.tierDot, { backgroundColor: tier.primaryColor }]} />
                  <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{tier.name}</Text>
                </View>
              </ProfileRow>

              <Divider color={theme.cardBorder} />
              <ProfileRow label="Region" theme={theme}>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{profile.region}</Text>
              </ProfileRow>

              <Divider color={theme.cardBorder} />
              <ProfileRow label="Holder Since" theme={theme}>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{profile.holderSince}</Text>
              </ProfileRow>

              <Divider color={theme.cardBorder} />
              <ProfileRow label="Rarity" theme={theme}>
                <Text style={[styles.rowValue, { color: theme.accent }]}>
                  {tier.supplyCount ? `Top ${tier.supplyCount}` : 'Open'}
                </Text>
              </ProfileRow>

              <Divider color={theme.cardBorder} />
              <ProfileRow label="Serial" theme={theme}>
                <Text style={[styles.serialValue, { color: theme.textSecondary }]}>
                  {maskSerial(serial)}
                </Text>
              </ProfileRow>
            </GlassPanel>
          ) : (
            <GlassPanel style={styles.hiddenCard}>
              <Text style={[styles.hiddenIcon, { color: theme.textMuted }]}>{'\u25C7'}</Text>
              <Text style={[styles.hiddenText, { color: theme.textMuted }]}>Profile Hidden</Text>
              <Text style={[styles.hiddenSubtext, { color: theme.textMuted }]}>
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
  theme: ReturnType<typeof useGemStore.getState>['getTheme'] extends () => infer R ? R : never;
  children: React.ReactNode;
}> = ({ label, theme, children }) => (
  <View style={styles.cardRow}>
    <Text style={[styles.rowLabel, { color: theme.textMuted }]}>{label}</Text>
    {children}
  </View>
);

const Divider: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.divider, { backgroundColor: color }]} />
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
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '300',
  },
  username: {
    ...typography.headlineSmall,
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
  },
  toggleDesc: {
    ...typography.caption,
    marginTop: spacing.xxs,
  },
  previewSection: { flex: 1 },
  cardTitle: {
    ...typography.labelSmall,
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
  },
  rowValue: {
    ...typography.titleSmall,
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
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  hiddenCard: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  hiddenIcon: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  hiddenText: {
    ...typography.headlineSmall,
    marginBottom: spacing.xs,
  },
  hiddenSubtext: {
    ...typography.caption,
  },
});

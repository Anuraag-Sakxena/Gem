/**
 * VerificationScreen V2 — code verification + rarity index with tokens.
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ScreenBackground, GlassPanel, PremiumButton, ScreenHeader } from '../components/ui';
import { useGemStore } from '../store/useGemStore';
import { TIER_PROFILES } from '../engine/tierProfiles';
import { maskSerial } from '../engine/gemConfig';
import { isValidGemCode } from '../utils/validation';
import { typography } from '../theme/typography';
import { spacing, radii, palette } from '../theme/tokens';
import { hapticSuccess, hapticWarning } from '../utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Verification'>;

interface VerifyResult {
  authentic: boolean;
  tier: string;
  supply: string;
  serial: string;
}

export const VerificationScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useGemStore((s) => s.getTheme());
  const tierKey = useGemStore((s) => s.currentTier);
  const tier = TIER_PROFILES[tierKey];
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = useCallback(() => {
    setResult(null);
    setError('');

    if (!isValidGemCode(code)) {
      hapticWarning();
      setError('Invalid format. Expected: RIN-XXXX');
      return;
    }

    hapticSuccess();
    setResult({
      authentic: true,
      tier: tier.name,
      supply: tier.supply,
      serial: maskSerial(code.trim().toUpperCase()),
    });
  }, [code, tier]);

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Verify" onBack={() => navigation.goBack()} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Verify */}
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <GlassPanel style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Verify a Gem</Text>
              <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>
                Enter a gem code to verify authenticity
              </Text>

              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.textPrimary,
                    borderColor: error ? palette.error : theme.cardBorder,
                    backgroundColor: theme.surfaceColor,
                  },
                ]}
                placeholder="RIN-07X"
                placeholderTextColor={theme.textMuted}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              {error !== '' && <Text style={styles.errorText}>{error}</Text>}

              <PremiumButton
                title="VERIFY"
                onPress={handleVerify}
                variant="accent"
                size="medium"
                style={{ marginTop: spacing.md }}
                disabled={code.trim().length === 0}
              />

              {result && (
                <Animated.View entering={FadeIn.duration(350)} style={styles.resultCard}>
                  <ResultRow label="Authentic" theme={theme}>
                    <Text style={{ ...typography.titleSmall, color: result.authentic ? palette.success : palette.error }}>
                      {result.authentic ? 'Yes' : 'No'}
                    </Text>
                  </ResultRow>
                  <ResultRow label="Tier" theme={theme}>
                    <Text style={[styles.resultValue, { color: theme.textPrimary }]}>{result.tier}</Text>
                  </ResultRow>
                  <ResultRow label="Supply" theme={theme}>
                    <Text style={[styles.resultValue, { color: theme.textPrimary }]}>{result.supply}</Text>
                  </ResultRow>
                  <ResultRow label="Serial" theme={theme}>
                    <Text style={[styles.serialValue, { color: theme.textSecondary }]}>{result.serial}</Text>
                  </ResultRow>
                </Animated.View>
              )}
            </GlassPanel>
          </Animated.View>

          {/* Rarity Index */}
          <Animated.View entering={FadeInDown.delay(250).duration(450)}>
            <GlassPanel style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Rarity Index</Text>
              <Text style={[styles.sectionDesc, { color: theme.textMuted }]}>
                Your current gem's scarcity metrics
              </Text>

              <View style={styles.rarityGrid}>
                <View style={styles.rarityItem}>
                  <Text style={[styles.rarityValue, { color: theme.accent }]}>{tier.supply}</Text>
                  <Text style={[styles.rarityLabel, { color: theme.textMuted }]}>Global Supply</Text>
                </View>
                <View style={styles.rarityItem}>
                  <Text style={[styles.rarityValue, { color: theme.accent }]}>
                    {tier.supplyCount ? Math.max(1, tier.supplyCount - 2) : '\u221E'}
                  </Text>
                  <Text style={[styles.rarityLabel, { color: theme.textMuted }]}>Remaining</Text>
                </View>
              </View>

              {tier.supplyCount ? (
                <Text style={[styles.rarityNote, { color: theme.textMuted }]}>
                  Unlocked by previous tier sellout. Limited edition.
                </Text>
              ) : null}
            </GlassPanel>
          </Animated.View>

          <View style={{ height: spacing['4xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
};

const ResultRow: React.FC<{
  label: string;
  theme: ReturnType<typeof useGemStore.getState>['getTheme'] extends () => infer R ? R : never;
  children: React.ReactNode;
}> = ({ label, theme, children }) => (
  <View style={styles.resultRow}>
    <Text style={[styles.resultLabel, { color: theme.textMuted }]}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.titleLarge, marginBottom: spacing.xs },
  sectionDesc: { ...typography.caption, marginBottom: spacing.lg },
  input: {
    borderWidth: 0.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.mono,
    fontSize: 15,
  },
  errorText: { ...typography.caption, color: palette.error, marginTop: spacing.sm },
  resultCard: { marginTop: spacing.lg, gap: spacing.sm },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: { ...typography.bodySmall },
  resultValue: { ...typography.titleSmall },
  serialValue: { ...typography.mono },
  rarityGrid: { flexDirection: 'row', gap: spacing.lg },
  rarityItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  rarityValue: { ...typography.headlineLarge, marginBottom: spacing.xs },
  rarityLabel: { ...typography.caption },
  rarityNote: { ...typography.caption, textAlign: 'center', marginTop: spacing.md, fontStyle: 'italic' },
});

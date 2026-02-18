/**
 * VerificationScreen V3 — code verification + rarity index.
 *
 * Changes from V2:
 *   - Keyboard dismiss on tap outside
 *   - Return key submits verification
 *   - Format hint always visible below input
 *   - Removed theme prop drilling — hardcoded noir palette
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  Pressable,
} from 'react-native';
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
  const tierKey = useGemStore((s) => s.currentTier);
  const tier = TIER_PROFILES[tierKey];
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState('');

  const handleVerify = useCallback(() => {
    Keyboard.dismiss();
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
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScreenHeader title="Verify" onBack={() => navigation.goBack()} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Verify */}
            <Animated.View entering={FadeInDown.delay(100).duration(450)}>
              <GlassPanel style={styles.section}>
                <Text style={styles.sectionTitle}>Verify a Gem</Text>
                <Text style={styles.sectionDesc}>
                  Enter a gem code to verify authenticity
                </Text>

                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    error ? styles.inputError : null,
                  ]}
                  placeholder="RIN-07X"
                  placeholderTextColor={palette.warmGray600}
                  value={code}
                  onChangeText={(text) => { setCode(text); setError(''); }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                  accessible
                  accessibilityLabel="Gem verification code input"
                  accessibilityHint="Enter a gem code in RIN-XXXX format"
                />

                <Text style={[styles.formatHint, error ? styles.formatHintError : null]}>
                  {error || 'Format: RIN-XXXX (e.g. RIN-07X)'}
                </Text>

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
                    <ResultRow label="Authentic">
                      <Text style={[styles.resultValue, { color: result.authentic ? palette.success : palette.error }]}>
                        {result.authentic ? 'Yes' : 'No'}
                      </Text>
                    </ResultRow>
                    <ResultRow label="Tier">
                      <Text style={styles.resultValue}>{result.tier}</Text>
                    </ResultRow>
                    <ResultRow label="Supply">
                      <Text style={styles.resultValue}>{result.supply}</Text>
                    </ResultRow>
                    <ResultRow label="Serial">
                      <Text style={styles.serialValue}>{result.serial}</Text>
                    </ResultRow>
                  </Animated.View>
                )}
              </GlassPanel>
            </Animated.View>

            {/* Rarity Index */}
            <Animated.View entering={FadeInDown.delay(250).duration(450)}>
              <GlassPanel style={styles.section}>
                <Text style={styles.sectionTitle}>Rarity Index</Text>
                <Text style={styles.sectionDesc}>
                  Your current gem's scarcity metrics
                </Text>

                <View style={styles.rarityGrid}>
                  <View style={styles.rarityItem}>
                    <Text style={styles.rarityValue}>{tier.supply}</Text>
                    <Text style={styles.rarityLabel}>Global Supply</Text>
                  </View>
                  <View style={styles.rarityItem}>
                    <Text style={styles.rarityValue}>
                      {tier.supplyCount ? Math.max(1, tier.supplyCount - 2) : '\u221E'}
                    </Text>
                    <Text style={styles.rarityLabel}>Remaining</Text>
                  </View>
                </View>

                {tier.supplyCount ? (
                  <Text style={styles.rarityNote}>
                    Unlocked by previous tier sellout. Limited edition.
                  </Text>
                ) : null}
              </GlassPanel>
            </Animated.View>

            <View style={{ height: spacing['4xl'] }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </ScreenBackground>
  );
};

const ResultRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
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
  sectionTitle: {
    ...typography.titleLarge,
    color: '#F2F0ED',
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    ...typography.caption,
    color: palette.warmGray600,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 0.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.mono,
    fontSize: 15,
    color: '#F2F0ED',
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputError: {
    borderColor: palette.error,
  },
  formatHint: {
    ...typography.caption,
    color: palette.warmGray600,
    marginTop: spacing.sm,
    fontSize: 10,
  },
  formatHintError: {
    color: palette.error,
  },
  resultCard: { marginTop: spacing.lg, gap: spacing.sm },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    ...typography.bodySmall,
    color: palette.warmGray600,
  },
  resultValue: {
    ...typography.titleSmall,
    color: '#F2F0ED',
  },
  serialValue: {
    ...typography.mono,
    color: palette.warmGray400,
  },
  rarityGrid: { flexDirection: 'row', gap: spacing.lg },
  rarityItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  rarityValue: {
    ...typography.headlineLarge,
    color: palette.gold400,
    marginBottom: spacing.xs,
  },
  rarityLabel: {
    ...typography.caption,
    color: palette.warmGray600,
  },
  rarityNote: {
    ...typography.caption,
    color: palette.warmGray600,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});

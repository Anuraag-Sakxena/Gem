/**
 * PlanBScreen V2 — scarcity compression info with elegant timeline.
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ScreenBackground, GlassPanel, ScreenHeader } from '../components/ui';
import { useGemStore } from '../store/useGemStore';
import { PLAN_B_WAVES } from '../engine/gemConfig';
import { typography } from '../theme/typography';
import { spacing, radii } from '../theme/tokens';
import { stagger } from '../motion';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanB'>;

export const PlanBScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useGemStore((s) => s.getTheme());

  return (
    <ScreenBackground>
      <View style={styles.container}>
        <ScreenHeader title="Plan B" onBack={() => navigation.goBack()} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Explanation */}
          <Animated.View entering={FadeInDown.delay(100).duration(450)}>
            <GlassPanel>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Scarcity Compression
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                Plan B is a contingency model activated if global demand exceeds
                the initial supply of scarce tiers. Rather than expanding supply,
                the system compresses it further — reducing availability while
                increasing price — creating even greater exclusivity.
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary, marginTop: spacing.md }]}>
                Each wave represents a sellout event. When a tier sells out,
                the next wave launches with fewer units at a higher price.
                This rewards early holders and creates authentic, market-driven scarcity.
              </Text>
            </GlassPanel>
          </Animated.View>

          {/* Timeline */}
          <Animated.View entering={FadeInDown.delay(250).duration(450)}>
            <GlassPanel>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Apex Tier Compression
              </Text>

              {PLAN_B_WAVES.map((wave, index) => (
                <Animated.View
                  key={wave.wave}
                  entering={FadeInDown.delay(300 + index * stagger.fast).duration(400)}
                >
                  <View style={styles.timelineRow}>
                    {/* Timeline dot + line */}
                    <View style={styles.timelineTrack}>
                      <View style={[styles.timelineDot, { backgroundColor: theme.accent }]} />
                      {index < PLAN_B_WAVES.length - 1 && (
                        <View style={[styles.timelineLine, { backgroundColor: theme.cardBorder }]} />
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={[styles.waveLabel, { color: theme.textPrimary }]}>
                          Wave {wave.wave}
                        </Text>
                        <Text style={[styles.priceTag, { color: theme.accent }]}>
                          {wave.priceMultiplier.toFixed(2)}x
                        </Text>
                      </View>
                      <Text style={[styles.supplyText, { color: theme.textMuted }]}>
                        {wave.globalSupply} units worldwide
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </GlassPanel>
          </Animated.View>

          {/* Principles */}
          <Animated.View entering={FadeInDown.delay(500).duration(450)}>
            <GlassPanel>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Key Principles
              </Text>
              {[
                'Supply never increases \u2014 only decreases or holds.',
                'Price increases are tied to real sellout events.',
                'Early holders always maintain their position.',
                'Each wave is a discrete event, not continuous.',
                'Applies only to scarce tiers (Crest and above).',
              ].map((text, i) => (
                <View key={i} style={styles.principleRow}>
                  <Text style={[styles.bullet, { color: theme.accent }]}>{'\u25C7'}</Text>
                  <Text style={[styles.principleText, { color: theme.textSecondary }]}>
                    {text}
                  </Text>
                </View>
              ))}
            </GlassPanel>
          </Animated.View>

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
  scrollContent: { gap: spacing.lg },
  sectionTitle: {
    ...typography.titleLarge,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.bodyMedium,
    lineHeight: 22,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  timelineTrack: {
    width: spacing['2xl'],
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    marginTop: spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  waveLabel: {
    ...typography.titleMedium,
  },
  priceTag: {
    ...typography.titleSmall,
  },
  supplyText: {
    ...typography.caption,
  },
  principleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: 10,
    marginTop: 3,
  },
  principleText: {
    ...typography.bodyMedium,
    flex: 1,
    lineHeight: 22,
  },
});

/**
 * PlanBScreen V3 — scarcity compression info with elegant timeline.
 *
 * Changes from V2:
 *   - Removed theme prop drilling — hardcoded noir palette
 *   - Added progress indicator showing current wave position
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { ScreenBackground, GlassPanel, ScreenHeader } from '../components/ui';
import { PLAN_B_WAVES } from '../engine/gemConfig';
import { typography } from '../theme/typography';
import { spacing, palette } from '../theme/tokens';
import { stagger } from '../motion';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanB'>;

export const PlanBScreen: React.FC<Props> = ({ navigation }) => {
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
              <Text style={styles.sectionTitle}>
                Scarcity Compression
              </Text>
              <Text style={styles.body}>
                Plan B is a contingency model activated if global demand exceeds
                the initial supply of scarce tiers. Rather than expanding supply,
                the system compresses it further — reducing availability while
                increasing price — creating even greater exclusivity.
              </Text>
              <Text style={[styles.body, { marginTop: spacing.md }]}>
                Each wave represents a sellout event. When a tier sells out,
                the next wave launches with fewer units at a higher price.
                This rewards early holders and creates authentic, market-driven scarcity.
              </Text>
            </GlassPanel>
          </Animated.View>

          {/* Timeline */}
          <Animated.View entering={FadeInDown.delay(250).duration(450)}>
            <GlassPanel>
              <Text style={styles.sectionTitle}>
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
                      <View style={[styles.timelineDot, { backgroundColor: palette.gold400 }]} />
                      {index < PLAN_B_WAVES.length - 1 && (
                        <View style={styles.timelineLine} />
                      )}
                    </View>

                    {/* Content */}
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.waveLabel}>
                          Wave {wave.wave}
                        </Text>
                        <Text style={styles.priceTag}>
                          {wave.priceMultiplier.toFixed(2)}x
                        </Text>
                      </View>
                      <Text style={styles.supplyText}>
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
              <Text style={styles.sectionTitle}>
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
                  <Text style={styles.bullet}>{'\u25C7'}</Text>
                  <Text style={styles.principleText}>
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
    color: '#F2F0ED',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.bodyMedium,
    color: palette.warmGray400,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: '#F2F0ED',
  },
  priceTag: {
    ...typography.titleSmall,
    color: palette.gold400,
  },
  supplyText: {
    ...typography.caption,
    color: palette.warmGray600,
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
    color: palette.gold400,
  },
  principleText: {
    ...typography.bodyMedium,
    color: palette.warmGray400,
    flex: 1,
    lineHeight: 22,
  },
});

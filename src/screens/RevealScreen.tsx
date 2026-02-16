/**
 * RevealScreen V6 — Owns its own GemRenderer3D, hidden until materialize.
 *
 * Architecture:
 *   - GemRenderer3D renders at full-screen behind a dark overlay
 *   - 2D variant animations play on top of the overlay
 *   - On "materialize": dark overlay fades out → gem becomes visible
 *   - On "flash" / "complete": gem becomes interactive
 *
 * Each screen owns its own GemRenderer3D. No shared renderer.
 *
 * Variants:
 *   A "Assembly"      — atom -> ring -> shards converge -> gem
 *   B "Carved"        — stone -> laser sweep -> crack -> gem
 *   C "Crystallize"   — droplet -> ripples -> crystal rays -> gem
 *   D "Particle Forge" — particles scatter -> swirl -> snap -> gem
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { GemRenderer3D } from '../gem3d/GemRenderer3D';
import { PremiumButton } from '../components/ui';
import { useGemStore } from '../store/useGemStore';
import { TIER_PROFILES } from '../engine/tierProfiles';
import { typography } from '../theme/typography';
import { spacing, palette } from '../theme/tokens';
import { easing } from '../motion';
import { hapticSuccess, hapticLight } from '../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../components/ui/BackButton';
import { VariantAssembly } from './reveal/VariantAssembly';
import { VariantCarved } from './reveal/VariantCarved';
import { VariantCrystallize } from './reveal/VariantCrystallize';
import { VariantParticleForge } from './reveal/VariantParticleForge';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Reveal'>;
type RevealPhase = 'idle' | 'animating' | 'materializing' | 'complete';
type VariantType = 'assembly' | 'carved' | 'crystallize' | 'particleForge';

const VARIANTS: VariantType[] = ['assembly', 'carved', 'crystallize', 'particleForge'];
const VARIANT_LABELS: Record<VariantType, string> = {
  assembly: 'Assembly',
  carved: 'Carved',
  crystallize: 'Crystallize',
  particleForge: 'Particle Forge',
};

function pickRandomVariant(): VariantType {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

export const RevealScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tierKey = useGemStore((s) => s.currentTier);
  const gemShape = useGemStore((s) => s.gemShape);
  const markRevealed = useGemStore((s) => s.markRevealed);
  const tier = TIER_PROFILES[tierKey];

  const [phase, setPhase] = useState<RevealPhase>('idle');
  const [variant, setVariant] = useState<VariantType>(pickRandomVariant);
  const [devVariant, setDevVariant] = useState<VariantType | null>(null);
  const [variantActive, setVariantActive] = useState(false);
  const [gemInteractive, setGemInteractive] = useState(false);

  const activeVariant = devVariant ?? variant;

  // Animated values for background and flash
  const bgOpacity = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleMaterialize = useCallback(() => {
    setPhase('materializing');
    // Fade out the dark background to reveal the GemRenderer3D underneath
    bgOpacity.value = withTiming(0, { duration: 800, easing: easing.decelerate });
  }, [bgOpacity]);

  const handleFlash = useCallback(() => {
    flashOpacity.value = withSequence(
      withTiming(0.65, { duration: 100 }),
      withTiming(0, { duration: 450, easing: easing.decelerate }),
    );
    hapticSuccess();
    // Wait for flash animation to fully complete (100+450=550ms) before transitioning
    setTimeout(() => {
      setPhase('complete');
      setVariantActive(false);
      setGemInteractive(true);
      markRevealed();
    }, 600);
  }, [markRevealed, flashOpacity]);

  const startReveal = useCallback(() => {
    setPhase('animating');
    setVariantActive(true);
  }, []);

  const resetReveal = useCallback(() => {
    setPhase('idle');
    setVariantActive(false);
    setGemInteractive(false);
    bgOpacity.value = 1;
    flashOpacity.value = 0;
  }, [bgOpacity, flashOpacity]);

  // Dev long-press cycles variant
  const cycleDevVariant = useCallback(() => {
    if (phase !== 'idle') return;
    hapticLight();
    setDevVariant((prev) => {
      const curr = prev ?? variant;
      const idx = VARIANTS.indexOf(curr);
      const next = VARIANTS[(idx + 1) % VARIANTS.length];
      return next;
    });
  }, [phase, variant]);

  // ─── Animated styles ──────────────────────────────────────────────────────

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <View style={styles.root}>
      {/* Full-screen gem — renders behind overlay, revealed on materialize */}
      <View style={styles.gemLayer}>
        <GemRenderer3D
          tierKey={tierKey}
          shape={gemShape}
          size={320}
          viewWidth={SCREEN_W}
          viewHeight={SCREEN_H}
          interactive={gemInteractive}
        />
      </View>

      {/* Dark background — covers gem until materialize fades it out */}
      <Animated.View style={[styles.bgOverlay, bgStyle]} pointerEvents={phase === 'complete' ? 'none' : 'auto'}>
        <LinearGradient
          colors={['#050505', '#0A0A09', '#050505']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Flash effect */}
      <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <BackButton onPress={() => navigation.goBack()} label="Back" />
      </View>

      {/* ─── Stage ─────────────────────────────────────────────────── */}
      <View style={styles.stage}>
        {/* Variant animation overlays */}
        {activeVariant === 'assembly' && (
          <VariantAssembly
            active={variantActive}
            color={tier.primaryColor}
            glowColor={tier.glowColor}
            onMaterialize={handleMaterialize}
            onFlash={handleFlash}
          />
        )}
        {activeVariant === 'carved' && (
          <VariantCarved
            active={variantActive}
            color={tier.primaryColor}
            glowColor={tier.glowColor}
            onMaterialize={handleMaterialize}
            onFlash={handleFlash}
          />
        )}
        {activeVariant === 'crystallize' && (
          <VariantCrystallize
            active={variantActive}
            color={tier.primaryColor}
            glowColor={tier.glowColor}
            onMaterialize={handleMaterialize}
            onFlash={handleFlash}
          />
        )}
        {activeVariant === 'particleForge' && (
          <VariantParticleForge
            active={variantActive}
            color={tier.primaryColor}
            glowColor={tier.glowColor}
            onMaterialize={handleMaterialize}
            onFlash={handleFlash}
          />
        )}

        {/* Idle prompt */}
        {phase === 'idle' && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.idleContainer}>
            <Text style={styles.idleText}>Reveal Your Gem</Text>
            <Text style={styles.idleSubtext}>
              Watch your {tier.name} tier gem materialize
            </Text>
            <View style={{ height: spacing['3xl'] }} />
            <PremiumButton
              title="BEGIN REVEAL"
              onPress={startReveal}
              variant="accent"
              size="large"
            />
            {/* Dev variant indicator */}
            <Pressable onLongPress={cycleDevVariant} style={styles.variantHint}>
              <Text style={styles.variantHintText}>
                {VARIANT_LABELS[activeVariant]}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* ─── Complete actions ──────────────────────────────────────── */}
      {phase === 'complete' && (
        <Animated.View
          entering={FadeIn.delay(400).duration(500)}
          style={[styles.bottomActions, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <PremiumButton
            title="BACK TO GALLERY"
            onPress={() => { hapticLight(); navigation.goBack(); }}
            variant="accent"
            size="medium"
          />
          <View style={{ height: spacing.sm }} />
          <Pressable onPress={resetReveal}>
            <Text style={styles.replayText}>Replay Reveal</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  gemLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.white,
    zIndex: 100,
  },
  header: {
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  idleContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['4xl'],
  },
  idleText: {
    ...typography.displaySmall,
    color: '#F2F0ED',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  idleSubtext: {
    ...typography.bodyMedium,
    color: palette.warmGray500,
    textAlign: 'center',
  },
  bottomActions: {
    alignItems: 'center',
    paddingHorizontal: spacing['4xl'],
    zIndex: 10,
  },
  replayText: {
    ...typography.caption,
    color: palette.warmGray600,
    letterSpacing: 1,
    paddingVertical: spacing.sm,
  },
  variantHint: {
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  variantHintText: {
    ...typography.caption,
    color: palette.warmGray700,
    fontSize: 9,
    letterSpacing: 2,
  },
});

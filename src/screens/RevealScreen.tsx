/**
 * RevealScreen V7 — Owns its own GemRenderer3D, hidden until materialize.
 *
 * Architecture:
 *   - GemRenderer3D renders at full-screen behind a dark overlay
 *   - 2D variant animations play on top of the overlay
 *   - On "materialize": dark overlay fades out -> gem becomes visible
 *   - On "flash" / "complete": gem becomes interactive
 *
 * Each screen owns its own GemRenderer3D. No shared renderer.
 *
 * Changes from V6:
 *   - Magic numbers extracted to named constants
 *   - Double-tap prevention on BEGIN REVEAL
 *   - Phase-driven status text during animation
 */

import React, { useState, useCallback } from 'react';
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
import { TIER_PROFILES, TIER_ORDER, TierKey } from '../engine/tierProfiles';
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

// ─── Named constants ─────────────────────────────────────────────────────
const MATERIALIZE_FADE_MS = 800;
const FLASH_PEAK_MS = 100;
const FLASH_DECAY_MS = 450;
const FLASH_COMPLETE_DELAY_MS = 600; // must exceed FLASH_PEAK_MS + FLASH_DECAY_MS (550ms)

/** Tier-aware flash: higher tiers get more dramatic reveals */
function getFlashPeakOpacity(tierKey: TierKey): number {
  const idx = TIER_ORDER.indexOf(tierKey);
  // Seed: 0.35, One: 0.85 — linear ramp
  return 0.35 + (idx / Math.max(1, TIER_ORDER.length - 1)) * 0.50;
}

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

const PHASE_STATUS: Partial<Record<RevealPhase, string>> = {
  animating: 'Forging...',
  materializing: 'Materializing...',
};

function pickRandomVariant(): VariantType {
  return VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
}

export const RevealScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const tierKey = useGemStore((s) => s.currentTier);
  const gemShape = useGemStore((s) => s.gemShape);
  const backgroundMode = useGemStore((s) => s.backgroundMode);
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
    bgOpacity.value = withTiming(0, {
      duration: MATERIALIZE_FADE_MS,
      easing: easing.decelerate,
    });
  }, [bgOpacity]);

  const handleFlash = useCallback(() => {
    flashOpacity.value = withSequence(
      withTiming(getFlashPeakOpacity(tierKey), { duration: FLASH_PEAK_MS }),
      withTiming(0, { duration: FLASH_DECAY_MS, easing: easing.decelerate }),
    );
    hapticSuccess();
    setTimeout(() => {
      setPhase('complete');
      setVariantActive(false);
      setGemInteractive(true);
      markRevealed();
    }, FLASH_COMPLETE_DELAY_MS);
  }, [markRevealed, flashOpacity, tierKey]);

  const startReveal = useCallback(() => {
    if (phase !== 'idle') return; // prevent double-tap
    setPhase('animating');
    setVariantActive(true);
  }, [phase]);

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
      return VARIANTS[(idx + 1) % VARIANTS.length];
    });
  }, [phase, variant]);

  // ─── Animated styles ──────────────────────────────────────────────────────

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const statusText = PHASE_STATUS[phase];

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
          backgroundMode={backgroundMode}
        />
      </View>

      {/* Dark background — covers gem until materialize fades it out */}
      <Animated.View style={[styles.bgOverlay, bgStyle]} pointerEvents={phase === 'complete' ? 'none' : 'auto'}>
        <LinearGradient
          colors={['#050505', '#0A0A09', '#050505']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Flash effect — tinted to tier glow color */}
      <Animated.View style={[styles.flash, { backgroundColor: tier.glowColor }, flashStyle]} pointerEvents="none" />

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

        {/* Phase status text */}
        {statusText && (
          <Animated.Text entering={FadeIn.duration(300)} style={styles.statusText}>
            {statusText}
          </Animated.Text>
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
          <Pressable
            onPress={resetReveal}
            accessible
            accessibilityLabel="Replay the reveal animation"
            accessibilityRole="button"
          >
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
  statusText: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    position: 'absolute',
    bottom: 80,
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

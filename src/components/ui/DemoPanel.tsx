/**
 * DemoPanel — hidden dev panel for quick switching tiers/shapes.
 * Themes and environment toggles have been removed (noir space vault only).
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useGemStore, GemShape, ALL_GEM_SHAPES } from '../../store/useGemStore';
import { TIER_ORDER, TierKey } from '../../engine/tierProfiles';
import { TIER_MATERIALS, safeMaterial } from '../../gem3d/materials';
import { gemDiagnostics } from '../../gem3d/GemView';
import { typography } from '../../theme/typography';
import { spacing, radii, palette } from '../../theme/tokens';
import { hapticSelection } from '../../utils/haptics';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Diagnostics ──────────────────────────────────────────────────────────

interface DiagResult {
  label: string;
  pass: boolean;
  detail: string;
}

function runDiagnostics(): DiagResult[] {
  const results: DiagResult[] = [];

  // Material safety
  let matPass = true;
  let matDetail = '';
  for (const key of TIER_ORDER) {
    const mat = safeMaterial(TIER_MATERIALS[key]);
    if (mat.opacity < 0.85 || mat.emissiveIntensity < 0.08) {
      matPass = false;
      matDetail = `${key} failed safety clamp`;
      break;
    }
  }
  results.push({
    label: 'Material Safety',
    pass: matPass,
    detail: matPass ? `${TIER_ORDER.length} tiers OK` : matDetail,
  });

  // WebGL status
  const glReady = gemDiagnostics.glReady;
  const lastFrame = gemDiagnostics.lastFrameTime;
  const frameAge = lastFrame > 0 ? Date.now() - lastFrame : -1;
  const glAlive = glReady && frameAge >= 0 && frameAge < 3000;
  results.push({
    label: 'WebGL Render',
    pass: glAlive,
    detail: !glReady
      ? 'Not initialized (go to Home first)'
      : glAlive
      ? `${gemDiagnostics.fps} fps, ${gemDiagnostics.frameCount} frames`
      : `Stale: ${frameAge}ms since last frame`,
  });

  // GL errors
  const errCount = gemDiagnostics.errors.length;
  results.push({
    label: 'GL Errors',
    pass: errCount === 0,
    detail: errCount === 0 ? 'None' : `${errCount}: ${gemDiagnostics.errors[errCount - 1]}`,
  });

  // Shape count
  const shapeCount = ALL_GEM_SHAPES.length;
  results.push({
    label: 'Gem Shapes',
    pass: shapeCount >= 15,
    detail: `${shapeCount} shapes available`,
  });

  return results;
}

const DiagnosticsSection: React.FC = React.memo(() => {
  const [results, setResults] = useState<DiagResult[] | null>(null);

  const handleRun = useCallback(() => {
    hapticSelection();
    setResults(runDiagnostics());
  }, []);

  return (
    <View>
      <Pressable
        onPress={handleRun}
        style={[styles.chip, {
          backgroundColor: 'rgba(26,26,24,0.75)',
          borderColor: 'rgba(201,169,110,0.10)',
        }]}
      >
        <Text style={[styles.chipText, { color: palette.warmGray400 }]}>
          Run Self-Test
        </Text>
      </Pressable>
      {results && (
        <View style={styles.diagResults}>
          {results.map((r) => (
            <View key={r.label} style={styles.diagRow}>
              <Text style={[styles.diagIcon, { color: r.pass ? palette.success : palette.error }]}>
                {r.pass ? '\u2713' : '\u2717'}
              </Text>
              <View style={styles.diagInfo}>
                <Text style={[styles.diagLabel, { color: '#F2F0ED' }]}>{r.label}</Text>
                <Text style={[styles.diagDetail, { color: palette.warmGray500 }]}>{r.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

// ─── Main Panel ───────────────────────────────────────────────────────────

export const DemoPanel: React.FC = React.memo(() => {
  const show = useGemStore((s) => s.showDemoPanel);
  const toggle = useGemStore((s) => s.toggleDemoPanel);
  const setTier = useGemStore((s) => s.setTier);
  const setShape = useGemStore((s) => s.setGemShape);
  const toggleVault = useGemStore((s) => s.toggleVault);
  const currentTier = useGemStore((s) => s.currentTier);
  const currentShape = useGemStore((s) => s.gemShape);
  const vaultEnabled = useGemStore((s) => s.vaultEnabled);

  if (!show) return null;

  const handleTier = (key: TierKey) => { hapticSelection(); setTier(key); };
  const handleShape = (shape: GemShape) => { hapticSelection(); setShape(shape); };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.overlay]}
    >
      <Pressable style={styles.backdrop} onPress={toggle} />
      <View style={[styles.panel, { backgroundColor: '#1A1A18' }]}>
        <View style={styles.handle} />
        <Text style={[styles.title, { color: '#F2F0ED' }]}>Demo Controls</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* Tiers */}
          <Text style={[styles.sectionLabel, { color: palette.warmGray500 }]}>TIER</Text>
          <View style={styles.chipRow}>
            {TIER_ORDER.map((key) => (
              <Pressable
                key={key}
                onPress={() => handleTier(key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: key === currentTier ? palette.gold400 : 'rgba(26,26,24,0.75)',
                    borderColor: key === currentTier ? palette.gold400 : 'rgba(201,169,110,0.10)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: key === currentTier ? '#0A0A09' : palette.warmGray400 },
                  ]}
                >
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Shapes (15) */}
          <Text style={[styles.sectionLabel, { color: palette.warmGray500 }]}>SHAPE</Text>
          <View style={styles.chipRow}>
            {ALL_GEM_SHAPES.map((key) => (
              <Pressable
                key={key}
                onPress={() => handleShape(key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: key === currentShape ? palette.gold400 : 'rgba(26,26,24,0.75)',
                    borderColor: key === currentShape ? palette.gold400 : 'rgba(201,169,110,0.10)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: key === currentShape ? '#0A0A09' : palette.warmGray400 },
                  ]}
                >
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Vault */}
          <Text style={[styles.sectionLabel, { color: palette.warmGray500 }]}>VAULT</Text>
          <Pressable
            onPress={() => { hapticSelection(); toggleVault(); }}
            style={[
              styles.chip,
              {
                backgroundColor: vaultEnabled ? palette.gold400 : 'rgba(26,26,24,0.75)',
                borderColor: vaultEnabled ? palette.gold400 : 'rgba(201,169,110,0.10)',
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: vaultEnabled ? '#0A0A09' : palette.warmGray400 },
              ]}
            >
              {vaultEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </Pressable>

          {/* Diagnostics */}
          <Text style={[styles.sectionLabel, { color: palette.warmGray500 }]}>DIAGNOSTICS</Text>
          <DiagnosticsSection />

          <View style={{ height: spacing['3xl'] }} />
        </ScrollView>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing['4xl'],
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.warmGray300,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineMedium,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  sectionLabel: {
    ...typography.labelSmall,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 0.5,
  },
  chipText: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  diagResults: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  diagIcon: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  diagInfo: {
    flex: 1,
  },
  diagLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  diagDetail: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 1,
  },
});

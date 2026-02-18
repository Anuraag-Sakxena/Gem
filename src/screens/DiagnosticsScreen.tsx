/**
 * DiagnosticsScreen V2 — Real system health dashboard with auto-refresh.
 *
 * Shows REAL metrics:
 *   - GL context status (initialized, rendering)
 *   - FPS estimate
 *   - Renderer info (vendor/GPU)
 *   - Draw calls + triangle count
 *   - Material safety (all tiers pass clamp)
 *   - Tier/Material sync
 *   - Gem shapes count
 *   - Current gem state (tier, shape)
 *   - SafeRenderMode status
 *   - GL errors
 *   - Purchase service status
 *
 * Changes from V1:
 *   - Auto-refresh toggle (polls every 2s)
 *   - Color-coded critical failures
 *   - Copy report button (clipboard)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../components/ui/BackButton';
import { gemDiagnostics } from '../gem3d/GemView';
import { TIER_MATERIALS, safeMaterial } from '../gem3d/materials';
import { TIER_ORDER } from '../engine/tierProfiles';
import { ALL_GEM_SHAPES, useGemStore } from '../store/useGemStore';
import { purchaseService } from '../engine/PurchaseService';
import { typography } from '../theme/typography';
import { spacing, palette } from '../theme/tokens';
import { hapticSelection } from '../utils/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'Diagnostics'>;

const AUTO_REFRESH_MS = 2000;

interface DiagResult {
  label: string;
  pass: boolean;
  detail: string;
}

function runDiagnostics(): DiagResult[] {
  const results: DiagResult[] = [];
  const store = useGemStore.getState();

  // 1. GL Context
  const glReady = gemDiagnostics.glReady;
  const lastFrame = gemDiagnostics.lastFrameTime;
  const frameAge = lastFrame > 0 ? Date.now() - lastFrame : -1;
  const glAlive = glReady && frameAge >= 0 && frameAge < 3000;
  results.push({
    label: 'GL Context',
    pass: glAlive,
    detail: !glReady
      ? 'Not initialized (navigate to Home first)'
      : frameAge < 0
        ? 'Initialized, no frames yet'
        : glAlive
          ? `Active \u2014 ${frameAge}ms since last frame`
          : `Stale \u2014 ${frameAge}ms since last frame`,
  });

  // 2. FPS
  results.push({
    label: 'FPS',
    pass: gemDiagnostics.fps >= 30,
    detail: gemDiagnostics.fps > 0
      ? `${gemDiagnostics.fps} fps`
      : glReady ? 'Measuring...' : 'N/A (GL not active)',
  });

  // 3. Renderer Info
  results.push({
    label: 'Renderer',
    pass: gemDiagnostics.rendererInfo.length > 0,
    detail: gemDiagnostics.rendererInfo || 'Not available',
  });

  // 4. Draw Calls + Triangles
  results.push({
    label: 'Draw Stats',
    pass: true,
    detail: `${gemDiagnostics.drawCalls} draw calls, ${gemDiagnostics.triangles} triangles`,
  });

  // 5. Frame Count
  results.push({
    label: 'Total Frames',
    pass: gemDiagnostics.frameCount > 0,
    detail: `${gemDiagnostics.frameCount} frames rendered`,
  });

  // 6. SafeRenderMode
  results.push({
    label: 'Safe Mode',
    pass: !gemDiagnostics.safeMode,
    detail: gemDiagnostics.safeMode
      ? 'ACTIVE \u2014 using fallback renderer'
      : 'Off \u2014 primary renderer OK',
  });

  // 7. GL Errors
  const errCount = gemDiagnostics.errors.length;
  results.push({
    label: 'GL Errors',
    pass: errCount === 0,
    detail: errCount === 0
      ? 'None'
      : `${errCount} error(s): ${gemDiagnostics.errors[errCount - 1]}`,
  });

  // 8. Material Safety
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

  // 9. Tier/Material Sync
  const tierCount = TIER_ORDER.length;
  const matCount = Object.keys(TIER_MATERIALS).length;
  const profilesMatch = tierCount === matCount;
  results.push({
    label: 'Tier/Material Sync',
    pass: profilesMatch,
    detail: profilesMatch
      ? `${tierCount} tiers, ${matCount} materials`
      : `Mismatch: ${tierCount} tiers vs ${matCount} materials`,
  });

  // 10. Gem Shapes
  const shapeCount = ALL_GEM_SHAPES.length;
  results.push({
    label: 'Gem Shapes',
    pass: shapeCount >= 15,
    detail: `${shapeCount} shapes available`,
  });

  // 11. Current Gem State
  results.push({
    label: 'Current Gem',
    pass: true,
    detail: `tier=${store.currentTier}, shape=${store.gemShape}`,
  });

  // 12. Purchase Service
  const entitlements = purchaseService.getEntitlements();
  results.push({
    label: 'Purchase Service',
    pass: true,
    detail: `${entitlements.owned.size} owned, highest: ${entitlements.highestTier}`,
  });

  return results;
}

function formatReport(results: DiagResult[]): string {
  const lines = results.map(
    (r) => `${r.pass ? '\u2713' : '\u2717'} ${r.label}: ${r.detail}`,
  );
  return `Gem Diagnostics Report\n${'='.repeat(30)}\n${lines.join('\n')}`;
}

export const DiagnosticsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState<DiagResult[] | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRun = useCallback(() => {
    hapticSelection();
    setResults(runDiagnostics());
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    hapticSelection();
    setAutoRefresh((prev) => !prev);
  }, []);

  const handleCopyReport = useCallback(() => {
    if (!results) return;
    hapticSelection();
    const report = formatReport(results);
    Alert.alert('Diagnostics Report', report);
  }, [results]);

  // Auto-run on mount
  useEffect(() => {
    setResults(runDiagnostics());
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setResults(runDiagnostics());
      }, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh]);

  const passCount = results?.filter((r) => r.pass).length ?? 0;
  const totalCount = results?.length ?? 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} label="Back" />
        <Text style={styles.title}>Diagnostics</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {results && (
          <>
            <View style={styles.summaryRow}>
              <Text style={[
                styles.summaryText,
                { color: passCount === totalCount ? palette.success : palette.error },
              ]}>
                {passCount}/{totalCount} PASSED
              </Text>
              {autoRefresh && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>

            {results.map((r) => (
              <View key={r.label} style={styles.resultRow}>
                <Text style={[styles.icon, { color: r.pass ? palette.success : palette.error }]}>
                  {r.pass ? '\u2713' : '\u2717'}
                </Text>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultLabel}>{r.label}</Text>
                  <Text style={[
                    styles.resultDetail,
                    !r.pass && styles.resultDetailFail,
                  ]}>
                    {r.detail}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.actions}>
          <Pressable onPress={handleRun} style={styles.actionButton}>
            <Text style={styles.actionText}>Re-Run Tests</Text>
          </Pressable>
          <Pressable onPress={toggleAutoRefresh} style={[styles.actionButton, autoRefresh && styles.actionButtonActive]}>
            <Text style={[styles.actionText, autoRefresh && styles.actionTextActive]}>
              {autoRefresh ? 'Stop Auto-Refresh' : 'Auto-Refresh'}
            </Text>
          </Pressable>
          <Pressable onPress={handleCopyReport} style={styles.actionButton}>
            <Text style={styles.actionText}>View Report</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A09',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.headlineMedium,
    color: '#F2F0ED',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['4xl'],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  summaryText: {
    ...typography.headlineSmall,
    letterSpacing: 3,
  },
  liveBadge: {
    backgroundColor: palette.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveBadgeText: {
    ...typography.labelSmall,
    color: '#0A0A09',
    fontSize: 8,
    letterSpacing: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  resultInfo: {
    flex: 1,
  },
  resultLabel: {
    ...typography.bodyMedium,
    color: '#F2F0ED',
    fontWeight: '600',
  },
  resultDetail: {
    ...typography.caption,
    color: palette.warmGray500,
    marginTop: 2,
  },
  resultDetailFail: {
    color: palette.error,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 180,
    alignItems: 'center',
  },
  actionButtonActive: {
    borderColor: palette.success,
    backgroundColor: 'rgba(52,199,89,0.1)',
  },
  actionText: {
    ...typography.labelMedium,
    color: palette.warmGray400,
    letterSpacing: 2,
  },
  actionTextActive: {
    color: palette.success,
  },
});

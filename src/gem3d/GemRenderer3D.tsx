/**
 * GemRenderer3D V6 — Top-level 3D gem component for React Native screens.
 *
 * WHAT CHANGED (V5 → V6):
 *   - TRUE 360° rotation: all pitch clamps removed. Quaternion = no limits.
 *   - Delayed auto-rotate resume: waits 800ms after user lifts finger
 *   - Asymptotic velocity decay: fast spins slow naturally, slow spins sustain
 *   - Velocity smoothing via EMA for premium fling momentum
 *
 * CRITICAL: Does NOT key GemView by tier/shape.
 * GemView is persistent — all changes are lerped or swapped in-place.
 *
 * Fallback: premium gradient placeholder, NEVER a flat 2D polygon.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, Text, AppState, AppStateStatus, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { GemView, RotationState, GestureInput } from './GemView';
import { Gem3DErrorBoundary } from './Gem3DErrorBoundary';
import { TierKey, TIER_PROFILES } from '../engine/tierProfiles';
import { GemShapeKey } from './geometries';
import type { BackgroundMode } from '../store/useGemStore';
import { hapticSelection } from '../utils/haptics';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Props {
  tierKey: TierKey;
  shape?: GemShapeKey;
  size?: number;
  viewWidth?: number;
  viewHeight?: number;
  interactive?: boolean;
  onTap?: () => void;
  style?: ViewStyle;
  gemScale?: number;
  backgroundMode?: BackgroundMode;
}

const GL_READY_TIMEOUT = 4000;

// Initial slight downward tilt (0.15 rad around X axis)
// qFromAxisAngle(1, 0, 0, 0.15) pre-computed:
const INITIAL_QX = 0.07494;
const INITIAL_QW = 0.99719;

// ─── Premium Fallback ───────────────────────────────────────────────────────

const PremiumFallback: React.FC<{ tierKey: TierKey; size: number }> = ({ tierKey, size }) => {
  const tier = TIER_PROFILES[tierKey];
  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <LinearGradient
        colors={[tier.primaryColor + '30', tier.glowColor + '15', 'transparent']}
        style={[styles.fallbackGlow, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3 }]}
      />
      <View style={[styles.fallbackDiamond, {
        width: size * 0.3,
        height: size * 0.4,
        borderColor: tier.primaryColor + '50',
      }]} />
      <Text style={[styles.fallbackLabel, { color: tier.primaryColor + '60' }]}>
        Rendering optimized for your device
      </Text>
    </View>
  );
};

// ─── Component ──────────────────────────────────────────────────────────────

export const GemRenderer3D: React.FC<Props> = React.memo(({
  tierKey,
  shape = 'brilliant',
  size = 220,
  viewWidth,
  viewHeight,
  interactive = true,
  onTap,
  style,
  gemScale = 1,
  backgroundMode = 'dark',
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const [glReady, setGlReady] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrameRef = useRef(0);

  // Measured layout for robust size tracking (navigation transitions, rotation)
  const [layoutSize, setLayoutSize] = useState<{ w: number; h: number } | null>(null);
  const layoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: lw, height: lh } = e.nativeEvent.layout;
    if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    layoutTimerRef.current = setTimeout(() => {
      setLayoutSize((prev) => {
        // Skip if unchanged (within 2px tolerance)
        if (prev && Math.abs(prev.w - lw) < 2 && Math.abs(prev.h - lh) < 2) return prev;
        return { w: Math.round(lw), h: Math.round(lh) };
      });
    }, 150); // 150ms debounce — settles after navigation transition
  }, []);

  const displayW = viewWidth ?? size;
  const displayH = viewHeight ?? size;

  // Persistent quaternion rotation state
  const rotationRef = useRef<RotationState>({
    qx: INITIAL_QX, qy: 0, qz: 0, qw: INITIAL_QW,
    vx: 0, vy: 0, isDragging: false,
    autoRotatePaused: false,
    lastInteractionTime: 0,
  });
  // Gesture input via Reanimated shared values — worklet-safe, never serializes rotationRef
  const gDragging = useSharedValue(false);
  const gTransX = useSharedValue(0);
  const gTransY = useSharedValue(0);
  const gVelX = useSharedValue(0);
  const gVelY = useSharedValue(0);
  const gestureInputRef = useRef<GestureInput>({
    dragging: gDragging,
    transX: gTransX,
    transY: gTransY,
    velX: gVelX,
    velY: gVelY,
  });

  // ── AppState lifecycle (pause when backgrounded) ──
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      setAppActive(state === 'active');
    };
    const sub = AppState.addEventListener('change', handler);
    return () => {
      sub.remove();
      if (layoutTimerRef.current) clearTimeout(layoutTimerRef.current);
    };
  }, []);

  // ── GL readiness timeout ──
  useEffect(() => {
    if (!useFallback && !glReady) {
      timeoutRef.current = setTimeout(() => {
        if (!glReady) setUseFallback(true);
      }, GL_READY_TIMEOUT);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [useFallback, glReady]);

  // ── Heartbeat monitor ──
  useEffect(() => {
    if (!glReady || useFallback) return;
    const interval = setInterval(() => {
      if (appActive && lastFrameRef.current > 0 && Date.now() - lastFrameRef.current > 3000) {
        if (__DEV__) console.warn('[GemRenderer3D] GL stopped producing frames');
        setUseFallback(true);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [glReady, useFallback, appActive]);

  const handleGlReady = useCallback(() => {
    setGlReady(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleGlError = useCallback(() => setUseFallback(true), []);

  const handleFrame = useCallback(() => {
    lastFrameRef.current = Date.now();
  }, []);

  // ── Gestures — pure worklet handlers write to shared values only ──
  // CRITICAL: rotationRef is NEVER captured in gesture closures.
  // All quaternion math happens in GemView's animation loop (JS thread, rAF).
  const panGesture = Gesture.Pan()
    .enabled(interactive)
    .onBegin(() => {
      'worklet';
      gDragging.value = true;
      gTransX.value = 0;
      gTransY.value = 0;
      gVelX.value = 0;
      gVelY.value = 0;
    })
    .onUpdate((e) => {
      'worklet';
      gTransX.value = e.translationX;
      gTransY.value = e.translationY;
      gVelX.value = e.velocityX;
      gVelY.value = e.velocityY;
    })
    .onEnd(() => {
      'worklet';
      gDragging.value = false;
    });

  const tapGesture = Gesture.Tap()
    .enabled(!!onTap)
    .runOnJS(true)
    .onEnd(() => {
      if (onTap) {
        hapticSelection();
        onTap();
      }
    });

  const composed = interactive && onTap
    ? Gesture.Exclusive(panGesture, tapGesture)
    : interactive
    ? panGesture
    : onTap
    ? tapGesture
    : Gesture.Tap();

  // Premium fallback
  if (useFallback) {
    return (
      <View style={[{ width: displayW, height: displayH }, style]}>
        <PremiumFallback tierKey={tierKey} size={Math.min(displayW, displayH)} />
      </View>
    );
  }

  // 3D Renderer (persistent, no key)
  return (
    <Gem3DErrorBoundary
      tierKey={tierKey}
      shape={shape}
      size={Math.min(displayW, displayH)}
      onTap={onTap}
      interactive={interactive}
    >
      <GestureDetector gesture={composed}>
        <View
          style={[styles.container, { width: displayW, height: displayH }, style]}
          onLayout={handleLayout}
        >
          <GemView
            tierKey={tierKey}
            shape={shape}
            size={size}
            viewWidth={layoutSize?.w ?? displayW}
            viewHeight={layoutSize?.h ?? displayH}
            rotationState={rotationRef.current}
            gestureInput={gestureInputRef.current}
            gemScale={gemScale}
            backgroundMode={backgroundMode}
            paused={!appActive}
            onReady={handleGlReady}
            onError={handleGlError}
            onFrame={handleFrame}
          />
        </View>
      </GestureDetector>
    </Gem3DErrorBoundary>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlow: {
    position: 'absolute',
  },
  fallbackDiamond: {
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  fallbackLabel: {
    position: 'absolute',
    bottom: 8,
    fontSize: 9,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

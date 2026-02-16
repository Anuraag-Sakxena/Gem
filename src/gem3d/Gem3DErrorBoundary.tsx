/**
 * Gem3DErrorBoundary — catches 3D rendering errors.
 * Falls back to a premium gradient placeholder — NEVER a flat 2D polygon.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TierKey, TIER_PROFILES } from '../engine/tierProfiles';

interface Props {
  children: ReactNode;
  tierKey: TierKey;
  shape?: string;
  size: number;
  onTap?: () => void;
  interactive?: boolean;
}

interface State {
  hasError: boolean;
}

/** Premium static fallback — gradient gem silhouette, never a flat polygon */
const GemFallback: React.FC<{ tierKey: TierKey; size: number }> = ({ tierKey, size }) => {
  const tier = TIER_PROFILES[tierKey];
  return (
    <View style={[styles.fallback, { width: size, height: size }]}>
      <LinearGradient
        colors={[tier.primaryColor + '40', tier.glowColor + '20', 'transparent']}
        style={[styles.fallbackGlow, { width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35 }]}
      />
      <View style={[styles.fallbackGem, {
        width: size * 0.35,
        height: size * 0.45,
        borderColor: tier.primaryColor + '60',
      }]} />
      <Text style={[styles.fallbackText, { color: tier.primaryColor + '80' }]}>
        Rendering optimized for your device
      </Text>
    </View>
  );
};

export class Gem3DErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn('[Gem3DErrorBoundary]', error.message, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <GemFallback
          tierKey={this.props.tierKey}
          size={this.props.size}
        />
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlow: {
    position: 'absolute',
  },
  fallbackGem: {
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  fallbackText: {
    position: 'absolute',
    bottom: 8,
    fontSize: 9,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

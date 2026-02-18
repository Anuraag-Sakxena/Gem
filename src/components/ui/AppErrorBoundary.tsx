/**
 * AppErrorBoundary — top-level error boundary for fatal crashes.
 * Shows a premium "Something went wrong" screen with restart capability.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';
import { spacing, palette } from '../../theme/tokens';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.error('[AppErrorBoundary]', error.message, info.componentStack);
    }
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>{'\u25C7'}</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetail} numberOfLines={3}>
              {this.state.error}
            </Text>
          )}
          <Pressable
            onPress={this.handleRestart}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>RESTART</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A09',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['4xl'],
  },
  icon: {
    fontSize: 48,
    color: palette.gold400,
    fontWeight: '100',
    marginBottom: spacing['2xl'],
  },
  title: {
    ...typography.headlineLarge,
    color: '#F2F0ED',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: palette.warmGray500,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  errorDetail: {
    ...typography.mono,
    color: palette.error,
    fontSize: 10,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.lg,
    borderRadius: 24,
    backgroundColor: palette.gold400,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    ...typography.labelMedium,
    color: '#0A0A09',
    letterSpacing: 2,
  },
});

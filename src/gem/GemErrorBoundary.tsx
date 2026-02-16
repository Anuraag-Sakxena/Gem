/**
 * GemErrorBoundary — catches rendering errors and shows elegant fallback.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/tokens';
import { typography } from '../theme/typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GemErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (__DEV__) {
      console.warn('[GemErrorBoundary]', error.message, info.componentStack);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.icon}>◇</Text>
          <Text style={styles.text}>Gem loading...</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallback: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    color: palette.gold400,
    marginBottom: 8,
  },
  text: {
    ...typography.caption,
    color: palette.warmGray400,
  },
});

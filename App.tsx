/**
 * App — Root entry point.
 *
 * Each screen owns its own GemRenderer3D instance.
 * Shared state via Zustand ensures identical gem/theme across screens.
 * Global overlays (Toast, DemoPanel) render above everything.
 *
 * WHY NOT shared canvas in AppShell:
 *   @react-navigation/native-stack uses UINavigationController (iOS)
 *   which manages its own native view hierarchy. React z-index does not
 *   pierce through native screen containers. Screens always cover
 *   sibling views at the same level.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Toast, DemoPanel } from './src/components/ui';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
          <Toast />
          <DemoPanel />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

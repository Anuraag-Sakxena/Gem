/**
 * RootNavigator V2 — native stack with onboarding gate.
 *
 * First launch: shows Splash → user taps CONTINUE → marks onboarded → Home.
 * Subsequent launches: skips Splash, goes directly to Home.
 *
 * All screens have transparent backgrounds — screens that need opaque
 * backgrounds render their own background views.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { hasOnboarded } from '../utils/persistence';
import { SplashScreen } from '../screens/SplashScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TierLadderScreen } from '../screens/TierLadderScreen';
import { RevealScreen } from '../screens/RevealScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { VerificationScreen } from '../screens/VerificationScreen';
import { PlanBScreen } from '../screens/PlanBScreen';
import { DiagnosticsScreen } from '../screens/DiagnosticsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  TierLadder: undefined;
  Reveal: undefined;
  Profile: undefined;
  Verification: undefined;
  PlanB: undefined;
  Diagnostics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const initialRoute = hasOnboarded() ? 'Home' : 'Splash';

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 350,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="TierLadder"
        component={TierLadderScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Reveal"
        component={RevealScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Verification"
        component={VerificationScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PlanB"
        component={PlanBScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Diagnostics"
        component={DiagnosticsScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

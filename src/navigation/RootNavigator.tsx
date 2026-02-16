/**
 * RootNavigator — native stack navigator with screen definitions.
 *
 * All screens have transparent backgrounds — the shared 3D renderer
 * in AppShell shows through. Screens that need opaque backgrounds
 * render their own background views.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
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
        options={{ animation: 'fade' }}
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

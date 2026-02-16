/**
 * SplashScreen V2 — minimal entry with refined typography and warm fade.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { PremiumButton } from '../components/ui';
import { typography } from '../theme/typography';
import { palette, spacing } from '../theme/tokens';
import { easing, duration } from '../motion';
import { hapticMedium } from '../utils/haptics';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const bgY = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(
      400,
      withTiming(1, { duration: duration.dramatic, easing: easing.decelerate }),
    );
    taglineOpacity.value = withDelay(
      900,
      withTiming(1, { duration: duration.slow, easing: easing.decelerate }),
    );
    buttonOpacity.value = withDelay(
      1600,
      withTiming(1, { duration: duration.slow, easing: easing.decelerate }),
    );
    bgY.value = withTiming(-20, { duration: 25000, easing: easing.linear });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: (1 - logoOpacity.value) * 16 }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: (1 - taglineOpacity.value) * 12 }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: (1 - buttonOpacity.value) * 8 }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bgY.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient
          colors={[palette.ivory50, palette.ivory100, palette.ivory200, palette.ivory100]}
          style={{ width, height: height + 40 }}
        />
      </Animated.View>

      <View style={[styles.content, { paddingTop: insets.top + spacing['7xl'] }]}>
        <Animated.View style={logoStyle}>
          <Text style={styles.logoIcon}>{'\u25C7'}</Text>
        </Animated.View>

        <Animated.Text style={[styles.brandName, logoStyle]}>
          GEM
        </Animated.Text>

        <Animated.Text style={[styles.tagline, taglineStyle]}>
          Status, crystallized.
        </Animated.Text>

        <Animated.View style={[styles.buttonWrap, buttonStyle]}>
          <PremiumButton
            title="CONTINUE"
            onPress={() => { hapticMedium(); navigation.replace('Home'); }}
            size="large"
          />
        </Animated.View>
      </View>

      <Animated.Text
        style={[styles.version, { bottom: insets.bottom + spacing.lg }, buttonStyle]}
      >
        MVP Demo v2.0
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.ivory50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['5xl'],
  },
  logoIcon: {
    fontSize: 52,
    color: palette.gold400,
    fontWeight: '100',
    marginBottom: spacing.lg,
  },
  brandName: {
    ...typography.displayLarge,
    color: palette.charcoal,
    letterSpacing: 14,
    marginBottom: spacing.md,
  },
  tagline: {
    ...typography.bodyLarge,
    color: palette.warmGray400,
    letterSpacing: 2.5,
    marginBottom: spacing['8xl'],
  },
  buttonWrap: {
    position: 'absolute',
    bottom: 100,
  },
  version: {
    position: 'absolute',
    alignSelf: 'center',
    ...typography.caption,
    color: palette.warmGray300,
    letterSpacing: 1,
  },
});

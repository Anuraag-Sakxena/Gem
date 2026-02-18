/**
 * SplashScreen V4 — Dark noir with warm radial glow.
 *
 * Visual design: deep dark background with a warm gold radial glow
 * emanating from center, giving depth and premium feel.
 * Not just black — has visible warmth and atmosphere.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
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
import { markOnboarded } from '../utils/persistence';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Radial glow fades in first
    glowOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
    );
    glowScale.value = withDelay(
      200,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }),
    );
    // Then gentle breathing
    glowScale.value = withDelay(
      1700,
      withRepeat(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );

    logoOpacity.value = withDelay(
      600,
      withTiming(1, { duration: duration.dramatic, easing: easing.decelerate }),
    );
    taglineOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: duration.slow, easing: easing.decelerate }),
    );
    buttonOpacity.value = withDelay(
      1800,
      withTiming(1, { duration: duration.slow, easing: easing.decelerate }),
    );
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

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Base dark gradient */}
      <LinearGradient
        colors={['#0A0808', '#0F0D0A', '#12100D', '#0A0908']}
        style={StyleSheet.absoluteFill}
      />

      {/* Warm radial glow — gives depth to the dark background */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={[
            'rgba(201,169,110,0.12)',
            'rgba(180,140,80,0.06)',
            'rgba(140,100,50,0.02)',
            'transparent',
          ]}
          style={styles.radialGlow}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Secondary cooler glow for depth */}
      <View style={styles.secondaryGlowContainer}>
        <LinearGradient
          colors={[
            'rgba(100,120,160,0.05)',
            'rgba(80,100,140,0.02)',
            'transparent',
          ]}
          style={styles.secondaryGlow}
          start={{ x: 0.5, y: 0.3 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

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
            onPress={() => { hapticMedium(); markOnboarded(); navigation.replace('Home'); }}
            size="large"
            variant="accent"
          />
        </Animated.View>
      </View>
    </View>
  );
};

const GLOW_SIZE = Math.max(width, height) * 0.9;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080706',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialGlow: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
  },
  secondaryGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  secondaryGlow: {
    width: width,
    height: height * 0.6,
    marginTop: height * 0.1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['5xl'],
  },
  logoIcon: {
    fontSize: 56,
    color: palette.gold400,
    fontWeight: '100',
    marginBottom: spacing.lg,
    // Subtle gold text shadow for glow effect
    textShadowColor: 'rgba(201,169,110,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  brandName: {
    ...typography.displayLarge,
    color: '#F2F0ED',
    letterSpacing: 14,
    marginBottom: spacing.md,
    textShadowColor: 'rgba(255,248,240,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
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
});

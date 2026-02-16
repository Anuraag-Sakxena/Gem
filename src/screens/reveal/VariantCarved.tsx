/**
 * Variant B — "Carved"
 * Rough stone circle fades in → laser lines sweep across →
 * stone cracks with particle burst → stone dissolves, gem materializes.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { easing } from '../../motion';
import { hapticLight, hapticMedium, hapticHeavy } from '../../utils/haptics';

const CRACK_COUNT = 10;

interface CrackProps {
  index: number;
  color: string;
  active: boolean;
}

const CrackParticle: React.FC<CrackProps> = React.memo(({ index, color, active }) => {
  const angle = (Math.PI * 2 * index) / CRACK_COUNT + (Math.random() - 0.5) * 0.4;
  const dist = 80 + Math.random() * 80;
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  const sc = useSharedValue(1);

  useEffect(() => {
    if (active) {
      // Tightened: all particles vanish before materialize fires
      const delay = index * 25;
      op.value = withDelay(delay, withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 350, easing: easing.decelerate }),
      ));
      tx.value = withDelay(delay, withTiming(Math.cos(angle) * dist, { duration: 450, easing: easing.decelerate }));
      ty.value = withDelay(delay, withTiming(Math.sin(angle) * dist, { duration: 450, easing: easing.decelerate }));
      sc.value = withDelay(delay, withTiming(0.2, { duration: 450 }));
    } else {
      tx.value = 0;
      ty.value = 0;
      op.value = 0;
      sc.value = 1;
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: sc.value },
    ],
  }));

  const size = 3 + Math.random() * 4;

  return (
    <Animated.View
      style={[
        styles.crackParticle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
});

interface Props {
  active: boolean;
  color: string;
  glowColor: string;
  onMaterialize: () => void;
  onFlash: () => void;
}

export const VariantCarved: React.FC<Props> = React.memo(({
  active,
  color,
  glowColor,
  onMaterialize,
  onFlash,
}) => {
  const stoneOpacity = useSharedValue(0);
  const stoneScale = useSharedValue(0.6);
  const laserY = useSharedValue(-60);
  const laserOpacity = useSharedValue(0);
  const laser2Y = useSharedValue(60);
  const laser2Opacity = useSharedValue(0);
  const [cracking, setCracking] = React.useState(false);

  useEffect(() => {
    if (!active) {
      stoneOpacity.value = 0;
      stoneScale.value = 0.6;
      laserY.value = -60;
      laserOpacity.value = 0;
      laser2Y.value = 60;
      laser2Opacity.value = 0;
      setCracking(false);
      return;
    }

    // Phase 1: Stone appears (0–1.2s)
    hapticLight();
    stoneOpacity.value = withTiming(0.7, { duration: 800, easing: easing.decelerate });
    stoneScale.value = withTiming(1, { duration: 1000, easing: easing.emphasized });

    // Phase 2: Laser lines sweep (1.2–2.5s)
    const t1 = setTimeout(() => {
      hapticMedium();
      laserOpacity.value = withTiming(0.9, { duration: 200 });
      laserY.value = withTiming(60, { duration: 1100, easing: easing.standard });
      laser2Opacity.value = withDelay(200, withTiming(0.9, { duration: 200 }));
      laser2Y.value = withDelay(200, withTiming(-60, { duration: 1100, easing: easing.standard }));
    }, 1200);

    // Phase 3: Crack + dissolve (2.5–3.5s)
    const t2 = setTimeout(() => {
      hapticHeavy();
      setCracking(true);
      laserOpacity.value = withTiming(0, { duration: 200 });
      laser2Opacity.value = withTiming(0, { duration: 200 });
      stoneOpacity.value = withDelay(200, withTiming(0, { duration: 500, easing: easing.accelerate }));
      stoneScale.value = withDelay(200, withTiming(1.3, { duration: 500, easing: easing.decelerate }));
    }, 2500);

    // Materialize — after all particles vanished (max: 2500+225+450=3175ms, stone: 2500+700=3200ms)
    const t3 = setTimeout(() => onMaterialize(), 3300);

    // Flash — after bg fade begins
    const t4 = setTimeout(() => onFlash(), 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active]);

  const stoneStyle = useAnimatedStyle(() => ({
    opacity: stoneOpacity.value,
    transform: [{ scale: stoneScale.value }],
  }));

  const laserStyle = useAnimatedStyle(() => ({
    opacity: laserOpacity.value,
    transform: [{ translateY: laserY.value }],
  }));

  const laser2Style = useAnimatedStyle(() => ({
    opacity: laser2Opacity.value,
    transform: [{ translateY: laser2Y.value }],
  }));

  if (!active && !cracking) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {/* Rough stone */}
        <Animated.View style={[styles.stoneWrap, stoneStyle]}>
          <View style={[styles.stone, { borderColor: glowColor }]}>
            {/* Stone texture lines */}
            <View style={[styles.stoneLine, { backgroundColor: glowColor, top: '30%' }]} />
            <View style={[styles.stoneLine, { backgroundColor: glowColor, top: '55%' }]} />
            <View style={[styles.stoneLine, { backgroundColor: glowColor, top: '75%', width: '60%' }]} />
          </View>
        </Animated.View>

        {/* Laser sweep lines */}
        <Animated.View style={[styles.laserWrap, laserStyle]}>
          <View style={[styles.laser, { backgroundColor: color }]} />
        </Animated.View>
        <Animated.View style={[styles.laserWrap, laser2Style]}>
          <View style={[styles.laser, { backgroundColor: color, opacity: 0.6 }]} />
        </Animated.View>

        {/* Crack particles */}
        {cracking &&
          Array.from({ length: CRACK_COUNT }).map((_, i) => (
            <CrackParticle key={i} index={i} color={color} active={cracking} />
          ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stone: {
    width: 100,
    height: 100,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
  },
  stoneLine: {
    position: 'absolute',
    height: 0.5,
    width: '80%',
    opacity: 0.3,
  },
  laserWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laser: {
    width: 180,
    height: 1.5,
    borderRadius: 0.75,
  },
  crackParticle: {
    position: 'absolute',
  },
});

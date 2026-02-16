/**
 * Variant C — "Crystallize"
 * Liquid droplet grows with wobble → concentric ripples expand →
 * crystal rays radiate then contract → gem snaps into focus.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import { easing } from '../../motion';
import { hapticLight, hapticMedium, hapticHeavy } from '../../utils/haptics';

const RAY_COUNT = 6;
const RIPPLE_COUNT = 3;

interface RayProps {
  index: number;
  color: string;
  active: boolean;
}

const CrystalRay: React.FC<RayProps> = React.memo(({ index, color, active }) => {
  const angle = (360 * index) / RAY_COUNT;
  const len = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    if (active) {
      // Tightened: all rays complete before flash fires
      const delay = index * 50;
      op.value = withDelay(delay, withSequence(
        withTiming(0.8, { duration: 150 }),
        withTiming(0.6, { duration: 400 }),
        withTiming(0, { duration: 200, easing: easing.accelerate }),
      ));
      len.value = withDelay(delay, withSequence(
        withTiming(120, { duration: 400, easing: easing.decelerate }),
        withTiming(0, { duration: 350, easing: easing.accelerate }),
      ));
    } else {
      len.value = 0;
      op.value = 0;
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    height: len.value,
    transform: [{ rotate: `${angle}deg` }],
  }));

  return (
    <Animated.View style={[styles.rayWrap, style]}>
      <View style={[styles.ray, { backgroundColor: color }]} />
    </Animated.View>
  );
});

interface RippleProps {
  index: number;
  color: string;
  active: boolean;
}

const Ripple: React.FC<RippleProps> = React.memo(({ index, color, active }) => {
  const scale = useSharedValue(0.2);
  const op = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const delay = index * 250;
      scale.value = withDelay(delay, withTiming(2.5, { duration: 900, easing: easing.decelerate }));
      op.value = withDelay(delay, withSequence(
        withTiming(0.5, { duration: 200 }),
        withTiming(0, { duration: 700, easing: easing.decelerate }),
      ));
    } else {
      scale.value = 0.2;
      op.value = 0;
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.ripple, { borderColor: color }, style]} />
  );
});

interface Props {
  active: boolean;
  color: string;
  glowColor: string;
  onMaterialize: () => void;
  onFlash: () => void;
}

export const VariantCrystallize: React.FC<Props> = React.memo(({
  active,
  color,
  glowColor,
  onMaterialize,
  onFlash,
}) => {
  const dropScale = useSharedValue(0);
  const dropOpacity = useSharedValue(0);
  const dropWobble = useSharedValue(1);
  const [showRipples, setShowRipples] = React.useState(false);
  const [showRays, setShowRays] = React.useState(false);

  useEffect(() => {
    if (!active) {
      dropScale.value = 0;
      dropOpacity.value = 0;
      dropWobble.value = 1;
      setShowRipples(false);
      setShowRays(false);
      return;
    }

    // Phase 1: Liquid droplet grows (0–1s)
    hapticLight();
    dropOpacity.value = withTiming(0.7, { duration: 500, easing: easing.decelerate });
    dropScale.value = withTiming(1, { duration: 900, easing: easing.emphasized });
    // Wobble effect
    dropWobble.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 300, easing: easing.gentle }),
        withTiming(0.88, { duration: 300, easing: easing.gentle }),
      ),
      3,
      true,
    );

    // Phase 2: Ripples (1–2.2s)
    const t1 = setTimeout(() => {
      hapticMedium();
      setShowRipples(true);
    }, 1000);

    // Phase 3: Crystal rays (2.2–3.3s)
    const t2 = setTimeout(() => {
      hapticMedium();
      setShowRays(true);
      // Droplet shrinks and vanishes
      dropScale.value = withTiming(0.3, { duration: 600, easing: easing.accelerate });
      dropOpacity.value = withDelay(300, withTiming(0, { duration: 300 }));
      dropWobble.value = withTiming(1, { duration: 300 });
    }, 2200);

    // Materialize (2.8s)
    const t3 = setTimeout(() => {
      hapticHeavy();
      onMaterialize();
    }, 2800);

    // Flash (3.4s)
    const t4 = setTimeout(() => onFlash(), 3400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active]);

  const dropStyle = useAnimatedStyle(() => ({
    opacity: dropOpacity.value,
    transform: [
      { scale: dropScale.value },
      { scaleX: dropWobble.value },
      { scaleY: 2 - dropWobble.value },
    ],
  }));

  if (!active && !showRipples && !showRays) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {/* Liquid droplet */}
        <Animated.View style={[styles.dropWrap, dropStyle]}>
          <View style={[styles.drop, { backgroundColor: glowColor }]} />
        </Animated.View>

        {/* Concentric ripples */}
        {showRipples &&
          Array.from({ length: RIPPLE_COUNT }).map((_, i) => (
            <Ripple key={i} index={i} color={glowColor} active={showRipples} />
          ))}

        {/* Crystal rays */}
        {showRays &&
          Array.from({ length: RAY_COUNT }).map((_, i) => (
            <CrystalRay key={i} index={i} color={color} active={showRays} />
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
  dropWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drop: {
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.5,
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
  },
  rayWrap: {
    position: 'absolute',
    width: 2,
    transformOrigin: 'center bottom',
    alignItems: 'center',
  },
  ray: {
    width: 1.5,
    flex: 1,
    borderRadius: 0.75,
  },
});

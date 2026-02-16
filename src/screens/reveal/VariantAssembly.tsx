/**
 * Variant A — "Assembly"
 * Atom dot pulses → energy ring expands → 8 shards fly outward →
 * shards converge to center → gem materializes with flash.
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

const FRAGMENT_COUNT = 8;

interface FragmentProps {
  index: number;
  color: string;
  active: boolean;
  converging: boolean;
}

const Shard: React.FC<FragmentProps> = React.memo(({ index, color, active, converging }) => {
  const angle = (Math.PI * 2 * index) / FRAGMENT_COUNT;
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    if (active && !converging) {
      // Fly outward
      tx.value = withDelay(index * 60, withTiming(Math.cos(angle) * 160, { duration: 500, easing: easing.decelerate }));
      ty.value = withDelay(index * 60, withTiming(Math.sin(angle) * 160, { duration: 500, easing: easing.decelerate }));
      op.value = withDelay(index * 60, withTiming(0.7, { duration: 300 }));
      rot.value = withTiming(Math.random() * 360, { duration: 800 });
    }
    if (converging) {
      // Tightened: all shards converge and vanish before materialize fires
      const dur = 450 + index * 25;
      tx.value = withTiming(0, { duration: dur, easing: easing.accelerate });
      ty.value = withTiming(0, { duration: dur, easing: easing.accelerate });
      rot.value = withTiming(0, { duration: dur });
      op.value = withDelay(dur - 150, withTiming(0, { duration: 150 }));
    }
    if (!active && !converging) {
      tx.value = 0;
      ty.value = 0;
      op.value = 0;
      rot.value = 0;
    }
  }, [active, converging]);

  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.shard, { backgroundColor: color }, style]} />
  );
});

interface Props {
  active: boolean;
  color: string;
  glowColor: string;
  onMaterialize: () => void;
  onFlash: () => void;
}

export const VariantAssembly: React.FC<Props> = React.memo(({
  active,
  color,
  glowColor,
  onMaterialize,
  onFlash,
}) => {
  const atomScale = useSharedValue(0);
  const atomOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const ringRotation = useSharedValue(0);
  const [showFragments, setShowFragments] = React.useState(false);
  const [converging, setConverging] = React.useState(false);

  useEffect(() => {
    if (!active) {
      atomScale.value = 0;
      atomOpacity.value = 0;
      ringScale.value = 0;
      ringOpacity.value = 0;
      ringRotation.value = 0;
      setShowFragments(false);
      setConverging(false);
      return;
    }

    // Phase 1: Atom pulse (0–1s)
    hapticLight();
    atomOpacity.value = withTiming(1, { duration: 400, easing: easing.decelerate });
    atomScale.value = withSequence(
      withTiming(1, { duration: 400, easing: easing.emphasized }),
      withTiming(0.8, { duration: 250 }),
      withTiming(1.2, { duration: 250 }),
    );

    // Phase 2: Ring + fragments fly out (1–2.4s)
    const t1 = setTimeout(() => {
      hapticMedium();
      ringOpacity.value = withTiming(0.65, { duration: 300 });
      ringScale.value = withTiming(1, { duration: 600, easing: easing.decelerate });
      ringRotation.value = withTiming(540, { duration: 2200, easing: easing.standard });
      setShowFragments(true);
    }, 1000);

    // Phase 3: Fragments converge (2.4–3.4s)
    const t2 = setTimeout(() => {
      hapticHeavy();
      setConverging(true);
      atomOpacity.value = withDelay(300, withTiming(0, { duration: 200 }));
      ringOpacity.value = withDelay(200, withTiming(0, { duration: 300 }));
    }, 2400);

    // Materialize gem — after all shards vanished (max shard: 450+7*25+150 = 775ms after 2400 = 3175ms)
    const t3 = setTimeout(() => onMaterialize(), 3200);

    // Flash — after bg fade begins
    const t4 = setTimeout(() => onFlash(), 3700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [active]);

  const atomStyle = useAnimatedStyle(() => ({
    opacity: atomOpacity.value,
    transform: [{ scale: atomScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }, { rotate: `${ringRotation.value}deg` }],
  }));

  const showAtom = active;
  const showRing = active;

  if (!active && !showFragments) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.center}>
        {showAtom && (
          <Animated.View style={[styles.atomWrap, atomStyle]}>
            <View style={[styles.atomDot, { backgroundColor: color }]} />
          </Animated.View>
        )}
        {showRing && (
          <Animated.View style={[styles.ringWrap, ringStyle]}>
            <View style={[styles.ring, { borderColor: glowColor }]} />
          </Animated.View>
        )}
        {showFragments &&
          Array.from({ length: FRAGMENT_COUNT }).map((_, i) => (
            <Shard
              key={i}
              index={i}
              color={color}
              active={showFragments}
              converging={converging}
            />
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
  atomWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atomDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  ringWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.2,
  },
  shard: {
    position: 'absolute',
    width: 5,
    height: 10,
    borderRadius: 2,
  },
});

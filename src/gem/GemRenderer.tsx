/**
 * GemRenderer V2 — main interactive gem component.
 * Composites all gem layers with gesture support and error boundary.
 */

import React, { useCallback } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { TierKey, TIER_PROFILES } from '../engine/tierProfiles';
import { GemShape as GemShapeType } from '../store/useGemStore';
import { spring } from '../motion';
import { hapticSelection } from '../utils/haptics';
import { GemErrorBoundary } from './GemErrorBoundary';
import { GemGlow } from './GemGlow';
import { GemAuraRings } from './GemAuraRings';
import { GemCrownBeams } from './GemCrownBeams';
import { GemShape } from './GemShape';
import { GemParticles } from './GemParticles';

const { width: SCREEN_W } = Dimensions.get('window');
const DEFAULT_GEM_SIZE = Math.min(SCREEN_W * 0.58, 250);

interface Props {
  tierKey: TierKey;
  shape?: GemShapeType;
  size?: number;
  onTap?: () => void;
  interactive?: boolean;
}

export const GemRenderer: React.FC<Props> = React.memo(
  ({ tierKey, shape = 'brilliant', size = DEFAULT_GEM_SIZE, onTap, interactive = true }) => {
    const tier = TIER_PROFILES[tierKey];
    const rotX = useSharedValue(0);
    const rotY = useSharedValue(0);
    const scale = useSharedValue(1);

    const panGesture = Gesture.Pan()
      .onUpdate((e) => {
        if (!interactive) return;
        rotY.value = e.translationX * 0.25;
        rotX.value = e.translationY * 0.25;
      })
      .onEnd(() => {
        rotX.value = withSpring(0, spring.gentle);
        rotY.value = withSpring(0, spring.gentle);
      });

    const tapGesture = Gesture.Tap().onEnd(() => {
      if (onTap) {
        runOnJS(hapticSelection)();
        runOnJS(onTap)();
      }
    });

    const pinchGesture = Gesture.Pinch()
      .onUpdate((e) => {
        if (!interactive) return;
        scale.value = Math.max(0.85, Math.min(1.4, e.scale));
      })
      .onEnd(() => {
        scale.value = withSpring(1, spring.gentle);
      });

    const composed = Gesture.Simultaneous(
      panGesture,
      Gesture.Exclusive(tapGesture, pinchGesture),
    );

    const containerStyle = useAnimatedStyle(() => ({
      transform: [
        { perspective: 800 },
        { rotateX: `${rotX.value}deg` },
        { rotateY: `${rotY.value}deg` },
        { scale: scale.value },
      ],
    }));

    return (
      <GemErrorBoundary>
        <GestureDetector gesture={composed}>
          <Animated.View
            style={[styles.container, { width: size, height: size }, containerStyle]}
          >
            <GemGlow tier={tier} size={size} />
            <GemAuraRings tier={tier} size={size} />
            <GemCrownBeams tier={tier} size={size} />
            <GemShape tier={tier} shape={shape} size={size} rotationX={0} rotationY={0} />
            <GemParticles tier={tier} size={size} />
          </Animated.View>
        </GestureDetector>
      </GemErrorBoundary>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/**
 * TierPreview — Lightweight gem preview for tier cards.
 * Uses 2D SVG GemRenderer for reliability in ScrollView.
 * Maps 15 shapes to the 3 supported SVG shapes.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GemRenderer } from '../gem/GemRenderer';
import { TierKey } from '../engine/tierProfiles';

/** Map any shape to one of the 3 SVG-supported shapes */
function toSvgShape(shape: string): 'brilliant' | 'emerald' | 'marquise' {
  switch (shape) {
    case 'emerald':
    case 'cushion':
    case 'hexagon':
    case 'cube':
      return 'emerald';
    case 'marquise':
    case 'pear':
    case 'oval':
    case 'kite':
      return 'marquise';
    default:
      return 'brilliant';
  }
}

interface Props {
  tierKey: TierKey;
  shape?: string;
  size?: number;
}

export const TierPreview: React.FC<Props> = React.memo(({
  tierKey,
  shape = 'brilliant',
  size = 56,
}) => (
  <View style={[styles.container, { width: size, height: size }]}>
    <GemRenderer
      tierKey={tierKey}
      shape={toSvgShape(shape)}
      size={size}
      interactive={false}
    />
  </View>
));

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

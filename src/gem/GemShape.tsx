/**
 * GemShape V2 — high-quality SVG gem with physically-inspired rendering.
 * Supports 3 shape variants, tier-driven materials, specular highlights,
 * internal refraction simulation, and parallax depth.
 */

import React, { useEffect } from 'react';
import Svg, {
  Defs,
  LinearGradient as SvgGrad,
  RadialGradient,
  Stop,
  Polygon,
  Path,
  Ellipse,
  G,
  Rect,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TierProfile } from '../engine/tierProfiles';
import { GemShape as GemShapeType } from '../store/useGemStore';
import { GEM_SHAPES, GemGeometry } from './shapes';
import { easing, duration } from '../motion';

/** Map any of 15 shapes to one of the 3 SVG-supported shapes */
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
  tier: TierProfile;
  shape: GemShapeType;
  size: number;
  rotationX: number;
  rotationY: number;
}

export const GemShape: React.FC<Props> = React.memo(
  ({ tier, shape, size, rotationX, rotationY }) => {
    const shimmer = useSharedValue(0);

    useEffect(() => {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3500 / tier.shimmerSpeed, easing: easing.gentle }),
          withTiming(0, { duration: 3500 / tier.shimmerSpeed, easing: easing.gentle }),
        ),
        -1,
        true,
      );
    }, [tier.key]);

    const floatAnim = useAnimatedStyle(() => ({
      transform: [{ translateY: shimmer.value * -5 }],
    }));

    const cx = size / 2;
    const cy = size / 2;
    const geo = GEM_SHAPES[toSvgShape(shape)];

    // Parallax offsets
    const px = rotationY * 3;
    const py = rotationX * 3;

    // Compute specular position from rotation
    const specCx = cx - size * 0.1 - px * 2;
    const specCy = cy - size * 0.18 - py * 2;

    // Internal refraction position
    const refCx = cx + size * 0.06 + px;
    const refCy = cy + size * 0.06 + py;

    const shadow = geo.shadow(cx, cy, size);
    const starPaths = geo.starFacets(cx, cy, size);

    // Subtle internal color shift based on tier
    const internalColor = tier.key === 'one'
      ? '#FFEEDD'
      : tier.secondaryColor;

    return (
      <Animated.View style={[{ width: size, height: size }, floatAnim]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            {/* Primary body gradient — warm, rich */}
            <SvgGrad id="bodyGrad" x1="0.2" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor={tier.primaryColor} stopOpacity="0.95" />
              <Stop offset="0.35" stopColor={tier.secondaryColor} stopOpacity="0.85" />
              <Stop offset="0.65" stopColor={tier.primaryColor} stopOpacity="0.9" />
              <Stop offset="1" stopColor={tier.secondaryColor} stopOpacity="0.95" />
            </SvgGrad>

            {/* Crown left — darker face for depth */}
            <SvgGrad id="crownLGrad" x1="0" y1="0" x2="1" y2="0.6">
              <Stop offset="0" stopColor={tier.primaryColor} stopOpacity="0.55" />
              <Stop offset="0.5" stopColor={tier.secondaryColor} stopOpacity="0.7" />
              <Stop offset="1" stopColor={tier.primaryColor} stopOpacity="0.6" />
            </SvgGrad>

            {/* Crown right — lighter face with highlight */}
            <SvgGrad id="crownRGrad" x1="1" y1="0" x2="0" y2="0.6">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.28" />
              <Stop offset="0.4" stopColor={tier.secondaryColor} stopOpacity="0.4" />
              <Stop offset="1" stopColor={tier.primaryColor} stopOpacity="0.35" />
            </SvgGrad>

            {/* Pavilion — deep, dark with color */}
            <SvgGrad id="pavGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={tier.primaryColor} stopOpacity="0.5" />
              <Stop offset="0.6" stopColor={internalColor} stopOpacity="0.25" />
              <Stop offset="1" stopColor={tier.primaryColor} stopOpacity="0.1" />
            </SvgGrad>

            {/* Table face — bright top surface */}
            <SvgGrad id="tableGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2 + tier.refractionStrength * 0.15} />
              <Stop offset="1" stopColor={tier.secondaryColor} stopOpacity="0.15" />
            </SvgGrad>

            {/* Specular highlight — soft white bloom */}
            <RadialGradient id="specular" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55 * tier.refractionStrength} />
              <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.2 * tier.refractionStrength} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>

            {/* Secondary specular — smaller, sharper */}
            <RadialGradient id="specular2" cx="0.5" cy="0.5" rx="0.5" ry="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7 * tier.refractionStrength} />
              <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.1 * tier.refractionStrength} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>

            {/* Internal refraction — colored depth */}
            <RadialGradient id="refraction" cx="0.5" cy="0.5" rx="0.5" ry="0.6">
              <Stop offset="0" stopColor={tier.glowColor} stopOpacity={0.35 * tier.refractionStrength} />
              <Stop offset="0.5" stopColor={tier.glowColor} stopOpacity={0.12 * tier.refractionStrength} />
              <Stop offset="1" stopColor={tier.glowColor} stopOpacity="0" />
            </RadialGradient>

            {/* Rim light — subtle edge highlight */}
            <SvgGrad id="rimGrad" x1="0" y1="0.5" x2="1" y2="0.5">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" />
              <Stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.08" />
            </SvgGrad>
          </Defs>

          <G transform={`translate(${px}, ${py})`}>
            {/* Ground shadow */}
            <Ellipse
              cx={shadow.cx}
              cy={shadow.cy}
              rx={shadow.rx}
              ry={shadow.ry}
              fill="rgba(0,0,0,0.1)"
            />

            {/* Main gem body */}
            <Polygon points={geo.outline(cx, cy, size)} fill="url(#bodyGrad)" />

            {/* Rim light overlay on body */}
            <Polygon points={geo.outline(cx, cy, size)} fill="url(#rimGrad)" />

            {/* Crown facets */}
            <Polygon points={geo.crownLeft(cx, cy, size)} fill="url(#crownLGrad)" />
            <Polygon points={geo.crownRight(cx, cy, size)} fill="url(#crownRGrad)" />

            {/* Pavilion facets */}
            <Polygon points={geo.pavLeft(cx, cy, size)} fill="url(#pavGrad)" opacity={0.6} />
            <Polygon points={geo.pavRight(cx, cy, size)} fill="url(#pavGrad)" opacity={0.4} />

            {/* Table face */}
            <Polygon points={geo.table(cx, cy, size)} fill="url(#tableGrad)" />

            {/* Facet lines based on cut complexity */}
            {tier.cutComplexity >= 2 &&
              starPaths.slice(0, 2).map((d: string, i: number) => (
                <Path
                  key={`f${i}`}
                  d={d}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={0.4}
                  strokeOpacity={0.15}
                />
              ))}

            {tier.cutComplexity >= 4 &&
              starPaths.slice(2).map((d: string, i: number) => (
                <Path
                  key={`f2${i}`}
                  d={d}
                  fill="none"
                  stroke={tier.primaryColor}
                  strokeWidth={0.3}
                  strokeOpacity={0.2}
                />
              ))}

            {tier.cutComplexity >= 5 && (
              <Polygon
                points={geo.table(cx, cy, size)}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={0.3}
                strokeOpacity={0.12}
              />
            )}

            {/* Primary specular highlight */}
            <Ellipse
              cx={specCx}
              cy={specCy}
              rx={size * 0.1}
              ry={size * 0.07}
              fill="url(#specular)"
            />

            {/* Secondary specular (sharp point) */}
            <Ellipse
              cx={specCx + size * 0.04}
              cy={specCy + size * 0.02}
              rx={size * 0.03}
              ry={size * 0.02}
              fill="url(#specular2)"
            />

            {/* Internal refraction glow */}
            <Ellipse
              cx={refCx}
              cy={refCy}
              rx={size * 0.14}
              ry={size * 0.17}
              fill="url(#refraction)"
            />
          </G>
        </Svg>
      </Animated.View>
    );
  },
);

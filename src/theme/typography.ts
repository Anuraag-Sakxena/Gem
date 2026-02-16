/**
 * Typography V2 — refined premium font system.
 * Clean hierarchy, consistent spacing, luxury feel.
 */

import { Platform, TextStyle } from 'react-native';
import { palette } from './tokens';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  /** 40pt — splash / hero titles */
  displayLarge: {
    fontFamily,
    fontSize: 40,
    fontWeight: '200' as const,
    letterSpacing: 2,
    lineHeight: 48,
  },
  /** 32pt — section hero */
  displayMedium: {
    fontFamily,
    fontSize: 32,
    fontWeight: '200' as const,
    letterSpacing: 1.2,
    lineHeight: 40,
  },
  /** 26pt — screen titles */
  displaySmall: {
    fontFamily,
    fontSize: 26,
    fontWeight: '300' as const,
    letterSpacing: 0.6,
    lineHeight: 34,
  },
  /** 22pt — page headings */
  headlineLarge: {
    fontFamily,
    fontSize: 22,
    fontWeight: '300' as const,
    letterSpacing: 0.4,
    lineHeight: 30,
  },
  /** 18pt — section headings */
  headlineMedium: {
    fontFamily,
    fontSize: 18,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
    lineHeight: 26,
  },
  /** 16pt — sub headings */
  headlineSmall: {
    fontFamily,
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  /** 15pt — card titles, bold body */
  titleLarge: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.15,
    lineHeight: 22,
  },
  /** 14pt — list titles */
  titleMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  /** 13pt — small titles */
  titleSmall: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  /** 15pt — primary body text */
  bodyLarge: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 22,
  },
  /** 14pt — secondary body text */
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  /** 12pt — small body text */
  bodySmall: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  /** 12pt — uppercase labels */
  labelLarge: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    lineHeight: 18,
  },
  /** 11pt — small uppercase labels */
  labelMedium: {
    fontFamily,
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    lineHeight: 16,
  },
  /** 10pt — tiny uppercase labels */
  labelSmall: {
    fontFamily,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
    lineHeight: 14,
  },
  /** 11pt — captions, metadata */
  caption: {
    fontFamily,
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  /** 13pt — monospace for serials/codes */
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 1,
    lineHeight: 18,
  },
} as const satisfies Record<string, TextStyle>;

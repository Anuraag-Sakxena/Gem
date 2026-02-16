/**
 * Validation utilities — format checks, assertions.
 */

import { ORIGIN_WORD } from '../engine/gemConfig';
import { TierKey, TIER_ORDER } from '../engine/tierProfiles';

/** Validate a gem verification code format: ORIGIN-XXXX */
export const isValidGemCode = (code: string): boolean => {
  const pattern = new RegExp(`^${ORIGIN_WORD}-[A-Za-z0-9]{2,4}$`);
  return pattern.test(code.trim());
};

/** Validate passcode format: 4–6 digits */
export const isValidPasscode = (code: string): boolean => {
  return /^\d{4,6}$/.test(code);
};

/** Check if a tier key is valid */
export const isValidTierKey = (key: string): key is TierKey => {
  return TIER_ORDER.includes(key as TierKey);
};

/** Dev-mode assertion for invalid states */
export const devAssert = (condition: boolean, message: string): void => {
  if (__DEV__ && !condition) {
    console.warn(`[Gem DevAssert] ${message}`);
  }
};

/**
 * Tests for tier profile data integrity.
 */

import { TIER_PROFILES, TIER_ORDER, getTierIndex, TierKey } from '../engine/tierProfiles';

describe('TIER_ORDER', () => {
  it('contains exactly 9 tiers', () => {
    expect(TIER_ORDER).toHaveLength(9);
  });

  it('starts with seed and ends with one', () => {
    expect(TIER_ORDER[0]).toBe('seed');
    expect(TIER_ORDER[TIER_ORDER.length - 1]).toBe('one');
  });

  it('matches the expected order', () => {
    expect(TIER_ORDER).toEqual([
      'seed', 'form', 'aura', 'lumen', 'crest',
      'verity', 'prime', 'apex', 'one',
    ]);
  });
});

describe('TIER_PROFILES', () => {
  it('has a profile for every tier in TIER_ORDER', () => {
    TIER_ORDER.forEach((key) => {
      expect(TIER_PROFILES[key]).toBeDefined();
      expect(TIER_PROFILES[key].key).toBe(key);
    });
  });

  it('every profile has required visual parameters', () => {
    TIER_ORDER.forEach((key) => {
      const tier = TIER_PROFILES[key];
      expect(tier.name).toBeTruthy();
      expect(tier.primaryColor).toMatch(/^#/);
      expect(tier.secondaryColor).toMatch(/^#/);
      expect(tier.glowColor).toMatch(/^#/);
      expect(tier.glowIntensity).toBeGreaterThanOrEqual(0);
      expect(tier.glowIntensity).toBeLessThanOrEqual(1);
      expect(tier.refractionStrength).toBeGreaterThanOrEqual(0);
      expect(tier.refractionStrength).toBeLessThanOrEqual(1);
    });
  });

  it('scarce tiers (Crest+) have finite supply', () => {
    const scarceTiers: TierKey[] = ['crest', 'verity', 'prime', 'apex', 'one'];
    scarceTiers.forEach((key) => {
      expect(TIER_PROFILES[key].supplyCount).not.toBeNull();
      expect(TIER_PROFILES[key].supplyCount).toBeGreaterThan(0);
    });
  });

  it('open tiers have unlimited supply', () => {
    const openTiers: TierKey[] = ['seed', 'form', 'aura', 'lumen'];
    openTiers.forEach((key) => {
      expect(TIER_PROFILES[key].supplyCount).toBeNull();
    });
  });

  it('One tier has exactly 1 supply', () => {
    expect(TIER_PROFILES.one.supplyCount).toBe(1);
  });

  it('glowIntensity increases with tier', () => {
    for (let i = 1; i < TIER_ORDER.length; i++) {
      const prev = TIER_PROFILES[TIER_ORDER[i - 1]!];
      const curr = TIER_PROFILES[TIER_ORDER[i]!];
      expect(curr.glowIntensity).toBeGreaterThanOrEqual(prev.glowIntensity);
    }
  });
});

describe('getTierIndex', () => {
  it('returns correct indices', () => {
    expect(getTierIndex('seed')).toBe(0);
    expect(getTierIndex('one')).toBe(8);
    expect(getTierIndex('crest')).toBe(4);
  });
});

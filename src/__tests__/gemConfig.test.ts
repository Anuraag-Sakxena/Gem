/**
 * Tests for gem configuration and serial generation.
 */

import { ORIGIN_WORD, generateSerial, maskSerial, DEFAULT_PASSCODE, PLAN_B_WAVES } from '../engine/gemConfig';

describe('ORIGIN_WORD', () => {
  it('is a non-empty string', () => {
    expect(ORIGIN_WORD).toBeTruthy();
    expect(typeof ORIGIN_WORD).toBe('string');
  });
});

describe('generateSerial', () => {
  it('starts with origin word', () => {
    const serial = generateSerial(0);
    expect(serial.startsWith(`${ORIGIN_WORD}-`)).toBe(true);
  });

  it('includes tier index in serial', () => {
    const serial = generateSerial(3);
    const code = serial.split('-')[1]!;
    expect(code.startsWith('3')).toBe(true);
  });

  it('generates different serials on subsequent calls', () => {
    const serials = new Set(Array.from({ length: 10 }, () => generateSerial(0)));
    // With random hex, very unlikely to get all the same
    expect(serials.size).toBeGreaterThan(1);
  });
});

describe('maskSerial', () => {
  it('masks alternate characters after dash', () => {
    const masked = maskSerial('RIN-07XY');
    // Even-index chars visible, odd-index chars masked with bullet
    expect(masked).toMatch(/^RIN-/);
    expect(masked).toContain('\u2022');
  });

  it('preserves short serials', () => {
    expect(maskSerial('AB')).toBe('AB');
    expect(maskSerial('')).toBe('');
  });

  it('handles serial without dash', () => {
    expect(maskSerial('ABCDEF')).toBe('ABCDEF');
  });
});

describe('DEFAULT_PASSCODE', () => {
  it('is a 4-digit string', () => {
    expect(DEFAULT_PASSCODE).toMatch(/^\d{4}$/);
  });
});

describe('PLAN_B_WAVES', () => {
  it('has at least 3 waves', () => {
    expect(PLAN_B_WAVES.length).toBeGreaterThanOrEqual(3);
  });

  it('has increasing wave numbers', () => {
    for (let i = 1; i < PLAN_B_WAVES.length; i++) {
      expect(PLAN_B_WAVES[i]!.wave).toBeGreaterThan(PLAN_B_WAVES[i - 1]!.wave);
    }
  });

  it('has decreasing supply', () => {
    for (let i = 1; i < PLAN_B_WAVES.length; i++) {
      expect(PLAN_B_WAVES[i]!.globalSupply).toBeLessThanOrEqual(PLAN_B_WAVES[i - 1]!.globalSupply);
    }
  });

  it('has increasing price multiplier', () => {
    for (let i = 1; i < PLAN_B_WAVES.length; i++) {
      expect(PLAN_B_WAVES[i]!.priceMultiplier).toBeGreaterThanOrEqual(PLAN_B_WAVES[i - 1]!.priceMultiplier);
    }
  });
});

/**
 * Tests for validation utilities.
 */

import { isValidGemCode, isValidPasscode, isValidTierKey } from '../utils/validation';

describe('isValidGemCode', () => {
  it('accepts valid 2-char codes', () => {
    expect(isValidGemCode('RIN-07')).toBe(true);
    expect(isValidGemCode('RIN-AB')).toBe(true);
  });

  it('accepts valid 3-char codes', () => {
    expect(isValidGemCode('RIN-07X')).toBe(true);
  });

  it('accepts valid 4-char codes', () => {
    expect(isValidGemCode('RIN-07XY')).toBe(true);
  });

  it('rejects codes with wrong prefix', () => {
    expect(isValidGemCode('GEM-07X')).toBe(false);
    expect(isValidGemCode('ABC-1234')).toBe(false);
  });

  it('rejects codes without dash', () => {
    expect(isValidGemCode('RIN07X')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidGemCode('')).toBe(false);
  });

  it('rejects codes that are too short', () => {
    expect(isValidGemCode('RIN-0')).toBe(false);
  });

  it('rejects codes that are too long', () => {
    expect(isValidGemCode('RIN-12345')).toBe(false);
  });

  it('trims whitespace', () => {
    expect(isValidGemCode('  RIN-07X  ')).toBe(true);
  });
});

describe('isValidPasscode', () => {
  it('accepts 4-digit codes', () => {
    expect(isValidPasscode('1234')).toBe(true);
    expect(isValidPasscode('0000')).toBe(true);
  });

  it('accepts 5-digit codes', () => {
    expect(isValidPasscode('12345')).toBe(true);
  });

  it('accepts 6-digit codes', () => {
    expect(isValidPasscode('123456')).toBe(true);
  });

  it('rejects codes shorter than 4 digits', () => {
    expect(isValidPasscode('123')).toBe(false);
    expect(isValidPasscode('')).toBe(false);
  });

  it('rejects codes longer than 6 digits', () => {
    expect(isValidPasscode('1234567')).toBe(false);
  });

  it('rejects non-numeric codes', () => {
    expect(isValidPasscode('abcd')).toBe(false);
    expect(isValidPasscode('12ab')).toBe(false);
  });
});

describe('isValidTierKey', () => {
  it('accepts all valid tier keys', () => {
    const validKeys = ['seed', 'form', 'aura', 'lumen', 'crest', 'verity', 'prime', 'apex', 'one'];
    validKeys.forEach((key) => {
      expect(isValidTierKey(key)).toBe(true);
    });
  });

  it('rejects invalid tier keys', () => {
    expect(isValidTierKey('diamond')).toBe(false);
    expect(isValidTierKey('gold')).toBe(false);
    expect(isValidTierKey('')).toBe(false);
    expect(isValidTierKey('SEED')).toBe(false);
  });
});

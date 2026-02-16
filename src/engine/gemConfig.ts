/**
 * Gem Configuration — origin word, serial patterns, and global config.
 * Change ORIGIN_WORD when final names are supplied.
 */

/** The origin word for gem naming. Replace with final name later. */
export const ORIGIN_WORD = 'RIN';

/** Generate a demo serial number */
export const generateSerial = (tierIndex: number): string => {
  const hex = Math.random().toString(16).substring(2, 4).toUpperCase();
  return `${ORIGIN_WORD}-${tierIndex}${hex[0]}${hex[1]}`;
};

/** Mask a serial for display */
export const maskSerial = (serial: string): string => {
  if (!serial || serial.length < 4) return serial;
  const parts = serial.split('-');
  if (parts.length < 2) return serial;
  const code = parts[1]!;
  const masked = code
    .split('')
    .map((c, i) => (i % 2 === 0 ? c : '\u2022'))
    .join('');
  return `${parts[0]}-${masked}`;
};

/** Default passcode for Vault mode (demo) */
export const DEFAULT_PASSCODE = '1234';

/** Plan B wave data */
export interface ScarcityWave {
  wave: number;
  tierName: string;
  globalSupply: number;
  priceMultiplier: number;
}

export const PLAN_B_WAVES: ScarcityWave[] = [
  { wave: 1, tierName: 'Apex', globalSupply: 10, priceMultiplier: 1.0 },
  { wave: 2, tierName: 'Apex', globalSupply: 9, priceMultiplier: 1.15 },
  { wave: 3, tierName: 'Apex', globalSupply: 8, priceMultiplier: 1.35 },
  { wave: 4, tierName: 'Apex', globalSupply: 7, priceMultiplier: 1.6 },
  { wave: 5, tierName: 'Apex', globalSupply: 6, priceMultiplier: 2.0 },
];

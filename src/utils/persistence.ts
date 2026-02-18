/**
 * Persistence — state persistence using MMKV.
 *
 * MMKV is synchronous and fast (no async overhead).
 * Falls back gracefully if MMKV is unavailable (web, test).
 *
 * Persists: tier, serial, gemShape, profile, onboarding flag.
 * All reads validate before returning (guard against corrupt storage).
 */

import type { GemShape } from '../store/useGemStore';
import { TIER_ORDER, type TierKey } from '../engine/tierProfiles';

// ─── Storage backend ────────────────────────────────────────────────────

let storage: {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
  getAllKeys(): string[];
} | null = null;

try {
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({ id: 'gem-preferences' });
} catch {
  const mem = new Map<string, string>();
  storage = {
    getString: (key: string) => mem.get(key),
    set: (key: string, value: string) => { mem.set(key, value); },
    delete: (key: string) => { mem.delete(key); },
    getAllKeys: () => [...mem.keys()],
  };
  if (__DEV__) {
    console.log('[Persistence] MMKV unavailable, using in-memory fallback');
  }
}

// ─── Keys ────────────────────────────────────────────────────────────────

const KEYS = {
  SHAPE: 'gem.shape',
  TIER: 'gem.tier',
  SERIAL: 'gem.serial',
  BACKGROUND_MODE: 'gem.backgroundMode',
  HAS_ONBOARDED: 'gem.hasOnboarded',
  PROFILE_USERNAME: 'gem.profile.username',
  PROFILE_IS_PUBLIC: 'gem.profile.isPublic',
  PROFILE_REGION: 'gem.profile.region',
  PROFILE_HOLDER_SINCE: 'gem.profile.holderSince',
} as const;

// ─── Valid shapes for validation ──────────────────────────────────────────

const VALID_SHAPES = new Set<string>([
  'brilliant', 'princess', 'emerald', 'cushion', 'pear',
  'marquise', 'oval', 'heart', 'trillion', 'hexagon',
  'prism', 'shard', 'kite', 'star', 'cube',
]);

// ─── Shape ──────────────────────────────────────────────────────────────

export function loadPersistedShape(): GemShape | null {
  const val = storage?.getString(KEYS.SHAPE);
  if (val && VALID_SHAPES.has(val)) return val as GemShape;
  return null;
}

export function persistShape(shape: GemShape): void {
  storage?.set(KEYS.SHAPE, shape);
}

// ─── Tier ────────────────────────────────────────────────────────────────

export function loadPersistedTier(): TierKey | null {
  const val = storage?.getString(KEYS.TIER);
  if (val && TIER_ORDER.includes(val as TierKey)) return val as TierKey;
  return null;
}

export function persistTier(tier: TierKey): void {
  storage?.set(KEYS.TIER, tier);
}

// ─── Serial ──────────────────────────────────────────────────────────────

export function loadPersistedSerial(): string | null {
  const val = storage?.getString(KEYS.SERIAL);
  if (val && val.length >= 4) return val;
  return null;
}

export function persistSerial(serial: string): void {
  storage?.set(KEYS.SERIAL, serial);
}

// ─── Background Mode ────────────────────────────────────────────────────

export type PersistedBackgroundMode = 'light' | 'dark';

export function loadPersistedBackgroundMode(): PersistedBackgroundMode | null {
  const val = storage?.getString(KEYS.BACKGROUND_MODE);
  if (val === 'light' || val === 'dark') return val;
  return null;
}

export function persistBackgroundMode(mode: PersistedBackgroundMode): void {
  storage?.set(KEYS.BACKGROUND_MODE, mode);
}

// ─── Onboarding ─────────────────────────────────────────────────────────

export function hasOnboarded(): boolean {
  return storage?.getString(KEYS.HAS_ONBOARDED) === 'true';
}

export function markOnboarded(): void {
  storage?.set(KEYS.HAS_ONBOARDED, 'true');
}

// ─── Profile ─────────────────────────────────────────────────────────────

export interface PersistedProfile {
  username: string;
  isPublic: boolean;
  region: string;
  holderSince: string;
}

export function loadPersistedProfile(): Partial<PersistedProfile> {
  const result: Partial<PersistedProfile> = {};
  const username = storage?.getString(KEYS.PROFILE_USERNAME);
  if (username && username.length > 0) result.username = username;
  const isPublic = storage?.getString(KEYS.PROFILE_IS_PUBLIC);
  if (isPublic !== undefined) result.isPublic = isPublic === 'true';
  const region = storage?.getString(KEYS.PROFILE_REGION);
  if (region && region.length > 0) result.region = region;
  const holderSince = storage?.getString(KEYS.PROFILE_HOLDER_SINCE);
  if (holderSince && holderSince.length > 0) result.holderSince = holderSince;
  return result;
}

export function persistProfile(profile: PersistedProfile): void {
  storage?.set(KEYS.PROFILE_USERNAME, profile.username);
  storage?.set(KEYS.PROFILE_IS_PUBLIC, String(profile.isPublic));
  storage?.set(KEYS.PROFILE_REGION, profile.region);
  storage?.set(KEYS.PROFILE_HOLDER_SINCE, profile.holderSince);
}

// ─── Clear All (for demo reset) ──────────────────────────────────────────

export function clearAllPersistedState(): void {
  const keys = storage?.getAllKeys() ?? [];
  for (const key of keys) {
    if (key.startsWith('gem.')) {
      storage?.delete(key);
    }
  }
}

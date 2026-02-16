/**
 * Persistence — state persistence using MMKV.
 *
 * MMKV is synchronous and fast (no async overhead).
 * Falls back gracefully if MMKV is unavailable (web, test).
 */

import { GemShape } from '../store/useGemStore';

// ─── Storage backend ────────────────────────────────────────────────────

let storage: {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
} | null = null;

try {
  // MMKV is available on native platforms
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({ id: 'gem-preferences' });
} catch {
  // Fallback: in-memory (web / test)
  const mem = new Map<string, string>();
  storage = {
    getString: (key: string) => mem.get(key),
    set: (key: string, value: string) => { mem.set(key, value); },
    delete: (key: string) => { mem.delete(key); },
  };
  if (__DEV__) {
    console.log('[Persistence] MMKV unavailable, using in-memory fallback');
  }
}

// ─── Keys ────────────────────────────────────────────────────────────────

const KEYS = {
  SHAPE: 'gem.shape',
  TIER: 'gem.tier',
  HAS_ONBOARDED: 'gem.hasOnboarded',
} as const;

// ─── Shape ──────────────────────────────────────────────────────────────

export function loadPersistedShape(): GemShape | null {
  const val = storage?.getString(KEYS.SHAPE);
  return val ? (val as GemShape) : null;
}

export function persistShape(shape: GemShape): void {
  storage?.set(KEYS.SHAPE, shape);
}

// ─── Onboarding ─────────────────────────────────────────────────────────

export function hasOnboarded(): boolean {
  return storage?.getString(KEYS.HAS_ONBOARDED) === 'true';
}

export function markOnboarded(): void {
  storage?.set(KEYS.HAS_ONBOARDED, 'true');
}

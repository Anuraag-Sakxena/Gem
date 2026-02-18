/**
 * Global state store V5 — Zustand with persistence, hydration, and toast fix.
 *
 * Slices:
 *   gem     — tier, serial, shape (persisted via MMKV)
 *   scene   — shared renderer control (visible, interactive, mode)
 *   ui      — menu, details, demo panel, toast (with toastTierKey fix)
 *   profile — username, vault, region (persisted via MMKV)
 *
 * Changes from V4:
 *   - Full persistence: tier, serial, shape, profile survive restart
 *   - Hydration: loads persisted state synchronously before first render
 *   - Toast race condition fix: toastTierKey tracks which tier triggered toast
 *   - resetDemo() action for clean state reset
 *   - getTheme() returns noir directly (no THEMES lookup)
 */

import { create } from 'zustand';
import { TierKey, TIER_PROFILES, TIER_ORDER } from '../engine/tierProfiles';
import { NOIR_THEME } from '../theme/themes';
import type { AppTheme } from '../theme/themes';
import { generateSerial } from '../engine/gemConfig';
import { devAssert } from '../utils/validation';
import {
  persistShape,
  persistTier,
  persistSerial,
  persistProfile,
  persistBackgroundMode,
  loadPersistedShape,
  loadPersistedTier,
  loadPersistedSerial,
  loadPersistedProfile,
  loadPersistedBackgroundMode,
  clearAllPersistedState,
} from '../utils/persistence';

// ─── Types ──────────────────────────────────────────────────────────────

export type GemShape =
  | 'brilliant'
  | 'princess'
  | 'emerald'
  | 'cushion'
  | 'pear'
  | 'marquise'
  | 'oval'
  | 'heart'
  | 'trillion'
  | 'hexagon'
  | 'prism'
  | 'shard'
  | 'kite'
  | 'star'
  | 'cube';

export const ALL_GEM_SHAPES: GemShape[] = [
  'brilliant', 'princess', 'emerald', 'cushion', 'pear',
  'marquise', 'oval', 'heart', 'trillion', 'hexagon',
  'prism', 'shard', 'kite', 'star', 'cube',
];

export type BackgroundMode = 'light' | 'dark';
export type SceneMode = 'home' | 'reveal' | 'gallery' | 'hidden';

// ─── Hydrate persisted state ─────────────────────────────────────────────

const persistedShape = loadPersistedShape();
const persistedTier = loadPersistedTier();
const persistedSerial = loadPersistedSerial();
const persistedProfile = loadPersistedProfile();
const persistedBgMode = loadPersistedBackgroundMode();

const initialTier: TierKey = persistedTier ?? 'seed';
const initialSerial: string = persistedSerial ?? generateSerial(TIER_ORDER.indexOf(initialTier));
const initialShape: GemShape = persistedShape ?? 'brilliant';
const initialBackgroundMode: BackgroundMode = persistedBgMode ?? 'dark';

// ─── Slice: Gem ─────────────────────────────────────────────────────────

interface GemSlice {
  readonly currentTier: TierKey;
  readonly previousTier: TierKey | null;
  readonly serial: string;
  readonly gemShape: GemShape;
  readonly backgroundMode: BackgroundMode;
  readonly hasRevealedOnce: boolean;
  setTier: (tier: TierKey) => void;
  setGemShape: (shape: GemShape) => void;
  setBackgroundMode: (mode: BackgroundMode) => void;
  markRevealed: () => void;
}

// ─── Slice: Scene (shared renderer control) ─────────────────────────────

interface SceneSlice {
  readonly sceneMode: SceneMode;
  readonly sceneVisible: boolean;
  readonly sceneInteractive: boolean;
  setSceneMode: (mode: SceneMode) => void;
  setSceneVisible: (visible: boolean) => void;
  setSceneInteractive: (interactive: boolean) => void;
}

// ─── Slice: UI ──────────────────────────────────────────────────────────

interface UISlice {
  readonly showUpgradeToast: boolean;
  readonly toastTierKey: TierKey | null;
  readonly showDemoPanel: boolean;
  readonly showMenu: boolean;
  readonly showGemDetails: boolean;
  dismissUpgradeToast: () => void;
  toggleDemoPanel: () => void;
  toggleMenu: () => void;
  toggleGemDetails: () => void;
}

// ─── Slice: Profile ─────────────────────────────────────────────────────

interface ProfileState {
  readonly username: string;
  readonly isPublic: boolean;
  readonly region: string;
  readonly holderSince: string;
}

interface ProfileSlice {
  readonly profile: ProfileState;
  readonly vaultEnabled: boolean;
  readonly vaultPasscode: string;
  readonly vaultLocked: boolean;
  updateProfile: (updates: Partial<ProfileState>) => void;
  togglePublicProfile: () => void;
  toggleVault: () => void;
  setVaultLocked: (locked: boolean) => void;
}

// ─── Theme accessor (noir only, no switching) ───────────────────────────

interface ThemeAccessor {
  getTheme: () => AppTheme;
}

// ─── App control ─────────────────────────────────────────────────────────

interface AppControl {
  resetDemo: () => void;
}

// ─── Combined Store ─────────────────────────────────────────────────────

type GemStore = GemSlice & SceneSlice & UISlice & ProfileSlice & ThemeAccessor & AppControl;

// ─── Noir theme constant (imported directly) ──────────────────────────────

export const useGemStore = create<GemStore>((set, get) => ({
  // ── Gem Slice ──
  currentTier: initialTier,
  previousTier: null,
  serial: initialSerial,
  gemShape: initialShape,
  backgroundMode: initialBackgroundMode,
  hasRevealedOnce: false,

  setTier: (tier: TierKey) => {
    devAssert(TIER_ORDER.includes(tier), `Invalid tier key: ${tier}`);
    const currentTier = get().currentTier;
    if (tier === currentTier) return;
    const index = TIER_ORDER.indexOf(tier);
    const serial = generateSerial(index);
    set({
      currentTier: tier,
      previousTier: currentTier,
      serial,
      showUpgradeToast: true,
      toastTierKey: tier,
    });
    persistTier(tier);
    persistSerial(serial);
  },

  setGemShape: (shape: GemShape) => {
    set({ gemShape: shape });
    persistShape(shape);
  },

  setBackgroundMode: (mode: BackgroundMode) => {
    set({ backgroundMode: mode });
    persistBackgroundMode(mode);
  },

  markRevealed: () => set({ hasRevealedOnce: true }),

  // ── Scene Slice ──
  sceneMode: 'home',
  sceneVisible: true,
  sceneInteractive: true,

  setSceneMode: (mode: SceneMode) => set({ sceneMode: mode }),
  setSceneVisible: (visible: boolean) => set({ sceneVisible: visible }),
  setSceneInteractive: (interactive: boolean) => set({ sceneInteractive: interactive }),

  // ── UI Slice (with toast race condition fix) ──
  showUpgradeToast: false,
  toastTierKey: null,
  showDemoPanel: false,
  showMenu: false,
  showGemDetails: false,

  dismissUpgradeToast: () => set({ showUpgradeToast: false, toastTierKey: null }),

  toggleDemoPanel: () =>
    set((state) => ({ showDemoPanel: !state.showDemoPanel })),

  toggleMenu: () =>
    set((state) => ({ showMenu: !state.showMenu })),

  toggleGemDetails: () =>
    set((state) => ({ showGemDetails: !state.showGemDetails })),

  // ── Profile Slice (persisted) ──
  profile: {
    username: persistedProfile.username ?? 'Anonymous Holder',
    isPublic: persistedProfile.isPublic ?? false,
    region: persistedProfile.region ?? 'Global',
    holderSince: persistedProfile.holderSince ?? 'Jan 2025',
  },
  vaultEnabled: false,
  vaultPasscode: '1234',
  vaultLocked: false,

  updateProfile: (updates: Partial<ProfileState>) =>
    set((state) => {
      const updated = { ...state.profile, ...updates };
      persistProfile(updated);
      return { profile: updated };
    }),

  togglePublicProfile: () =>
    set((state) => {
      const updated = { ...state.profile, isPublic: !state.profile.isPublic };
      persistProfile(updated);
      return { profile: updated };
    }),

  toggleVault: () =>
    set((state) => ({
      vaultEnabled: !state.vaultEnabled,
      vaultLocked: !state.vaultEnabled,
    })),

  setVaultLocked: (locked: boolean) => set({ vaultLocked: locked }),

  // ── Theme (noir only — no switching) ──
  getTheme: () => NOIR_THEME,

  // ── App Control ──
  resetDemo: () => {
    clearAllPersistedState();
    set({
      currentTier: 'seed',
      previousTier: null,
      serial: generateSerial(0),
      gemShape: 'brilliant',
      backgroundMode: 'dark',
      hasRevealedOnce: false,
      sceneMode: 'home',
      sceneVisible: true,
      sceneInteractive: true,
      showUpgradeToast: false,
      toastTierKey: null,
      showDemoPanel: false,
      showMenu: false,
      showGemDetails: false,
      profile: {
        username: 'Anonymous Holder',
        isPublic: false,
        region: 'Global',
        holderSince: 'Jan 2025',
      },
      vaultEnabled: false,
      vaultPasscode: '1234',
      vaultLocked: false,
    });
  },
}));

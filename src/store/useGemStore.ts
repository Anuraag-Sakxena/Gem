/**
 * Global state store V4 — Zustand with logical slices.
 *
 * Slices:
 *   gem     — tier, serial, shape
 *   scene   — shared renderer control (visible, interactive, mode)
 *   ui      — menu, details, demo panel, toast
 *   profile — username, vault, region
 *
 * The scene slice is the bridge between screens and the shared 3D renderer.
 * Screens set scene state; the renderer reads it.
 */

import { create } from 'zustand';
import { TierKey, TIER_PROFILES, TIER_ORDER } from '../engine/tierProfiles';
import { AppTheme, THEMES } from '../theme/themes';
import { generateSerial } from '../engine/gemConfig';
import { devAssert } from '../utils/validation';
import { persistShape } from '../utils/persistence';

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

export type SceneMode = 'home' | 'reveal' | 'gallery' | 'hidden';

// ─── Slice: Gem ─────────────────────────────────────────────────────────

interface GemSlice {
  readonly currentTier: TierKey;
  readonly previousTier: TierKey | null;
  readonly serial: string;
  readonly gemShape: GemShape;
  readonly hasRevealedOnce: boolean;
  setTier: (tier: TierKey) => void;
  setGemShape: (shape: GemShape) => void;
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

// ─── Combined Store ─────────────────────────────────────────────────────

type GemStore = GemSlice & SceneSlice & UISlice & ProfileSlice & ThemeAccessor;

export const useGemStore = create<GemStore>((set, get) => ({
  // ── Gem Slice ──
  currentTier: 'seed',
  previousTier: null,
  serial: generateSerial(0),
  gemShape: 'brilliant',
  hasRevealedOnce: false,

  setTier: (tier: TierKey) => {
    devAssert(TIER_ORDER.includes(tier), `Invalid tier key: ${tier}`);
    const currentTier = get().currentTier;
    if (tier === currentTier) return;
    const index = TIER_ORDER.indexOf(tier);
    set({
      currentTier: tier,
      previousTier: currentTier,
      serial: generateSerial(index),
      showUpgradeToast: true,
    });
  },

  setGemShape: (shape: GemShape) => {
    set({ gemShape: shape });
    persistShape(shape);
  },

  markRevealed: () => set({ hasRevealedOnce: true }),

  // ── Scene Slice ──
  sceneMode: 'home',
  sceneVisible: true,
  sceneInteractive: true,

  setSceneMode: (mode: SceneMode) => set({ sceneMode: mode }),
  setSceneVisible: (visible: boolean) => set({ sceneVisible: visible }),
  setSceneInteractive: (interactive: boolean) => set({ sceneInteractive: interactive }),

  // ── UI Slice ──
  showUpgradeToast: false,
  showDemoPanel: false,
  showMenu: false,
  showGemDetails: false,

  dismissUpgradeToast: () => set({ showUpgradeToast: false }),

  toggleDemoPanel: () =>
    set((state) => ({ showDemoPanel: !state.showDemoPanel })),

  toggleMenu: () =>
    set((state) => ({ showMenu: !state.showMenu })),

  toggleGemDetails: () =>
    set((state) => ({ showGemDetails: !state.showGemDetails })),

  // ── Profile Slice ──
  profile: {
    username: 'Anonymous Holder',
    isPublic: false,
    region: 'Global',
    holderSince: 'Jan 2025',
  },
  vaultEnabled: false,
  vaultPasscode: '1234',
  vaultLocked: false,

  updateProfile: (updates: Partial<ProfileState>) =>
    set((state) => ({
      profile: { ...state.profile, ...updates },
    })),

  togglePublicProfile: () =>
    set((state) => ({
      profile: { ...state.profile, isPublic: !state.profile.isPublic },
    })),

  toggleVault: () =>
    set((state) => ({
      vaultEnabled: !state.vaultEnabled,
      vaultLocked: !state.vaultEnabled,
    })),

  setVaultLocked: (locked: boolean) => set({ vaultLocked: locked }),

  // ── Theme (noir only — no switching) ──
  getTheme: () => THEMES.noir,
}));

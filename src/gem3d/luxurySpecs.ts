/**
 * Luxury Specifications per Tier V2 — Royal Vivid "Luxury Ladder".
 *
 * V1→V2: Dramatically boosted visibility and richness.
 *
 * Changes:
 *   - Engraving intensity raised across ALL tiers (2-3x more visible)
 *   - Emissive boost raised significantly (engravings now GLOW visibly)
 *   - Metal colors made richer: gold brighter, platinum shinier
 *   - Added RUBY RED as secondary accent for warmth on Prime/Apex
 *   - Pattern density raised so luxury detail is unmistakable
 *   - Normal depth increased for deeper, more physical engravings
 *   - Metalness boosted for more realistic metallic appearance
 *
 * Design philosophy: Royal, rich, elegant, UNMISTAKABLY premium.
 * The engravings should be the first thing a user notices on expensive tiers.
 * They must feel physically etched — like real Cartier/Chopard craftsmanship.
 */

import { TierKey } from '../engine/tierProfiles';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LuxurySpec {
  engravingLabel: string;
  inlayLabel: string;
  engravingIntensity: number;    // 0.0 = none, 1.0 = maximum visibility
  patternDensity: number;        // 0.0 = minimal lines, 1.0 = full ornate detail
  primaryInlayColor: string;     // hex — main metal (gold, platinum, rose gold)
  secondaryInlayColor: string;   // hex — gem accent (emerald, sapphire, ruby)
  inlayBlend: number;            // 0.0 = only primary metal, 1.0 = heavy secondary gem color
  normalDepth: number;           // 0.0–1.0 — depth of physically-etched grooves
  inlayMetalness: number;        // 0.0–1.0 — how metallic the inlay appears
  inlayRoughness: number;        // 0.0–1.0 — roughness (lower = more mirror-like)
  emissiveBoost: number;         // 0.0–1.0 — subtle glow in engraving channels
}

// ─── Precious Metal & Gem Colors ────────────────────────────────────────────
// Royal, rich, vibrant — luxury jewelry palette at maximum saturation.

const GOLD = '#FFD700';           // Bright 24K gold
const RICH_GOLD = '#FFB800';      // Deep warm gold
const ROSE_GOLD = '#F0A088';      // Warm rose gold (brighter)
const PLATINUM = '#D8D8E0';       // Bright platinum
const SILVER = '#C8C8D0';         // Polished silver
const EMERALD = '#00E050';        // Vivid emerald green
const SAPPHIRE = '#3080FF';       // Deep vivid sapphire blue
const RUBY = '#FF2040';           // Royal ruby red

// ─── Per-Tier Luxury Specs ──────────────────────────────────────────────────

export const LUXURY_SPECS: Record<TierKey, LuxurySpec> = {
  // ── Seed (Free): Clean, no engravings. ──
  seed: {
    engravingLabel: 'None',
    inlayLabel: 'None',
    engravingIntensity: 0.0,
    patternDensity: 0.0,
    primaryInlayColor: SILVER,
    secondaryInlayColor: SILVER,
    inlayBlend: 0.0,
    normalDepth: 0.0,
    inlayMetalness: 0.0,
    inlayRoughness: 0.3,
    emissiveBoost: 0.0,
  },

  // ── Form ($99): Subtle silver polish marks. ──
  form: {
    engravingLabel: 'Micro Polish',
    inlayLabel: 'None',
    engravingIntensity: 0.25,
    patternDensity: 0.15,
    primaryInlayColor: SILVER,
    secondaryInlayColor: SILVER,
    inlayBlend: 0.0,
    normalDepth: 0.25,
    inlayMetalness: 0.35,
    inlayRoughness: 0.06,
    emissiveBoost: 0.06,
  },

  // ── Aura ($199): Silver etch lines — geometric precision. ──
  aura: {
    engravingLabel: 'Silver Etch',
    inlayLabel: 'None',
    engravingIntensity: 0.40,
    patternDensity: 0.30,
    primaryInlayColor: SILVER,
    secondaryInlayColor: SILVER,
    inlayBlend: 0.0,
    normalDepth: 0.35,
    inlayMetalness: 0.45,
    inlayRoughness: 0.04,
    emissiveBoost: 0.10,
  },

  // ── Lumen ($299): Gold filigree — luxury begins here. ──
  lumen: {
    engravingLabel: 'Gold Filigree',
    inlayLabel: 'None',
    engravingIntensity: 0.55,
    patternDensity: 0.45,
    primaryInlayColor: GOLD,
    secondaryInlayColor: RICH_GOLD,
    inlayBlend: 0.0,
    normalDepth: 0.45,
    inlayMetalness: 0.65,
    inlayRoughness: 0.03,
    emissiveBoost: 0.16,
  },

  // ── Crest ($999): Gold filigree + emerald green channels. ──
  crest: {
    engravingLabel: 'Gold Filigree',
    inlayLabel: 'Emerald Channels',
    engravingIntensity: 0.68,
    patternDensity: 0.60,
    primaryInlayColor: GOLD,
    secondaryInlayColor: EMERALD,
    inlayBlend: 0.50,
    normalDepth: 0.50,
    inlayMetalness: 0.70,
    inlayRoughness: 0.025,
    emissiveBoost: 0.22,
  },

  // ── Verity ($2,000): Platinum wire + sapphire blue accents. ──
  verity: {
    engravingLabel: 'Platinum Wire',
    inlayLabel: 'Sapphire Accents',
    engravingIntensity: 0.78,
    patternDensity: 0.72,
    primaryInlayColor: PLATINUM,
    secondaryInlayColor: SAPPHIRE,
    inlayBlend: 0.55,
    normalDepth: 0.55,
    inlayMetalness: 0.75,
    inlayRoughness: 0.02,
    emissiveBoost: 0.28,
  },

  // ── Prime ($5,000): Rose gold ornate + ruby red channels. ──
  prime: {
    engravingLabel: 'Rose Gold Ornate',
    inlayLabel: 'Ruby Channels',
    engravingIntensity: 0.85,
    patternDensity: 0.82,
    primaryInlayColor: ROSE_GOLD,
    secondaryInlayColor: RUBY,
    inlayBlend: 0.55,
    normalDepth: 0.60,
    inlayMetalness: 0.78,
    inlayRoughness: 0.018,
    emissiveBoost: 0.32,
  },

  // ── Apex ($10,000): Royal crest — gold + emerald micro-inlays. ──
  apex: {
    engravingLabel: 'Royal Crest',
    inlayLabel: 'Multi-Gem Micro-Inlay',
    engravingIntensity: 0.92,
    patternDensity: 0.92,
    primaryInlayColor: RICH_GOLD,
    secondaryInlayColor: EMERALD,
    inlayBlend: 0.60,
    normalDepth: 0.70,
    inlayMetalness: 0.82,
    inlayRoughness: 0.015,
    emissiveBoost: 0.38,
  },

  // ── One ($50,000): Heirloom artifact — ultimate layered craftsmanship. ──
  one: {
    engravingLabel: 'Heirloom Artifact',
    inlayLabel: 'Gold & Sapphire Layered',
    engravingIntensity: 1.0,
    patternDensity: 1.0,
    primaryInlayColor: GOLD,
    secondaryInlayColor: SAPPHIRE,
    inlayBlend: 0.65,
    normalDepth: 0.80,
    inlayMetalness: 0.85,
    inlayRoughness: 0.012,
    emissiveBoost: 0.45,
  },
};

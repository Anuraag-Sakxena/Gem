/**
 * Luxury Specifications per Tier — Visual "Luxury Ladder".
 *
 * Maps each tier/price point to its engraving and inlay configuration.
 * The higher the price, the more royal, rich, elegant, and precious the gem looks.
 *
 * Design philosophy (royal, rich, elegant, very precious — NOT cartoonish):
 *   - Seed  (Free):    Clean starter gem. No engravings. The beginning.
 *   - Form  ($99):     Barely visible micro-polish marks. Understated quality.
 *   - Aura  ($199):    Faint silver etch lines. Geometric precision.
 *   - Lumen ($299):    Gold filigree engraving. First visible metal work.
 *   - Crest ($999):    Gold filigree + emerald green inlay channels.
 *   - Verity ($2,000): Platinum wire pattern + sapphire blue accents.
 *   - Prime ($5,000):  Rose gold ornate pattern + emerald channels.
 *   - Apex  ($10,000): Royal crest — gold + platinum multi-metal + gem micro-flecks.
 *   - One   ($50,000): Heirloom artifact — ultimate craftsmanship, layered inlays.
 *
 * Key: Each tier must feel meaningfully different and obviously upgraded.
 * The engravings must look physically believable — not like a flat sticker.
 * Royal, rich, elegant, very precious — but also modern, minimal, Apple-level.
 *
 * These specs control the procedural shader-based engraving system in
 * engravingShader.ts, which modulates roughness, metalness, color, emissive,
 * and normal perturbation on the existing MeshPhysicalMaterial.
 */

import { TierKey } from '../engine/tierProfiles';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LuxurySpec {
  // Display metadata (shown in Gem Details sheet)
  engravingLabel: string;
  inlayLabel: string;

  // Shader parameters — drive the procedural engraving system
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
// Chosen to be royal, rich, elegant, tasteful — luxury jewelry palette.

const GOLD = '#FFD700';
const ROSE_GOLD = '#E8A090';
const PLATINUM = '#D0D0D8';
const SILVER = '#C0C0C8';
const EMERALD = '#00C853';
const SAPPHIRE = '#2979FF';

// ─── Per-Tier Luxury Specs ──────────────────────────────────────────────────

export const LUXURY_SPECS: Record<TierKey, LuxurySpec> = {
  // ── Seed (Free): Clean, no engravings. The beginning. ──
  // Pure crystal. No engraving, no inlay. The gem speaks for itself.
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

  // ── Form ($99): Micro polish marks. Barely visible quality indicator. ──
  // Just enough to suggest craftsmanship. Like the factory polish marks on
  // a $100 watch — you know it's been finished, but nothing flashy.
  form: {
    engravingLabel: 'Micro Polish',
    inlayLabel: 'None',
    engravingIntensity: 0.15,
    patternDensity: 0.1,
    primaryInlayColor: SILVER,
    secondaryInlayColor: SILVER,
    inlayBlend: 0.0,
    normalDepth: 0.15,
    inlayMetalness: 0.2,
    inlayRoughness: 0.08,
    emissiveBoost: 0.02,
  },

  // ── Aura ($199): Faint silver etch lines. Geometric precision. ──
  // Visible on close inspection. Thin geometric lines that catch the light.
  // Like the subtle guilloché on a Cartier dial.
  aura: {
    engravingLabel: 'Silver Etch',
    inlayLabel: 'None',
    engravingIntensity: 0.25,
    patternDensity: 0.2,
    primaryInlayColor: SILVER,
    secondaryInlayColor: SILVER,
    inlayBlend: 0.0,
    normalDepth: 0.25,
    inlayMetalness: 0.3,
    inlayRoughness: 0.06,
    emissiveBoost: 0.04,
  },

  // ── Lumen ($299): Gold filigree. First visible metal engraving. ──
  // This is where luxury begins. Thin gold lines in a geometric pattern
  // are clearly visible as the gem rotates. Like gold wire in a Bvlgari piece.
  lumen: {
    engravingLabel: 'Gold Filigree',
    inlayLabel: 'None',
    engravingIntensity: 0.40,
    patternDensity: 0.35,
    primaryInlayColor: GOLD,
    secondaryInlayColor: GOLD,
    inlayBlend: 0.0,
    normalDepth: 0.35,
    inlayMetalness: 0.5,
    inlayRoughness: 0.04,
    emissiveBoost: 0.08,
  },

  // ── Crest ($999): Gold filigree + emerald green inlay channels. ──
  // The first tier with emerald green accents. Gold channels with green
  // gem inlays at accent points. Limited edition feel.
  crest: {
    engravingLabel: 'Gold Filigree',
    inlayLabel: 'Emerald Channels',
    engravingIntensity: 0.55,
    patternDensity: 0.5,
    primaryInlayColor: GOLD,
    secondaryInlayColor: EMERALD,
    inlayBlend: 0.4,
    normalDepth: 0.4,
    inlayMetalness: 0.55,
    inlayRoughness: 0.035,
    emissiveBoost: 0.12,
  },

  // ── Verity ($2,000): Platinum wire + sapphire blue accents. ──
  // Cool-toned luxury. Platinum wire pattern with sapphire micro-inlays.
  // Like a Chopard Happy Diamonds piece — refined, cool, precious.
  verity: {
    engravingLabel: 'Platinum Wire',
    inlayLabel: 'Sapphire Accents',
    engravingIntensity: 0.65,
    patternDensity: 0.6,
    primaryInlayColor: PLATINUM,
    secondaryInlayColor: SAPPHIRE,
    inlayBlend: 0.45,
    normalDepth: 0.45,
    inlayMetalness: 0.6,
    inlayRoughness: 0.03,
    emissiveBoost: 0.15,
  },

  // ── Prime ($5,000): Rose gold ornate + emerald channels. ──
  // Multi-metal, rich, warm. Rose gold with emerald green channels.
  // Like a Van Cleef Alhambra — warm metals, green gemstone accents.
  prime: {
    engravingLabel: 'Rose Gold Ornate',
    inlayLabel: 'Emerald Channels',
    engravingIntensity: 0.75,
    patternDensity: 0.72,
    primaryInlayColor: ROSE_GOLD,
    secondaryInlayColor: EMERALD,
    inlayBlend: 0.5,
    normalDepth: 0.5,
    inlayMetalness: 0.65,
    inlayRoughness: 0.025,
    emissiveBoost: 0.18,
  },

  // ── Apex ($10,000): Royal crest — gold + multi-gem micro-inlays. ──
  // Crown-like presence. Gold with emerald micro-flecks.
  // Dramatic engine-turned grid becomes visible. Royal, commanding.
  apex: {
    engravingLabel: 'Royal Crest',
    inlayLabel: 'Multi-Gem Micro-Inlay',
    engravingIntensity: 0.85,
    patternDensity: 0.85,
    primaryInlayColor: GOLD,
    secondaryInlayColor: EMERALD,
    inlayBlend: 0.55,
    normalDepth: 0.6,
    inlayMetalness: 0.7,
    inlayRoughness: 0.02,
    emissiveBoost: 0.22,
  },

  // ── One ($50,000): Heirloom artifact. Ultimate craftsmanship. ──
  // The singular gem. Maximum engraving density, layered gold + sapphire.
  // Every pattern layer active, finest detail, strongest metallic presence.
  // Subtle animated shimmer on the engravings makes it feel alive.
  // This is a $50,000 heirloom — it must be unmistakably THE ONE.
  one: {
    engravingLabel: 'Heirloom Artifact',
    inlayLabel: 'Gold & Sapphire Layered',
    engravingIntensity: 0.95,
    patternDensity: 1.0,
    primaryInlayColor: GOLD,
    secondaryInlayColor: SAPPHIRE,
    inlayBlend: 0.6,
    normalDepth: 0.7,
    inlayMetalness: 0.75,
    inlayRoughness: 0.015,
    emissiveBoost: 0.28,
  },
};

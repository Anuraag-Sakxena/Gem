/**
 * Engraving Shader System — Procedural luxury engravings on gem surfaces.
 *
 * Injects into MeshPhysicalMaterial via onBeforeCompile to add physically-
 * believable engravings: gold filigree, emerald inlays, platinum accents,
 * rose gold lines, sapphire micro-inlays — all computed procedurally in
 * the fragment shader from object-space position.
 *
 * HOW IT WORKS:
 *   1. Vertex shader passes object-space position to fragment shader
 *   2. Fragment shader generates procedural SDF patterns:
 *      - Layer 1: Girdle band (metallic ring around the gem equator)
 *      - Layer 2: Radial crown spokes (lines radiating from table)
 *      - Layer 3: Concentric rings (circular step-bands)
 *      - Layer 4: Engine-turned grid (fine cross-hatch at 45°)
 *      - Layer 5: Micro-inlay dots (bright spots at grid intersections)
 *   3. Pattern modulates material properties:
 *      - roughness: polished metal in engraving channels
 *      - metalness: metallic appearance of gold/platinum inlay
 *      - diffuseColor: inlay color (gold, emerald, sapphire)
 *      - emissive: subtle glow so engravings are visible through glass
 *      - normal: perturbation for physically-etched groove depth
 *
 * WHY OBJECT-SPACE (not UV-space):
 *   Gem geometries are procedural faceted shapes with NO UV coordinates.
 *   Using object-space position means patterns are:
 *   - Shape-independent (works across all 15 gem shapes)
 *   - Stable during rotation (tied to geometry, not screen)
 *   - Scale-consistent (tuned for ~1 unit gem radius)
 *
 * WHY onBeforeCompile (not custom ShaderMaterial):
 *   Preserves ALL MeshPhysicalMaterial features — transmission, IOR,
 *   clearcoat, Beer-Lambert absorption, ACES tone mapping, env map
 *   reflections. The engravings ADD to the existing PBR pipeline.
 *
 * PERFORMANCE:
 *   ~12 sin + ~10 smoothstep + 2 dFdx/dFdy per fragment.
 *   Well within budget for modern mobile GPUs at 60fps.
 *   For Seed tier (intensity=0), the entire block is skipped via early-out.
 */

import * as THREE from 'three';
import type { LuxurySpec } from './luxurySpecs';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EngravingUniforms {
  uEngravingIntensity: { value: number };
  uPatternDensity: { value: number };
  uInlayColor1: { value: THREE.Color };
  uInlayColor2: { value: THREE.Color };
  uInlayBlend: { value: number };
  uNormalDepth: { value: number };
  uInlayMetalness: { value: number };
  uInlayRoughness: { value: number };
  uEmissiveBoost: { value: number };
  uEngravingTime: { value: number };
}

/** Target values for smooth lerping between tiers */
export interface EngravingTargets {
  intensity: number;
  density: number;
  color1: THREE.Color;
  color2: THREE.Color;
  blend: number;
  normalDepth: number;
  metalness: number;
  roughness: number;
  emissive: number;
}

// ─── GLSL Injection Strings ─────────────────────────────────────────────────

/** Vertex shader: declare varying for object-space position */
const VERTEX_DECLARATIONS = /* glsl */ `
varying vec3 vEngravingPos;
`;

/** Vertex shader: capture object-space position before model transform */
const VERTEX_POSITION = /* glsl */ `
vEngravingPos = position;
`;

/** Fragment shader: declare varyings and uniforms */
const FRAGMENT_DECLARATIONS = /* glsl */ `
varying vec3 vEngravingPos;
uniform float uEngravingIntensity;
uniform float uPatternDensity;
uniform vec3 uInlayColor1;
uniform vec3 uInlayColor2;
uniform float uInlayBlend;
uniform float uNormalDepth;
uniform float uInlayMetalness;
uniform float uInlayRoughness;
uniform float uEmissiveBoost;
uniform float uEngravingTime;
`;

/**
 * Fragment shader: procedural engraving pattern computation + material modulation.
 *
 * Injected AFTER #include <emissivemap_fragment> (before lighting calculations).
 * At this point we have access to: diffuseColor, roughnessFactor, metalnessFactor,
 * normal, totalEmissiveRadiance — all of which feed into the PBR lighting.
 *
 * Pattern layers (from simplest to most ornate):
 *   1. Girdle Band — metallic ring at y≈0 with angular filigree modulation
 *   2. Crown Spokes — thin radial lines from table (y>0)
 *   3. Concentric Rings — circular bands at varying radii
 *   4. Engine-Turn Grid — fine 45° cross-hatch (luxury watch technique)
 *   5. Micro-Inlay Dots — bright accent dots at grid intersections
 *
 * Higher patternDensity activates more layers → more ornate appearance.
 * Higher engravingIntensity makes all layers more visible.
 */
const FRAGMENT_LOGIC = /* glsl */ `
if (uEngravingIntensity > 0.01) {
  vec3 ep = vEngravingPos;
  float epY = ep.y;
  float rXZ = length(ep.xz);
  float theta = atan(ep.x, ep.z);

  // ═══ Layer 1: Girdle Band ═══
  // A thin metallic band around the gem equator (y ≈ 0).
  // Real jewelers engrave the girdle — it's the signature of fine craftsmanship.
  // Angular filigree modulation gives it a detailed, not-plain-band look.
  float girdleProximity = 1.0 - smoothstep(0.0, 0.06, abs(epY));
  float girdleFiligree = sin(theta * 32.0) * 0.5 + 0.5;
  float girdleBand = girdleProximity * mix(0.4, 1.0, girdleFiligree);

  // ═══ Layer 2: Radial Crown Spokes ═══
  // Thin lines radiating from the table center — like a sun motif or
  // the hour markers on a Patek Philippe watch face.
  // Visible when viewing the gem from above or at an angle.
  float spokes = abs(sin(theta * 8.0));
  spokes = smoothstep(0.93, 1.0, spokes);
  float crownMask = smoothstep(0.05, 0.35, epY);
  float pavilionMask = smoothstep(-0.05, -0.4, epY);
  spokes *= max(crownMask, pavilionMask * 0.4);

  // ═══ Layer 3: Concentric Rings ═══
  // Rings around the Y axis. Like growth rings or step-cut bands.
  // Adds structural complexity to the engraving pattern.
  float rings = abs(sin(rXZ * 18.0));
  rings = smoothstep(0.92, 0.99, rings);
  rings *= 1.0 - girdleProximity * 1.3;

  // ═══ Layer 4: Engine-Turned Grid (high-tier detail) ═══
  // Fine cross-hatch at 45° angles — named after the guilloché technique
  // used on luxury watches (Breguet, Vacheron Constantin) and fine pens.
  // Only becomes visible at higher patternDensity values.
  float diagFreq = 25.0;
  float gridA = abs(sin((ep.x + ep.z) * diagFreq));
  float gridB = abs(sin((ep.x - ep.z) * diagFreq));
  float fineGrid = smoothstep(0.96, 1.0, max(gridA, gridB));
  fineGrid *= smoothstep(0.3, 0.6, uPatternDensity);

  // ═══ Layer 5: Micro-Inlay Dots (highest tiers) ═══
  // Bright dots at grid intersections — simulates micro-set gemstones
  // (emeralds, sapphires) set into the engraving channels.
  // Like the diamond-set bezels on a Chopard Happy Diamonds piece.
  float dots = smoothstep(0.97, 1.0, gridA) * smoothstep(0.97, 1.0, gridB);
  dots *= smoothstep(0.5, 0.8, uPatternDensity);

  // ═══ Combine all layers ═══
  float engravingPattern = max(
    girdleBand * 0.7,
    max(spokes * 0.6,
    max(rings * 0.5,
        fineGrid * 0.4))
  );
  engravingPattern += dots * 0.3;
  engravingPattern = clamp(engravingPattern * uEngravingIntensity, 0.0, 1.0);

  // ═══ Inlay Color ═══
  // Primary metal for main lines (gold, platinum, rose gold).
  // Secondary gem color at accent points (emerald, sapphire).
  // The blend creates a two-material look: metal channels with gem inlays.
  float secondaryMix = uInlayBlend * (dots * 3.0 + girdleFiligree * 0.2);
  secondaryMix = clamp(secondaryMix, 0.0, 1.0);
  vec3 engravingColor = mix(uInlayColor1, uInlayColor2, secondaryMix);

  // ═══ Apply to Material ═══

  // Mix engraving color into the gem's diffuse — makes gold/green visible
  diffuseColor.rgb = mix(diffuseColor.rgb, engravingColor, engravingPattern * 0.65);

  // Polished metal in engraving channels — low roughness catches studio reflections
  roughnessFactor = mix(roughnessFactor, uInlayRoughness, engravingPattern);

  // Metallic appearance — gold and platinum are metals, not dielectrics
  metalnessFactor = mix(metalnessFactor, uInlayMetalness, engravingPattern);

  // Subtle emissive glow — makes engravings visible through transparent gem body.
  // Without this, engravings on the back face would be invisible through glass.
  // Very subtle shimmer animation (8% at max intensity) — makes the gem feel alive.
  float shimmer = 1.0 + uEngravingIntensity * 0.08 * sin(uEngravingTime * 1.2);
  totalEmissiveRadiance += engravingColor * engravingPattern * uEmissiveBoost * shimmer;

  // Normal perturbation for physically-etched groove depth.
  // dFdx/dFdy gives screen-space gradient of the pattern = bump mapping.
  // Makes the engravings look CUT INTO the surface, not painted on.
  float bumpDx = dFdx(engravingPattern);
  float bumpDy = dFdy(engravingPattern);
  normal = normalize(normal + vec3(bumpDx, bumpDy, 0.0) * uNormalDepth * 6.0);
}
`;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Apply the engraving shader to a MeshPhysicalMaterial.
 *
 * MUST be called BEFORE the first render (before the shader is compiled).
 * Call this in onContextCreate right after creating the material.
 *
 * Returns uniform refs so the animation loop can update values (for smooth
 * tier transitions and time-based shimmer animation).
 */
export function applyEngravingShader(
  material: THREE.MeshPhysicalMaterial,
  spec: LuxurySpec,
): EngravingUniforms {
  const uniforms: EngravingUniforms = {
    uEngravingIntensity: { value: spec.engravingIntensity },
    uPatternDensity: { value: spec.patternDensity },
    uInlayColor1: { value: new THREE.Color(spec.primaryInlayColor) },
    uInlayColor2: { value: new THREE.Color(spec.secondaryInlayColor) },
    uInlayBlend: { value: spec.inlayBlend },
    uNormalDepth: { value: spec.normalDepth },
    uInlayMetalness: { value: spec.inlayMetalness },
    uInlayRoughness: { value: spec.inlayRoughness },
    uEmissiveBoost: { value: spec.emissiveBoost },
    uEngravingTime: { value: 0 },
  };

  material.onBeforeCompile = (shader) => {
    // Merge engraving uniforms into the shader's uniform map
    Object.assign(shader.uniforms, uniforms);

    // ── Vertex Shader: pass object-space position to fragment ──
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\n' + VERTEX_DECLARATIONS,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n' + VERTEX_POSITION,
    );

    // ── Fragment Shader: declare uniforms/varyings ──
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\n' + FRAGMENT_DECLARATIONS,
    );

    // ── Fragment Shader: inject engraving pattern logic ──
    // Injected after emissivemap_fragment (before PBR lighting calculations).
    // At this point: diffuseColor, roughnessFactor, metalnessFactor, normal,
    // and totalEmissiveRadiance are all available and not yet consumed.
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n' + FRAGMENT_LOGIC,
    );
  };

  return uniforms;
}

/**
 * Create interpolation targets from a luxury spec.
 * Used for smooth tier transitions — the animation loop lerps
 * current uniform values toward these targets.
 */
export function createEngravingTargets(spec: LuxurySpec): EngravingTargets {
  return {
    intensity: spec.engravingIntensity,
    density: spec.patternDensity,
    color1: new THREE.Color(spec.primaryInlayColor),
    color2: new THREE.Color(spec.secondaryInlayColor),
    blend: spec.inlayBlend,
    normalDepth: spec.normalDepth,
    metalness: spec.inlayMetalness,
    roughness: spec.inlayRoughness,
    emissive: spec.emissiveBoost,
  };
}

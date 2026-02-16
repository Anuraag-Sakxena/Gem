# Gem — Luxury Status Gem MVP

A premium React Native (Expo) demo app showcasing interactive 3D collectible gems with tier-based materials, cinematic reveal animations, and Apple-grade UI polish.

## Setup

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS Simulator / `a` for Android Emulator.

## Features

### Gem Chamber (Home)
- **True 3D gem** rendered via Three.js with MeshPhysicalMaterial
- Drag-to-rotate with inertia physics
- Gentle float animation
- Tap the gem to see tier info, serial, and supply
- Action buttons: Elevate, Themes, Reveal, Profile, Verify, Plan B

### Switching Gem Tier
Navigate to **Elevate** (Tier Ladder) and tap **Demo Unlock** on any tier.
Each tier card shows a **3D gem preview** with the tier's unique material.

| Tier | Price | Supply |
|------|-------|--------|
| Seed | Free | Unlimited |
| Form | $99 | Unlimited |
| Aura | $199 | Unlimited |
| Lumen | $299 | Unlimited |
| Crest | $999 | 100 worldwide |
| Verity | $2,000 | 50 worldwide |
| Prime | $5,000 | 25 worldwide |
| Apex | $10,000 | 10 worldwide |
| One | $50,000 | 1 worldwide |

### Reveal Mode
1. Navigate to **Reveal**
2. Tap **Begin Reveal**
3. Watch the cinematic sequence: atom → energy ring → fragment assembly → **3D gem materializes**
4. End-state: full 3D gem with noir lighting, interactive drag rotation
5. Tap **Replay Reveal** to watch again

### Themes
Five environments: Ivory Gallery, Velvet Hall, Crystal Vault, Noir Chamber, Aurora Room.

### Public Profile
Toggle public/private to show or hide your gem profile card.

### Verification
Enter a gem code (`RIN-XXXX`) to verify authenticity (demo).

### Plan B
Scarcity Compression info with wave timeline.

---

## 3D Gem System

### Architecture

```
src/gem3d/
  geometries.ts      — Procedural gem geometries (brilliant, emerald, marquise)
  materials.ts       — Per-tier MeshPhysicalMaterial configs
  lighting.ts        — Lighting presets (ivory gallery, noir reveal, preview)
  GemMesh.tsx        — Three.js mesh with auto-rotate + float animation
  GemScene.tsx       — Complete scene: lights + gem + glow + shadow
  GemRenderer3D.tsx  — Top-level component with gesture handling + Canvas
  TierPreview.tsx    — Lightweight preview for tier cards
  index.ts           — Barrel exports
```

### GemRenderer3D Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tierKey` | `TierKey` | required | Tier determines material |
| `shape` | `'brilliant' \| 'emerald' \| 'marquise'` | `'brilliant'` | Gem cut |
| `size` | `number` | `220` | Canvas size (px) |
| `interactive` | `boolean` | `true` | Drag-to-rotate |
| `theme` | `'ivory' \| 'noir' \| 'preview'` | `'ivory'` | Lighting preset |
| `onTap` | `() => void` | — | Tap handler |
| `gemScale` | `number` | `1` | Mesh scale |

### Replacing Gem Models

Current implementation uses **procedural geometries** (no external files). To use custom GLB models:

1. Place `.glb` files in `src/assets/models/`
2. In `GemMesh.tsx`, replace `createGemGeometry()` with a loaded GLTF mesh
3. Use `expo-asset` and `@react-three/drei`'s `useGLTF` for loading

### Tier Material Presets

Material configs: `src/gem3d/materials.ts`

Each tier defines: color, emissive, metalness, roughness, clearcoat, opacity, glow. Tiers progress from subtle crystal (Seed) to dramatic prismatic (One).

### Lighting Presets

Defined in `src/gem3d/lighting.ts`:

- **Ivory** — Warm gallery/museum. Home screen.
- **Noir** — Dramatic dark. Reveal screen.
- **Preview** — Lightweight. Tier card thumbnails.

---

## Project Structure

```
src/
  gem3d/          — 3D gem rendering (Three.js + R3F)
  gem/            — 2D gem rendering (SVG, kept as fallback)
  screens/        — All 8 app screens
  components/ui/  — Shared UI (buttons, panels, toast, etc.)
  engine/         — Tier profiles, gem config
  store/          — Zustand state
  theme/          — Design tokens, typography, themes
  motion/         — Animation presets
  utils/          — Validation, haptics
  navigation/     — React Navigation stack
```

## Testing

```bash
npm test
```

39 unit tests covering validation, tier profiles, and gem config.

## Configuration

- **Origin Word**: `ORIGIN_WORD` in `src/engine/gemConfig.ts` (currently "RIN")
- **Tier visuals**: `src/engine/tierProfiles.ts`
- **3D materials**: `src/gem3d/materials.ts`
- **Lighting**: `src/gem3d/lighting.ts`
- **Themes**: `src/theme/themes.ts`
- **Default passcode**: `1234` in `src/engine/gemConfig.ts`

## Tech Stack

- React Native 0.81 + Expo SDK 54
- TypeScript (strict)
- Three.js + @react-three/fiber (3D rendering)
- react-native-reanimated v4 (60fps animations)
- react-native-gesture-handler (touch gestures)
- Zustand (state management)
- expo-gl (WebGL context)
- react-native-svg (2D gem fallback)

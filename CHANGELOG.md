# DINO MODE — Gem Visual Overhaul Changelog

## V8.0 — Nuclear Reactor Crystal, Final Polish

### Task 1: True 360° Rotation with Soft Pitch Clamp
**Files:** `GemRenderer3D.tsx` (V5), `GemView.tsx` (V8)

- Soft pitch clamp at ±45° with spring-like resistance (never hard-locks)
- Beyond 45°: quadratic resistance curve, 0.02 minimum factor at hard limit (~82°)
- Pushing further past limit while already past: 0.3× additional reduction
- Spring pull-back in animation loop (`PITCH_SPRING_STRENGTH = 0.015`) gently restores neutral
- Delayed auto-rotate resume: 800ms after user lifts finger
- `RotationState` extended with `autoRotatePaused` and `lastInteractionTime` fields
- Velocity smoothing via exponential moving average (0.3 smoothing factor)
- Velocity magnitude capped at 0.04 to prevent wild spins
- Asymptotic damping at 0.965 per frame (was 0.96)

### Task 2: Per-Shape Presentation Profiles
**Files:** `shapeProfiles.ts` (NEW), `GemView.tsx`, `fitCamera.ts`

- New `ShapeProfile` interface: `cameraPadding`, `baseScale`, `yOffset`, `initialOrientation`
- 15 unique profiles — each shape shows its best angle and fills viewport differently
- Round shapes (brilliant, cushion, oval): subtle tilt, standard padding
- Angular shapes (princess, emerald, hexagon): slight rotation to reveal facets
- Fancy shapes (pear, marquise, heart, trillion, kite, star): dramatic angles
- Crystal shapes (prism, shard, cube): more camera room, asymmetric orientations
- Initial orientation written to rotation state so gesture system stays in sync
- Shape profile used for camera padding and yOffset on geometry swap

### Task 3: Upgraded Illumination System
**Files:** `ArcCoreShader.ts` (V2), `GemView.tsx`

- **ArcCoreShader V2**: Hex grid overlay pattern with animated pulsing cells
- Concentric energy rings that propagate outward from center
- White-hot center spike fading to tier color at edges
- Dual-frequency pulse (2.8Hz throb + 5.5Hz flicker)
- Two-octave noise turbulence for organic variation
- Output multiplier raised to 4.0 (was 3.5), alpha 0.92 (was 0.9)
- **Bloom approximation**: Additive PlaneGeometry(4,4) behind gem with Gaussian falloff shader
- **3 orbiting specular sweep lights**: Different speeds (0.4, 0.55, 0.8 rad/s), radii (2.5, 1.8, 1.5), and colors (white, warm, cool)
- Each light pulses independently at different frequencies
- Arc core sphere enlarged to 0.42 radius (was 0.38)
- Mid glow sphere enlarged to 0.7 (was 0.65)
- Outer haze enlarged to 1.3 (was 1.2)

### Task 4: Reveal Animation Timing Fixes
**Files:** `VariantAssembly.tsx`, `VariantCarved.tsx`, `VariantCrystallize.tsx`, `VariantParticleForge.tsx`, `RevealScreen.tsx`

- **Assembly**: Shortened shard convergence (450+25×i ms, was 650+35×i). Materialize at 3200ms, flash at 3700ms. All shards vanish before materialize fires.
- **Carved**: Shortened crack particles (25ms stagger, 100+350ms opacity, was 40ms/150+500ms). Materialize at 3300ms, flash at 3800ms. All particles gone before materialize.
- **Crystallize**: Shortened crystal rays (50ms stagger, 150+400+200ms opacity, was 70ms/200+600+300ms). Rays complete at ~3200ms, well before flash at 3400ms.
- **ParticleForge**: Explode phase starts at 2300ms (was 2500ms), tightened burst (150ms, was 200ms) and contract (250ms, was 350ms). All invisible by 2700ms, materialize at 2800ms.
- **RevealScreen**: Flash completion timeout increased to 600ms (was 500ms) to wait for full flash animation (550ms) before phase transition.

### Task 5: Improved Reflections and Environment Map
**Files:** `GemView.tsx`

- **Env map studio upgraded**: 3 ceiling softboxes (warm, warm-offset, cool-blue) for gradient feel
- 3 horizontal strip lights for cinematic facet streaks (white, warm, cool)
- Enlarged side panels pushed further out (6.5 vs 6.0)
- 10 accent spheres (was 8) with larger radius (0.5 vs 0.4) and more varied positions
- Tone mapping exposure raised to 1.9 (was 1.8)
- Camera micro-breathing reduced slightly (0.015 vs 0.02) for subtlety

## Build Verification
- `npx tsc --noEmit` — 0 errors
- `npx jest --no-coverage` — 39 tests, 3 suites, all passing
- `npx expo export --platform web` — 2.75 MB bundle

## QA Checklist
- [ ] Gem rotates 360° in Y axis freely
- [ ] Pitch feels springy beyond ~45°, springs back when released
- [ ] Auto-rotate pauses during drag, resumes ~800ms after release
- [ ] Flick gesture creates smooth momentum that decays naturally
- [ ] Each shape (brilliant, princess, emerald, etc.) has distinct initial angle
- [ ] Different shapes fill viewport differently (prism taller, oval wider)
- [ ] Arc reactor core pulses with hex grid pattern visible inside gem
- [ ] Concentric rings propagate outward from center
- [ ] 3 specular sweep lights create moving highlights on facets
- [ ] Bloom glow visible behind gem, pulsing subtly
- [ ] Env map reflections visible on facets (warm/cool streaks)
- [ ] All 4 reveal variants: no visible animation artifacts during materialize
- [ ] Assembly: shards fully gone before gem appears
- [ ] Carved: crack particles fully gone before gem appears
- [ ] Crystallize: rays finished before flash
- [ ] ParticleForge: explode particles invisible before materialize
- [ ] Flash effect completes fully before "complete" state activates
- [ ] Tab switching: gem pauses and resumes correctly
- [ ] Tier change: material lerps smoothly, glow colors update
- [ ] Shape change: geometry swaps instantly with camera reframe
- [ ] SafeRenderMode: still works if primary setup fails

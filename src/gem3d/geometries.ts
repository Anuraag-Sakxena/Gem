/**
 * Procedural faceted gem geometries for Three.js.
 * 15 shape variants with distinct silhouettes and facet patterns.
 * All geometries use non-indexed buffers with flat normals for crisp facet sparkle.
 */

import * as THREE from 'three';

type Vec3 = [number, number, number];

/** Compute flat normal from triangle vertices and push 3 copies */
function pushTriangle(
  positions: number[],
  normals: number[],
  a: Vec3,
  b: Vec3,
  c: Vec3,
) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const acx = c[0] - a[0], acy = c[1] - a[1], acz = c[2] - a[2];
  let nx = aby * acz - abz * acy;
  let ny = abz * acx - abx * acz;
  let nz = abx * acy - aby * acx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  nx /= len; ny /= len; nz /= len;

  positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
}

function buildGeometry(positions: number[], normals: number[]): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.computeBoundingSphere();
  return geom;
}

/** Connect two rings with a quad strip (each quad = 2 triangles) */
function stepBand(positions: number[], normals: number[], upper: Vec3[], lower: Vec3[]) {
  const N = upper.length;
  for (let i = 0; i < N; i++) {
    const u0 = upper[i], u1 = upper[(i + 1) % N];
    const l0 = lower[i], l1 = lower[(i + 1) % N];
    pushTriangle(positions, normals, u0, l0, l1);
    pushTriangle(positions, normals, u0, l1, u1);
  }
}

/** Fan triangles from a center point to a ring */
function fanCap(positions: number[], normals: number[], center: Vec3, ring: Vec3[], flip = false) {
  const N = ring.length;
  for (let i = 0; i < N; i++) {
    if (flip) {
      pushTriangle(positions, normals, center, ring[(i + 1) % N], ring[i]);
    } else {
      pushTriangle(positions, normals, center, ring[i], ring[(i + 1) % N]);
    }
  }
}

// ─── Brilliant (Round Diamond) ───────────────────────────────────────────────

/**
 * Classic round brilliant cut: 8-fold symmetry with table, crown kites, and pavilion.
 * N=8 → 32 triangles, 96 vertices.
 */
export function createBrilliantGeometry(scale = 1): THREE.BufferGeometry {
  const N = 8;
  const tableR = 0.46 * scale;
  const girdleR = 1.0 * scale;
  const crownH = 0.34 * scale;
  const pavH = 0.92 * scale;

  const positions: number[] = [];
  const normals: number[] = [];

  const tableCenter: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  // Table edge ring (at crown height, smaller radius)
  const tableEdge: Vec3[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    tableEdge.push([Math.cos(a) * tableR, crownH, Math.sin(a) * tableR]);
  }

  // Girdle ring (widest, offset by half-segment for kite facets)
  const girdle: Vec3[] = [];
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * Math.PI * 2;
    girdle.push([Math.cos(a) * girdleR, 0, Math.sin(a) * girdleR]);
  }

  // Table: fan of N triangles
  for (let i = 0; i < N; i++) {
    pushTriangle(positions, normals, tableCenter, tableEdge[i], tableEdge[(i + 1) % N]);
  }

  // Crown: 2N kite triangles (upper + lower halves)
  for (let i = 0; i < N; i++) {
    const t0 = tableEdge[i];
    const t1 = tableEdge[(i + 1) % N];
    const g = girdle[i];
    const gPrev = girdle[(i - 1 + N) % N];

    // Upper kite half: table[i] → girdle[i] → table[i+1]
    pushTriangle(positions, normals, t0, g, t1);
    // Lower kite half: table[i] → girdle[i-1] → girdle[i]
    pushTriangle(positions, normals, t0, gPrev, g);
  }

  // Pavilion: N triangles from girdle to culet
  for (let i = 0; i < N; i++) {
    pushTriangle(positions, normals, girdle[i], girdle[(i + 1) % N], culet);
  }

  return buildGeometry(positions, normals);
}

// ─── Princess (Square Cut) ──────────────────────────────────────────────────

/**
 * Princess cut: square shape with faceted crown and pavilion.
 * Sharp 4-fold symmetry with chevron pavilion facets.
 */
export function createPrincessGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const hw = 0.82 * scale;   // half-width of square
  const crownH = 0.30 * scale;
  const pavH = 0.88 * scale;
  const tableR = 0.48 * scale;

  // Table (smaller square, rotated slightly for visual interest)
  const table: Vec3[] = [
    [ tableR, crownH,  tableR],
    [ tableR, crownH, -tableR],
    [-tableR, crownH, -tableR],
    [-tableR, crownH,  tableR],
  ];

  // Girdle (full square)
  const girdle: Vec3[] = [
    [ hw, 0,  hw],
    [ hw, 0, -hw],
    [-hw, 0, -hw],
    [-hw, 0,  hw],
  ];

  // Crown mid-edge points (at edge midpoints, slightly raised)
  const crownMidH = crownH * 0.45;
  const crownMid: Vec3[] = [
    [ hw,       crownMidH,  0],  // +X edge midpoint
    [ 0,        crownMidH, -hw], // -Z edge midpoint
    [-hw,       crownMidH,  0],  // -X edge midpoint
    [ 0,        crownMidH,  hw], // +Z edge midpoint
  ];

  // Table center
  const tc: Vec3 = [0, crownH, 0];

  // Table fan
  for (let i = 0; i < 4; i++) {
    pushTriangle(positions, normals, tc, table[i], table[(i + 1) % 4]);
  }

  // Crown: from each table edge to girdle via crown mid-edge
  for (let i = 0; i < 4; i++) {
    const t0 = table[i];
    const t1 = table[(i + 1) % 4];
    const g0 = girdle[i];
    const g1 = girdle[(i + 1) % 4];
    const cm = crownMid[i]; // midpoint of this girdle edge

    // Upper crown triangles
    pushTriangle(positions, normals, t0, g0, cm);
    pushTriangle(positions, normals, t1, cm, g1);
    // Lower crown triangle connecting mid to table edge
    pushTriangle(positions, normals, t0, cm, t1);
  }

  // Pavilion: chevron facets to culet
  const culet: Vec3 = [0, -pavH, 0];

  // Pavilion mid-edge points
  const pavMidH = -pavH * 0.45;
  const pavMid: Vec3[] = [
    [ hw * 0.5,  pavMidH,  0],
    [ 0,         pavMidH, -hw * 0.5],
    [-hw * 0.5,  pavMidH,  0],
    [ 0,         pavMidH,  hw * 0.5],
  ];

  for (let i = 0; i < 4; i++) {
    const g0 = girdle[i];
    const g1 = girdle[(i + 1) % 4];
    const pm = pavMid[i];

    // Upper pavilion
    pushTriangle(positions, normals, g0, pm, g1);
    // Lower pavilion sides to culet
    pushTriangle(positions, normals, g0, culet, pm);
    pushTriangle(positions, normals, g1, pm, culet);
  }

  return buildGeometry(positions, normals);
}

// ─── Emerald (Step Cut) ──────────────────────────────────────────────────────

/**
 * Step-cut emerald shape: elongated octagon with horizontal bands.
 * Creates a rectangular gem with cut corners and 3 step levels.
 */
export function createEmeraldGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const w = 0.72 * scale;   // half-width
  const l = 1.0 * scale;    // half-length
  const corner = 0.28;       // corner cut ratio
  const crownH = 0.30 * scale;
  const stepH = 0.15 * scale;
  const pavH = 0.78 * scale;
  const pavStepH = 0.45 * scale;

  // Octagonal ring generator (rectangle with cut corners)
  function octRing(hw: number, hl: number, y: number): Vec3[] {
    const cc = corner * Math.min(hw, hl);
    return [
      [ hw,       y,  hl - cc],   // 0: right-front
      [ hw,       y, -hl + cc],   // 1: right-back
      [ hw - cc,  y, -hl],        // 2: front-right
      [-hw + cc,  y, -hl],        // 3: front-left
      [-hw,       y, -hl + cc],   // 4: left-back
      [-hw,       y,  hl - cc],   // 5: left-front
      [-hw + cc,  y,  hl],        // 6: back-left
      [ hw - cc,  y,  hl],        // 7: back-right
    ];
  }

  const table = octRing(w * 0.52, l * 0.52, crownH);
  const step1 = octRing(w * 0.78, l * 0.78, stepH);
  const girdle = octRing(w, l, 0);
  const pavStep = octRing(w * 0.55, l * 0.55, -pavStepH);
  const culetRing = octRing(w * 0.12, l * 0.12, -pavH);

  const N = 8;

  // Table face (fan from center)
  const tc: Vec3 = [0, crownH, 0];
  for (let i = 0; i < N; i++) {
    pushTriangle(positions, normals, tc, table[i], table[(i + 1) % N]);
  }

  // Step bands: table→step1, step1→girdle
  stepBand(positions, normals, table, step1);
  stepBand(positions, normals, step1, girdle);
  stepBand(positions, normals, girdle, pavStep);
  stepBand(positions, normals, pavStep, culetRing);

  // Bottom face (close the culet ring)
  const bc: Vec3 = [0, -pavH, 0];
  for (let i = 0; i < N; i++) {
    pushTriangle(positions, normals, bc, culetRing[(i + 1) % N], culetRing[i]);
  }

  return buildGeometry(positions, normals);
}

// ─── Cushion (Rounded Square) ────────────────────────────────────────────────

/**
 * Cushion cut: rounded square with soft pillow-like edges.
 * N=12 sides for smooth corners while retaining a square overall shape.
 */
export function createCushionGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 12;
  const crownH = 0.32 * scale;
  const pavH = 0.88 * scale;
  const girdleR = 0.92 * scale;
  const squish = 0.72; // how square (0=circle, 1=full square)

  // Cushion profile: superellipse-like ring
  function cushionRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      // Superellipse: blend between circle and square
      const px = Math.sign(cosA) * Math.pow(Math.abs(cosA), 1.0 - squish * 0.5);
      const pz = Math.sign(sinA) * Math.pow(Math.abs(sinA), 1.0 - squish * 0.5);
      const r = girdleR * rScale;
      pts.push([px * r, y, pz * r]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = cushionRing(0.48, crownH);
  const crownStep = cushionRing(0.76, crownH * 0.4);
  const girdle = cushionRing(1.0, 0);
  const pavStep = cushionRing(0.55, -pavH * 0.45);

  // Table fan
  fanCap(positions, normals, tc, table);

  // Crown bands
  stepBand(positions, normals, table, crownStep);
  stepBand(positions, normals, crownStep, girdle);

  // Pavilion bands
  stepBand(positions, normals, girdle, pavStep);

  // Pavilion fan to culet
  fanCap(positions, normals, culet, pavStep, true);

  return buildGeometry(positions, normals);
}

// ─── Pear (Teardrop) ────────────────────────────────────────────────────────

/**
 * Pear cut: teardrop shape, wider at one end and pointed at the other.
 * Asymmetric profile with brilliant-style faceting.
 */
export function createPearGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 14;
  const crownH = 0.30 * scale;
  const pavH = 0.90 * scale;

  // Pear profile: egg-shaped, pointed at +Z, round at -Z
  function pearRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      // asymmetric: narrower at +Z (top of teardrop), wider at -Z
      const zRaw = Math.cos(t);
      const xRaw = Math.sin(t);
      // Taper the width based on z position (narrower toward +Z point)
      const taper = 0.55 + 0.45 * (1 - zRaw) * 0.5; // wider at -Z
      const maxW = 0.72 * scale * rScale;
      const halfL = 1.05 * scale * rScale;
      const x = xRaw * maxW * taper;
      const z = zRaw * halfL;
      pts.push([x, y, z]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = pearRing(0.46, crownH);
  const crownMid = pearRing(0.75, crownH * 0.35);
  const girdle = pearRing(1.0, 0);

  // Table fan
  fanCap(positions, normals, tc, table);

  // Crown: table → crownMid → girdle
  stepBand(positions, normals, table, crownMid);
  stepBand(positions, normals, crownMid, girdle);

  // Pavilion: girdle → culet
  fanCap(positions, normals, culet, girdle, true);

  return buildGeometry(positions, normals);
}

// ─── Marquise (Pointed Oval) ────────────────────────────────────────────────

/**
 * Marquise cut: boat-shaped gem with two pointed ends.
 * Uses sin-based profile for the pointed elliptical outline.
 */
export function createMarquiseGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 14; // total vertices per ring (even number for symmetry)
  const maxW = 0.58 * scale;  // max half-width at center
  const halfL = 1.08 * scale; // half-length to each point
  const crownH = 0.30 * scale;
  const pavH = 0.85 * scale;

  // Marquise profile ring: sin(t) for width creates pointed ends
  function marquiseRing(wScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const x = Math.sin(t) * maxW * wScale;
      const z = Math.cos(t) * halfL * wScale;
      pts.push([x, y, z]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];
  const table = marquiseRing(0.48, crownH);
  const crownMid = marquiseRing(0.76, crownH * 0.4);
  const girdle = marquiseRing(1.0, 0);

  // Table fan
  for (let i = 0; i < N; i++) {
    pushTriangle(positions, normals, tc, table[i], table[(i + 1) % N]);
  }

  // Crown upper: table → crownMid
  for (let i = 0; i < N; i++) {
    const t0 = table[i], t1 = table[(i + 1) % N];
    const m0 = crownMid[i], m1 = crownMid[(i + 1) % N];
    pushTriangle(positions, normals, t0, m0, m1);
    pushTriangle(positions, normals, t0, m1, t1);
  }

  // Crown lower: crownMid → girdle
  for (let i = 0; i < N; i++) {
    const m0 = crownMid[i], m1 = crownMid[(i + 1) % N];
    const g0 = girdle[i], g1 = girdle[(i + 1) % N];
    pushTriangle(positions, normals, m0, g0, g1);
    pushTriangle(positions, normals, m0, g1, m1);
  }

  // Pavilion: girdle → culet
  for (let i = 0; i < N; i++) {
    pushTriangle(positions, normals, girdle[i], girdle[(i + 1) % N], culet);
  }

  return buildGeometry(positions, normals);
}

// ─── Oval ────────────────────────────────────────────────────────────────────

/**
 * Oval cut: elongated round brilliant, stretched along Z axis.
 * Same faceting as brilliant but with elliptical profile.
 */
export function createOvalGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 12;
  const widthR = 0.68 * scale;   // half-width (X axis)
  const lengthR = 1.02 * scale;  // half-length (Z axis, stretched)
  const crownH = 0.32 * scale;
  const pavH = 0.88 * scale;

  function ovalRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push([Math.cos(a) * widthR * rScale, y, Math.sin(a) * lengthR * rScale]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = ovalRing(0.46, crownH);
  const crownMid = ovalRing(0.75, crownH * 0.4);
  const girdle = ovalRing(1.0, 0);

  // Table: fan from center
  fanCap(positions, normals, tc, table);

  // Crown: table → crownMid → girdle
  stepBand(positions, normals, table, crownMid);
  stepBand(positions, normals, crownMid, girdle);

  // Pavilion: girdle → culet
  fanCap(positions, normals, culet, girdle, true);

  return buildGeometry(positions, normals);
}

// ─── Heart ───────────────────────────────────────────────────────────────────

/**
 * Heart cut: two rounded lobes at top, pointed at bottom.
 * Complex outline using parametric heart curve.
 */
export function createHeartGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 20; // need more segments for complex shape
  const crownH = 0.28 * scale;
  const pavH = 0.85 * scale;

  // Heart outline using parametric curve
  function heartRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    const s = 0.55 * scale * rScale;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      // Heart parametric curve (rotated so point faces -Z, lobes face +Z)
      const x = s * 16 * Math.pow(Math.sin(t), 3) / 16;
      const zRaw = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
      const z = -zRaw * s; // flip so point is at +Z, lobes at -Z
      pts.push([x, y, z]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = heartRing(0.46, crownH);
  const crownMid = heartRing(0.74, crownH * 0.35);
  const girdle = heartRing(1.0, 0);
  const pavStep = heartRing(0.50, -pavH * 0.5);

  // Table
  fanCap(positions, normals, tc, table);

  // Crown bands
  stepBand(positions, normals, table, crownMid);
  stepBand(positions, normals, crownMid, girdle);

  // Pavilion bands
  stepBand(positions, normals, girdle, pavStep);

  // Pavilion bottom fan
  fanCap(positions, normals, culet, pavStep, true);

  return buildGeometry(positions, normals);
}

// ─── Trillion (Triangular) ──────────────────────────────────────────────────

/**
 * Trillion cut: triangular gem with 3-fold symmetry.
 * Equilateral triangle with slightly curved sides and faceted crown/pavilion.
 */
export function createTrillionGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 3;
  const segsPerSide = 3; // subdivisions per side for curved edges
  const totalPts = N * segsPerSide;
  const crownH = 0.30 * scale;
  const pavH = 0.90 * scale;
  const outerR = 1.05 * scale;
  const bulge = 0.18 * scale; // how much sides curve outward

  // Generate a triangular ring with slightly curved (bowed-out) sides
  function trillionRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    // 3 corner vertices
    const corners: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2; // first vertex at top
      corners.push([Math.cos(a) * outerR * rScale, y, Math.sin(a) * outerR * rScale]);
    }
    // Interpolate between corners with outward bulge
    for (let i = 0; i < N; i++) {
      const c0 = corners[i];
      const c1 = corners[(i + 1) % N];
      for (let j = 0; j < segsPerSide; j++) {
        const t = j / segsPerSide;
        const x = c0[0] + (c1[0] - c0[0]) * t;
        const z = c0[2] + (c1[2] - c0[2]) * t;
        // Bulge outward: maximum at midpoint of edge
        const bulgeFactor = Math.sin(t * Math.PI) * bulge * rScale;
        const midX = (c0[0] + c1[0]) * 0.5;
        const midZ = (c0[2] + c1[2]) * 0.5;
        // Direction from center to edge midpoint
        const dLen = Math.sqrt(midX * midX + midZ * midZ) || 1;
        const dx = midX / dLen;
        const dz = midZ / dLen;
        pts.push([x + dx * bulgeFactor, y, z + dz * bulgeFactor]);
      }
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = trillionRing(0.42, crownH);
  const crownMid = trillionRing(0.72, crownH * 0.35);
  const girdle = trillionRing(1.0, 0);
  const pavStep = trillionRing(0.45, -pavH * 0.5);

  // Table
  fanCap(positions, normals, tc, table);

  // Crown
  stepBand(positions, normals, table, crownMid);
  stepBand(positions, normals, crownMid, girdle);

  // Pavilion
  stepBand(positions, normals, girdle, pavStep);
  fanCap(positions, normals, culet, pavStep, true);

  return buildGeometry(positions, normals);
}

// ─── Hexagon (Hexagonal Step Cut) ───────────────────────────────────────────

/**
 * Hexagonal cut: 6-fold symmetry step-cut gem.
 * Clean geometric hexagonal outline with step-cut crown and pavilion.
 */
export function createHexagonGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 6;
  const outerR = 0.95 * scale;
  const crownH = 0.32 * scale;
  const stepH = 0.16 * scale;
  const pavH = 0.82 * scale;
  const pavStepH = 0.46 * scale;

  function hexRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push([Math.cos(a) * outerR * rScale, y, Math.sin(a) * outerR * rScale]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const bc: Vec3 = [0, -pavH, 0];

  const table = hexRing(0.50, crownH);
  const crownStep = hexRing(0.78, stepH);
  const girdle = hexRing(1.0, 0);
  const pavStep1 = hexRing(0.72, -pavStepH * 0.5);
  const pavStep2 = hexRing(0.38, -pavStepH);
  const culetRing = hexRing(0.10, -pavH);

  // Table fan
  fanCap(positions, normals, tc, table);

  // Crown steps
  stepBand(positions, normals, table, crownStep);
  stepBand(positions, normals, crownStep, girdle);

  // Pavilion steps
  stepBand(positions, normals, girdle, pavStep1);
  stepBand(positions, normals, pavStep1, pavStep2);
  stepBand(positions, normals, pavStep2, culetRing);

  // Bottom
  fanCap(positions, normals, bc, culetRing, true);

  return buildGeometry(positions, normals);
}

// ─── Prism (Tall Crystal) ───────────────────────────────────────────────────

/**
 * Prism: tall elongated crystal with rectangular cross-section.
 * Pointed at both ends like a natural quartz crystal.
 */
export function createPrismGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const N = 6; // hexagonal cross-section
  const bodyR = 0.52 * scale;
  const bodyH = 0.55 * scale;    // half-height of the prismatic body
  const tipH = 0.55 * scale;     // height of each pointed tip
  const tipR = 0.12 * scale;     // small flat at each tip

  function prismRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pts.push([Math.cos(a) * bodyR * rScale, y, Math.sin(a) * bodyR * rScale]);
    }
    return pts;
  }

  const topTip: Vec3 = [0, bodyH + tipH, 0];
  const botTip: Vec3 = [0, -(bodyH + tipH), 0];

  const topCap = prismRing(0.30, bodyH + tipH * 0.6);
  const topBody = prismRing(1.0, bodyH);
  const botBody = prismRing(1.0, -bodyH);
  const botCap = prismRing(0.30, -(bodyH + tipH * 0.6));

  // Top termination
  fanCap(positions, normals, topTip, topCap);
  stepBand(positions, normals, topCap, topBody);

  // Body
  stepBand(positions, normals, topBody, botBody);

  // Bottom termination
  stepBand(positions, normals, botBody, botCap);
  fanCap(positions, normals, botTip, botCap, true);

  return buildGeometry(positions, normals);
}

// ─── Shard (Asymmetric Crystal) ─────────────────────────────────────────────

/**
 * Shard: irregular crystal fragment with asymmetric facets.
 * Tilted and angular for a natural crystal look.
 */
export function createShardGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const s = scale;

  // Define an irregular pentagonal cross-section at different heights
  // Intentionally asymmetric for a natural shard look
  const topPeak: Vec3 = [0.1 * s, 0.95 * s, -0.05 * s];

  const topRing: Vec3[] = [
    [ 0.35 * s,  0.60 * s,  0.25 * s],
    [ 0.40 * s,  0.55 * s, -0.20 * s],
    [ 0.05 * s,  0.65 * s, -0.40 * s],
    [-0.30 * s,  0.58 * s, -0.15 * s],
    [-0.25 * s,  0.62 * s,  0.30 * s],
  ];

  const midRing: Vec3[] = [
    [ 0.55 * s,  0.0,  0.38 * s],
    [ 0.60 * s,  0.05 * s, -0.32 * s],
    [ 0.10 * s, -0.05 * s, -0.62 * s],
    [-0.50 * s,  0.0, -0.25 * s],
    [-0.42 * s,  0.05 * s,  0.45 * s],
  ];

  const lowerRing: Vec3[] = [
    [ 0.38 * s, -0.50 * s,  0.28 * s],
    [ 0.42 * s, -0.45 * s, -0.22 * s],
    [ 0.05 * s, -0.52 * s, -0.45 * s],
    [-0.35 * s, -0.48 * s, -0.18 * s],
    [-0.30 * s, -0.50 * s,  0.32 * s],
  ];

  const botPoint: Vec3 = [0.05 * s, -0.95 * s, 0.02 * s];

  // Top peak to top ring
  fanCap(positions, normals, topPeak, topRing);

  // Bands
  stepBand(positions, normals, topRing, midRing);
  stepBand(positions, normals, midRing, lowerRing);

  // Bottom to point
  fanCap(positions, normals, botPoint, lowerRing, true);

  return buildGeometry(positions, normals);
}

// ─── Kite (Diamond Kite Shape) ──────────────────────────────────────────────

/**
 * Kite cut: 4-sided gem with unequal top/bottom proportions.
 * Wider at the top, narrower and longer at the bottom. Diamond kite silhouette.
 */
export function createKiteGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const s = scale;
  const crownH = 0.28 * s;
  const pavH = 0.85 * s;

  // Kite outline: top point, left, bottom point, right
  // Top is shorter, bottom is longer
  const topExtent = 0.55 * s;   // distance from center to top point
  const botExtent = 1.05 * s;   // distance from center to bottom point
  const sideExtent = 0.72 * s;  // distance from center to sides

  function kiteRing(rScale: number, y: number): Vec3[] {
    // 8-sided approximation of kite: top point, upper-right, right, lower-right,
    // bottom point, lower-left, left, upper-left
    const r = rScale;
    return [
      [0,                    y,  -topExtent * r],   // top point
      [ sideExtent * 0.5 * r, y, -topExtent * 0.4 * r], // upper-right
      [ sideExtent * r,      y,  0],                // right
      [ sideExtent * 0.5 * r, y,  botExtent * 0.5 * r], // lower-right
      [0,                    y,   botExtent * r],    // bottom point
      [-sideExtent * 0.5 * r, y,  botExtent * 0.5 * r], // lower-left
      [-sideExtent * r,      y,  0],                // left
      [-sideExtent * 0.5 * r, y, -topExtent * 0.4 * r], // upper-left
    ];
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = kiteRing(0.44, crownH);
  const crownMid = kiteRing(0.74, crownH * 0.35);
  const girdle = kiteRing(1.0, 0);
  const pavStep = kiteRing(0.45, -pavH * 0.5);

  // Table
  fanCap(positions, normals, tc, table);

  // Crown
  stepBand(positions, normals, table, crownMid);
  stepBand(positions, normals, crownMid, girdle);

  // Pavilion
  stepBand(positions, normals, girdle, pavStep);
  fanCap(positions, normals, culet, pavStep, true);

  return buildGeometry(positions, normals);
}

// ─── Star (Star Cut) ────────────────────────────────────────────────────────

/**
 * Star cut: 6-pointed star with alternating inner/outer vertices.
 * Creates a distinct spiky silhouette with faceted crown and pavilion.
 */
export function createStarGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const points = 6;
  const N = points * 2; // alternating outer and inner vertices
  const outerR = 1.0 * scale;
  const innerR = 0.48 * scale; // inner vertex radius (valley)
  const crownH = 0.30 * scale;
  const pavH = 0.85 * scale;

  function starRing(rScale: number, y: number): Vec3[] {
    const pts: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const r = (i % 2 === 0 ? outerR : innerR) * rScale;
      pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return pts;
  }

  const tc: Vec3 = [0, crownH, 0];
  const culet: Vec3 = [0, -pavH, 0];

  const table = starRing(0.42, crownH);
  const crownMid = starRing(0.72, crownH * 0.35);
  const girdle = starRing(1.0, 0);
  const pavStep = starRing(0.50, -pavH * 0.45);

  // Table
  fanCap(positions, normals, tc, table);

  // Crown
  stepBand(positions, normals, table, crownMid);
  stepBand(positions, normals, crownMid, girdle);

  // Pavilion
  stepBand(positions, normals, girdle, pavStep);
  fanCap(positions, normals, culet, pavStep, true);

  return buildGeometry(positions, normals);
}

// ─── Cube (Faceted Cube Crystal) ────────────────────────────────────────────

/**
 * Cube cut: cube-shaped crystal with beveled/chamfered edges.
 * Creates a cube silhouette with cut edges for extra facets and sparkle.
 */
export function createCubeGeometry(scale = 1): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const s = 0.72 * scale;    // half-size of cube
  const bev = 0.20 * scale;  // bevel/chamfer size

  // A cube with beveled edges has 6 main faces, 12 edge bevels, and 8 corner bevels.
  // We'll define it as rings at different Y levels.

  // Top face ring (at y = s, inset by bevel)
  const topFace: Vec3[] = [
    [ s - bev,  s,  s - bev],
    [ s - bev,  s, -s + bev],
    [-s + bev,  s, -s + bev],
    [-s + bev,  s,  s - bev],
  ];

  // Upper bevel ring (at y = s - bev transitioning to full width)
  // 8 vertices: 4 corners become 2 vertices each
  const topBevel: Vec3[] = [
    [ s,        s - bev,  s - bev],  // +X +Z edge
    [ s - bev,  s - bev,  s],        // +Z +X edge
    [-s + bev,  s - bev,  s],        // +Z -X edge
    [-s,        s - bev,  s - bev],  // -X +Z edge
    [-s,        s - bev, -s + bev],  // -X -Z edge
    [-s + bev,  s - bev, -s],        // -Z -X edge
    [ s - bev,  s - bev, -s],        // -Z +X edge
    [ s,        s - bev, -s + bev],  // +X -Z edge
  ];

  // Lower bevel ring (mirror of upper at y = -(s - bev))
  const botBevel: Vec3[] = [
    [ s,       -(s - bev),  s - bev],
    [ s - bev, -(s - bev),  s],
    [-s + bev, -(s - bev),  s],
    [-s,       -(s - bev),  s - bev],
    [-s,       -(s - bev), -s + bev],
    [-s + bev, -(s - bev), -s],
    [ s - bev, -(s - bev), -s],
    [ s,       -(s - bev), -s + bev],
  ];

  // Bottom face ring (at y = -s, inset by bevel)
  const botFace: Vec3[] = [
    [ s - bev, -s,  s - bev],
    [ s - bev, -s, -s + bev],
    [-s + bev, -s, -s + bev],
    [-s + bev, -s,  s - bev],
  ];

  // Top face (2 triangles forming quad)
  const tc: Vec3 = [0, s, 0];
  fanCap(positions, normals, tc, topFace);

  // Top bevel: connect topFace (4 pts) to topBevel (8 pts)
  // Each topFace edge becomes 3 triangles connecting to 2 bevel points + 1 bevel corner
  for (let i = 0; i < 4; i++) {
    const tf0 = topFace[i];
    const tf1 = topFace[(i + 1) % 4];
    const bi = i * 2; // index into 8-point bevel ring
    const tb0 = topBevel[bi];
    const tb1 = topBevel[(bi + 1) % 8];
    const tb2 = topBevel[(bi + 2) % 8];

    // Corner triangle from topFace vertex to its two adjacent bevel vertices
    pushTriangle(positions, normals, tf0, tb0, tb1);
    // Edge quad from topFace edge to bevel edge
    pushTriangle(positions, normals, tf0, tb1, tf1);
    pushTriangle(positions, normals, tf1, tb1, tb2);
  }

  // Side faces: topBevel to botBevel (8 quads for 8 segments)
  stepBand(positions, normals, topBevel, botBevel);

  // Bottom bevel: botBevel (8 pts) to botFace (4 pts)
  for (let i = 0; i < 4; i++) {
    const bf0 = botFace[i];
    const bf1 = botFace[(i + 1) % 4];
    const bi = i * 2;
    const bb0 = botBevel[bi];
    const bb1 = botBevel[(bi + 1) % 8];
    const bb2 = botBevel[(bi + 2) % 8];

    pushTriangle(positions, normals, bf0, bb1, bb0);
    pushTriangle(positions, normals, bf0, bf1, bb1);
    pushTriangle(positions, normals, bf1, bb2, bb1);
  }

  // Bottom face
  const bc: Vec3 = [0, -s, 0];
  fanCap(positions, normals, bc, botFace, true);

  return buildGeometry(positions, normals);
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export type GemShapeKey =
  | 'brilliant' | 'princess' | 'emerald' | 'cushion' | 'pear'
  | 'marquise' | 'oval' | 'heart' | 'trillion' | 'hexagon'
  | 'prism' | 'shard' | 'kite' | 'star' | 'cube';

export function createGemGeometry(shape: GemShapeKey, scale = 1): THREE.BufferGeometry {
  switch (shape) {
    case 'brilliant': return createBrilliantGeometry(scale);
    case 'princess':  return createPrincessGeometry(scale);
    case 'emerald':   return createEmeraldGeometry(scale);
    case 'cushion':   return createCushionGeometry(scale);
    case 'pear':      return createPearGeometry(scale);
    case 'marquise':  return createMarquiseGeometry(scale);
    case 'oval':      return createOvalGeometry(scale);
    case 'heart':     return createHeartGeometry(scale);
    case 'trillion':  return createTrillionGeometry(scale);
    case 'hexagon':   return createHexagonGeometry(scale);
    case 'prism':     return createPrismGeometry(scale);
    case 'shard':     return createShardGeometry(scale);
    case 'kite':      return createKiteGeometry(scale);
    case 'star':      return createStarGeometry(scale);
    case 'cube':      return createCubeGeometry(scale);
  }
}

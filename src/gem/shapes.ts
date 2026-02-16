/**
 * Gem Shape Definitions — 3 variants with SVG path geometry.
 * Each shape defines the key points for a faceted gem.
 */

/** Legacy 2D shape type — only 3 shapes have SVG definitions */
type LegacyShapeKey = 'brilliant' | 'emerald' | 'marquise';

export interface GemGeometry {
  /** Display name */
  name: string;
  /** Main outline polygon points (centered at cx, cy) */
  outline: (cx: number, cy: number, size: number) => string;
  /** Crown left facet */
  crownLeft: (cx: number, cy: number, size: number) => string;
  /** Crown right facet */
  crownRight: (cx: number, cy: number, size: number) => string;
  /** Pavilion left */
  pavLeft: (cx: number, cy: number, size: number) => string;
  /** Pavilion right */
  pavRight: (cx: number, cy: number, size: number) => string;
  /** Table face (top flat area) */
  table: (cx: number, cy: number, size: number) => string;
  /** Inner star pattern for high-complexity tiers */
  starFacets: (cx: number, cy: number, size: number) => string[];
  /** Shadow ellipse params */
  shadow: (cx: number, cy: number, size: number) => { cx: number; cy: number; rx: number; ry: number };
}

const pts = (pairs: [number, number][]) => pairs.map((p) => p.join(',')).join(' ');

export const GEM_SHAPES: Record<LegacyShapeKey, GemGeometry> = {
  /** Classic brilliant-cut diamond */
  brilliant: {
    name: 'Brilliant',
    outline: (cx, cy, s) => {
      const top = cy - s * 0.4;
      const crownY = cy - s * 0.1;
      const girdleY = cy + s * 0.02;
      const bottom = cy + s * 0.42;
      const hw = s * 0.36;
      const chw = s * 0.4;
      return pts([
        [cx, top],
        [cx + chw, crownY],
        [cx + hw, girdleY],
        [cx, bottom],
        [cx - hw, girdleY],
        [cx - chw, crownY],
      ]);
    },
    crownLeft: (cx, cy, s) => {
      const top = cy - s * 0.4;
      const crownY = cy - s * 0.1;
      const girdleY = cy + s * 0.02;
      const chw = s * 0.4;
      const hw = s * 0.36;
      return pts([[cx, top], [cx - chw, crownY], [cx - hw, girdleY], [cx, girdleY]]);
    },
    crownRight: (cx, cy, s) => {
      const top = cy - s * 0.4;
      const crownY = cy - s * 0.1;
      const girdleY = cy + s * 0.02;
      const chw = s * 0.4;
      const hw = s * 0.36;
      return pts([[cx, top], [cx + chw, crownY], [cx + hw, girdleY], [cx, girdleY]]);
    },
    pavLeft: (cx, cy, s) => {
      const girdleY = cy + s * 0.02;
      const bottom = cy + s * 0.42;
      const hw = s * 0.36;
      return pts([[cx - hw, girdleY], [cx, bottom], [cx, girdleY]]);
    },
    pavRight: (cx, cy, s) => {
      const girdleY = cy + s * 0.02;
      const bottom = cy + s * 0.42;
      const hw = s * 0.36;
      return pts([[cx + hw, girdleY], [cx, bottom], [cx, girdleY]]);
    },
    table: (cx, cy, s) => {
      const top = cy - s * 0.4;
      const crownY = cy - s * 0.1;
      const chw = s * 0.4;
      const tw = s * 0.2;
      return pts([[cx - tw, top + s * 0.06], [cx + tw, top + s * 0.06], [cx + chw * 0.55, crownY], [cx - chw * 0.55, crownY]]);
    },
    starFacets: (cx, cy, s) => {
      const top = cy - s * 0.4;
      const crownY = cy - s * 0.1;
      const girdleY = cy + s * 0.02;
      const bottom = cy + s * 0.42;
      const chw = s * 0.4;
      const hw = s * 0.36;
      return [
        `M${cx},${top} L${cx - chw * 0.5},${crownY} L${cx},${girdleY}`,
        `M${cx},${top} L${cx + chw * 0.5},${crownY} L${cx},${girdleY}`,
        `M${cx - hw * 0.5},${girdleY} L${cx},${bottom * 0.97}`,
        `M${cx + hw * 0.5},${girdleY} L${cx},${bottom * 0.97}`,
      ];
    },
    shadow: (cx, cy, s) => ({ cx, cy: cy + s * 0.46, rx: s * 0.24, ry: s * 0.035 }),
  },

  /** Emerald cut — rectangular with chamfered corners */
  emerald: {
    name: 'Emerald',
    outline: (cx, cy, s) => {
      const top = cy - s * 0.32;
      const bottom = cy + s * 0.32;
      const hw = s * 0.28;
      const chamfer = s * 0.08;
      return pts([
        [cx - hw + chamfer, top],
        [cx + hw - chamfer, top],
        [cx + hw, top + chamfer],
        [cx + hw, bottom - chamfer],
        [cx + hw - chamfer, bottom],
        [cx - hw + chamfer, bottom],
        [cx - hw, bottom - chamfer],
        [cx - hw, top + chamfer],
      ]);
    },
    crownLeft: (cx, cy, s) => {
      const top = cy - s * 0.32;
      const hw = s * 0.28;
      const chamfer = s * 0.08;
      const mid = cy;
      return pts([
        [cx - hw, top + chamfer],
        [cx - hw + chamfer, top],
        [cx, top],
        [cx, mid],
        [cx - hw, mid],
      ]);
    },
    crownRight: (cx, cy, s) => {
      const top = cy - s * 0.32;
      const hw = s * 0.28;
      const chamfer = s * 0.08;
      const mid = cy;
      return pts([
        [cx + hw, top + chamfer],
        [cx + hw - chamfer, top],
        [cx, top],
        [cx, mid],
        [cx + hw, mid],
      ]);
    },
    pavLeft: (cx, cy, s) => {
      const bottom = cy + s * 0.32;
      const hw = s * 0.28;
      const chamfer = s * 0.08;
      const mid = cy;
      return pts([
        [cx - hw, mid],
        [cx, mid],
        [cx, bottom],
        [cx - hw + chamfer, bottom],
        [cx - hw, bottom - chamfer],
      ]);
    },
    pavRight: (cx, cy, s) => {
      const bottom = cy + s * 0.32;
      const hw = s * 0.28;
      const chamfer = s * 0.08;
      const mid = cy;
      return pts([
        [cx + hw, mid],
        [cx, mid],
        [cx, bottom],
        [cx + hw - chamfer, bottom],
        [cx + hw, bottom - chamfer],
      ]);
    },
    table: (cx, cy, s) => {
      const top = cy - s * 0.32;
      const hw = s * 0.28;
      const inset = s * 0.08;
      return pts([
        [cx - hw + inset * 2, top + inset],
        [cx + hw - inset * 2, top + inset],
        [cx + hw - inset * 2, top + inset * 3],
        [cx - hw + inset * 2, top + inset * 3],
      ]);
    },
    starFacets: (cx, cy, s) => {
      const hw = s * 0.28;
      return [
        `M${cx - hw},${cy} L${cx},${cy}`,
        `M${cx + hw},${cy} L${cx},${cy}`,
      ];
    },
    shadow: (cx, cy, s) => ({ cx, cy: cy + s * 0.38, rx: s * 0.26, ry: s * 0.03 }),
  },

  /** Marquise cut — elongated with pointed ends */
  marquise: {
    name: 'Marquise',
    outline: (cx, cy, s) => {
      const topY = cy - s * 0.44;
      const bottomY = cy + s * 0.44;
      const midY = cy;
      const hw = s * 0.26;
      const qh = s * 0.22;
      return pts([
        [cx, topY],
        [cx + hw * 0.6, topY + qh],
        [cx + hw, midY],
        [cx + hw * 0.6, bottomY - qh],
        [cx, bottomY],
        [cx - hw * 0.6, bottomY - qh],
        [cx - hw, midY],
        [cx - hw * 0.6, topY + qh],
      ]);
    },
    crownLeft: (cx, cy, s) => {
      const topY = cy - s * 0.44;
      const hw = s * 0.26;
      const qh = s * 0.22;
      return pts([
        [cx, topY],
        [cx - hw * 0.6, topY + qh],
        [cx - hw, cy],
        [cx, cy],
      ]);
    },
    crownRight: (cx, cy, s) => {
      const topY = cy - s * 0.44;
      const hw = s * 0.26;
      const qh = s * 0.22;
      return pts([
        [cx, topY],
        [cx + hw * 0.6, topY + qh],
        [cx + hw, cy],
        [cx, cy],
      ]);
    },
    pavLeft: (cx, cy, s) => {
      const bottomY = cy + s * 0.44;
      const hw = s * 0.26;
      const qh = s * 0.22;
      return pts([
        [cx - hw, cy],
        [cx, cy],
        [cx, bottomY],
        [cx - hw * 0.6, bottomY - qh],
      ]);
    },
    pavRight: (cx, cy, s) => {
      const bottomY = cy + s * 0.44;
      const hw = s * 0.26;
      const qh = s * 0.22;
      return pts([
        [cx + hw, cy],
        [cx, cy],
        [cx, bottomY],
        [cx + hw * 0.6, bottomY - qh],
      ]);
    },
    table: (cx, cy, s) => {
      const topY = cy - s * 0.44;
      const hw = s * 0.26;
      const inset = s * 0.12;
      return pts([
        [cx, topY + inset * 0.5],
        [cx + hw * 0.35, topY + inset * 1.5],
        [cx, cy - inset * 0.5],
        [cx - hw * 0.35, topY + inset * 1.5],
      ]);
    },
    starFacets: (cx, cy, s) => {
      const topY = cy - s * 0.44;
      const bottomY = cy + s * 0.44;
      return [
        `M${cx},${topY} L${cx},${bottomY}`,
      ];
    },
    shadow: (cx, cy, s) => ({ cx, cy: cy + s * 0.48, rx: s * 0.18, ry: s * 0.03 }),
  },
};

export const GEM_SHAPE_ORDER: LegacyShapeKey[] = ['brilliant', 'emerald', 'marquise'];

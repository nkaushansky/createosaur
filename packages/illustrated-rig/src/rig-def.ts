import type { MeshGridSpec, MeshLayerId, Point, RectBounds, RigLayerId } from './types';

/**
 * The trex-r0-v1 rig definition: stage size, pivots, layer bounds and mesh
 * densities. These numbers are part of the pack contract — the bounds are
 * copied from the pack's manifest.json (an integrity test keeps them equal),
 * and the pivots start from the validated standalone prototype, tuned here
 * during the visual verify loop.
 */

export const RIG_STAGE = { width: 1536, height: 1024 } as const;

/** Rotation/attachment points in stage coordinates. */
export const PIVOTS = {
  torso: { x: 705, y: 505 },
  pelvis: { x: 748, y: 432 },
  tail: { x: 848, y: 420 },
  neck: { x: 438, y: 470 },
  head: { x: 315, y: 390 },
  jaw: { x: 300, y: 366 },
  // The far hip sits forward/up of the prototype estimate: rotating nearer
  // the thigh's front-edge contact keeps that edge from dropping out of the
  // belly silhouette when the far leg swings back (round-1 finding).
  farHip: { x: 585, y: 502 },
  farKnee: { x: 612, y: 645 },
  nearHip: { x: 748, y: 498 },
  nearKnee: { x: 770, y: 645 },
  farShoulder: { x: 447, y: 448 },
  nearShoulder: { x: 414, y: 432 },
} as const satisfies Record<string, Point>;

export type PivotId = keyof typeof PIVOTS;

/**
 * Full layer bounds (visible art + concealed overlap) from manifest.json.
 * Mesh grids are built over these rectangles.
 */
export const LAYER_BOUNDS: Record<RigLayerId, RectBounds> = {
  'far-hind-shank-foot': { x: 512, y: 560, width: 188, height: 225 },
  'far-hind-thigh': { x: 513, y: 458, width: 167, height: 147 },
  'near-hind-shank-foot': { x: 645, y: 532, width: 256, height: 257 },
  'near-hind-thigh': { x: 609, y: 365, width: 280, height: 237 },
  'far-forearm': { x: 420, y: 398, width: 96, height: 187 },
  'near-forearm': { x: 368, y: 387, width: 129, height: 205 },
  tail: { x: 805, y: 280, width: 719, height: 380 },
  pelvis: { x: 622, y: 263, width: 309, height: 410 },
  torso: { x: 375, y: 265, width: 361, height: 514 },
  neck: { x: 240, y: 233, width: 231, height: 357 },
  'head-upper': { x: 46, y: 230, width: 320, height: 223 },
  'jaw-lower': { x: 43, y: 335, width: 278, height: 105 },
};

/**
 * Coarse grids: enough vertices for a smooth bend, few enough to author and
 * debug by eye. Density increases only for a visible reason (AGENT rule).
 */
export const MESH_SPECS: Record<MeshLayerId, MeshGridSpec> = {
  torso: { columns: 6, rows: 4 },
  neck: { columns: 4, rows: 4 },
  pelvis: { columns: 4, rows: 3 },
  tail: { columns: 8, rows: 3 },
};

/**
 * Rest-pose vertex positions for a meshed layer: a uniform grid over its
 * bounds, row-major, [x0, y0, x1, y1, …]. The renderer derives UVs from these
 * same numbers, so rest geometry and texture mapping cannot disagree.
 */
export function restMeshPositions(layerId: MeshLayerId): number[] {
  const { columns, rows } = MESH_SPECS[layerId];
  const b = LAYER_BOUNDS[layerId];
  const positions: number[] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) {
      positions.push(b.x + (b.width * i) / columns, b.y + (b.height * j) / rows);
    }
  }
  return positions;
}

/** Triangle indices for a grid mesh (two triangles per cell), row-major. */
export function meshIndices(spec: MeshGridSpec): number[] {
  const { columns, rows } = spec;
  const stride = columns + 1;
  const indices: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const tl = j * stride + i;
      const tr = tl + 1;
      const bl = tl + stride;
      const br = bl + 1;
      indices.push(tl, tr, bl, tr, br, bl);
    }
  }
  return indices;
}

import type { MeshGridSpec, MeshLayerId, Point, RectBounds, RigLayerId } from './types';

/**
 * Per-species rig definitions. Every number the pose evaluator uses lives
 * here: pivots, layer bounds (mirrored from each pack's manifest.json and
 * cross-checked by the web integrity tests), coarse mesh densities, and the
 * deformation-field constants tuned during each species' visual seam rounds.
 *
 * TREX_RIG_DEF reproduces the IR0-approved T. rex behavior exactly — its
 * constants are the ones the owner signed off on, and the fixed-time pose
 * snapshot guards them bit-for-bit.
 */

export const RIG_STAGE = { width: 1536, height: 1024 } as const;

export type SpeciesId = 'trex' | 'allosaurus';

export type PivotId =
  | 'torso'
  | 'pelvis'
  | 'tail'
  | 'neck'
  | 'head'
  | 'jaw'
  | 'farHip'
  | 'farKnee'
  | 'nearHip'
  | 'nearKnee'
  | 'farShoulder'
  | 'nearShoulder';

/** [from, to] smoothstep ramp edges (either direction). */
type Ramp = readonly [number, number];
/** rise [from,to] then fall [from,to] envelope. */
type Envelope = { rise: Ramp; fall: Ramp };

export interface RigDeformDef {
  torso: {
    liftAmp: number;
    dorsalRamp: Ramp;
    pelvisPinRamp: Ramp;
    chest: { amp: number; cx: number; halfW: number; envelope: Envelope };
    plateau: { sample: Point; x: Envelope; y: Envelope };
  };
  neck: {
    xBase: number;
    xHead: number;
    liftBase: number;
    liftHead: number;
    rotPerHeadDeg: number;
    rotPerBreath: number;
  };
  head: { dxPerDeg: number; dyPerDegUp: number; dyPerDegDown: number };
  legs: {
    farThighAmp: number;
    farShankAmp: number;
    nearThighAmp: number;
    nearShankAmp: number;
    nearShiftForward: readonly [number, number];
    nearShiftBackward: readonly [number, number];
  };
  arms: { breathRot: number };
  pelvis: { settleAmp: number; rotAmp: number; xRamp: Ramp; yPinRamp: Ramp };
  tail: {
    ramp: Ramp;
    swayRot: number;
    strideRot: number;
    breathRot: number;
    shiftX: number;
    shiftY: number;
    legFollow: { xFade: Ramp; yRamp: Ramp; dx: number; dy: number };
  };
}

export interface SpeciesRigDef {
  speciesId: SpeciesId;
  label: string;
  /** Pack path under /public (no leading slash). */
  packPath: string;
  /** Pack-relative file of the cleaned approved master (debug underlay). */
  masterFile: string;
  /** The species' deterministic variation seed (its pack's pattern seed). */
  seed: number;
  /** Per-species stride bound: how far this pack's overlap stays seam-clean. */
  strideRange: { min: number; max: number };
  pivots: Record<PivotId, Point>;
  layerBounds: Record<RigLayerId, RectBounds>;
  meshSpecs: Record<MeshLayerId, MeshGridSpec>;
  deform: RigDeformDef;
}

const SHARED_MESH_SPECS: Record<MeshLayerId, MeshGridSpec> = {
  torso: { columns: 6, rows: 4 },
  neck: { columns: 4, rows: 4 },
  pelvis: { columns: 4, rows: 3 },
  tail: { columns: 8, rows: 3 },
};

export const TREX_RIG_DEF: SpeciesRigDef = {
  speciesId: 'trex',
  label: 'Tyrannosaurus rex',
  packPath: 'rigs/trex-r0-v1',
  masterFile: 'trex-master-clean.png',
  seed: 20260718,
  // The trex-r0-v1 pack's straight extraction-cut edges expose beyond ~0.6
  // (IR0 finding); the range stays capped until a pack revision.
  strideRange: { min: -0.6, max: 0.6 },
  pivots: {
    torso: { x: 705, y: 505 },
    pelvis: { x: 748, y: 432 },
    tail: { x: 848, y: 420 },
    neck: { x: 438, y: 470 },
    head: { x: 315, y: 390 },
    jaw: { x: 300, y: 366 },
    farHip: { x: 585, y: 502 },
    farKnee: { x: 612, y: 645 },
    nearHip: { x: 748, y: 498 },
    nearKnee: { x: 770, y: 645 },
    farShoulder: { x: 447, y: 448 },
    nearShoulder: { x: 414, y: 432 },
  },
  layerBounds: {
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
  },
  meshSpecs: SHARED_MESH_SPECS,
  deform: {
    torso: {
      liftAmp: 9,
      dorsalRamp: [760, 300],
      pelvisPinRamp: [650, 734],
      chest: { amp: 2.5, cx: 690, halfW: 315, envelope: { rise: [280, 420], fall: [520, 700] } },
      plateau: {
        sample: { x: 455, y: 495 },
        x: { rise: [343, 388], fall: [500, 545] },
        y: { rise: [367, 412], fall: [580, 625] },
      },
    },
    neck: { xBase: 465, xHead: 305, liftBase: 5.5, liftHead: 4.5, rotPerHeadDeg: 0.45, rotPerBreath: -0.9 },
    head: { dxPerDeg: -0.5, dyPerDegUp: -0.12, dyPerDegDown: -0.3 },
    legs: {
      farThighAmp: -4.2,
      farShankAmp: 6,
      nearThighAmp: 4.6,
      nearShankAmp: 6.5,
      nearShiftForward: [0, -4.8],
      nearShiftBackward: [7.2, 2],
    },
    arms: { breathRot: -1.0 },
    pelvis: { settleAmp: 1.2, rotAmp: 1.2, xRamp: [700, 820], yPinRamp: [560, 660] },
    tail: {
      ramp: [870, 1500],
      swayRot: 5,
      strideRot: 2.4,
      breathRot: -0.7,
      shiftX: -4,
      shiftY: 2,
      legFollow: { xFade: [900, 970], yRamp: [545, 610], dx: -8, dy: 4 },
    },
  },
};

export const ALLOSAURUS_RIG_DEF: SpeciesRigDef = {
  speciesId: 'allosaurus',
  label: 'Allosaurus',
  packPath: 'rigs/allosaurus-r0-v1',
  masterFile: 'allosaurus-master-clean.png',
  seed: 20260720,
  // Verified full range (2026-07-21 seam rounds): crease-following cut edges
  // plus 28-44 px leg rims hold ±1 — enclosed-hole scan is flat across the
  // whole sweep. The trex's ±0.6 cap was the pack, not the approach.
  strideRange: { min: -1, max: 1 },
  pivots: {
    torso: { x: 680, y: 470 },
    pelvis: { x: 780, y: 400 },
    tail: { x: 940, y: 400 },
    neck: { x: 400, y: 415 },
    head: { x: 250, y: 295 },
    jaw: { x: 248, y: 350 },
    farHip: { x: 870, y: 490 },
    // Centered on the visible thigh/shank seam so the knee counter-rotation
    // diverges least along the cut (round-2 finding: the far leg is the
    // bottom of the z-stack, so a knee gap has nothing behind it to show).
    farKnee: { x: 852, y: 592 },
    nearHip: { x: 750, y: 480 },
    nearKnee: { x: 735, y: 615 },
    farShoulder: { x: 430, y: 465 },
    nearShoulder: { x: 470, y: 465 },
  },
  layerBounds: {
    'far-hind-shank-foot': { x: 796, y: 561, width: 154, height: 234 },
    'far-hind-thigh': { x: 796, y: 429, width: 152, height: 192 },
    'near-hind-shank-foot': { x: 606, y: 579, width: 173, height: 222 },
    'near-hind-thigh': { x: 620, y: 421, width: 258, height: 202 },
    'far-forearm': { x: 392, y: 434, width: 74, height: 242 },
    'near-forearm': { x: 425, y: 434, width: 106, height: 264 },
    tail: { x: 874, y: 326, width: 642, height: 175 },
    pelvis: { x: 668, y: 295, width: 259, height: 212 },
    torso: { x: 371, y: 274, width: 327, height: 311 },
    neck: { x: 241, y: 236, width: 172, height: 251 },
    'head-upper': { x: 52, y: 231, width: 222, height: 159 },
    'jaw-lower': { x: 51, y: 344, width: 223, height: 63 },
  },
  meshSpecs: SHARED_MESH_SPECS,
  deform: {
    torso: {
      liftAmp: 8,
      dorsalRamp: [565, 295],
      pelvisPinRamp: [610, 696],
      chest: { amp: 2.2, cx: 655, halfW: 285, envelope: { rise: [285, 400], fall: [480, 585] } },
      plateau: {
        sample: { x: 470, y: 470 },
        x: { rise: [355, 400], fall: [545, 590] },
        y: { rise: [350, 395], fall: [590, 635] },
      },
    },
    neck: { xBase: 405, xHead: 290, liftBase: 5, liftHead: 4, rotPerHeadDeg: 0.45, rotPerBreath: -0.9 },
    head: { dxPerDeg: -0.5, dyPerDegUp: -0.12, dyPerDegDown: -0.3 },
    legs: {
      farThighAmp: -4.6,
      farShankAmp: 4,
      nearThighAmp: 5.8,
      nearShankAmp: 8,
      nearShiftForward: [2, -4.5],
      nearShiftBackward: [8.4, 3],
    },
    arms: { breathRot: -1.0 },
    pelvis: { settleAmp: 1.2, rotAmp: 1.2, xRamp: [740, 860], yPinRamp: [430, 500] },
    tail: {
      ramp: [960, 1480],
      swayRot: 5,
      strideRot: 2.4,
      breathRot: -0.7,
      shiftX: -4,
      shiftY: 2,
      legFollow: { xFade: [930, 990], yRamp: [415, 470], dx: -8, dy: 4 },
    },
  },
};

export const SPECIES_RIG_DEFS: Record<SpeciesId, SpeciesRigDef> = {
  trex: TREX_RIG_DEF,
  allosaurus: ALLOSAURUS_RIG_DEF,
};

/**
 * Rest-pose vertex positions for a meshed layer of a species: a uniform grid
 * over its bounds, row-major [x0, y0, x1, y1, …].
 */
export function restMeshPositions(def: SpeciesRigDef, layerId: MeshLayerId): number[] {
  const { columns, rows } = def.meshSpecs[layerId];
  const b = def.layerBounds[layerId];
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

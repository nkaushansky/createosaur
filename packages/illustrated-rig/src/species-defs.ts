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
  /**
   * Per-species jaw bound in degrees around the as-painted neutral: negative
   * clenches shut (painted pixels tuck into hidden overlap under the cheek).
   * The as-painted gap is the widest backable open, so max is 0 today.
   */
  jawRange: { min: number; max: number };
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
  packPath: 'rigs/trex-r0-v2',
  masterFile: 'trex-master-clean.png',
  seed: 20260718,
  // Trial: the v2 cut applies every IR1 slice rule (crease-following edges,
  // deep leg rims), so the range starts at full; the seam rounds set it.
  strideRange: { min: -1, max: 1 },
  // Jaw seam rounds (2026-07-21): clenching is fully backed (the jaw tucks
  // under the cheek with correct tooth occlusion) but opening past the
  // painted gap cannot be — the head is top of the z-stack, so nothing can
  // fill the strip the jaw vacates. Neutral IS the open pose.
  jawRange: { min: -8, max: 0 },
  pivots: {
    torso: { x: 650, y: 480 },
    pelvis: { x: 950, y: 400 },
    tail: { x: 1100, y: 400 },
    neck: { x: 430, y: 400 },
    head: { x: 185, y: 300 },
    jaw: { x: 250, y: 366 },
    farHip: { x: 620, y: 465 },
    farKnee: { x: 615, y: 635 },
    nearHip: { x: 755, y: 465 },
    nearKnee: { x: 800, y: 640 },
    farShoulder: { x: 405, y: 492 },
    nearShoulder: { x: 445, y: 480 },
  },
  layerBounds: {
    'far-hind-shank-foot': { x: 510, y: 571, width: 189, height: 213 },
    'far-hind-thigh': { x: 552, y: 415, width: 144, height: 225 },
    'near-hind-shank-foot': { x: 751, y: 596, width: 151, height: 192 },
    'near-hind-thigh': { x: 609, y: 400, width: 299, height: 246 },
    'far-forearm': { x: 382, y: 470, width: 47, height: 43 },
    'near-forearm': { x: 394, y: 460, width: 108, height: 129 },
    tail: { x: 1057, y: 326, width: 474, height: 149 },
    pelvis: { x: 812, y: 280, width: 283, height: 219 },
    torso: { x: 404, y: 254, width: 474, height: 381 },
    neck: { x: 223, y: 218, width: 255, height: 274 },
    'jaw-lower': { x: 45, y: 326, width: 216, height: 128 },
    'head-upper': { x: 34, y: 228, width: 234, height: 176 },
  },
  meshSpecs: SHARED_MESH_SPECS,
  deform: {
    torso: {
      liftAmp: 9,
      dorsalRamp: [630, 290],
      pelvisPinRamp: [770, 870],
      chest: { amp: 2.5, cx: 640, halfW: 250, envelope: { rise: [290, 430], fall: [505, 630] } },
      plateau: {
        sample: { x: 440, y: 500 },
        x: { rise: [360, 405], fall: [510, 555] },
        y: { rise: [420, 460], fall: [585, 625] },
      },
    },
    neck: { xBase: 460, xHead: 270, liftBase: 5.5, liftHead: 4.5, rotPerHeadDeg: 0.45, rotPerBreath: -0.9 },
    head: { dxPerDeg: -0.5, dyPerDegUp: -0.12, dyPerDegDown: -0.3 },
    legs: {
      farThighAmp: -4.8,
      farShankAmp: 4.5,
      nearThighAmp: 5.4,
      nearShankAmp: 7,
      nearShiftForward: [0, -4.8],
      nearShiftBackward: [7.2, 2],
    },
    arms: { breathRot: -1.0 },
    pelvis: { settleAmp: 1.2, rotAmp: 1.2, xRamp: [840, 960], yPinRamp: [460, 505] },
    tail: {
      ramp: [1080, 1530],
      swayRot: 5,
      strideRot: 2.4,
      breathRot: -0.7,
      shiftX: -4,
      shiftY: 2,
      legFollow: { xFade: [1060, 1120], yRamp: [440, 500], dx: -8, dy: 4 },
    },
  },
};

export const ALLOSAURUS_RIG_DEF: SpeciesRigDef = {
  speciesId: 'allosaurus',
  label: 'Allosaurus',
  packPath: 'rigs/allosaurus-r0-v2',
  masterFile: 'allosaurus-master-clean.png',
  seed: 20260720,
  // Trial at full range: the v2 cut keeps every rule that verified ±1 on
  // allosaurus-r0-v1 (crease edges, deep leg rims); the seam rounds confirm.
  strideRange: { min: -1, max: 1 },
  // Jaw seam rounds (2026-07-21): clenching is fully backed (the jaw tucks
  // under the cheek with correct tooth occlusion) but opening past the
  // painted gap cannot be — the head is top of the z-stack, so nothing can
  // fill the strip the jaw vacates. Neutral IS the open pose.
  jawRange: { min: -8, max: 0 },
  pivots: {
    torso: { x: 660, y: 470 },
    pelvis: { x: 1000, y: 390 },
    tail: { x: 1160, y: 420 },
    neck: { x: 430, y: 420 },
    head: { x: 240, y: 300 },
    jaw: { x: 238, y: 352 },
    farHip: { x: 905, y: 435 },
    // Knee pivots sit on the visible thigh/shank seam so counter-rotation
    // diverges least along the cut (IR1 finding: the far leg is the bottom
    // of the z-stack, so a knee gap has nothing behind it to show).
    farKnee: { x: 900, y: 598 },
    nearHip: { x: 800, y: 460 },
    nearKnee: { x: 790, y: 640 },
    farShoulder: { x: 455, y: 505 },
    nearShoulder: { x: 495, y: 495 },
  },
  layerBounds: {
    'far-hind-shank-foot': { x: 825, y: 584, width: 149, height: 236 },
    'far-hind-thigh': { x: 848, y: 384, width: 108, height: 112 },
    'near-hind-shank-foot': { x: 614, y: 623, width: 184, height: 200 },
    'near-hind-thigh': { x: 650, y: 380, width: 320, height: 285 },
    'far-forearm': { x: 392, y: 506, width: 119, height: 184 },
    'near-forearm': { x: 435, y: 476, width: 186, height: 236 },
    tail: { x: 1146, y: 343, width: 370, height: 141 },
    pelvis: { x: 858, y: 299, width: 314, height: 193 },
    torso: { x: 400, y: 271, width: 520, height: 420 },
    neck: { x: 226, y: 210, width: 246, height: 310 },
    'jaw-lower': { x: 54, y: 314, width: 208, height: 105 },
    'head-upper': { x: 39, y: 204, width: 233, height: 169 },
  },
  meshSpecs: SHARED_MESH_SPECS,
  deform: {
    torso: {
      liftAmp: 8,
      dorsalRamp: [580, 300],
      pelvisPinRamp: [790, 900],
      chest: { amp: 2.2, cx: 650, halfW: 260, envelope: { rise: [290, 400], fall: [500, 620] } },
      plateau: {
        sample: { x: 480, y: 500 },
        x: { rise: [420, 470], fall: [610, 660] },
        y: { rise: [440, 490], fall: [640, 690] },
      },
    },
    neck: { xBase: 430, xHead: 285, liftBase: 5, liftHead: 4, rotPerHeadDeg: 0.45, rotPerBreath: -0.9 },
    head: { dxPerDeg: -0.5, dyPerDegUp: -0.12, dyPerDegDown: -0.3 },
    legs: {
      // The v2 art tucks the far leg almost entirely behind the hip (204
      // visible px of thigh), so its swing stays small — the stride read
      // comes from the near leg and the tail.
      farThighAmp: -2.6,
      farShankAmp: 2.5,
      nearThighAmp: 4.6,
      nearShankAmp: 8,
      nearShiftForward: [1.5, -3.6],
      nearShiftBackward: [8.4, 3],
    },
    arms: { breathRot: -1.0 },
    pelvis: { settleAmp: 1.2, rotAmp: 1.2, xRamp: [900, 1030], yPinRamp: [400, 470] },
    tail: {
      ramp: [1180, 1500],
      swayRot: 5,
      strideRot: 2.4,
      breathRot: -0.7,
      shiftX: -4,
      shiftY: 2,
      legFollow: { xFade: [1130, 1190], yRamp: [400, 460], dx: -8, dy: 4 },
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

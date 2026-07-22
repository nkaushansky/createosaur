import type { PartsMeshLayerId, PartsRigDef } from './parts';
import type { MeshGridSpec } from './types';

/**
 * Parts-first species definitions. Layer bounds mirror the generated pack's
 * manifest.json (cross-checked by the web integrity test); pivots and deform
 * constants are tuned in the /rig-lab verify loop against the TRUE approved
 * master. trex-pf-r0 is the first pack assembled by tools/sheet-slicer from
 * the accepted round-4 parts contact sheet (D-021 architecture probe).
 */

const PARTS_MESH_SPECS: Record<PartsMeshLayerId, MeshGridSpec> = {
  core: { columns: 8, rows: 5 },
  neck: { columns: 4, rows: 4 },
  tail: { columns: 8, rows: 3 },
};

export const TREX_PF_RIG_DEF: PartsRigDef = {
  rigKind: 'theropod-parts',
  speciesId: 'trex-pf',
  label: 'Tyrannosaurus rex (parts-first)',
  packPath: 'rigs/trex-pf-r0',
  masterFile: 'trex-pf-master.png',
  seed: 20260722,
  // Whole-piece legs pivot at the hip with no knee to counter-rotate, so the
  // seam-clean stride envelope is tighter than the twelve-layer cut's ±1.
  strideRange: { min: -0.6, max: 0.6 },
  // Mouth is painted OPEN on the head (dark interior) with a separate jaw, so
  // neutral is the widest gape; the jaw can only clench shut from there.
  jawRange: { min: -8, max: 0 },
  pivots: {
    core: { x: 748, y: 408 },
    tail: { x: 1060, y: 430 },
    neck: { x: 428, y: 400 },
    head: { x: 225, y: 312 },
    jaw: { x: 240, y: 358 },
    farHip: { x: 606, y: 525 },
    nearHip: { x: 818, y: 522 },
    farShoulder: { x: 410, y: 482 },
    nearShoulder: { x: 448, y: 480 },
  },
  // These MUST equal the pack's manifest.json bounds (the web integrity test
  // enforces it): the mesh rest grid and pattern UVs are built from them.
  layerBounds: {
    'far-leg': { x: 487, y: 504, width: 238, height: 287 },
    tail: { x: 1003, y: 401, width: 518, height: 74 },
    core: { x: 404, y: 260, width: 688, height: 296 },
    'far-arm': { x: 381, y: 474, width: 69, height: 121 },
    'near-leg': { x: 729, y: 501, width: 212, height: 294 },
    'near-arm': { x: 410, y: 470, width: 76, height: 116 },
    neck: { x: 235, y: 271, width: 214, height: 174 },
    'jaw-lower': { x: 54, y: 339, width: 216, height: 98 },
    'head-upper': { x: 45, y: 233, width: 225, height: 134 },
  },
  meshSpecs: PARTS_MESH_SPECS,
  deform: {
    core: {
      liftAmp: 8,
      dorsalRamp: [540, 275],
      frontFade: [406, 560],
      rearFade: [960, 1092],
      chest: { amp: 2.2, cx: 700, halfW: 320, yRamp: [300, 520] },
      sample: { x: 452, y: 500 },
      settleAmp: 1,
    },
    neck: { xBase: 445, xHead: 255, liftBase: 5, liftHead: 4.5, rotPerHeadDeg: 0.45, rotPerBreath: -0.9 },
    head: { dxPerDeg: -0.5, dyPerDegUp: -0.12, dyPerDegDown: -0.3 },
    arms: { breathRot: -1.0 },
    legs: { nearAmp: 5, farAmp: -4, nearLift: -3 },
    tail: { ramp: [1090, 1500], swayRot: 6, strideRot: 2.6, breathRot: -0.7, shiftX: -4, shiftY: 2 },
  },
};

export const PARTS_RIG_DEFS: Record<string, PartsRigDef> = {
  'trex-pf': TREX_PF_RIG_DEF,
};

import type { PartsMeshLayerId, PartsRigDef } from './parts';
import type { MeshGridSpec } from './types';

/**
 * Parts-first species definitions. Layer bounds mirror the generated pack's
 * manifest.json (cross-checked by the web integrity test); pivots and deform
 * constants are tuned in the /rig-lab verify loop against the TRUE approved
 * master. trex-pf-r0 is assembled by tools/sheet-slicer from the round-5
 * head-cover parts sheet (a focused fixer round that replaced the round-4
 * flat neck / no-cover head — the front-third junction fix; D-021 probe).
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
    tail: { x: 1045, y: 430 },
    neck: { x: 430, y: 400 },
    head: { x: 250, y: 320 },
    jaw: { x: 250, y: 365 },
    farHip: { x: 610, y: 540 },
    nearHip: { x: 825, y: 542 },
    farShoulder: { x: 413, y: 483 },
    nearShoulder: { x: 450, y: 480 },
  },
  // These MUST equal the pack's manifest.json bounds (the web integrity test
  // enforces it): the mesh rest grid and pattern UVs are built from them.
  layerBounds: {
    'far-leg': { x: 494, y: 520, width: 223, height: 270 },
    tail: { x: 999, y: 403, width: 513, height: 74 },
    core: { x: 441, y: 270, width: 614, height: 276 },
    'far-arm': { x: 383, y: 475, width: 64, height: 113 },
    'near-leg': { x: 737, y: 522, width: 196, height: 272 },
    'near-arm': { x: 413, y: 471, width: 70, height: 108 },
    neck: { x: 271, y: 336, width: 184, height: 97 },
    'jaw-lower': { x: 63, y: 342, width: 198, height: 92 },
    'head-upper': { x: 37, y: 217, width: 304, height: 193 },
  },
  meshSpecs: PARTS_MESH_SPECS,
  deform: {
    core: {
      liftAmp: 8,
      dorsalRamp: [520, 285],
      frontFade: [443, 590],
      rearFade: [930, 1055],
      chest: { amp: 2.2, cx: 700, halfW: 320, yRamp: [300, 520] },
      sample: { x: 460, y: 500 },
      settleAmp: 1,
    },
    neck: { xBase: 448, xHead: 280, liftBase: 5, liftHead: 4.5, rotPerHeadDeg: 0.45, rotPerBreath: -0.9 },
    head: { dxPerDeg: -0.5, dyPerDegUp: -0.12, dyPerDegDown: -0.3 },
    arms: { breathRot: -1.0 },
    legs: { nearAmp: 5, farAmp: -4, nearLift: -3 },
    tail: { ramp: [1055, 1470], swayRot: 6, strideRot: 2.6, breathRot: -0.7, shiftX: -4, shiftY: 2 },
  },
};

export const PARTS_RIG_DEFS: Record<string, PartsRigDef> = {
  'trex-pf': TREX_PF_RIG_DEF,
};

/**
 * Parts-first theropod rig (IR — D-021 architecture probe).
 *
 * The v2 packs cut a finished master into twelve layers, so limbs sit UNDER a
 * hole-cut torso. The parts-first pack instead assembles nine SEPARATELY drawn
 * pieces over a single CLOSED core — the neck/head/limbs/tail draw OVER the
 * core, which has no openings. This module is the pure pose math for that
 * assembly: it reuses the same deformation *model* as pose.ts (a breathing
 * dorsal-lift field, a neck bend that hands off to a rigid skull, contact
 * legs, a pinned-root swaying tail) but adapts it to the nine-piece, single-
 * core geometry and the new z-order.
 *
 * Kept deliberately parallel to pose.ts rather than shared through it: the
 * twelve-layer evaluator is snapshot-locked bit-for-bit, and the parts geometry
 * differs enough (merged core, whole-piece legs, a −50°-laid neck) that a
 * shared signature would bend both out of shape. Same math, own constants.
 */
import { applyMat, compose, ramp, rotateAboutDeg, smoothstep01, translate } from './affine';
import { clampMotionToRanges, requestedMotion } from './pose';
import { meshIndices } from './species-defs';
import type {
  IllustratedRigParams,
  LayerPose,
  Mat2D,
  MeshGridSpec,
  MotionParams,
  Point,
  PoseOptions,
  RectBounds,
} from './types';

/** Nine parts-first pieces, back to front. Everything overlays the closed core. */
export const PARTS_LAYER_IDS = [
  'far-leg',
  'tail',
  'core',
  'far-arm',
  'near-leg',
  'near-arm',
  'neck',
  'jaw-lower',
  'head-upper',
] as const;
export type PartsLayerId = (typeof PARTS_LAYER_IDS)[number];

/** Pieces that deform at the vertex level (breath / bend / sway). */
export const PARTS_MESH_LAYER_IDS = ['tail', 'core', 'neck'] as const;
export type PartsMeshLayerId = (typeof PARTS_MESH_LAYER_IDS)[number];

export type PartsPivotId =
  | 'core'
  | 'tail'
  | 'neck'
  | 'head'
  | 'jaw'
  | 'nearHip'
  | 'farHip'
  | 'nearShoulder'
  | 'farShoulder';

type Ramp = readonly [number, number];

export interface PartsDeformDef {
  core: {
    liftAmp: number;
    /** [belly y, back y] — dorsal lift weight (1 at the back). */
    dorsalRamp: Ramp;
    /** x fade so the neck-base end of the core holds still. */
    frontFade: Ramp;
    /** x fade so the tail-root end of the core holds still. */
    rearFade: Ramp;
    chest: { amp: number; cx: number; halfW: number; yRamp: Ramp };
    /** Stage sample of the arm-contact strip: the drift both arms share. */
    sample: Point;
    settleAmp: number;
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
  arms: { breathRot: number };
  legs: { nearAmp: number; farAmp: number; nearLift: number };
  tail: { ramp: Ramp; swayRot: number; strideRot: number; breathRot: number; shiftX: number; shiftY: number };
}

export interface PartsRigDef {
  rigKind: 'theropod-parts';
  speciesId: string;
  label: string;
  /** Pack path under /public (no leading slash). */
  packPath: string;
  /** Pack-relative file of the TRUE approved master (identity underlay). */
  masterFile: string;
  seed: number;
  strideRange: { min: number; max: number };
  jawRange: { min: number; max: number };
  pivots: Record<PartsPivotId, Point>;
  layerBounds: Record<PartsLayerId, RectBounds>;
  meshSpecs: Record<PartsMeshLayerId, MeshGridSpec>;
  deform: PartsDeformDef;
}

/** Rest grid over a rectangle, row-major [x0,y0,x1,y1,…] — parts analogue of restMeshPositions. */
export function restPartsMesh(def: PartsRigDef, layerId: PartsMeshLayerId): number[] {
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

export { meshIndices as partsMeshIndices };

/** The motion values a parts pose is actually built from. */
export function partsEffectiveMotion(
  def: PartsRigDef,
  params: IllustratedRigParams,
  options: PoseOptions
): MotionParams {
  return clampMotionToRanges(requestedMotion(params, options), def.strideRange, def.jawRange);
}

/** Core breathing displacement field, in stage px. Lift concentrates at the
 * back, fades to the belly and to both pinned ends (neck base, tail root). */
function coreField(def: PartsRigDef, x: number, y: number, breath: number): Point {
  const c = def.deform.core;
  const wDorsal = ramp(c.dorsalRamp[0], c.dorsalRamp[1], y);
  const wFront = ramp(c.frontFade[0], c.frontFade[1], x);
  const wRear = 1 - ramp(c.rearFade[0], c.rearFade[1], x);
  const wEnds = wFront * wRear;
  const wChestY = ramp(c.chest.yRamp[0], c.chest.yRamp[1], y);
  return {
    x: breath * c.chest.amp * ((x - c.chest.cx) / c.chest.halfW) * wChestY * wEnds,
    y: -breath * c.liftAmp * wDorsal * wEnds,
  };
}

/** The drift of the arm-contact strip — the translation both arms share. */
function chestDrift(def: PartsRigDef, breath: number): Point {
  return coreField(def, def.deform.core.sample.x, def.deform.core.sample.y, breath);
}

function neckRotDeg(def: PartsRigDef, motion: MotionParams): number {
  const n = def.deform.neck;
  return motion.headAngle * n.rotPerHeadDeg + motion.breath * n.rotPerBreath;
}

/** The rigid operation the neck applies at its head end — the head assembly's base. */
function headBaseMatrix(def: PartsRigDef, motion: MotionParams): Mat2D {
  const n = def.deform.neck;
  return compose(
    translate(0, -motion.breath * (n.liftBase + n.liftHead)),
    rotateAboutDeg(def.pivots.neck, neckRotDeg(def, motion))
  );
}

function headMatrix(def: PartsRigDef, motion: MotionParams): Mat2D {
  const h = def.deform.head;
  const headRot = motion.headAngle;
  const headDx = headRot * h.dxPerDeg;
  const headDy = headRot * (headRot < 0 ? h.dyPerDegDown : h.dyPerDegUp);
  return compose(headBaseMatrix(def, motion), translate(headDx, headDy), rotateAboutDeg(def.pivots.head, headRot));
}

function coreMesh(def: PartsRigDef, motion: MotionParams): number[] {
  const positions = restPartsMesh(def, 'core');
  const settle = motion.breath * def.deform.core.settleAmp;
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const d = coreField(def, x, y, motion.breath);
    positions[i] = x + d.x;
    positions[i + 1] = y + d.y + settle * (1 - ramp(def.deform.core.dorsalRamp[0], def.deform.core.dorsalRamp[1], y));
  }
  return positions;
}

function neckT(def: PartsRigDef, x: number): number {
  return ramp(def.deform.neck.xBase, def.deform.neck.xHead, x);
}

function neckMesh(def: PartsRigDef, motion: MotionParams): number[] {
  const n = def.deform.neck;
  const rot = neckRotDeg(def, motion);
  const positions = restPartsMesh(def, 'neck');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const t = neckT(def, x);
    const bent = applyMat(rotateAboutDeg(def.pivots.neck, rot * t), { x, y });
    positions[i] = bent.x;
    positions[i + 1] = bent.y - motion.breath * (n.liftBase + n.liftHead * t);
  }
  return positions;
}

function tailMesh(def: PartsRigDef, motion: MotionParams): number[] {
  const t = def.deform.tail;
  const tailRot = motion.tailSway * t.swayRot + motion.stride * t.strideRot + motion.breath * t.breathRot;
  const shiftX = motion.tailSway * t.shiftX;
  const shiftY = motion.tailSway * t.shiftY;
  const positions = restPartsMesh(def, 'tail');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    // Root (under the core) pinned; sway grows smoothly toward the tip.
    const tt = smoothstep01(ramp(t.ramp[0], t.ramp[1], x));
    const turned = applyMat(rotateAboutDeg(def.pivots.tail, tailRot * tt), { x, y });
    positions[i] = turned.x + shiftX * tt;
    positions[i + 1] = turned.y + shiftY * tt;
  }
  return positions;
}

/** The four rigid leg/arm matrices. Legs are whole pieces that pivot at the
 * hip (no separate knee — the piece is one brick); the near, weight-bearing
 * leg lifts a touch as it swings so a forward stride reads as a step. */
function limbMatrices(def: PartsRigDef, motion: MotionParams): {
  farLeg: Mat2D;
  nearLeg: Mat2D;
  farArm: Mat2D;
  nearArm: Mat2D;
} {
  const l = def.deform.legs;
  const s = motion.stride;
  const nearLegShift = translate(0, Math.max(0, s) * l.nearLift);
  const drift = chestDrift(def, motion.breath);
  const armRot = motion.breath * def.deform.arms.breathRot;
  return {
    farLeg: rotateAboutDeg(def.pivots.farHip, s * l.farAmp),
    nearLeg: compose(nearLegShift, rotateAboutDeg(def.pivots.nearHip, s * l.nearAmp)),
    farArm: compose(translate(drift.x, drift.y), rotateAboutDeg(def.pivots.farShoulder, armRot)),
    nearArm: compose(translate(drift.x, drift.y), rotateAboutDeg(def.pivots.nearShoulder, armRot)),
  };
}

export interface EvaluatedPartsPose {
  effective: MotionParams;
  layers: Record<PartsLayerId, LayerPose>;
}

/**
 * evaluatePartsRigPose — the whole parts-first animation model as one pure
 * function. (def, params, seed, timeMs) → nine layer poses. Deterministic:
 * same inputs, same numbers, so frozen-time screenshots and snapshots hold.
 */
export function evaluatePartsRigPose(
  def: PartsRigDef,
  params: IllustratedRigParams,
  options: PoseOptions
): EvaluatedPartsPose {
  const motion = partsEffectiveMotion(def, params, options);
  const headM = headMatrix(def, motion);
  const jawM = compose(headM, rotateAboutDeg(def.pivots.jaw, -motion.jawAngle));
  const limbs = limbMatrices(def, motion);

  const layers: Record<PartsLayerId, LayerPose> = {
    'far-leg': { kind: 'transform', matrix: limbs.farLeg },
    tail: { kind: 'mesh', grid: def.meshSpecs.tail, positions: tailMesh(def, motion) },
    core: { kind: 'mesh', grid: def.meshSpecs.core, positions: coreMesh(def, motion) },
    'far-arm': { kind: 'transform', matrix: limbs.farArm },
    'near-leg': { kind: 'transform', matrix: limbs.nearLeg },
    'near-arm': { kind: 'transform', matrix: limbs.nearArm },
    neck: { kind: 'mesh', grid: def.meshSpecs.neck, positions: neckMesh(def, motion) },
    'jaw-lower': { kind: 'transform', matrix: jawM },
    'head-upper': { kind: 'transform', matrix: headM },
  };
  return { effective: motion, layers };
}

/** Where the debug overlay should draw each pivot for a given parts pose. */
export function partsPosedPivots(def: PartsRigDef, pose: EvaluatedPartsPose): Record<PartsPivotId, Point> {
  const layerFor: Partial<Record<PartsPivotId, PartsLayerId>> = {
    head: 'head-upper',
    jaw: 'jaw-lower',
    farHip: 'far-leg',
    nearHip: 'near-leg',
    farShoulder: 'far-arm',
    nearShoulder: 'near-arm',
  };
  const out = {} as Record<PartsPivotId, Point>;
  for (const key of Object.keys(def.pivots) as PartsPivotId[]) {
    const layerId = layerFor[key];
    const layer = layerId ? pose.layers[layerId] : undefined;
    out[key] =
      layer && layer.kind === 'transform' ? applyMat(layer.matrix, def.pivots[key]) : def.pivots[key];
  }
  return out;
}

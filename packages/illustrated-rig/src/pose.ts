import { applyMat, compose, ramp, rotateAboutDeg, smoothstep01, translate } from './affine';
import { idleMotion } from './idle';
import { clampRigParams } from './params';
import { MESH_SPECS, PIVOTS, restMeshPositions } from './rig-def';
import type {
  EvaluatedRigPose,
  IllustratedRigParams,
  LayerPose,
  Mat2D,
  MotionParams,
  PoseOptions,
  Point,
  RigLayerId,
} from './types';

/**
 * evaluateRigPose — the whole animation model as one pure function.
 *
 * (params, seed, timeMs) → per-layer transforms and mesh vertices, nothing
 * else. The browser feeds it a live clock; tests feed it a frozen one. Same
 * inputs, same numbers, to the last bit — that invariant is what makes the
 * fixed-time screenshot mode and the snapshot tests possible.
 *
 * Deformation model (kept deliberately small for IR0):
 * - torso/neck/pelvis/tail deform at the vertex level (breathing, neck
 *   compensation, settling, sway);
 * - head, jaw, forearms and both hind-leg chains are rigid transforms;
 * - the head assembly reuses the exact end-of-neck operation, so the
 *   neck's hidden extension under the head tracks the skull rigidly and the
 *   head↔neck seam cannot open by construction.
 */

/** The motion values a pose is actually built from. */
export function effectiveMotion(params: IllustratedRigParams, options: PoseOptions): MotionParams {
  const clamped = clampRigParams(params);
  if (!clamped.reducedMotion && clamped.autoIdle) return idleMotion(options.seed, options.timeMs);
  return {
    headAngle: clamped.headAngle,
    jawAngle: clamped.jawAngle,
    breath: clamped.breath,
    stride: clamped.stride,
    tailSway: clamped.tailSway,
  };
}

/**
 * Torso breathing displacement field, in stage px. Dorsal lift fades to zero
 * toward the belly/thigh line (feet stay planted) and toward the pelvis
 * boundary (that seam's vertices hold still); a slight forward chest swell
 * keeps the ribcage reading as volume rather than a vertical elevator.
 */
function torsoFieldBase(x: number, y: number, breath: number): Point {
  const wDorsal = ramp(760, 300, y);
  const wPelvisPin = 1 - ramp(650, 734, x);
  const wChestY = ramp(280, 420, y) * (1 - ramp(520, 700, y));
  return {
    x: breath * 2.5 * ((x - 690) / 315) * wChestY * wPelvisPin,
    y: -breath * 9 * wDorsal * wPelvisPin,
  };
}

/**
 * The forearms hang over the chest edge along an alpha-flush contact — any
 * differential motion there opens a hairline (round-1 finding). The field is
 * flattened to one value across the arm-contact strip, and both arms ride
 * that same value, so arms and the chest art covering them move in unison.
 */
const SHOULDER_SAMPLE: Point = { x: 455, y: 495 };

function shoulderPlateauWeight(x: number, y: number): number {
  const wx = ramp(343, 388, x) * (1 - ramp(500, 545, x));
  const wy = ramp(367, 412, y) * (1 - ramp(580, 625, y));
  return wx * wy;
}

function torsoField(x: number, y: number, breath: number): Point {
  const base = torsoFieldBase(x, y, breath);
  const plateau = torsoFieldBase(SHOULDER_SAMPLE.x, SHOULDER_SAMPLE.y, breath);
  const w = shoulderPlateauWeight(x, y);
  return { x: base.x + (plateau.x - base.x) * w, y: base.y + (plateau.y - base.y) * w };
}

/** Neck bend parameter: 0 at the torso junction, 1 where the skull takes over. */
function neckT(x: number): number {
  return ramp(465, 305, x);
}

// Base lift matches the flattened torso field at the neck-torso junction so
// the two layers ride together; the head end gets a little extra rise.
const NECK_LIFT_BASE = 5.5;
const NECK_LIFT_HEAD = 4.5;

function neckAngles(motion: MotionParams): { neckRot: number; headRot: number } {
  return {
    neckRot: motion.headAngle * 0.45 - motion.breath * 0.9,
    headRot: motion.headAngle,
  };
}

/** The rigid operation the neck applies at its head end — the head assembly's base. */
function headBaseMatrix(motion: MotionParams): Mat2D {
  const { neckRot } = neckAngles(motion);
  return compose(
    translate(0, -motion.breath * (NECK_LIFT_BASE + NECK_LIFT_HEAD)),
    rotateAboutDeg(PIVOTS.neck, neckRot)
  );
}

function headMatrix(motion: MotionParams): Mat2D {
  const { headRot } = neckAngles(motion);
  const headDx = headRot * -0.5;
  const headDy = headRot < 0 ? -headRot * 0.3 : -headRot * 0.12;
  return compose(headBaseMatrix(motion), translate(headDx, headDy), rotateAboutDeg(PIVOTS.head, headRot));
}

function legMatrices(motion: MotionParams): {
  farThigh: Mat2D;
  farShank: Mat2D;
  nearThigh: Mat2D;
  nearShank: Mat2D;
} {
  // Trailing-leg knee flexion only (the max branches). The prototype's small
  // counter-rotation on the leading shank popped the shank's hidden top
  // corner past the thigh silhouette (round-1 finding) — dropped.
  const s = motion.stride;
  const farThighRot = s * -5.2;
  const farShankRot = Math.max(0, s) * 7.5;
  const nearThighRot = s * 5.8;
  const nearShankRot = Math.max(0, -s) * 8;

  // The near thigh's exposed contact flips with direction: swinging forward
  // (s>0) pops its trailing edge out of the pelvis/tail silhouette; swinging
  // back (s<0) drops its front edge out of the belly line. A small counter-
  // translate pins whichever contact is exposed (the opposite edge tucks
  // deeper under cover, which is always safe) — and lets the stepping foot
  // lift a little, which reads naturally.
  const nearShift =
    s >= 0 ? translate(0, -6 * s) : translate(4.2 * s, 3.6 * s);

  const farThigh = rotateAboutDeg(PIVOTS.farHip, farThighRot);
  const nearThigh = compose(nearShift, rotateAboutDeg(PIVOTS.nearHip, nearThighRot));
  return {
    farThigh,
    farShank: compose(farThigh, rotateAboutDeg(PIVOTS.farKnee, farShankRot)),
    nearThigh,
    nearShank: compose(nearThigh, rotateAboutDeg(PIVOTS.nearKnee, nearShankRot)),
  };
}

function forearmMatrices(motion: MotionParams): { far: Mat2D; near: Mat2D } {
  // Both arms ride the chest's plateau displacement in unison, with identical
  // breath swing — any differential would slice a hairline where the hands
  // hang flush against each other and the belly edge.
  // No stride swing at all: the arms' outer edges sit flush against the
  // belly silhouette, and any rotation differential tears that contact at
  // reverse stride. Arms live through the breath drift alone.
  const drift = torsoField(SHOULDER_SAMPLE.x, SHOULDER_SAMPLE.y, motion.breath);
  const farRot = -motion.breath * 1.0;
  const nearRot = -motion.breath * 1.0;
  return {
    far: compose(translate(drift.x, drift.y), rotateAboutDeg(PIVOTS.farShoulder, farRot)),
    near: compose(translate(drift.x, drift.y), rotateAboutDeg(PIVOTS.nearShoulder, nearRot)),
  };
}

function torsoMesh(motion: MotionParams): number[] {
  const positions = restMeshPositions('torso');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const d = torsoField(x, y, motion.breath);
    positions[i] = x + d.x;
    positions[i + 1] = y + d.y;
  }
  return positions;
}

function neckMesh(motion: MotionParams): number[] {
  const { neckRot } = neckAngles(motion);
  const positions = restMeshPositions('neck');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const t = neckT(x);
    const bent = applyMat(rotateAboutDeg(PIVOTS.neck, neckRot * t), { x, y });
    positions[i] = bent.x;
    positions[i + 1] = bent.y - motion.breath * (NECK_LIFT_BASE + NECK_LIFT_HEAD * t);
  }
  return positions;
}

function pelvisMesh(motion: MotionParams): number[] {
  const settleDy = motion.breath * 1.2;
  const rot = motion.stride * 1.2;
  const positions = restMeshPositions('pelvis');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    // Bend toward the tail side; the torso-boundary vertices stay pinned.
    const w = ramp(700, 820, x);
    const turned = applyMat(rotateAboutDeg(PIVOTS.pelvis, rot * w), { x, y });
    positions[i] = turned.x;
    positions[i + 1] = turned.y + settleDy;
  }
  return positions;
}

function tailMesh(motion: MotionParams): number[] {
  const tailRot = motion.tailSway * 5 + motion.stride * 2.4 - motion.breath * 0.7;
  const shiftX = -motion.tailSway * 4;
  const shiftY = motion.tailSway * 2;
  const positions = restMeshPositions('tail');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    // The base (hidden under the pelvis) is pinned; sway grows toward the tip.
    const t = smoothstep01(ramp(870, 1500, x));
    const turned = applyMat(rotateAboutDeg(PIVOTS.tail, tailRot * t), { x, y });
    positions[i] = turned.x + shiftX * t;
    positions[i + 1] = turned.y + shiftY * t;
  }
  return positions;
}

export function evaluateRigPose(params: IllustratedRigParams, options: PoseOptions): EvaluatedRigPose {
  const motion = effectiveMotion(params, options);

  const headM = headMatrix(motion);
  const jawM = compose(headM, rotateAboutDeg(PIVOTS.jaw, motion.jawAngle));
  const legs = legMatrices(motion);
  const arms = forearmMatrices(motion);

  const layers: Record<RigLayerId, LayerPose> = {
    'far-hind-shank-foot': { kind: 'transform', matrix: legs.farShank },
    'far-hind-thigh': { kind: 'transform', matrix: legs.farThigh },
    'near-hind-shank-foot': { kind: 'transform', matrix: legs.nearShank },
    'near-hind-thigh': { kind: 'transform', matrix: legs.nearThigh },
    'far-forearm': { kind: 'transform', matrix: arms.far },
    'near-forearm': { kind: 'transform', matrix: arms.near },
    tail: { kind: 'mesh', grid: MESH_SPECS.tail, positions: tailMesh(motion) },
    pelvis: { kind: 'mesh', grid: MESH_SPECS.pelvis, positions: pelvisMesh(motion) },
    torso: { kind: 'mesh', grid: MESH_SPECS.torso, positions: torsoMesh(motion) },
    neck: { kind: 'mesh', grid: MESH_SPECS.neck, positions: neckMesh(motion) },
    'head-upper': { kind: 'transform', matrix: headM },
    'jaw-lower': { kind: 'transform', matrix: jawM },
  };

  return { effective: motion, layers };
}

/** Where the debug overlay should draw each pivot for a given pose. */
export function posedPivots(pose: EvaluatedRigPose): Record<keyof typeof PIVOTS, Point> {
  const layerFor: Partial<Record<keyof typeof PIVOTS, RigLayerId>> = {
    head: 'head-upper',
    jaw: 'jaw-lower',
    farHip: 'far-hind-thigh',
    farKnee: 'far-hind-shank-foot',
    nearHip: 'near-hind-thigh',
    nearKnee: 'near-hind-shank-foot',
    farShoulder: 'far-forearm',
    nearShoulder: 'near-forearm',
  };
  const out = {} as Record<keyof typeof PIVOTS, Point>;
  for (const key of Object.keys(PIVOTS) as (keyof typeof PIVOTS)[]) {
    const layerId = layerFor[key];
    const layer = layerId ? pose.layers[layerId] : undefined;
    out[key] = layer && layer.kind === 'transform' ? applyMat(layer.matrix, PIVOTS[key]) : PIVOTS[key];
  }
  return out;
}

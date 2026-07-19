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
function torsoField(x: number, y: number, breath: number): Point {
  const wDorsal = ramp(760, 300, y);
  const wPelvisPin = 1 - ramp(650, 734, x);
  const wChestY = ramp(280, 420, y) * (1 - ramp(520, 700, y));
  return {
    x: breath * 2.5 * ((x - 690) / 315) * wChestY * wPelvisPin,
    y: -breath * 9 * wDorsal * wPelvisPin,
  };
}

/** Neck bend parameter: 0 at the torso junction, 1 where the skull takes over. */
function neckT(x: number): number {
  return ramp(465, 305, x);
}

const NECK_LIFT_BASE = 6;
const NECK_LIFT_HEAD = 4;

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
  const s = motion.stride;
  const farThighRot = s * -7;
  const farShankRot = Math.max(0, s) * 9 + Math.min(0, s) * 2;
  const nearThighRot = s * 7;
  const nearShankRot = Math.max(0, -s) * 9 + Math.min(0, -s) * 2;

  const farThigh = rotateAboutDeg(PIVOTS.farHip, farThighRot);
  const nearThigh = rotateAboutDeg(PIVOTS.nearHip, nearThighRot);
  return {
    farThigh,
    farShank: compose(farThigh, rotateAboutDeg(PIVOTS.farKnee, farShankRot)),
    nearThigh,
    nearShank: compose(nearThigh, rotateAboutDeg(PIVOTS.nearKnee, nearShankRot)),
  };
}

function forearmMatrices(motion: MotionParams): { far: Mat2D; near: Mat2D } {
  // Arms hang from the breathing chest: they track the torso field at their
  // shoulder pivots, then add the prototype's small compensating swings.
  const farDrift = torsoField(PIVOTS.farShoulder.x, PIVOTS.farShoulder.y, motion.breath);
  const nearDrift = torsoField(PIVOTS.nearShoulder.x, PIVOTS.nearShoulder.y, motion.breath);
  const farRot = motion.stride * 4 - motion.breath * 1.2;
  const nearRot = -motion.stride * 4 - motion.breath * 0.8;
  return {
    far: compose(translate(farDrift.x, farDrift.y), rotateAboutDeg(PIVOTS.farShoulder, farRot)),
    near: compose(translate(nearDrift.x, nearDrift.y), rotateAboutDeg(PIVOTS.nearShoulder, nearRot)),
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

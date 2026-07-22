import { applyMat, clamp, compose, ramp, rotateAboutDeg, smoothstep01, translate } from './affine';
import { idleMotion } from './idle';
import { clampRigParams } from './params';
import { restMeshPositions, type PivotId, type SpeciesRigDef } from './species-defs';
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
 * (def, params, seed, timeMs) → per-layer transforms and mesh vertices,
 * nothing else. The browser feeds it a live clock; tests feed it a frozen
 * one. Same inputs, same numbers, to the last bit — that invariant is what
 * makes the fixed-time screenshot mode and the snapshot tests possible.
 *
 * The deformation model (breathing field with a flattened shoulder plateau,
 * neck bend that hands off rigidly to the skull, contact-pinned leg chains,
 * pinned-root tail with leg-follow) is shared across species; every constant
 * comes from the SpeciesRigDef, tuned per pack in its visual seam rounds.
 */

function envelopeWeight(w: { rise: readonly [number, number]; fall: readonly [number, number] }, v: number): number {
  return ramp(w.rise[0], w.rise[1], v) * (1 - ramp(w.fall[0], w.fall[1], v));
}

/**
 * The raw requested motion — live sliders, or the idle loop when it drives.
 * Species/hybrid envelopes are applied on top by clampMotionToRanges.
 */
export function requestedMotion(params: IllustratedRigParams, options: PoseOptions): MotionParams {
  const clamped = clampRigParams(params);
  return !clamped.reducedMotion && clamped.autoIdle
    ? idleMotion(options.seed, options.timeMs)
    : {
        headAngle: clamped.headAngle,
        jawAngle: clamped.jawAngle,
        breath: clamped.breath,
        stride: clamped.stride,
        tailSway: clamped.tailSway,
      };
}

/** Clamp stride and jaw into a pack's seam-clean envelope. */
export function clampMotionToRanges(
  motion: MotionParams,
  strideRange: { min: number; max: number },
  jawRange: { min: number; max: number }
): MotionParams {
  return {
    ...motion,
    stride: clamp(motion.stride, strideRange.min, strideRange.max),
    jawAngle: clamp(motion.jawAngle, jawRange.min, jawRange.max),
  };
}

/** The motion values a pose is actually built from. */
export function effectiveMotion(
  def: SpeciesRigDef,
  params: IllustratedRigParams,
  options: PoseOptions
): MotionParams {
  return clampMotionToRanges(requestedMotion(params, options), def.strideRange, def.jawRange);
}

/**
 * Torso breathing displacement field, in stage px. Dorsal lift fades to zero
 * toward the belly/thigh line (feet stay planted) and toward the pelvis
 * boundary (that seam's vertices hold still); a slight forward chest swell
 * keeps the ribcage reading as volume rather than a vertical elevator. The
 * field is flattened to one value across the arm-contact strip so arms and
 * the chest art covering them move in unison (IR0 round-1 finding).
 */
function torsoFieldBase(def: SpeciesRigDef, x: number, y: number, breath: number): Point {
  const t = def.deform.torso;
  const wDorsal = ramp(t.dorsalRamp[0], t.dorsalRamp[1], y);
  const wPelvisPin = 1 - ramp(t.pelvisPinRamp[0], t.pelvisPinRamp[1], x);
  const wChestY = envelopeWeight(t.chest.envelope, y);
  return {
    x: breath * t.chest.amp * ((x - t.chest.cx) / t.chest.halfW) * wChestY * wPelvisPin,
    y: -breath * t.liftAmp * wDorsal * wPelvisPin,
  };
}

function shoulderPlateauWeight(def: SpeciesRigDef, x: number, y: number): number {
  const p = def.deform.torso.plateau;
  return envelopeWeight(p.x, x) * envelopeWeight(p.y, y);
}

function torsoField(def: SpeciesRigDef, x: number, y: number, breath: number): Point {
  const sample = def.deform.torso.plateau.sample;
  const base = torsoFieldBase(def, x, y, breath);
  const plateau = torsoFieldBase(def, sample.x, sample.y, breath);
  const w = shoulderPlateauWeight(def, x, y);
  return { x: base.x + (plateau.x - base.x) * w, y: base.y + (plateau.y - base.y) * w };
}

/** Neck bend parameter: 0 at the torso junction, 1 where the skull takes over. */
function neckT(def: SpeciesRigDef, x: number): number {
  return ramp(def.deform.neck.xBase, def.deform.neck.xHead, x);
}

function neckRotDeg(def: SpeciesRigDef, motion: MotionParams): number {
  const n = def.deform.neck;
  return motion.headAngle * n.rotPerHeadDeg + motion.breath * n.rotPerBreath;
}

/** The rigid operation the neck applies at its head end — the head assembly's base. */
export function headBaseMatrix(def: SpeciesRigDef, motion: MotionParams): Mat2D {
  const n = def.deform.neck;
  return compose(
    translate(0, -motion.breath * (n.liftBase + n.liftHead)),
    rotateAboutDeg(def.pivots.neck, neckRotDeg(def, motion))
  );
}

export function headMatrix(def: SpeciesRigDef, motion: MotionParams): Mat2D {
  const h = def.deform.head;
  const headRot = motion.headAngle;
  const headDx = headRot * h.dxPerDeg;
  const headDy = headRot * (headRot < 0 ? h.dyPerDegDown : h.dyPerDegUp);
  return compose(
    headBaseMatrix(def, motion),
    translate(headDx, headDy),
    rotateAboutDeg(def.pivots.head, headRot)
  );
}

export function legMatrices(def: SpeciesRigDef, motion: MotionParams): {
  farThigh: Mat2D;
  farShank: Mat2D;
  nearThigh: Mat2D;
  nearShank: Mat2D;
} {
  const l = def.deform.legs;
  const s = motion.stride;
  const farThighRot = s * l.farThighAmp;
  const farShankRot = Math.max(0, s) * l.farShankAmp;
  const nearThighRot = s * l.nearThighAmp;
  const nearShankRot = Math.max(0, -s) * l.nearShankAmp;

  // The near thigh's exposed contact flips with direction: swinging forward
  // pops its trailing edge out of the pelvis/tail silhouette; swinging back
  // drops its front edge out of the belly line. A counter-translate pins
  // whichever contact is exposed — and lets the stepping foot lift a little,
  // which reads naturally.
  const shift = s >= 0 ? l.nearShiftForward : l.nearShiftBackward;
  const nearShift = translate(shift[0] * s, shift[1] * s);

  const farThigh = rotateAboutDeg(def.pivots.farHip, farThighRot);
  const nearThigh = compose(nearShift, rotateAboutDeg(def.pivots.nearHip, nearThighRot));
  return {
    farThigh,
    farShank: compose(farThigh, rotateAboutDeg(def.pivots.farKnee, farShankRot)),
    nearThigh,
    nearShank: compose(nearThigh, rotateAboutDeg(def.pivots.nearKnee, nearShankRot)),
  };
}

/**
 * The displacement of the chest's flattened arm-contact strip — the exact
 * translation both arms must share so the flush arm/belly contact never
 * shears (IR0 round-1 finding). Hybrid donor arms ride the base body's drift.
 */
export function chestDrift(def: SpeciesRigDef, motion: MotionParams): Point {
  const sample = def.deform.torso.plateau.sample;
  return torsoField(def, sample.x, sample.y, motion.breath);
}

function forearmMatrices(def: SpeciesRigDef, motion: MotionParams): { far: Mat2D; near: Mat2D } {
  // Both arms ride the chest's plateau displacement in unison, breath swing
  // only — any stride rotation tears the flush arm/belly contact.
  const drift = chestDrift(def, motion);
  const rot = motion.breath * def.deform.arms.breathRot;
  return {
    far: compose(translate(drift.x, drift.y), rotateAboutDeg(def.pivots.farShoulder, rot)),
    near: compose(translate(drift.x, drift.y), rotateAboutDeg(def.pivots.nearShoulder, rot)),
  };
}

function torsoMesh(def: SpeciesRigDef, motion: MotionParams): number[] {
  const positions = restMeshPositions(def, 'torso');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const d = torsoField(def, x, y, motion.breath);
    positions[i] = x + d.x;
    positions[i + 1] = y + d.y;
  }
  return positions;
}

function neckMesh(def: SpeciesRigDef, motion: MotionParams): number[] {
  const n = def.deform.neck;
  const rot = neckRotDeg(def, motion);
  const positions = restMeshPositions(def, 'neck');
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

function pelvisMesh(def: SpeciesRigDef, motion: MotionParams): number[] {
  const p = def.deform.pelvis;
  const settleDy = motion.breath * p.settleAmp;
  const rot = motion.stride * p.rotAmp;
  const positions = restMeshPositions(def, 'pelvis');
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    // Bend toward the tail side; the torso-boundary vertices stay pinned —
    // and so does the lower half: the pelvis's rear-bottom silhouette is the
    // cover over the tail-root and shank overlap strips, and any slide there
    // uncovers them.
    const w = ramp(p.xRamp[0], p.xRamp[1], x) * (1 - ramp(p.yPinRamp[0], p.yPinRamp[1], y));
    const turned = applyMat(rotateAboutDeg(def.pivots.pelvis, rot * w), { x, y });
    positions[i] = turned.x;
    positions[i + 1] = turned.y + settleDy;
  }
  return positions;
}

function tailMesh(def: SpeciesRigDef, motion: MotionParams): number[] {
  return tailMeshFrom(def, motion, restMeshPositions(def, 'tail'));
}

/**
 * The tail deformation field applied to explicit rest vertices. The field is
 * a function of stage position, so a donor tail translated into the base's
 * stage space deforms under the base body's own pin ramps and leg-follow.
 */
export function tailMeshFrom(def: SpeciesRigDef, motion: MotionParams, rest: readonly number[]): number[] {
  const t = def.deform.tail;
  const tailRot = motion.tailSway * t.swayRot + motion.stride * t.strideRot + motion.breath * t.breathRot;
  const shiftX = motion.tailSway * t.shiftX;
  const shiftY = motion.tailSway * t.shiftY;
  // The tail-root flesh behind the near thigh follows the forward-swinging
  // leg a little (weight-faded, like haunch flesh) — otherwise the leg pulls
  // away from the root's cut edge and leaves a slit.
  const legFollow = Math.max(0, motion.stride);
  const positions = rest.slice();
  for (let i = 0; i < positions.length; i += 2) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    // The base (hidden under the pelvis) is pinned; sway grows toward the tip.
    const tt = smoothstep01(ramp(t.ramp[0], t.ramp[1], x));
    const turned = applyMat(rotateAboutDeg(def.pivots.tail, tailRot * tt), { x, y });
    const wFollow = (1 - ramp(t.legFollow.xFade[0], t.legFollow.xFade[1], x)) * ramp(t.legFollow.yRamp[0], t.legFollow.yRamp[1], y);
    positions[i] = turned.x + shiftX * tt + t.legFollow.dx * legFollow * wFollow;
    positions[i + 1] = turned.y + shiftY * tt + t.legFollow.dy * legFollow * wFollow;
  }
  return positions;
}

export function evaluateRigPose(
  def: SpeciesRigDef,
  params: IllustratedRigParams,
  options: PoseOptions
): EvaluatedRigPose {
  const motion = effectiveMotion(def, params, options);
  return { effective: motion, layers: poseLayers(def, motion) };
}

/** All twelve layer poses of one species for an already-resolved motion. */
export function poseLayers(def: SpeciesRigDef, motion: MotionParams): Record<RigLayerId, LayerPose> {
  const headM = headMatrix(def, motion);
  // Positive jawAngle opens (chin drops), negative clenches — the hinge sits
  // behind the mouth corner, so screen-clockwise rotation would lift the chin.
  const jawM = compose(headM, rotateAboutDeg(def.pivots.jaw, -motion.jawAngle));
  const legs = legMatrices(def, motion);
  const arms = forearmMatrices(def, motion);

  const layers: Record<RigLayerId, LayerPose> = {
    'far-hind-shank-foot': { kind: 'transform', matrix: legs.farShank },
    'far-hind-thigh': { kind: 'transform', matrix: legs.farThigh },
    'near-hind-shank-foot': { kind: 'transform', matrix: legs.nearShank },
    'near-hind-thigh': { kind: 'transform', matrix: legs.nearThigh },
    'far-forearm': { kind: 'transform', matrix: arms.far },
    'near-forearm': { kind: 'transform', matrix: arms.near },
    tail: { kind: 'mesh', grid: def.meshSpecs.tail, positions: tailMesh(def, motion) },
    pelvis: { kind: 'mesh', grid: def.meshSpecs.pelvis, positions: pelvisMesh(def, motion) },
    torso: { kind: 'mesh', grid: def.meshSpecs.torso, positions: torsoMesh(def, motion) },
    neck: { kind: 'mesh', grid: def.meshSpecs.neck, positions: neckMesh(def, motion) },
    'head-upper': { kind: 'transform', matrix: headM },
    'jaw-lower': { kind: 'transform', matrix: jawM },
  };

  return layers;
}

/** Where the debug overlay should draw each pivot for a given pose. */
export function posedPivots(def: SpeciesRigDef, pose: EvaluatedRigPose): Record<PivotId, Point> {
  const layerFor: Partial<Record<PivotId, RigLayerId>> = {
    head: 'head-upper',
    jaw: 'jaw-lower',
    farHip: 'far-hind-thigh',
    farKnee: 'far-hind-shank-foot',
    nearHip: 'near-hind-thigh',
    nearKnee: 'near-hind-shank-foot',
    farShoulder: 'far-forearm',
    nearShoulder: 'near-forearm',
  };
  const out = {} as Record<PivotId, Point>;
  for (const key of Object.keys(def.pivots) as PivotId[]) {
    const layerId = layerFor[key];
    const layer = layerId ? pose.layers[layerId] : undefined;
    out[key] =
      layer && layer.kind === 'transform' ? applyMat(layer.matrix, def.pivots[key]) : def.pivots[key];
  }
  return out;
}

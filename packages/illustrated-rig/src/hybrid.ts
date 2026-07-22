import { applyMat, compose, rotateAboutDeg, translate } from './affine';
import {
  chestDrift,
  clampMotionToRanges,
  headBaseMatrix,
  legMatrices,
  poseLayers,
  requestedMotion,
  tailMeshFrom,
} from './pose';
import { SPECIES_RIG_DEFS, restMeshPositions, type PivotId, type SpeciesId, type SpeciesRigDef } from './species-defs';
import type {
  EvaluatedRigPose,
  IllustratedRigParams,
  LayerPose,
  MotionParams,
  Point,
  PoseOptions,
  RigLayerId,
} from './types';

/**
 * Hybrid part mixing (IR1 proof of concept) — compose one creature from two
 * packs' layers, e.g. an Allosaurus head on a T. rex body.
 *
 * The whole mechanism rides on the packs' shared framing contract (addendum
 * §1: same 1536×1024 stage, same left facing, same ground band, same twelve
 * layer slots in the same draw order). A part group swaps by pure
 * translation — a donor anchor is pinned onto the base's matching anchor —
 * and the donor art keeps its own pivots and seam-tuned amplitudes while the
 * base body supplies the motion program (breath field, neck bend, stride
 * clock, idle seed).
 *
 * What this deliberately does NOT do (IR2-class work, recorded in the docs):
 * no scaling, no cross-pack seam healing, no hole backing where a donor part
 * is smaller than the opening the base composite leaves for it.
 */

export const PART_GROUPS = ['body', 'head', 'arms', 'legs', 'tail'] as const;
export type PartGroup = (typeof PART_GROUPS)[number];

/** Which species supplies each part group. `body` is the base: torso, neck,
 * pelvis, motion program and idle seed. */
export type HybridRigConfig = Readonly<Record<PartGroup, SpeciesId>>;

export const PART_GROUP_LAYERS: Record<PartGroup, readonly RigLayerId[]> = {
  body: ['torso', 'neck', 'pelvis'],
  head: ['head-upper', 'jaw-lower'],
  arms: ['far-forearm', 'near-forearm'],
  legs: ['far-hind-thigh', 'far-hind-shank-foot', 'near-hind-thigh', 'near-hind-shank-foot'],
  tail: ['tail'],
};

const LAYER_GROUP: Record<RigLayerId, PartGroup> = Object.fromEntries(
  (Object.entries(PART_GROUP_LAYERS) as [PartGroup, readonly RigLayerId[]][]).flatMap(
    ([group, layers]) => layers.map((id) => [id, group])
  )
) as Record<RigLayerId, PartGroup>;

/** The species whose pack supplies a given layer slot under a config. */
export function layerSourceSpecies(config: HybridRigConfig, layerId: RigLayerId): SpeciesId {
  return config[LAYER_GROUP[layerId]];
}

/** A single-species "hybrid": every group from one pack — renders identically
 * to the plain species rig, and anchors every parse/UI fallback. */
export function pureConfig(species: SpeciesId): HybridRigConfig {
  return { body: species, head: species, arms: species, legs: species, tail: species };
}

function diff(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** Bottom edge of a shank-foot layer = the painted ground contact (verified
 * against both packs' manifests: visible bottom equals bounds bottom). */
function footContactY(def: SpeciesRigDef, layer: 'far-hind-shank-foot' | 'near-hind-shank-foot'): number {
  const b = def.layerBounds[layer];
  return b.y + b.height;
}

/**
 * The translation that carries donor art into the base's stage space, per
 * attachment. Anchor choices:
 * - head: COVER-preserving, not pivot-preserving — the donor head-upper's
 *   rear edge lands exactly where the base head's rear edge was, so the base
 *   neck's front cut edge stays concealed as deeply as its own head hid it
 *   (pivot alignment left a paper gap at the junction: trex pivot sits 55 px
 *   deeper into its skull than the allosaurus'). Vertically the atlas height
 *   still governs. The donor head then articulates about its own carried
 *   pivot.
 * - arms: the shoulder pivots, per arm.
 * - legs: hip x (the leg hangs from the base hip line) but ground-contact y —
 *   feet must plant on the base's ground band, not float at the donor's hip
 *   height (the two packs stand ~35 px apart).
 * - tail: the tail-root pivot, so the root tucks under the base pelvis.
 */
export interface HybridPartOffsets {
  head: Point;
  farArm: Point;
  nearArm: Point;
  farLeg: Point;
  nearLeg: Point;
  tail: Point;
}

export function hybridPartOffsets(base: SpeciesRigDef, donor: SpeciesRigDef): HybridPartOffsets {
  const baseHead = base.layerBounds['head-upper'];
  const donorHead = donor.layerBounds['head-upper'];
  return {
    head: {
      x: baseHead.x + baseHead.width - (donorHead.x + donorHead.width),
      y: base.pivots.head.y - donor.pivots.head.y,
    },
    farArm: diff(base.pivots.farShoulder, donor.pivots.farShoulder),
    nearArm: diff(base.pivots.nearShoulder, donor.pivots.nearShoulder),
    farLeg: {
      x: base.pivots.farHip.x - donor.pivots.farHip.x,
      y: footContactY(base, 'far-hind-shank-foot') - footContactY(donor, 'far-hind-shank-foot'),
    },
    nearLeg: {
      x: base.pivots.nearHip.x - donor.pivots.nearHip.x,
      y: footContactY(base, 'near-hind-shank-foot') - footContactY(donor, 'near-hind-shank-foot'),
    },
    tail: diff(base.pivots.tail, donor.pivots.tail),
  };
}

function intersectRange(
  a: { min: number; max: number },
  b: { min: number; max: number }
): { min: number; max: number } {
  return { min: Math.max(a.min, b.min), max: Math.min(a.max, b.max) };
}

/** Range combination for explicit defs — the testable core of hybridMotionRanges. */
export function combineHybridRanges(
  body: SpeciesRigDef,
  head: SpeciesRigDef,
  legs: SpeciesRigDef
): { strideRange: { min: number; max: number }; jawRange: { min: number; max: number } } {
  return {
    // Stride swings both the base pelvis/tail AND the donor legs; both packs'
    // overlap must stay seam-clean, so the envelope is the intersection.
    strideRange: intersectRange(body.strideRange, legs.strideRange),
    // The clench tucks the donor jaw under the donor cheek — the head pack's
    // own art backs it, so its range governs alone.
    jawRange: head.jawRange,
  };
}

/** The seam-clean motion envelope of a mixed creature. */
export function hybridMotionRanges(config: HybridRigConfig): {
  strideRange: { min: number; max: number };
  jawRange: { min: number; max: number };
} {
  return combineHybridRanges(
    SPECIES_RIG_DEFS[config.body],
    SPECIES_RIG_DEFS[config.head],
    SPECIES_RIG_DEFS[config.legs]
  );
}

/** A hybrid is one specific individual: the body's pack seed everywhere. */
export function hybridSeed(config: HybridRigConfig): number {
  return SPECIES_RIG_DEFS[config.body].seed;
}

/** "T. rex body · Allosaurus head" — donor groups only; pure = species label. */
export function hybridLabel(config: HybridRigConfig): string {
  const base = SPECIES_RIG_DEFS[config.body];
  const donorParts = (PART_GROUPS.filter((g) => g !== 'body') as Exclude<PartGroup, 'body'>[])
    .filter((group) => config[group] !== config.body)
    .map((group) => `${SPECIES_RIG_DEFS[config[group]].label} ${group}`);
  if (donorParts.length === 0) return base.label;
  return [`${base.label} body`, ...donorParts].join(' · ');
}

/** The motion values a hybrid pose is actually built from. */
export function hybridEffectiveMotion(
  config: HybridRigConfig,
  params: IllustratedRigParams,
  options: PoseOptions
): MotionParams {
  const { strideRange, jawRange } = hybridMotionRanges(config);
  return clampMotionToRanges(requestedMotion(params, options), strideRange, jawRange);
}

/**
 * evaluateHybridRigPose — the pose evaluator for mixed creatures.
 *
 * Base-sourced groups get exactly the base species' layer poses (a config
 * with every group from one species is bit-identical to evaluateRigPose).
 * Donor groups pose in their home pack's space — own pivots, own seam-tuned
 * amplitudes — then translate into the base's stage space by their anchor
 * offset, while the base body supplies every shared motion input.
 */
export function evaluateHybridRigPose(
  config: HybridRigConfig,
  params: IllustratedRigParams,
  options: PoseOptions
): EvaluatedRigPose {
  const base = SPECIES_RIG_DEFS[config.body];
  const motion = hybridEffectiveMotion(config, params, options);
  const layers: Record<RigLayerId, LayerPose> = poseLayers(base, motion);

  if (config.head !== config.body) {
    const donor = SPECIES_RIG_DEFS[config.head];
    const off = hybridPartOffsets(base, donor).head;
    // The donor skull shifts to the cover anchor, the base neck program
    // carries it, and the head's own swing (base per-degree program) rotates
    // about the DONOR's carried pivot — its anatomically painted atlas — not
    // the base's, which sits elsewhere inside a different skull.
    const h = base.deform.head;
    const headRot = motion.headAngle;
    const headDx = headRot * h.dxPerDeg;
    const headDy = headRot * (headRot < 0 ? h.dyPerDegDown : h.dyPerDegUp);
    const headM = compose(
      headBaseMatrix(base, motion),
      translate(off.x + headDx, off.y + headDy),
      rotateAboutDeg(donor.pivots.head, headRot)
    );
    layers['head-upper'] = { kind: 'transform', matrix: headM };
    layers['jaw-lower'] = {
      kind: 'transform',
      matrix: compose(headM, rotateAboutDeg(donor.pivots.jaw, -motion.jawAngle)),
    };
  }

  if (config.arms !== config.body) {
    const donor = SPECIES_RIG_DEFS[config.arms];
    const offs = hybridPartOffsets(base, donor);
    // Donor arms must ride the BASE chest's arm-contact drift (the base torso
    // art is what they sit against), rotating about their own shoulders.
    const drift = chestDrift(base, motion);
    const rot = motion.breath * base.deform.arms.breathRot;
    layers['far-forearm'] = {
      kind: 'transform',
      matrix: compose(
        translate(drift.x + offs.farArm.x, drift.y + offs.farArm.y),
        rotateAboutDeg(donor.pivots.farShoulder, rot)
      ),
    };
    layers['near-forearm'] = {
      kind: 'transform',
      matrix: compose(
        translate(drift.x + offs.nearArm.x, drift.y + offs.nearArm.y),
        rotateAboutDeg(donor.pivots.nearShoulder, rot)
      ),
    };
  }

  if (config.legs !== config.body) {
    const donor = SPECIES_RIG_DEFS[config.legs];
    const offs = hybridPartOffsets(base, donor);
    // Whole chains pose in donor space (donor amplitudes pivot on the donor
    // art's painted seams), then each chain shifts by its own anchor offset.
    const chains = legMatrices(donor, motion);
    const farShift = translate(offs.farLeg.x, offs.farLeg.y);
    const nearShift = translate(offs.nearLeg.x, offs.nearLeg.y);
    layers['far-hind-thigh'] = { kind: 'transform', matrix: compose(farShift, chains.farThigh) };
    layers['far-hind-shank-foot'] = { kind: 'transform', matrix: compose(farShift, chains.farShank) };
    layers['near-hind-thigh'] = { kind: 'transform', matrix: compose(nearShift, chains.nearThigh) };
    layers['near-hind-shank-foot'] = { kind: 'transform', matrix: compose(nearShift, chains.nearShank) };
  }

  if (config.tail !== config.body) {
    const donor = SPECIES_RIG_DEFS[config.tail];
    const off = hybridPartOffsets(base, donor).tail;
    // The donor tail grid translates to the base tail root, then the BASE
    // body's tail field (its pin ramps, sway and leg-follow are stage-space
    // functions) deforms the shifted vertices.
    const rest = restMeshPositions(donor, 'tail');
    for (let i = 0; i < rest.length; i += 2) {
      rest[i] = rest[i]! + off.x;
      rest[i + 1] = rest[i + 1]! + off.y;
    }
    layers.tail = {
      kind: 'mesh',
      grid: donor.meshSpecs.tail,
      positions: tailMeshFrom(base, motion, rest),
    };
  }

  return { effective: motion, layers };
}

/**
 * Debug-overlay pivots for a hybrid pose: each pivot rides its layer's source
 * species (donor matrices already carry the anchor offset). Mesh-layer pivots
 * mirror posedPivots' rest-position convention; a donor tail pivot equals the
 * base's by construction (the tail root IS the anchor).
 */
export function hybridPosedPivots(
  config: HybridRigConfig,
  pose: EvaluatedRigPose
): Record<PivotId, Point> {
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
  const base = SPECIES_RIG_DEFS[config.body];
  const out = {} as Record<PivotId, Point>;
  for (const key of Object.keys(base.pivots) as PivotId[]) {
    const layerId = layerFor[key];
    if (!layerId) {
      out[key] = base.pivots[key];
      continue;
    }
    const source = SPECIES_RIG_DEFS[layerSourceSpecies(config, layerId)];
    const layer = pose.layers[layerId];
    out[key] =
      layer.kind === 'transform' ? applyMat(layer.matrix, source.pivots[key]) : source.pivots[key];
  }
  return out;
}

const MIX_ENTRY = /^(body|head|arms|legs|tail):([a-z0-9-]+)$/;

/**
 * Compact deep-link codec for hybrid configs: "body:trex,head:allosaurus".
 * Groups omitted from the string follow the body; an unknown species or a
 * malformed entry rejects the whole string (null) — deep links must never
 * guess.
 */
export function parseHybridConfig(raw: string | null | undefined): HybridRigConfig | null {
  if (!raw) return null;
  const picks: Partial<Record<PartGroup, SpeciesId>> = {};
  for (const part of raw.split(',')) {
    const match = MIX_ENTRY.exec(part.trim());
    if (!match) return null;
    const species = match[2]!;
    if (!(species in SPECIES_RIG_DEFS)) return null;
    picks[match[1] as PartGroup] = species as SpeciesId;
  }
  const body = picks.body ?? 'trex';
  return {
    body,
    head: picks.head ?? body,
    arms: picks.arms ?? body,
    legs: picks.legs ?? body,
    tail: picks.tail ?? body,
  };
}

/** Inverse of parseHybridConfig: body first, then only the donor groups. */
export function formatHybridConfig(config: HybridRigConfig): string {
  const parts = [`body:${config.body}`];
  for (const group of PART_GROUPS) {
    if (group !== 'body' && config[group] !== config.body) {
      parts.push(`${group}:${config[group]}`);
    }
  }
  return parts.join(',');
}

/**
 * Shared geometry and parameter types for the illustrated rig (IR0).
 *
 * Everything in this package is stage-space math: the rig lives on a fixed
 * logical canvas (the source pack's 1536×1024), y-down, rotations in degrees
 * clockwise — the same conventions as the layer PNGs themselves, so no
 * coordinate translation ever happens between art and math.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * 2D affine matrix in canvas/Pixi order: maps (x, y) to
 * (a·x + c·y + tx, b·x + d·y + ty).
 */
export type Mat2D = readonly [a: number, b: number, c: number, d: number, tx: number, ty: number];

export interface RectBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The twelve anatomical layers of the trex-r0-v1 pack, back to front. */
export const RIG_LAYER_IDS = [
  'far-hind-shank-foot',
  'far-hind-thigh',
  'near-hind-shank-foot',
  'near-hind-thigh',
  'far-forearm',
  'near-forearm',
  'tail',
  'pelvis',
  'torso',
  'neck',
  'head-upper',
  'jaw-lower',
] as const;

export type RigLayerId = (typeof RIG_LAYER_IDS)[number];

/** Layers that deform at the vertex level rather than as rigid transforms. */
export const MESH_LAYER_IDS = ['tail', 'pelvis', 'torso', 'neck'] as const;
export type MeshLayerId = (typeof MESH_LAYER_IDS)[number];

export type PatternType = 'none' | 'solid' | 'mottle' | 'bands';

/** The five motion axes exposed as sliders. Degrees for angles, unitless otherwise. */
export interface MotionParams {
  /** Head assembly rotation, degrees. Negative looks down, positive up. */
  headAngle: number;
  /** Lower-jaw opening, degrees. */
  jawAngle: number;
  /** Breathing amount, 0 (exhaled) to 1 (full inhale). */
  breath: number;
  /** Stride/weight-shift amount, −1..1 (near leg forward at +1). */
  stride: number;
  /** Tail sway amount, −1..1. */
  tailSway: number;
}

export interface PatternParams {
  pattern: PatternType;
  /** Overlay strength, 0..1. */
  patternIntensity: number;
  /** #rrggbb hex color multiplied into the masked region. */
  patternColor: string;
}

export interface IllustratedRigParams extends MotionParams, PatternParams {
  /** When true, the deterministic idle loop drives the motion axes from timeMs. */
  autoIdle: boolean;
  /** When true, idle and time are ignored entirely — the pose is the static sliders. */
  reducedMotion: boolean;
}

export interface PoseOptions {
  /** Deterministic variation source (idle phase offsets). Same seed → same motion. */
  seed: number;
  /** Explicit animation clock in milliseconds. Same timeMs → same pose. */
  timeMs: number;
}

export interface MeshGridSpec {
  readonly columns: number;
  readonly rows: number;
}

export type LayerPose =
  | { kind: 'transform'; matrix: Mat2D }
  | {
      kind: 'mesh';
      grid: MeshGridSpec;
      /** Deformed vertex positions in stage space: [x0, y0, x1, y1, …], row-major. */
      positions: number[];
    };

export interface EvaluatedRigPose {
  /** The motion values actually used (post-clamp, post-idle) — for UI display and tests. */
  effective: MotionParams;
  layers: Record<RigLayerId, LayerPose>;
}

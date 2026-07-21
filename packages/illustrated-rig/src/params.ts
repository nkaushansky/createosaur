import { clamp } from './affine';
import type { IllustratedRigParams, MotionParams, PatternType } from './types';

/**
 * Parameter ranges are deliberately conservative: the source art was authored
 * for restrained motion, and IR0's job is to prove the direction inside these
 * ranges, not to survive grotesque extremes (rig spec §9.3).
 */
export const MOTION_RANGES = {
  headAngle: { min: -6, max: 8 },
  jawAngle: { min: 0, max: 6 },
  breath: { min: 0, max: 1 },
  // Stride is capped where the pack stays seam-clean: beyond ~0.6 the legs
  // expose the straight extraction-cut edges of neighbouring hidden overlap
  // (tail root behind the near calf, thigh front against the belly) — a
  // source-art limit recorded for the next pack revision, not a rig bug.
  stride: { min: -0.6, max: 0.6 },
  tailSway: { min: -1, max: 1 },
} as const satisfies Record<keyof MotionParams, { min: number; max: number }>;

export const PATTERN_TYPES: readonly PatternType[] = ['none', 'solid', 'mottle', 'bands'];

export const DEFAULT_PATTERN_COLOR = '#445042';

export const DEFAULT_RIG_PARAMS: IllustratedRigParams = {
  headAngle: 0,
  jawAngle: 0,
  breath: 0,
  stride: 0,
  tailSway: 0,
  pattern: 'none',
  patternIntensity: 0.4,
  patternColor: DEFAULT_PATTERN_COLOR,
  autoIdle: true,
  reducedMotion: false,
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function clampMotionValue(key: keyof MotionParams, value: number): number {
  const { min, max } = MOTION_RANGES[key];
  // NaN gets the safe default; infinities clamp to the nearest bound.
  return clamp(Number.isNaN(value) ? 0 : value, min, max);
}

/** Clamp every axis into its documented range; sanitize pattern inputs. */
export function clampRigParams(params: IllustratedRigParams): IllustratedRigParams {
  return {
    headAngle: clampMotionValue('headAngle', params.headAngle),
    jawAngle: clampMotionValue('jawAngle', params.jawAngle),
    breath: clampMotionValue('breath', params.breath),
    stride: clampMotionValue('stride', params.stride),
    tailSway: clampMotionValue('tailSway', params.tailSway),
    pattern: PATTERN_TYPES.includes(params.pattern) ? params.pattern : 'none',
    patternIntensity: clamp(Number.isNaN(params.patternIntensity) ? 0 : params.patternIntensity, 0, 1),
    patternColor: HEX_COLOR.test(params.patternColor) ? params.patternColor.toLowerCase() : DEFAULT_PATTERN_COLOR,
    autoIdle: params.autoIdle === true,
    reducedMotion: params.reducedMotion === true,
  };
}

export const PRESET_NAMES = ['neutral', 'inhale', 'lookUp', 'stride', 'stress'] as const;
export type PresetName = (typeof PRESET_NAMES)[number];

/**
 * The five review poses from the validated standalone prototype. `stress`
 * intentionally drives every axis to a bound — it is the seam test, not a
 * pose the idle loop ever reaches.
 */
export const RIG_PRESETS: Record<PresetName, MotionParams> = {
  neutral: { headAngle: 0, jawAngle: 0, breath: 0, stride: 0, tailSway: 0 },
  inhale: { headAngle: 0.5, jawAngle: 0, breath: 1, stride: 0, tailSway: -0.08 },
  lookUp: { headAngle: 6, jawAngle: 0.4, breath: 0.2, stride: 0, tailSway: -0.1 },
  stride: { headAngle: -1.2, jawAngle: 0, breath: 0.35, stride: 0.55, tailSway: 0.55 },
  stress: { headAngle: 7.5, jawAngle: 4.5, breath: 1, stride: 0.6, tailSway: 1 },
};

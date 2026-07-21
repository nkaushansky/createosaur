import { MOTION_RANGES } from './params';
import { clamp } from './affine';
import type { MotionParams } from './types';

/**
 * The deterministic auto-idle loop: slow layered sinusoids per axis, with
 * seed-derived phase offsets so two rigs with different seeds breathe out of
 * step but any (seed, timeMs) pair always lands on the same pose. Frequencies
 * and amplitudes come from the approved standalone prototype.
 */

/** mulberry32 — tiny deterministic PRNG, same family the genome package uses. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface IdlePhases {
  breath: number;
  headSlow: number;
  headDrift: number;
  tail: number;
  stride: number;
  jaw: number;
}

export function idlePhases(seed: number): IdlePhases {
  const next = mulberry32(seed);
  const tau = Math.PI * 2;
  return {
    breath: next() * tau,
    headSlow: next() * tau,
    headDrift: next() * tau,
    tail: next() * tau,
    stride: next() * tau,
    jaw: next() * tau,
  };
}

/** Idle motion values at a given clock. Pure: (seed, timeMs) → pose axes. */
export function idleMotion(seed: number, timeMs: number): MotionParams {
  const p = idlePhases(seed);
  const t = timeMs / 1000;
  const motion: MotionParams = {
    breath: 0.5 + 0.5 * Math.sin(t * 1.9 + p.breath),
    headAngle: Math.sin(t * 0.8 + p.headSlow) * 1.6 + Math.sin(t * 0.2 + p.headDrift) * 0.4,
    tailSway: Math.sin(t * 1.1 + 1.5 + p.tail) * 0.4,
    stride: Math.sin(t * 0.65 + p.stride) * 0.18,
    jawAngle: Math.max(0, Math.sin(t * 0.42 - 0.8 + p.jaw)) * 0.9,
  };
  // The formulas stay inside the documented ranges by construction, but the
  // clamp is the contract — idle output must never exceed slider bounds.
  return {
    headAngle: clamp(motion.headAngle, MOTION_RANGES.headAngle.min, MOTION_RANGES.headAngle.max),
    jawAngle: clamp(motion.jawAngle, MOTION_RANGES.jawAngle.min, MOTION_RANGES.jawAngle.max),
    breath: clamp(motion.breath, MOTION_RANGES.breath.min, MOTION_RANGES.breath.max),
    stride: clamp(motion.stride, MOTION_RANGES.stride.min, MOTION_RANGES.stride.max),
    tailSway: clamp(motion.tailSway, MOTION_RANGES.tailSway.min, MOTION_RANGES.tailSway.max),
  };
}

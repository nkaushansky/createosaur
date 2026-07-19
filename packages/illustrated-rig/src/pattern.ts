import type { PatternType } from './types';

/**
 * Pattern application contract (mirrors the approved standalone prototype):
 * each layer's grayscale mask (white = patterned hide, black = untouched)
 * gates a single flat color that is MULTIPLIED over the artwork at the
 * chosen intensity. Multiply preserves the source luminosity and texture —
 * dark fixed details (eye, claws, mouth shadow) stay dark instead of being
 * flattened into a monochrome tint, which is the requirement that rules out
 * any replace-the-pixels approach.
 *
 * Masks are exported per anatomical layer in stage alignment, so a mask
 * rendered through its layer's own transform/mesh moves with the body part —
 * never in screen space.
 */

export const MASKED_PATTERN_TYPES = ['solid', 'mottle', 'bands'] as const;
export type MaskedPatternType = (typeof MASKED_PATTERN_TYPES)[number];

export function isMaskedPattern(type: PatternType): type is MaskedPatternType {
  return (MASKED_PATTERN_TYPES as readonly string[]).includes(type);
}

/** Parse "#rrggbb" into a 0xRRGGBB int (what Pixi tints want). Assumes clamped input. */
export function hexColorToInt(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

/**
 * Reference implementation of the per-pixel pattern math, used by tests as
 * the ground truth the GPU path must follow:
 * result = art × lerp(1, color, maskLuminance × intensity), per channel.
 */
export function patternPixel(
  art: readonly [number, number, number],
  color: readonly [number, number, number],
  maskLuminance: number,
  intensity: number
): [number, number, number] {
  const k = maskLuminance * intensity;
  const mix = (a: number, c: number): number => a * (1 - k + (c / 255) * k);
  return [mix(art[0], color[0]), mix(art[1], color[1]), mix(art[2], color[2])];
}

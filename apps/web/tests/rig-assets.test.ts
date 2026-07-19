import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  LAYER_BOUNDS,
  RIG_LAYER_IDS,
  TREX_R0_ASSET_SHA256,
  TREX_R0_PACK_PATH,
  runtimeAssetPaths,
  validateTrexR0Manifest,
  type RigLayerId,
} from '@createosaur/illustrated-rig';

/**
 * Asset-integrity gate for the exact-source T. rex pack (D-020): every file
 * must match the SHA-256 recorded from the approved owner handoff — no
 * repainting, regenerating, rescaling or substituting, ever. A hash mismatch
 * here means the approved artwork changed and the owner has not signed off.
 */

const packDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', TREX_R0_PACK_PATH);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe('trex-r0-v1 pack integrity', () => {
  it('every recorded file exists and hashes to its approved digest', () => {
    for (const [relPath, expected] of TREX_R0_ASSET_SHA256) {
      const actual = createHash('sha256').update(readFileSync(join(packDir, relPath))).digest('hex');
      expect(actual, `${relPath} does not match the approved handoff digest`).toBe(expected);
    }
  });

  it('the pack contains no files beyond the approved manifest of 58', () => {
    const onDisk = walk(packDir)
      .map((f) => relative(packDir, f))
      .sort();
    const recorded = TREX_R0_ASSET_SHA256.map(([p]) => p).sort();
    expect(onDisk).toEqual(recorded);
  });

  it('manifest.json validates as the twelve-layer trex-r0 rig', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    expect(result).toMatchObject({ ok: true });
  });

  it('the pose package’s embedded layer bounds match the manifest exactly', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    if (!result.ok) throw new Error('manifest invalid');
    for (const layer of result.manifest.layers) {
      expect(LAYER_BOUNDS[layer.id as RigLayerId], `bounds for ${layer.id}`).toEqual(layer.bounds);
    }
  });

  it('every runtime asset the rig loads is hash-locked', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    if (!result.ok) throw new Error('manifest invalid');
    const locked = new Set(runtimeAssetPaths());
    expect(locked.has('manifest.json')).toBe(true);
    for (const layer of result.manifest.layers) {
      expect(locked.has(layer.source), `layer source ${layer.source}`).toBe(true);
      for (const mask of Object.values(layer.patternMasks)) {
        expect(locked.has(mask), `mask ${mask}`).toBe(true);
      }
    }
    expect(RIG_LAYER_IDS).toHaveLength(12);
  });
});

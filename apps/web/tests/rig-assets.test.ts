import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ALLOSAURUS_R0_ASSET_SHA256,
  ALLOSAURUS_R0_PACK_PATH,
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

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const packDir = join(publicDir, TREX_R0_PACK_PATH);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const PACKS: { name: string; path: string; table: ReadonlyArray<readonly [string, string]> }[] = [
  { name: 'trex-r0-v1', path: TREX_R0_PACK_PATH, table: TREX_R0_ASSET_SHA256 },
  { name: 'allosaurus-r0-v1', path: ALLOSAURUS_R0_PACK_PATH, table: ALLOSAURUS_R0_ASSET_SHA256 },
];

describe.each(PACKS)('$name pack integrity', ({ path, table }) => {
  const dir = join(publicDir, path);

  it('every recorded file exists and hashes to its approved digest', () => {
    for (const [relPath, expected] of table) {
      const actual = createHash('sha256').update(readFileSync(join(dir, relPath))).digest('hex');
      expect(actual, `${relPath} does not match the approved digest`).toBe(expected);
    }
  });

  it('the pack contains no files beyond the recorded set', () => {
    const onDisk = walk(dir)
      .map((f) => relative(dir, f))
      .sort();
    const recorded = table.map(([p]) => p).sort();
    expect(onDisk).toEqual(recorded);
  });

  it('manifest.json validates as a twelve-layer theropod rig', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    expect(result).toMatchObject({ ok: true });
  });

  it('reassembly verification recorded zero visible error', () => {
    const parsed = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as {
      verification: { maxVisibleRgbError: number; maxAlphaError: number };
    };
    expect(parsed.verification.maxVisibleRgbError).toBe(0);
    expect(parsed.verification.maxAlphaError).toBe(0);
  });
});

describe('trex-r0-v1 pack specifics', () => {

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

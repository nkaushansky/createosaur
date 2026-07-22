import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ALLOSAURUS_R0_ASSET_SHA256,
  ALLOSAURUS_R0_PACK_PATH,
  ALLOSAURUS_RIG_DEF,
  PARTS_LAYER_IDS,
  RIG_LAYER_IDS,
  TREX_PF_RIG_DEF,
  TREX_R0_ASSET_SHA256,
  TREX_R0_PACK_PATH,
  TREX_RIG_DEF,
  runtimeAssetPaths,
  validatePartsManifest,
  validateTrexR0Manifest,
  type PartsLayerId,
  type RigLayerId,
  type SpeciesRigDef,
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

const PACKS: {
  name: string;
  path: string;
  table: ReadonlyArray<readonly [string, string]>;
  def: SpeciesRigDef;
}[] = [
  { name: 'trex-r0-v2', path: TREX_R0_PACK_PATH, table: TREX_R0_ASSET_SHA256, def: TREX_RIG_DEF },
  {
    name: 'allosaurus-r0-v2',
    path: ALLOSAURUS_R0_PACK_PATH,
    table: ALLOSAURUS_R0_ASSET_SHA256,
    def: ALLOSAURUS_RIG_DEF,
  },
];

describe.each(PACKS)('$name pack integrity', ({ path, table, def }) => {
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

  it("the species def's embedded layer bounds match the manifest exactly", () => {
    const parsed: unknown = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    if (!result.ok) throw new Error('manifest invalid');
    for (const layer of result.manifest.layers) {
      expect(def.layerBounds[layer.id as RigLayerId], `bounds for ${layer.id}`).toEqual(layer.bounds);
    }
  });

  it("the species def's pack path and seed match the pack", () => {
    const parsed = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as {
      patterns: { seed: number };
    };
    expect(def.packPath).toBe(path);
    expect(def.seed).toBe(parsed.patterns.seed);
  });

  it('every file the runtime loader fetches exists in this pack', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    if (!result.ok) throw new Error('manifest invalid');
    const recorded = new Set(table.map(([p]) => p));
    const runtimeLoads = [
      'manifest.json',
      def.masterFile,
      'debug/hidden-overlap-map.png',
      ...result.manifest.layers.flatMap((layer) => [
        layer.source,
        ...Object.values(layer.patternMasks),
      ]),
    ];
    for (const relPath of runtimeLoads) {
      expect(recorded.has(relPath), `runtime fetch ${relPath} is not in the pack`).toBe(true);
    }
  });
});

describe('trex-pf-r0 parts-first pack', () => {
  const dir = join(publicDir, TREX_PF_RIG_DEF.packPath);
  const manifest = (): unknown => JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));

  it('manifest.json validates as a nine-piece parts-first rig', () => {
    expect(validatePartsManifest(manifest())).toMatchObject({ ok: true });
    expect(PARTS_LAYER_IDS).toHaveLength(9);
  });

  it("the parts def's layer bounds match the manifest exactly (mesh rest + pattern UVs depend on it)", () => {
    const result = validatePartsManifest(manifest());
    if (!result.ok) throw new Error('manifest invalid');
    for (const layer of result.manifest.layers) {
      expect(TREX_PF_RIG_DEF.layerBounds[layer.id as PartsLayerId], `bounds for ${layer.id}`).toEqual(layer.bounds);
    }
  });

  it("the parts def's pack path and seed match the pack", () => {
    const parsed = manifest() as { patterns: { seed: number } };
    expect(TREX_PF_RIG_DEF.packPath).toBe('rigs/trex-pf-r0');
    expect(TREX_PF_RIG_DEF.seed).toBe(parsed.patterns.seed);
  });

  it('every file the runtime loader fetches exists in the pack', () => {
    const result = validatePartsManifest(manifest());
    if (!result.ok) throw new Error('manifest invalid');
    const runtimeLoads = [
      'manifest.json',
      TREX_PF_RIG_DEF.masterFile,
      'debug/hidden-overlap-map.png',
      ...result.manifest.layers.flatMap((layer) => [layer.source, ...Object.values(layer.patternMasks)]),
    ];
    for (const relPath of runtimeLoads) {
      expect(existsSync(join(dir, relPath)), `runtime fetch ${relPath} missing`).toBe(true);
    }
  });

  it('ships a desaturated value/ variant for every layer (D-023 runtime-paint storage)', () => {
    const result = validatePartsManifest(manifest());
    if (!result.ok) throw new Error('manifest invalid');
    for (const layer of result.manifest.layers) {
      const valuePath = layer.source.replace('layers/', 'value/');
      expect(existsSync(join(dir, valuePath)), `value variant ${valuePath} missing`).toBe(true);
    }
  });
});

describe('trex-r0-v2 pack specifics', () => {

  it('manifest.json validates as the twelve-layer trex-r0 rig (v2)', () => {
    const parsed: unknown = JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8'));
    const result = validateTrexR0Manifest(parsed);
    expect(result).toMatchObject({ ok: true });
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

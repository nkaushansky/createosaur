import {
  MASKED_PATTERN_TYPES,
  RIG_LAYER_IDS,
  SPECIES_RIG_DEFS,
  formatHybridConfig,
  layerSourceSpecies,
  validateTrexR0Manifest,
  type HybridRigConfig,
  type MaskedPatternType,
  type RigLayerId,
  type RigManifest,
  type RigManifestLayer,
  type SpeciesId,
  type SpeciesRigDef,
} from '@createosaur/illustrated-rig';

/**
 * Browser-side asset loading for the rig pack. Everything the rig needs is
 * fetched up front — layers, all three mask sets, and the debug overlays — so
 * switching pattern type later is a texture swap, never a network reload or a
 * rig rebuild.
 *
 * This module deliberately stays Pixi-free (plain fetch + ImageBitmap +
 * canvas) so the loading/error path is testable and the Pixi bootstrap stays
 * a pure consumer.
 */

/** What the stage is asked to show: one pack, or a cross-pack hybrid mix. */
export type RigSource =
  | { kind: 'species'; species: SpeciesId }
  | { kind: 'hybrid'; config: HybridRigConfig };

/** The def that anchors a source: the species itself, or the hybrid's body. */
export function sourceBaseDef(source: RigSource): SpeciesRigDef {
  return SPECIES_RIG_DEFS[source.kind === 'species' ? source.species : source.config.body];
}

/** Stable identity string — the stage rebuilds when this changes. */
export function sourceKey(source: RigSource): string {
  return source.kind === 'species' ? `species:${source.species}` : `hybrid:${formatHybridConfig(source.config)}`;
}

export class RigAssetError extends Error {
  /** The pack-relative path that failed, for the visible error state. */
  readonly assetPath: string;
  readonly details: string[];

  constructor(assetPath: string, message: string, details: string[] = []) {
    super(`${assetPath}: ${message}`);
    this.name = 'RigAssetError';
    this.assetPath = assetPath;
    this.details = details;
  }
}

export interface LoadProgress {
  step: 'manifest' | 'textures';
  loaded: number;
  total: number;
}

/**
 * A grayscale pattern mask converted for GPU use: luminance moved into the
 * alpha channel (white = full pattern), cropped to its layer's bounds so we
 * do not keep 36 full-canvas RGBA textures alive.
 */
export interface PreparedMask {
  canvas: HTMLCanvasElement;
  /** Stage position of the canvas's top-left corner (the layer's bounds origin). */
  offsetX: number;
  offsetY: number;
}

export interface LoadedRigLayer {
  spec: RigManifestLayer;
  id: RigLayerId;
  /** The species def whose pack this layer came from — mesh geometry and
   * pattern UVs must be built in the SOURCE pack's space, never the base's. */
  def: SpeciesRigDef;
  bitmap: ImageBitmap;
  masks: Record<MaskedPatternType, PreparedMask>;
}

export interface LoadedRigAssets {
  manifest: RigManifest;
  layers: LoadedRigLayer[];
  master: ImageBitmap;
  overlapMap: ImageBitmap;
  /** Total compressed bytes fetched, for the PR's performance notes. */
  totalBytes: number;
}

async function fetchBytes(baseUrl: string, relPath: string): Promise<{ blob: Blob; bytes: number }> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/${relPath}`);
  } catch (cause) {
    throw new RigAssetError(relPath, `network error (${String(cause)})`);
  }
  if (!response.ok) throw new RigAssetError(relPath, `HTTP ${response.status}`);
  const blob = await response.blob();
  return { blob, bytes: blob.size };
}

async function fetchBitmap(
  baseUrl: string,
  relPath: string
): Promise<{ bitmap: ImageBitmap; bytes: number }> {
  const { blob, bytes } = await fetchBytes(baseUrl, relPath);
  try {
    return { bitmap: await createImageBitmap(blob), bytes };
  } catch {
    throw new RigAssetError(relPath, 'could not decode image');
  }
}

/**
 * Move mask luminance into alpha. The pack's masks are opaque grayscale
 * (white = patterned hide); GPU compositing wants that as coverage, so the
 * overlay's color can be tinted at draw time without re-processing.
 */
function prepareMask(bitmap: ImageBitmap, layer: RigManifestLayer): PreparedMask {
  const { x, y, width, height } = layer.bounds;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new RigAssetError(layer.source, 'canvas 2d context unavailable');
  ctx.drawImage(bitmap, -x, -y);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const luminance = data[i]!; // grayscale source: r = g = b
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = luminance;
  }
  ctx.putImageData(image, 0, 0);
  bitmap.close();
  return { canvas, offsetX: x, offsetY: y };
}

// Next inlines NEXT_PUBLIC_* at build time; when the export is staged under
// a subfolder (basePath), asset fetches must carry the same prefix.
const DEPLOY_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Deploy-prefixed URL of a species' pack. */
export function packUrl(def: SpeciesRigDef): string {
  return `${DEPLOY_PREFIX}/${def.packPath}`;
}

async function fetchManifest(def: SpeciesRigDef): Promise<{ manifest: RigManifest; bytes: number }> {
  const { blob, bytes } = await fetchBytes(packUrl(def), 'manifest.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(await blob.text());
  } catch {
    throw new RigAssetError(`${def.packPath}/manifest.json`, 'not valid JSON');
  }
  const validation = validateTrexR0Manifest(parsed);
  if (!validation.ok) {
    throw new RigAssetError(`${def.packPath}/manifest.json`, 'failed validation', validation.errors);
  }
  return { manifest: validation.manifest, bytes };
}

/** One layer slot's fetch plan: which pack supplies this slot's art. */
interface LayerPlan {
  def: SpeciesRigDef;
  spec: RigManifestLayer;
}

/**
 * Fetch and prepare the twelve layer slots per plan, plus the base pack's
 * master and overlap map (the debug underlays always show the base species).
 */
async function loadPlannedAssets(
  baseDef: SpeciesRigDef,
  baseManifest: RigManifest,
  plans: LayerPlan[],
  manifestBytes: number,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadedRigAssets> {
  const total = plans.length * (1 + MASKED_PATTERN_TYPES.length) + 2;
  let loaded = 0;
  let totalBytes = manifestBytes;
  const tick = (bytes: number): void => {
    loaded += 1;
    totalBytes += bytes;
    onProgress?.({ step: 'textures', loaded, total });
  };

  const layerBitmaps = new Map<string, ImageBitmap>();
  const preparedMasks = new Map<string, Partial<Record<MaskedPatternType, PreparedMask>>>();

  await Promise.all([
    ...plans.map(async ({ def, spec }) => {
      const { bitmap, bytes } = await fetchBitmap(packUrl(def), spec.source);
      layerBitmaps.set(spec.id, bitmap);
      tick(bytes);
    }),
    ...plans.flatMap(({ def, spec }) =>
      MASKED_PATTERN_TYPES.map(async (kind) => {
        const { bitmap, bytes } = await fetchBitmap(packUrl(def), spec.patternMasks[kind]);
        const prepared = prepareMask(bitmap, spec);
        const forLayer = preparedMasks.get(spec.id) ?? {};
        forLayer[kind] = prepared;
        preparedMasks.set(spec.id, forLayer);
        tick(bytes);
      })
    ),
  ]);

  const { bitmap: master, bytes: masterBytes } = await fetchBitmap(packUrl(baseDef), baseDef.masterFile);
  tick(masterBytes);
  const { bitmap: overlapMap, bytes: overlapBytes } = await fetchBitmap(
    packUrl(baseDef),
    'debug/hidden-overlap-map.png'
  );
  tick(overlapBytes);

  const layers: LoadedRigLayer[] = plans.map(({ def, spec }) => {
    const bitmap = layerBitmaps.get(spec.id);
    const masks = preparedMasks.get(spec.id);
    if (!bitmap) throw new RigAssetError(spec.source, 'layer bitmap missing after load');
    if (!masks?.solid || !masks.mottle || !masks.bands) {
      throw new RigAssetError(`pattern-masks/${spec.id}`, 'mask set incomplete after load');
    }
    return {
      spec,
      id: spec.id as RigLayerId,
      def,
      bitmap,
      masks: masks as Record<MaskedPatternType, PreparedMask>,
    };
  });

  return { manifest: baseManifest, layers, master, overlapMap, totalBytes };
}

/**
 * Fetch, validate and prepare a species' whole pack. Progress is reported per
 * fetched file; any failure carries the exact pack-relative path.
 */
export async function loadRigAssets(
  def: SpeciesRigDef,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadedRigAssets> {
  onProgress?.({ step: 'manifest', loaded: 0, total: 1 });
  const { manifest, bytes } = await fetchManifest(def);
  const plans = manifest.layers.map((spec) => ({ def, spec }));
  return loadPlannedAssets(def, manifest, plans, bytes, onProgress);
}

/**
 * Fetch and prepare a hybrid mix: each of the twelve slots comes from its
 * config-selected pack, in the shared theropod draw order; the master and
 * overlap debug underlays come from the base (body) pack. The payload is the
 * same 50 files as a single pack — just drawn from two of them.
 */
export async function loadHybridRigAssets(
  config: HybridRigConfig,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadedRigAssets> {
  const speciesIds = [...new Set(Object.values(config))] as SpeciesId[];
  onProgress?.({ step: 'manifest', loaded: 0, total: speciesIds.length });
  const manifests = new Map<SpeciesId, RigManifest>();
  let manifestBytes = 0;
  await Promise.all(
    speciesIds.map(async (species, index) => {
      const { manifest, bytes } = await fetchManifest(SPECIES_RIG_DEFS[species]);
      manifests.set(species, manifest);
      manifestBytes += bytes;
      onProgress?.({ step: 'manifest', loaded: index + 1, total: speciesIds.length });
    })
  );

  const baseDef = SPECIES_RIG_DEFS[config.body];
  const baseManifest = manifests.get(config.body)!;
  const plans: LayerPlan[] = RIG_LAYER_IDS.map((id) => {
    const species = layerSourceSpecies(config, id);
    const manifest = manifests.get(species)!;
    const spec = manifest.layers.find((layer) => layer.id === id);
    if (!spec) {
      throw new RigAssetError(`${SPECIES_RIG_DEFS[species].packPath}/manifest.json`, `layer ${id} missing`);
    }
    return { def: SPECIES_RIG_DEFS[species], spec };
  });
  return loadPlannedAssets(baseDef, baseManifest, plans, manifestBytes, onProgress);
}

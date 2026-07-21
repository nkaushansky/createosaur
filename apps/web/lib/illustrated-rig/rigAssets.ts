import {
  MASKED_PATTERN_TYPES,
  TREX_R0_PACK_PATH,
  validateTrexR0Manifest,
  type MaskedPatternType,
  type RigLayerId,
  type RigManifest,
  type RigManifestLayer,
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

/**
 * Fetch, validate and prepare the whole pack. Progress is reported per
 * fetched file; any failure carries the exact pack-relative path.
 */
export async function loadRigAssets(
  baseUrl: string = `${DEPLOY_PREFIX}/${TREX_R0_PACK_PATH}`,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadedRigAssets> {
  onProgress?.({ step: 'manifest', loaded: 0, total: 1 });
  const { blob: manifestBlob, bytes: manifestBytes } = await fetchBytes(baseUrl, 'manifest.json');
  let parsed: unknown;
  try {
    parsed = JSON.parse(await manifestBlob.text());
  } catch {
    throw new RigAssetError('manifest.json', 'not valid JSON');
  }
  const validation = validateTrexR0Manifest(parsed);
  if (!validation.ok) {
    throw new RigAssetError('manifest.json', 'failed validation', validation.errors);
  }
  const manifest = validation.manifest;

  const maskPaths = manifest.layers.flatMap((layer) =>
    MASKED_PATTERN_TYPES.map((kind) => ({ layer, kind, path: layer.patternMasks[kind] }))
  );
  const total = manifest.layers.length + maskPaths.length + 2;
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
    ...manifest.layers.map(async (layer) => {
      const { bitmap, bytes } = await fetchBitmap(baseUrl, layer.source);
      layerBitmaps.set(layer.id, bitmap);
      tick(bytes);
    }),
    ...maskPaths.map(async ({ layer, kind, path }) => {
      const { bitmap, bytes } = await fetchBitmap(baseUrl, path);
      const prepared = prepareMask(bitmap, layer);
      const forLayer = preparedMasks.get(layer.id) ?? {};
      forLayer[kind] = prepared;
      preparedMasks.set(layer.id, forLayer);
      tick(bytes);
    }),
  ]);

  const { bitmap: master, bytes: masterBytes } = await fetchBitmap(baseUrl, 'trex-master-clean.png');
  tick(masterBytes);
  const { bitmap: overlapMap, bytes: overlapBytes } = await fetchBitmap(baseUrl, 'debug/hidden-overlap-map.png');
  tick(overlapBytes);

  const layers: LoadedRigLayer[] = manifest.layers.map((spec) => {
    const bitmap = layerBitmaps.get(spec.id);
    const masks = preparedMasks.get(spec.id);
    if (!bitmap) throw new RigAssetError(spec.source, 'layer bitmap missing after load');
    if (!masks?.solid || !masks.mottle || !masks.bands) {
      throw new RigAssetError(`pattern-masks/${spec.id}`, 'mask set incomplete after load');
    }
    return {
      spec,
      id: spec.id as RigLayerId,
      bitmap,
      masks: masks as Record<MaskedPatternType, PreparedMask>,
    };
  });

  return { manifest, layers, master, overlapMap, totalBytes };
}

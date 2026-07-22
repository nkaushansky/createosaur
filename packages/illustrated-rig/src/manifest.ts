import type { PatternType, RectBounds, RigLayerId } from './types';
import { RIG_LAYER_IDS } from './types';

/**
 * Types and validation for the rig pack's manifest.json (the file shipped in
 * `public/rigs/<pack>/`). The manifest is art data authored by the extraction
 * pipeline; the app must never trust it blindly — a malformed pack should fail
 * loudly with the exact path that is wrong, not render a broken creature.
 */

export interface RigManifestLayer {
  id: string;
  z: number;
  source: string;
  fullCanvasOrigin: [number, number];
  bounds: RectBounds;
  visibleBounds: RectBounds;
  visiblePixelCount: number;
  overlapPixelCount: number;
  patternMasks: Record<Exclude<PatternType, 'none'>, string>;
}

export interface RigManifest {
  rigId: string;
  status: string;
  source: string;
  sourcePolicy: string;
  canvas: { width: number; height: number };
  backgroundSample: number[];
  drawOrder: string[];
  layers: RigManifestLayer[];
  patterns: {
    seed: number;
    types: string[];
    coordinatePolicy: string;
  };
  verification: {
    maxVisibleRgbError: number;
    meanVisibleRgbError: number;
    maxAlphaError: number;
  };
  limitations: string[];
}

export type ManifestValidation =
  | { ok: true; manifest: RigManifest }
  | { ok: false; errors: string[] };

const MASK_KINDS = ['solid', 'mottle', 'bands'] as const;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isSafeRelativePath(v: unknown): v is string {
  // Relative, normalized, no traversal — these strings become fetch URLs.
  return typeof v === 'string' && /^[a-z0-9][a-z0-9\-/.]*\.(png|jpg|webp)$/.test(v) && !v.includes('..');
}

function readBounds(v: unknown, path: string, errors: string[]): RectBounds | undefined {
  if (!isRecord(v)) {
    errors.push(`${path}: expected an object`);
    return undefined;
  }
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    if (!isFiniteNumber(v[key])) errors.push(`${path}.${key}: expected a finite number`);
  }
  if (errors.length > 0) return undefined;
  const b = v as unknown as RectBounds;
  if (b.width <= 0 || b.height <= 0) errors.push(`${path}: width/height must be positive`);
  return b;
}

function boundsContain(outer: RectBounds, inner: RectBounds): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Structural validation of a parsed manifest.json. Returns every problem it
 * can find rather than stopping at the first, so a broken pack reads as one
 * actionable report.
 */
export function validateRigManifest(data: unknown): ManifestValidation {
  const errors: string[] = [];
  if (!isRecord(data)) return { ok: false, errors: ['manifest: expected a JSON object'] };

  if (typeof data.rigId !== 'string' || data.rigId.length === 0) errors.push('rigId: expected a non-empty string');

  if (!isRecord(data.canvas) || !isFiniteNumber(data.canvas.width) || !isFiniteNumber(data.canvas.height)) {
    errors.push('canvas: expected { width, height } numbers');
  } else if (data.canvas.width <= 0 || data.canvas.height <= 0) {
    errors.push('canvas: width/height must be positive');
  }

  if (!Array.isArray(data.drawOrder) || data.drawOrder.some((id) => typeof id !== 'string')) {
    errors.push('drawOrder: expected an array of layer id strings');
  }

  if (!Array.isArray(data.layers) || data.layers.length === 0) {
    errors.push('layers: expected a non-empty array');
    return { ok: false, errors };
  }

  const canvas = isRecord(data.canvas) ? (data.canvas as { width: number; height: number }) : undefined;
  const canvasBounds: RectBounds | undefined = canvas
    ? { x: 0, y: 0, width: canvas.width, height: canvas.height }
    : undefined;

  const seenIds = new Set<string>();
  let previousZ = -Infinity;

  data.layers.forEach((layer: unknown, i: number) => {
    const path = `layers[${i}]`;
    if (!isRecord(layer)) {
      errors.push(`${path}: expected an object`);
      return;
    }
    const id = typeof layer.id === 'string' && layer.id.length > 0 ? layer.id : undefined;
    if (!id) errors.push(`${path}.id: expected a non-empty string`);
    if (id) {
      if (seenIds.has(id)) errors.push(`${path}.id: duplicate layer id "${id}"`);
      seenIds.add(id);
    }

    if (!isFiniteNumber(layer.z)) errors.push(`${path}.z: expected a number`);
    else {
      if (layer.z <= previousZ) errors.push(`${path}.z: layers must be listed back-to-front in ascending z`);
      previousZ = layer.z;
    }

    if (!isSafeRelativePath(layer.source)) errors.push(`${path}.source: expected a safe relative image path`);

    const bounds = readBounds(layer.bounds, `${path}.bounds`, errors);
    const visible = readBounds(layer.visibleBounds, `${path}.visibleBounds`, errors);
    if (bounds && canvasBounds && !boundsContain(canvasBounds, bounds)) {
      errors.push(`${path}.bounds: outside the canvas`);
    }
    if (bounds && visible && !boundsContain(bounds, visible)) {
      errors.push(`${path}.visibleBounds: not contained in bounds`);
    }

    if (!isRecord(layer.patternMasks)) {
      errors.push(`${path}.patternMasks: expected { solid, mottle, bands } paths`);
    } else {
      for (const kind of MASK_KINDS) {
        if (!isSafeRelativePath(layer.patternMasks[kind])) {
          errors.push(`${path}.patternMasks.${kind}: expected a safe relative image path`);
        }
      }
    }
  });

  if (Array.isArray(data.drawOrder)) {
    const orderIds = data.drawOrder as string[];
    const layerIds = data.layers
      .filter(isRecord)
      .map((l) => l.id)
      .filter((v): v is string => typeof v === 'string');
    if (orderIds.length !== layerIds.length || orderIds.some((id, i) => layerIds[i] !== id)) {
      errors.push('drawOrder: must list exactly the layer ids in the same back-to-front order');
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: data as unknown as RigManifest };
}

/**
 * IR0 additionally requires the manifest to be the trex-r0 pack this package's
 * pose evaluator was written against: exactly the twelve known layer ids.
 */
export function validateTrexR0Manifest(data: unknown): ManifestValidation {
  const base = validateRigManifest(data);
  if (!base.ok) return base;
  const errors: string[] = [];
  const ids = base.manifest.layers.map((l) => l.id);
  if (ids.length !== RIG_LAYER_IDS.length || RIG_LAYER_IDS.some((id, i) => ids[i] !== id)) {
    errors.push(
      `layers: expected the twelve trex-r0 layer ids in pack order (${RIG_LAYER_IDS.join(', ')}); got (${ids.join(', ')})`
    );
  }
  if (errors.length > 0) return { ok: false, errors };
  return base;
}

/**
 * Parts-first packs ship nine pieces (not the twelve-layer cut) over a single
 * closed core. Structure is validated by validateRigManifest; this adds the
 * exact parts-first layer-id / draw-order check.
 */
const PARTS_LAYER_ORDER = [
  'far-leg',
  'tail',
  'core',
  'far-arm',
  'near-leg',
  'near-arm',
  'neck',
  'jaw-lower',
  'head-upper',
] as const;

export function validatePartsManifest(data: unknown): ManifestValidation {
  const base = validateRigManifest(data);
  if (!base.ok) return base;
  const ids = base.manifest.layers.map((l) => l.id);
  if (ids.length !== PARTS_LAYER_ORDER.length || PARTS_LAYER_ORDER.some((id, i) => ids[i] !== id)) {
    return {
      ok: false,
      errors: [
        `layers: expected the nine parts-first layer ids in pack order (${PARTS_LAYER_ORDER.join(', ')}); got (${ids.join(', ')})`,
      ],
    };
  }
  return base;
}

/** Typed accessor once validated: layer by id. */
export function manifestLayer(manifest: RigManifest, id: RigLayerId): RigManifestLayer {
  const layer = manifest.layers.find((l) => l.id === id);
  if (!layer) throw new Error(`manifest is missing layer "${id}" — validate before use`);
  return layer;
}

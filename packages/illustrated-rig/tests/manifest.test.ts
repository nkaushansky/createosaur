import { describe, expect, it } from 'vitest';
import { validateRigManifest, validateTrexR0Manifest } from '../src/manifest';
import { RIG_LAYER_IDS } from '../src/types';

/**
 * Validation logic against hand-built fixtures. The shipped pack's real
 * manifest.json is validated (and hash-locked) by apps/web/tests — here we
 * prove the validator actually catches broken packs.
 */

function maskSet(id: string): Record<'solid' | 'mottle' | 'bands', string> {
  return {
    solid: `pattern-masks/${id}/solid.png`,
    mottle: `pattern-masks/${id}/mottle.png`,
    bands: `pattern-masks/${id}/bands.png`,
  };
}

function makeLayer(id: string, z: number): Record<string, unknown> {
  return {
    id,
    z,
    source: `layers/${String(z).padStart(2, '0')}-${id}.png`,
    fullCanvasOrigin: [0, 0],
    bounds: { x: 10 + z, y: 20, width: 100, height: 50 },
    visibleBounds: { x: 12 + z, y: 22, width: 90, height: 40 },
    visiblePixelCount: 1000,
    overlapPixelCount: 10,
    patternMasks: maskSet(id),
  };
}

function makeManifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    rigId: 'test-rig',
    status: 'test',
    source: 'test.png',
    sourcePolicy: 'test',
    canvas: { width: 1536, height: 1024 },
    backgroundSample: [250, 247, 242],
    drawOrder: ['alpha', 'beta'],
    layers: [makeLayer('alpha', 0), makeLayer('beta', 1)],
    patterns: { seed: 1, types: ['solid', 'mottle', 'bands'], coordinatePolicy: 'test' },
    verification: { maxVisibleRgbError: 0, meanVisibleRgbError: 0, maxAlphaError: 0 },
    limitations: [],
    ...overrides,
  };
}

describe('validateRigManifest', () => {
  it('accepts a structurally sound manifest', () => {
    const result = validateRigManifest(makeManifest());
    expect(result.ok).toBe(true);
  });

  it('rejects non-object input with a readable error', () => {
    const result = validateRigManifest('nope');
    expect(result).toEqual({ ok: false, errors: ['manifest: expected a JSON object'] });
  });

  it('flags a duplicate layer id', () => {
    const result = validateRigManifest(
      makeManifest({ layers: [makeLayer('alpha', 0), makeLayer('alpha', 1)], drawOrder: ['alpha', 'alpha'] })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('duplicate layer id "alpha"');
  });

  it('flags layers listed out of z order', () => {
    const result = validateRigManifest(
      makeManifest({ layers: [makeLayer('alpha', 1), makeLayer('beta', 0)], drawOrder: ['alpha', 'beta'] })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('ascending z');
  });

  it('flags a drawOrder that disagrees with the layer list', () => {
    const result = validateRigManifest(makeManifest({ drawOrder: ['beta', 'alpha'] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('drawOrder');
  });

  it('flags bounds outside the canvas and visibleBounds outside bounds', () => {
    const bad = makeLayer('alpha', 0);
    bad.bounds = { x: 1500, y: 20, width: 100, height: 50 }; // spills past width 1536
    bad.visibleBounds = { x: 0, y: 0, width: 3000, height: 3000 };
    const result = validateRigManifest(makeManifest({ layers: [bad, makeLayer('beta', 1)] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join('\n')).toContain('layers[0].bounds: outside the canvas');
      expect(result.errors.join('\n')).toContain('layers[0].visibleBounds: not contained in bounds');
    }
  });

  it('flags a missing pattern mask with the exact path', () => {
    const bad = makeLayer('alpha', 0);
    bad.patternMasks = { solid: 'pattern-masks/alpha/solid.png', mottle: 'pattern-masks/alpha/mottle.png' };
    const result = validateRigManifest(makeManifest({ layers: [bad, makeLayer('beta', 1)] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('layers[0].patternMasks.bands');
  });

  it('rejects path traversal in asset paths', () => {
    const bad = makeLayer('alpha', 0);
    bad.source = '../../etc/passwd.png';
    const result = validateRigManifest(makeManifest({ layers: [bad, makeLayer('beta', 1)] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('layers[0].source');
  });
});

describe('validateTrexR0Manifest', () => {
  it('rejects a valid pack that is not the twelve-layer trex rig', () => {
    const result = validateTrexR0Manifest(makeManifest());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('twelve trex-r0 layer ids');
  });

  it('accepts a pack with exactly the twelve known layers in order', () => {
    const layers = RIG_LAYER_IDS.map((id, z) => makeLayer(id, z));
    const result = validateTrexR0Manifest(makeManifest({ layers, drawOrder: [...RIG_LAYER_IDS] }));
    expect(result.ok).toBe(true);
  });
});

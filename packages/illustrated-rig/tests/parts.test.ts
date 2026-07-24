import { describe, expect, it } from 'vitest';
import { applyMat } from '../src/affine';
import { DEFAULT_RIG_PARAMS } from '../src/params';
import {
  PARTS_LAYER_IDS,
  PARTS_MESH_LAYER_IDS,
  evaluatePartsRigPose,
  partsEffectiveMotion,
  restPartsMesh,
} from '../src/parts';
import { TREX_SOCK_RIG_DEF } from '../src/parts-defs';
import { validatePartsManifest } from '../src/manifest';
import type { IllustratedRigParams } from '../src/types';

/**
 * Parts-first rig invariants (D-021 probe). The parts evaluator is its own
 * pure function; these prove it holds the same guarantees the twelve-layer
 * evaluator does — determinism, a rest-identical neutral pose, planted feet,
 * pinned mesh ends, and a head that hands off cleanly to the neck.
 */
const DEF = TREX_SOCK_RIG_DEF;
const SEED = DEF.seed;

function staticParams(motion: Partial<IllustratedRigParams> = {}): IllustratedRigParams {
  return { ...DEFAULT_RIG_PARAMS, autoIdle: false, ...motion };
}

describe('parts-first rig shape', () => {
  it('exposes exactly nine pieces, three of them meshes', () => {
    expect(PARTS_LAYER_IDS).toHaveLength(9);
    expect([...PARTS_MESH_LAYER_IDS].sort()).toEqual(['core', 'neck', 'tail']);
    const pose = evaluatePartsRigPose(DEF, staticParams(), { seed: SEED, timeMs: 0 });
    expect(Object.keys(pose.layers).sort()).toEqual([...PARTS_LAYER_IDS].sort());
  });

  it('mesh grids cover their layer bounds at rest', () => {
    for (const id of PARTS_MESH_LAYER_IDS) {
      const spec = DEF.meshSpecs[id];
      const rest = restPartsMesh(DEF, id);
      const b = DEF.layerBounds[id];
      expect(rest.length).toBe(2 * (spec.columns + 1) * (spec.rows + 1));
      expect(rest[0]).toBe(b.x);
      expect(rest[1]).toBe(b.y);
      expect(rest[rest.length - 2]).toBe(b.x + b.width);
      expect(rest[rest.length - 1]).toBe(b.y + b.height);
    }
  });
});

describe('deterministic parts pose', () => {
  it('same params, seed and timeMs → identical pose', () => {
    const params = { ...DEFAULT_RIG_PARAMS, pattern: 'bands' as const };
    const a = evaluatePartsRigPose(DEF, params, { seed: SEED, timeMs: 3210.5 });
    const b = evaluatePartsRigPose(DEF, params, { seed: SEED, timeMs: 3210.5 });
    expect(a).toEqual(b);
  });

  it('reduced motion ignores time and idle', () => {
    const params = { ...DEFAULT_RIG_PARAMS, reducedMotion: true, breath: 0.5 };
    const a = evaluatePartsRigPose(DEF, params, { seed: SEED, timeMs: 0 });
    const b = evaluatePartsRigPose(DEF, params, { seed: SEED + 7, timeMs: 424242 });
    expect(a).toEqual(b);
    expect(a.effective.breath).toBe(0.5);
  });

  it('clamps stride and jaw to the parts def envelope', () => {
    const wide = partsEffectiveMotion(DEF, staticParams({ stride: 1 }), { seed: SEED, timeMs: 0 });
    expect(wide.stride).toBe(DEF.strideRange.max);
    const back = partsEffectiveMotion(DEF, staticParams({ stride: -1 }), { seed: SEED, timeMs: 0 });
    expect(back.stride).toBe(DEF.strideRange.min);
    const gape = partsEffectiveMotion(DEF, staticParams({ jawAngle: 99 }), { seed: SEED, timeMs: 0 });
    expect(gape.jawAngle).toBe(DEF.jawRange.max);
  });
});

describe('parts pose geometry invariants', () => {
  it('neutral pose is exactly the rest pose (identity transforms, meshes at rest)', () => {
    const pose = evaluatePartsRigPose(DEF, staticParams(), { seed: SEED, timeMs: 0 });
    for (const layerPose of Object.values(pose.layers)) {
      if (layerPose.kind === 'transform') expect(layerPose.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    }
    for (const id of PARTS_MESH_LAYER_IDS) {
      expect(pose.layers[id]).toMatchObject({ positions: restPartsMesh(DEF, id) });
    }
  });

  it('feet stay planted while breathing: legs stay identity, core ends pinned', () => {
    const pose = evaluatePartsRigPose(DEF, staticParams({ breath: 1 }), { seed: SEED, timeMs: 0 });
    for (const id of ['far-leg', 'near-leg'] as const) {
      const layer = pose.layers[id];
      expect(layer.kind).toBe('transform');
      if (layer.kind === 'transform') expect(layer.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    }
    // The core's front (neck-base) and rear (tail-root) columns hold still.
    const core = pose.layers.core;
    if (core.kind !== 'mesh') throw new Error('core must be a mesh');
    const rest = restPartsMesh(DEF, 'core');
    const { columns } = DEF.meshSpecs.core;
    for (let j = 0; j <= DEF.meshSpecs.core.rows; j++) {
      const left = 2 * (j * (columns + 1));
      const right = 2 * (j * (columns + 1) + columns);
      expect(core.positions[left]).toBeCloseTo(rest[left]!, 4);
      expect(core.positions[right]).toBeCloseTo(rest[right]!, 4);
    }
  });

  it('breathing lifts the core dorsal edge up', () => {
    const pose = evaluatePartsRigPose(DEF, staticParams({ breath: 1 }), { seed: SEED, timeMs: 0 });
    const core = pose.layers.core;
    if (core.kind !== 'mesh') throw new Error('core must be a mesh');
    const rest = restPartsMesh(DEF, 'core');
    const { columns } = DEF.meshSpecs.core;
    // A mid-span top vertex (dorsal) rises above rest.
    const mid = 2 * Math.floor(columns / 2);
    expect(core.positions[mid + 1]!).toBeLessThan(rest[mid + 1]!);
  });

  it('the head hands off to the neck in the rigid head-follow zone', () => {
    const pose = evaluatePartsRigPose(DEF, staticParams({ breath: 0.8 }), { seed: SEED, timeMs: 0 });
    const neck = pose.layers.neck;
    const head = pose.layers['head-upper'];
    if (neck.kind !== 'mesh' || head.kind !== 'transform') throw new Error('unexpected pose kinds');
    const rest = restPartsMesh(DEF, 'neck');
    for (let i = 0; i < rest.length; i += 2) {
      const x = rest[i]!;
      if (x > DEF.deform.neck.xHead) continue; // rigid skull-follow zone only
      const expected = applyMat(head.matrix, { x, y: rest[i + 1]! });
      expect(neck.positions[i]).toBeCloseTo(expected.x, 4);
      expect(neck.positions[i + 1]).toBeCloseTo(expected.y, 4);
    }
  });

  it('the tail root under the core stays pinned at full sway', () => {
    const pose = evaluatePartsRigPose(DEF, staticParams({ tailSway: 1 }), { seed: SEED, timeMs: 0 });
    const tail = pose.layers.tail;
    if (tail.kind !== 'mesh') throw new Error('tail must be a mesh');
    const rest = restPartsMesh(DEF, 'tail');
    for (let i = 0; i < rest.length; i += 2) {
      if (rest[i]! > DEF.deform.tail.ramp[0]) continue; // only the pinned root band
      expect(tail.positions[i]).toBeCloseTo(rest[i]!, 4);
      expect(tail.positions[i + 1]).toBeCloseTo(rest[i + 1]!, 4);
    }
  });

  it('a clenching jaw lifts the chin toward the skull', () => {
    const chin = { x: 70, y: 410 };
    const jawAt = (jawAngle: number): number => {
      const layer = evaluatePartsRigPose(DEF, staticParams({ jawAngle }), { seed: SEED, timeMs: 0 }).layers[
        'jaw-lower'
      ];
      if (layer.kind !== 'transform') throw new Error('jaw must be rigid');
      return applyMat(layer.matrix, chin).y;
    };
    expect(jawAt(-3)).toBeLessThan(jawAt(0));
    expect(jawAt(-8)).toBeLessThan(jawAt(-3));
  });

  it('a forward stride swings the near leg and sways the tail', () => {
    const neutral = evaluatePartsRigPose(DEF, staticParams(), { seed: SEED, timeMs: 0 });
    const strode = evaluatePartsRigPose(DEF, staticParams({ stride: DEF.strideRange.max }), { seed: SEED, timeMs: 0 });
    const nearLeg = strode.layers['near-leg'];
    if (nearLeg.kind !== 'transform') throw new Error('near-leg must be rigid');
    expect(nearLeg.matrix).not.toEqual([1, 0, 0, 1, 0, 0]);
    // The tail tip moves under stride (leg + tail read the same gait).
    const tail = strode.layers.tail;
    const tailRest = neutral.layers.tail;
    if (tail.kind !== 'mesh' || tailRest.kind !== 'mesh') throw new Error('tail must be a mesh');
    expect(tail.positions).not.toEqual(tailRest.positions);
  });
});

describe('parts manifest validation', () => {
  it('rejects a twelve-layer theropod manifest as not parts-first', () => {
    const twelve = {
      rigId: 'x',
      canvas: { width: 1536, height: 1024 },
      drawOrder: ['a'],
      layers: [
        {
          id: 'a',
          z: 0,
          source: 'layers/00-a.png',
          fullCanvasOrigin: [0, 0],
          bounds: { x: 1, y: 1, width: 10, height: 10 },
          visibleBounds: { x: 1, y: 1, width: 8, height: 8 },
          visiblePixelCount: 1,
          overlapPixelCount: 0,
          patternMasks: { solid: 'pattern-masks/a/solid.png', mottle: 'pattern-masks/a/mottle.png', bands: 'pattern-masks/a/bands.png' },
        },
      ],
    };
    const result = validatePartsManifest(twelve);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join('\n')).toContain('nine parts-first layer ids');
  });
});

describe('fixed-time parts pose snapshot', () => {
  it('the full evaluated parts pose at a known (seed, timeMs) is stable', () => {
    const pose = evaluatePartsRigPose(DEF, DEFAULT_RIG_PARAMS, { seed: SEED, timeMs: 2500 });
    const rounded = {
      effective: Object.fromEntries(
        Object.entries(pose.effective).map(([k, v]) => [k, Number(v.toFixed(4))])
      ),
      layers: Object.fromEntries(
        Object.entries(pose.layers).map(([id, layer]) => [
          id,
          layer.kind === 'transform'
            ? { kind: layer.kind, matrix: layer.matrix.map((v) => Number(v.toFixed(4))) }
            : { kind: layer.kind, grid: layer.grid, positions: layer.positions.map((v) => Number(v.toFixed(4))) },
        ])
      ),
    };
    expect(rounded).toMatchSnapshot();
  });
});

import { describe, expect, it } from 'vitest';
import { applyMat } from '../src/affine';
import { idleMotion } from '../src/idle';
import { DEFAULT_RIG_PARAMS, MOTION_RANGES, clampRigParams, rigPresets } from '../src/params';
import { effectiveMotion, evaluateRigPose } from '../src/pose';
import { ALLOSAURUS_RIG_DEF, TREX_RIG_DEF, restMeshPositions } from '../src/species-defs';
import type { IllustratedRigParams } from '../src/types';

const SEED = 20260718;
const DEF = TREX_RIG_DEF;

function staticParams(motion: Partial<IllustratedRigParams> = {}): IllustratedRigParams {
  return { ...DEFAULT_RIG_PARAMS, autoIdle: false, ...motion };
}

describe('parameter clamping', () => {
  it('clamps every motion axis into its documented range', () => {
    const clamped = clampRigParams(
      staticParams({ headAngle: 999, jawAngle: -99, breath: 2, stride: -9, tailSway: 1.5 })
    );
    expect(clamped.headAngle).toBe(MOTION_RANGES.headAngle.max);
    expect(clamped.jawAngle).toBe(MOTION_RANGES.jawAngle.min);
    expect(clamped.breath).toBe(1);
    expect(clamped.stride).toBe(MOTION_RANGES.stride.min);
    expect(clamped.tailSway).toBe(1);
  });

  it('sanitizes non-finite numbers, bad colors and unknown patterns', () => {
    const clamped = clampRigParams(
      staticParams({
        headAngle: Number.NaN,
        breath: Number.POSITIVE_INFINITY,
        pattern: 'plaid' as never,
        patternIntensity: 7,
        patternColor: 'chartreuse',
      })
    );
    expect(clamped.headAngle).toBe(0);
    expect(clamped.breath).toBe(1);
    expect(clamped.pattern).toBe('none');
    expect(clamped.patternIntensity).toBe(1);
    expect(clamped.patternColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('presets are all inside the clamp ranges (stress sits on the bounds)', () => {
    for (const preset of Object.values(rigPresets(DEF.strideRange.max, DEF.jawRange))) {
      const clamped = clampRigParams(staticParams(preset));
      expect(clamped.headAngle).toBe(preset.headAngle);
      expect(clamped.jawAngle).toBe(preset.jawAngle);
      expect(clamped.breath).toBe(preset.breath);
      expect(clamped.stride).toBe(preset.stride);
      expect(clamped.tailSway).toBe(preset.tailSway);
    }
  });
});

describe('deterministic pose evaluation', () => {
  it('same params, seed and timeMs → identical pose, to the last bit', () => {
    const params = { ...DEFAULT_RIG_PARAMS, pattern: 'mottle' as const };
    const a = evaluateRigPose(DEF, params, { seed: SEED, timeMs: 4321.5 });
    const b = evaluateRigPose(DEF, params, { seed: SEED, timeMs: 4321.5 });
    expect(a).toEqual(b);
  });

  it('different timeMs changes the idle pose; different seed changes the phase', () => {
    const params = DEFAULT_RIG_PARAMS;
    const base = evaluateRigPose(DEF, params, { seed: SEED, timeMs: 1000 });
    const laterTime = evaluateRigPose(DEF, params, { seed: SEED, timeMs: 2000 });
    const otherSeed = evaluateRigPose(DEF, params, { seed: SEED + 1, timeMs: 1000 });
    expect(laterTime.effective).not.toEqual(base.effective);
    expect(otherSeed.effective).not.toEqual(base.effective);
  });

  it('reduced motion ignores time and idle entirely', () => {
    const params = { ...DEFAULT_RIG_PARAMS, reducedMotion: true, breath: 0.5 };
    const a = evaluateRigPose(DEF, params, { seed: SEED, timeMs: 0 });
    const b = evaluateRigPose(DEF, params, { seed: SEED + 99, timeMs: 987654 });
    expect(a).toEqual(b);
    expect(a.effective.breath).toBe(0.5);
  });

  it('idle output stays inside the slider ranges at all sampled times', () => {
    for (let t = 0; t <= 30000; t += 137) {
      const m = idleMotion(SEED, t);
      expect(m.headAngle).toBeGreaterThanOrEqual(MOTION_RANGES.headAngle.min);
      expect(m.headAngle).toBeLessThanOrEqual(MOTION_RANGES.headAngle.max);
      expect(m.breath).toBeGreaterThanOrEqual(0);
      expect(m.breath).toBeLessThanOrEqual(1);
      expect(m.jawAngle).toBeGreaterThanOrEqual(0);
      expect(Math.abs(m.stride)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.tailSway)).toBeLessThanOrEqual(1);
    }
  });

  it('effectiveMotion with idle off passes the sliders through clamped', () => {
    const m = effectiveMotion(DEF, staticParams({ headAngle: 4, breath: 0.3 }), { seed: SEED, timeMs: 5555 });
    expect(m).toEqual({ headAngle: 4, jawAngle: 0, breath: 0.3, stride: 0, tailSway: 0 });
  });
});

describe('pose geometry invariants', () => {
  it('neutral pose is exactly the rest pose', () => {
    const pose = evaluateRigPose(DEF, staticParams(), { seed: SEED, timeMs: 0 });
    for (const layerPose of Object.values(pose.layers)) {
      if (layerPose.kind === 'transform') {
        expect(layerPose.matrix).toEqual([1, 0, 0, 1, 0, 0]);
      }
    }
    expect(pose.layers.torso).toMatchObject({ positions: restMeshPositions(DEF, 'torso') });
    expect(pose.layers.neck).toMatchObject({ positions: restMeshPositions(DEF, 'neck') });
  });

  it('feet stay planted while breathing: leg transforms identity, torso bottom row at rest', () => {
    const pose = evaluateRigPose(DEF, staticParams({ breath: 1 }), { seed: SEED, timeMs: 0 });
    for (const id of ['far-hind-shank-foot', 'near-hind-shank-foot', 'far-hind-thigh', 'near-hind-thigh'] as const) {
      const layer = pose.layers[id];
      expect(layer.kind).toBe('transform');
      if (layer.kind === 'transform') expect(layer.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    }
    const torso = pose.layers.torso;
    if (torso.kind !== 'mesh') throw new Error('torso must be a mesh');
    const rest = restMeshPositions(DEF, 'torso');
    const { columns, rows } = DEF.meshSpecs.torso;
    const bottomRowStart = 2 * (columns + 1) * rows;
    for (let i = bottomRowStart; i < rest.length; i++) {
      expect(torso.positions[i]).toBeCloseTo(rest[i]!, 6);
    }
  });

  it('breathing pins the torso pelvis-boundary column and moves the dorsal edge up', () => {
    const pose = evaluateRigPose(DEF, staticParams({ breath: 1 }), { seed: SEED, timeMs: 0 });
    const torso = pose.layers.torso;
    if (torso.kind !== 'mesh') throw new Error('torso must be a mesh');
    const rest = restMeshPositions(DEF, 'torso');
    const { columns } = DEF.meshSpecs.torso;
    // Rightmost column (pelvis boundary) must not move.
    for (let j = 0; j <= DEF.meshSpecs.torso.rows; j++) {
      const idx = 2 * (j * (columns + 1) + columns);
      expect(torso.positions[idx]).toBeCloseTo(rest[idx]!, 6);
      expect(torso.positions[idx + 1]).toBeCloseTo(rest[idx + 1]!, 6);
    }
    // Top-left dorsal vertex rises.
    expect(torso.positions[1]!).toBeLessThan(rest[1]! - 4);
  });

  it('the head assembly matches the neck mesh where the skull takes over (seam closed by construction)', () => {
    // headAngle 0 keeps the head's own offsets out of the comparison; breath
    // exercises the shared lift + neck counter-rotation path.
    const pose = evaluateRigPose(DEF, staticParams({ breath: 0.8 }), { seed: SEED, timeMs: 0 });
    const neck = pose.layers.neck;
    const head = pose.layers['head-upper'];
    if (neck.kind !== 'mesh' || head.kind !== 'transform') throw new Error('unexpected pose kinds');
    const rest = restMeshPositions(DEF, 'neck');
    for (let i = 0; i < rest.length; i += 2) {
      const x = rest[i]!;
      if (x > DEF.deform.neck.xHead) continue; // only the rigid head-follow zone
      const expected = applyMat(head.matrix, { x, y: rest[i + 1]! });
      expect(neck.positions[i]).toBeCloseTo(expected.x, 6);
      expect(neck.positions[i + 1]).toBeCloseTo(expected.y, 6);
    }
  });

  it('tail base under the pelvis stays pinned at full sway', () => {
    const pose = evaluateRigPose(DEF, staticParams({ tailSway: 1 }), { seed: SEED, timeMs: 0 });
    const tail = pose.layers.tail;
    if (tail.kind !== 'mesh') throw new Error('tail must be a mesh');
    const rest = restMeshPositions(DEF, 'tail');
    for (let i = 0; i < rest.length; i += 2) {
      if (rest[i]! > 870) continue;
      expect(tail.positions[i]).toBeCloseTo(rest[i]!, 6);
      expect(tail.positions[i + 1]).toBeCloseTo(rest[i + 1]!, 6);
    }
  });

  it('mesh grids cover their layer bounds at rest', () => {
    for (const [id, spec] of Object.entries(DEF.meshSpecs) as [keyof typeof DEF.meshSpecs, (typeof DEF.meshSpecs)[keyof typeof DEF.meshSpecs]][]) {
      const rest = restMeshPositions(DEF, id);
      const b = DEF.layerBounds[id];
      expect(rest.length).toBe(2 * (spec.columns + 1) * (spec.rows + 1));
      expect(rest[0]).toBe(b.x);
      expect(rest[1]).toBe(b.y);
      expect(rest[rest.length - 2]).toBe(b.x + b.width);
      expect(rest[rest.length - 1]).toBe(b.y + b.height);
    }
  });
});

describe('allosaurus rig def', () => {
  const ADEF = ALLOSAURUS_RIG_DEF;

  it('neutral pose is exactly the rest pose', () => {
    const pose = evaluateRigPose(ADEF, staticParams(), { seed: ADEF.seed, timeMs: 0 });
    for (const layerPose of Object.values(pose.layers)) {
      if (layerPose.kind === 'transform') expect(layerPose.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    }
    expect(pose.layers.torso).toMatchObject({ positions: restMeshPositions(ADEF, 'torso') });
  });

  it('feet stay planted while breathing', () => {
    const pose = evaluateRigPose(ADEF, staticParams({ breath: 1 }), { seed: ADEF.seed, timeMs: 0 });
    for (const id of ['far-hind-shank-foot', 'near-hind-shank-foot'] as const) {
      const layer = pose.layers[id];
      if (layer.kind === 'transform') expect(layer.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    }
  });

  it('head assembly matches the neck mesh in the rigid head-follow zone', () => {
    const pose = evaluateRigPose(ADEF, staticParams({ breath: 0.8 }), { seed: ADEF.seed, timeMs: 0 });
    const neck = pose.layers.neck;
    const head = pose.layers['head-upper'];
    if (neck.kind !== 'mesh' || head.kind !== 'transform') throw new Error('unexpected pose kinds');
    const rest = restMeshPositions(ADEF, 'neck');
    for (let i = 0; i < rest.length; i += 2) {
      const x = rest[i]!;
      if (x > ADEF.deform.neck.xHead) continue;
      const expected = applyMat(head.matrix, { x, y: rest[i + 1]! });
      expect(neck.positions[i]).toBeCloseTo(expected.x, 6);
      expect(neck.positions[i + 1]).toBeCloseTo(expected.y, 6);
    }
  });

  it('clamps stride and jaw to each species def', () => {
    const wide = effectiveMotion(ADEF, staticParams({ stride: 1 }), { seed: ADEF.seed, timeMs: 0 });
    expect(wide.stride).toBe(ADEF.strideRange.max);
    const clench = effectiveMotion(ADEF, staticParams({ jawAngle: -99 }), { seed: ADEF.seed, timeMs: 0 });
    expect(clench.jawAngle).toBe(ADEF.jawRange.min);
    const gape = effectiveMotion(DEF, staticParams({ jawAngle: 99 }), { seed: SEED, timeMs: 0 });
    expect(gape.jawAngle).toBe(DEF.jawRange.max);
  });

  it('a clenching jaw lifts the chin toward the skull, deeper with more clench', () => {
    const shut = evaluateRigPose(DEF, staticParams({ jawAngle: -3 }), { seed: SEED, timeMs: 0 });
    const shutHard = evaluateRigPose(DEF, staticParams({ jawAngle: -8 }), { seed: SEED, timeMs: 0 });
    const neutral = evaluateRigPose(DEF, staticParams({}), { seed: SEED, timeMs: 0 });
    const chin = { x: 60, y: 400 };
    const jawAt = (pose: typeof shut) => {
      const layer = pose.layers['jaw-lower'];
      if (layer.kind !== 'transform') throw new Error('jaw must be rigid');
      return applyMat(layer.matrix, chin);
    };
    expect(jawAt(shut).y).toBeLessThan(jawAt(neutral).y);
    expect(jawAt(shutHard).y).toBeLessThan(jawAt(shut).y);
    // Opening past the painted pose is not backable by art: clamp holds at 0.
    const wide = effectiveMotion(DEF, staticParams({ jawAngle: 99 }), { seed: SEED, timeMs: 0 });
    expect(wide.jawAngle).toBe(0);
  });

  it('fixed-time allosaurus pose snapshot is stable', () => {
    const pose = evaluateRigPose(ADEF, DEFAULT_RIG_PARAMS, { seed: ADEF.seed, timeMs: 2500 });
    const rounded = Object.fromEntries(
      Object.entries(pose.layers).map(([id, layer]) => [
        id,
        layer.kind === 'transform'
          ? layer.matrix.map((v) => Number(v.toFixed(4)))
          : layer.positions.map((v) => Number(v.toFixed(4))),
      ])
    );
    expect(rounded).toMatchSnapshot();
  });
});

describe('fixed-time pose snapshot', () => {
  it('the full evaluated pose at a known (seed, timeMs) is stable', () => {
    const pose = evaluateRigPose(DEF, DEFAULT_RIG_PARAMS, { seed: SEED, timeMs: 2500 });
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

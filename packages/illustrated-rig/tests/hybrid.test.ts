import { describe, expect, it } from 'vitest';
import { applyMat } from '../src/affine';
import {
  evaluateHybridRigPose,
  formatHybridConfig,
  combineHybridRanges,
  hybridLabel,
  hybridMotionRanges,
  hybridPartOffsets,
  hybridPosedPivots,
  hybridSeed,
  layerSourceSpecies,
  parseHybridConfig,
  pureConfig,
  type HybridRigConfig,
} from '../src/hybrid';
import { DEFAULT_RIG_PARAMS } from '../src/params';
import { evaluateRigPose, headBaseMatrix } from '../src/pose';
import { ALLOSAURUS_RIG_DEF, TREX_RIG_DEF, restMeshPositions } from '../src/species-defs';
import type { IllustratedRigParams } from '../src/types';

/** The marquee mix of this PoC: an Allosaurus head on the T. rex body. */
const ALLO_HEAD_ON_TREX: HybridRigConfig = { ...pureConfig('trex'), head: 'allosaurus' };

function staticParams(motion: Partial<IllustratedRigParams> = {}): IllustratedRigParams {
  return { ...DEFAULT_RIG_PARAMS, autoIdle: false, ...motion };
}

describe('pure configs (every group from one pack)', () => {
  it('are bit-identical to the plain species evaluator, idle and posed', () => {
    for (const species of ['trex', 'allosaurus'] as const) {
      const config = pureConfig(species);
      const seed = hybridSeed(config);
      for (const [params, timeMs] of [
        [DEFAULT_RIG_PARAMS, 2500],
        [staticParams({ breath: 0.8, stride: 0.5, jawAngle: -4, headAngle: 3, tailSway: -0.6 }), 0],
      ] as const) {
        const hybrid = evaluateHybridRigPose(config, params, { seed, timeMs });
        const plain = evaluateRigPose(
          species === 'trex' ? TREX_RIG_DEF : ALLOSAURUS_RIG_DEF,
          params,
          { seed, timeMs }
        );
        expect(hybrid).toEqual(plain);
      }
    }
  });

  it('hybridSeed is the body pack seed; label falls back to the species label', () => {
    expect(hybridSeed(pureConfig('trex'))).toBe(TREX_RIG_DEF.seed);
    expect(hybridSeed(ALLO_HEAD_ON_TREX)).toBe(TREX_RIG_DEF.seed);
    expect(hybridLabel(pureConfig('allosaurus'))).toBe('Allosaurus');
    expect(hybridLabel(ALLO_HEAD_ON_TREX)).toBe('Tyrannosaurus rex body · Allosaurus head');
  });
});

describe('donor head group', () => {
  it('at static neutral, the donor head is exactly the anchor translation; body layers stay at rest', () => {
    const pose = evaluateHybridRigPose(ALLO_HEAD_ON_TREX, staticParams(), { seed: 1, timeMs: 0 });
    const off = hybridPartOffsets(TREX_RIG_DEF, ALLOSAURUS_RIG_DEF).head;
    // Cover anchor: rear edges of the two head-upper layers differ by 4 px
    // (trex 34+234=268, allosaurus 39+233=272); atlas heights match at 300.
    expect(off).toEqual({ x: -4, y: 0 });
    for (const id of ['head-upper', 'jaw-lower'] as const) {
      const layer = pose.layers[id];
      if (layer.kind !== 'transform') throw new Error(`${id} must be rigid`);
      expect(layer.matrix).toEqual([1, 0, 0, 1, off.x, off.y]);
    }
    const torso = pose.layers.torso;
    if (torso.kind !== 'mesh') throw new Error('torso must be a mesh');
    expect(torso.positions).toEqual(restMeshPositions(TREX_RIG_DEF, 'torso'));
  });

  it('the donor jaw hinges about the donor pivot carried to the base space', () => {
    const clench = evaluateHybridRigPose(ALLO_HEAD_ON_TREX, staticParams({ jawAngle: -6 }), {
      seed: 1,
      timeMs: 0,
    });
    const jaw = clench.layers['jaw-lower'];
    if (jaw.kind !== 'transform') throw new Error('jaw must be rigid');
    const off = hybridPartOffsets(TREX_RIG_DEF, ALLOSAURUS_RIG_DEF).head;
    const donorHinge = ALLOSAURUS_RIG_DEF.pivots.jaw;
    // The hinge is the fixed point of the jaw's motion relative to the head.
    const posedHinge = applyMat(jaw.matrix, donorHinge);
    expect(posedHinge.x).toBeCloseTo(donorHinge.x + off.x, 9);
    expect(posedHinge.y).toBeCloseTo(donorHinge.y + off.y, 9);
    // And a chin point rises toward the skull when clenching.
    const neutral = evaluateHybridRigPose(ALLO_HEAD_ON_TREX, staticParams(), { seed: 1, timeMs: 0 });
    const neutralJaw = neutral.layers['jaw-lower'];
    if (neutralJaw.kind !== 'transform') throw new Error('jaw must be rigid');
    const chin = { x: 70, y: 400 };
    expect(applyMat(jaw.matrix, chin).y).toBeLessThan(applyMat(neutralJaw.matrix, chin).y);
  });

  it('head swing rotates about the donor pivot carried to base space, not the base pivot', () => {
    const pose = evaluateHybridRigPose(ALLO_HEAD_ON_TREX, staticParams({ headAngle: 6 }), {
      seed: 1,
      timeMs: 0,
    });
    const head = pose.layers['head-upper'];
    if (head.kind !== 'transform') throw new Error('head must be rigid');
    const off = hybridPartOffsets(TREX_RIG_DEF, ALLOSAURUS_RIG_DEF).head;
    const h = TREX_RIG_DEF.deform.head;
    const donorPivot = ALLOSAURUS_RIG_DEF.pivots.head;
    // Relative to the neck-carried frame, the pivot displaces by exactly the
    // anchor offset plus the base's per-degree head drift — the swing itself
    // contributes no displacement at its own pivot.
    const posed = applyMat(head.matrix, donorPivot);
    const carried = applyMat(headBaseMatrix(TREX_RIG_DEF, pose.effective), {
      x: donorPivot.x + off.x + 6 * h.dxPerDeg,
      y: donorPivot.y + off.y + 6 * h.dyPerDegUp,
    });
    expect(posed.x).toBeCloseTo(carried.x, 9);
    expect(posed.y).toBeCloseTo(carried.y, 9);
  });

  it('jaw range comes from the head species, stride from body∩legs', () => {
    const ranges = hybridMotionRanges(ALLO_HEAD_ON_TREX);
    expect(ranges.jawRange).toEqual(ALLOSAURUS_RIG_DEF.jawRange);
    expect(ranges.strideRange).toEqual(TREX_RIG_DEF.strideRange);

    // Synthetic defs prove the selection logic even while the real packs
    // share identical envelopes.
    const narrowLegs = { ...ALLOSAURUS_RIG_DEF, strideRange: { min: -0.4, max: 0.7 } };
    const softJaw = { ...ALLOSAURUS_RIG_DEF, jawRange: { min: -5, max: 0 } };
    const combined = combineHybridRanges(TREX_RIG_DEF, softJaw, narrowLegs);
    expect(combined.strideRange).toEqual({ min: -0.4, max: 0.7 });
    expect(combined.jawRange).toEqual({ min: -5, max: 0 });
  });
});

describe('donor legs group', () => {
  const TREX_LEGS_ON_ALLO: HybridRigConfig = { ...pureConfig('allosaurus'), legs: 'trex' };

  it('plants donor feet on the base ground line (contact-anchored y)', () => {
    const offs = hybridPartOffsets(ALLOSAURUS_RIG_DEF, TREX_RIG_DEF);
    const pose = evaluateHybridRigPose(TREX_LEGS_ON_ALLO, staticParams(), { seed: 1, timeMs: 0 });
    for (const [id, off] of [
      ['far-hind-shank-foot', offs.farLeg],
      ['near-hind-shank-foot', offs.nearLeg],
    ] as const) {
      const layer = pose.layers[id];
      if (layer.kind !== 'transform') throw new Error(`${id} must be rigid`);
      const donorBounds = TREX_RIG_DEF.layerBounds[id];
      const baseBounds = ALLOSAURUS_RIG_DEF.layerBounds[id];
      const donorContact = { x: donorBounds.x, y: donorBounds.y + donorBounds.height };
      const posed = applyMat(layer.matrix, donorContact);
      expect(posed.y).toBeCloseTo(baseBounds.y + baseBounds.height, 9);
      expect(layer.matrix).toEqual([1, 0, 0, 1, off.x, off.y]);
    }
  });

  it('keeps chains connected: thigh and shank share the chain offset at stride', () => {
    const pose = evaluateHybridRigPose(TREX_LEGS_ON_ALLO, staticParams({ stride: 0.8 }), {
      seed: 1,
      timeMs: 0,
    });
    const thigh = pose.layers['near-hind-thigh'];
    const shank = pose.layers['near-hind-shank-foot'];
    if (thigh.kind !== 'transform' || shank.kind !== 'transform') throw new Error('legs must be rigid');
    // At positive stride the near shank has zero counter-rotation, so the
    // shank matrix must equal the thigh matrix exactly (the chain moved as one).
    expect(shank.matrix).toEqual(thigh.matrix);
    // And the knee pivot is the fixed point between thigh and shank in general:
    const back = evaluateHybridRigPose(TREX_LEGS_ON_ALLO, staticParams({ stride: -0.8 }), {
      seed: 1,
      timeMs: 0,
    });
    const bThigh = back.layers['near-hind-thigh'];
    const bShank = back.layers['near-hind-shank-foot'];
    if (bThigh.kind !== 'transform' || bShank.kind !== 'transform') throw new Error('legs must be rigid');
    const knee = TREX_RIG_DEF.pivots.nearKnee;
    const viaThigh = applyMat(bThigh.matrix, knee);
    const viaShank = applyMat(bShank.matrix, knee);
    expect(viaShank.x).toBeCloseTo(viaThigh.x, 9);
    expect(viaShank.y).toBeCloseTo(viaThigh.y, 9);
  });
});

describe('donor tail group', () => {
  const ALLO_TAIL_ON_TREX: HybridRigConfig = { ...pureConfig('trex'), tail: 'allosaurus' };

  it('at rest the donor tail grid is the pure anchor translation', () => {
    const pose = evaluateHybridRigPose(ALLO_TAIL_ON_TREX, staticParams(), { seed: 1, timeMs: 0 });
    const tail = pose.layers.tail;
    if (tail.kind !== 'mesh') throw new Error('tail must be a mesh');
    const off = hybridPartOffsets(TREX_RIG_DEF, ALLOSAURUS_RIG_DEF).tail;
    const rest = restMeshPositions(ALLOSAURUS_RIG_DEF, 'tail');
    for (let i = 0; i < rest.length; i += 2) {
      expect(tail.positions[i]).toBeCloseTo(rest[i]! + off.x, 9);
      expect(tail.positions[i + 1]).toBeCloseTo(rest[i + 1]! + off.y, 9);
    }
  });

  it('under full sway the shifted root stays pinned under the base pelvis while the tip sweeps', () => {
    const pose = evaluateHybridRigPose(ALLO_TAIL_ON_TREX, staticParams({ tailSway: 1 }), {
      seed: 1,
      timeMs: 0,
    });
    const tail = pose.layers.tail;
    if (tail.kind !== 'mesh') throw new Error('tail must be a mesh');
    const off = hybridPartOffsets(TREX_RIG_DEF, ALLOSAURUS_RIG_DEF).tail;
    const rest = restMeshPositions(ALLOSAURUS_RIG_DEF, 'tail');
    // Root column (leftmost, tucked under the base pelvis): pinned to ~px.
    expect(tail.positions[0]).toBeCloseTo(rest[0]! + off.x, 1);
    expect(tail.positions[1]).toBeCloseTo(rest[1]! + off.y, 1);
    // Tip column (rightmost): swept well away from its rest position.
    const tipIdx = rest.length - 2;
    const tipMoved = Math.hypot(
      tail.positions[tipIdx]! - (rest[tipIdx]! + off.x),
      tail.positions[tipIdx + 1]! - (rest[tipIdx + 1]! + off.y)
    );
    expect(tipMoved).toBeGreaterThan(10);
  });
});

describe('determinism and hybrid identity', () => {
  it('same config, params, seed and timeMs → identical pose', () => {
    const config: HybridRigConfig = {
      body: 'trex',
      head: 'allosaurus',
      arms: 'allosaurus',
      legs: 'allosaurus',
      tail: 'allosaurus',
    };
    const opts = { seed: hybridSeed(config), timeMs: 4321.5 };
    expect(evaluateHybridRigPose(config, DEFAULT_RIG_PARAMS, opts)).toEqual(
      evaluateHybridRigPose(config, DEFAULT_RIG_PARAMS, opts)
    );
  });

  it('layerSourceSpecies maps every slot to its group pick', () => {
    expect(layerSourceSpecies(ALLO_HEAD_ON_TREX, 'head-upper')).toBe('allosaurus');
    expect(layerSourceSpecies(ALLO_HEAD_ON_TREX, 'jaw-lower')).toBe('allosaurus');
    expect(layerSourceSpecies(ALLO_HEAD_ON_TREX, 'torso')).toBe('trex');
    expect(layerSourceSpecies(ALLO_HEAD_ON_TREX, 'near-hind-thigh')).toBe('trex');
  });

  it('posed hybrid pivots ride their source layers', () => {
    const pose = evaluateHybridRigPose(ALLO_HEAD_ON_TREX, staticParams(), { seed: 1, timeMs: 0 });
    const pivots = hybridPosedPivots(ALLO_HEAD_ON_TREX, pose);
    const off = hybridPartOffsets(TREX_RIG_DEF, ALLOSAURUS_RIG_DEF).head;
    // The donor head pivot rides along with the cover-anchored art at neutral.
    expect(pivots.head).toEqual({
      x: ALLOSAURUS_RIG_DEF.pivots.head.x + off.x,
      y: ALLOSAURUS_RIG_DEF.pivots.head.y + off.y,
    });
    // Body pivots are the base's.
    expect(pivots.torso).toEqual(TREX_RIG_DEF.pivots.torso);
    expect(pivots.nearHip).toEqual(TREX_RIG_DEF.pivots.nearHip);
  });

  it('fixed-time marquee hybrid pose snapshot is stable', () => {
    const pose = evaluateHybridRigPose(ALLO_HEAD_ON_TREX, DEFAULT_RIG_PARAMS, {
      seed: hybridSeed(ALLO_HEAD_ON_TREX),
      timeMs: 2500,
    });
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

describe('mix deep-link codec', () => {
  it('round-trips configs, omitting groups that follow the body', () => {
    expect(formatHybridConfig(ALLO_HEAD_ON_TREX)).toBe('body:trex,head:allosaurus');
    expect(parseHybridConfig('body:trex,head:allosaurus')).toEqual(ALLO_HEAD_ON_TREX);
    expect(parseHybridConfig(formatHybridConfig(pureConfig('allosaurus')))).toEqual(
      pureConfig('allosaurus')
    );
  });

  it('missing groups follow the body; body defaults to trex', () => {
    expect(parseHybridConfig('head:allosaurus')).toEqual(ALLO_HEAD_ON_TREX);
    expect(parseHybridConfig('body:allosaurus')).toEqual(pureConfig('allosaurus'));
  });

  it('rejects malformed strings and unknown species outright', () => {
    expect(parseHybridConfig(null)).toBeNull();
    expect(parseHybridConfig('')).toBeNull();
    expect(parseHybridConfig('head:stegosaurus')).toBeNull();
    expect(parseHybridConfig('wings:allosaurus')).toBeNull();
    expect(parseHybridConfig('head=allosaurus')).toBeNull();
    expect(parseHybridConfig('head:allosaurus,')).toBeNull();
  });
});

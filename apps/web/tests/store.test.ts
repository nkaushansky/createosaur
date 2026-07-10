import { beforeEach, describe, expect, it } from 'vitest';
import { defaultGenome } from '@createosaur/genome';
import { useLab } from '../lib/store';

/**
 * Unit tests for the lab store's history contract — the semantics the
 * adversarial review flagged as unguarded (e2e cannot exercise gesture-level
 * history because its setRange helper bypasses pointer events).
 */
const state = () => useLab.getState();

beforeEach(() => {
  useLab.setState({ genome: defaultGenome(), past: [], future: [] });
});

describe('lab store history', () => {
  it('discrete change → undo → redo round-trips', () => {
    state().setPin('head', 'triceratops');
    expect(state().genome.parts.head).toBe('triceratops');

    state().undo();
    expect(state().genome.parts.head).toBeUndefined();

    state().redo();
    expect(state().genome.parts.head).toBe('triceratops');
  });

  it('no-op discrete actions leave no history at all', () => {
    state().setAge('adult'); // already adult
    state().setPattern('solid'); // already solid
    expect(state().past).toHaveLength(0);
  });

  it('markHistory dedupes repeated gesture starts', () => {
    state().markHistory();
    state().markHistory();
    state().markHistory();
    expect(state().past).toHaveLength(1);
  });

  it('touching a slider without moving it does not break the next undo', () => {
    state().setPin('head', 'triceratops'); // real change
    state().markHistory(); // pointerdown on a slider…
    // …released without moving. One undo must reach the pre-pin state.
    state().undo();
    expect(state().genome.parts.head).toBeUndefined();
    state().redo();
    expect(state().genome.parts.head).toBe('triceratops');
  });

  it('markHistory does not wipe the redo stack; real changes do', () => {
    state().setPin('head', 'triceratops');
    state().undo();
    expect(state().future).toHaveLength(1);

    state().markHistory(); // idle slider touch keeps redo alive
    expect(state().future).toHaveLength(1);

    state().setShare('triceratops', 40); // an actual change consumes it
    expect(state().future).toHaveLength(0);
  });

  it('a slider drag is one undo step: mark at gesture start, transient ticks', () => {
    state().markHistory(); // pointerdown
    for (const v of [10, 20, 30, 40, 50]) state().setShare('triceratops', v);
    expect(state().genome.dna.find((d) => d.species === 'triceratops')?.share).toBe(50);
    expect(state().past).toHaveLength(1);

    state().undo();
    expect(state().genome.dna.find((d) => d.species === 'triceratops')?.share).toBe(0);
  });

  it('a color-picker session is one undo step', () => {
    state().markHistory(); // first micro-step marks
    for (const hide of ['#111111', '#222222', '#333333']) {
      state().setCosmeticTransient({ hide });
    }
    state().undo();
    expect(state().genome.cosmetics.hide).toBe(defaultGenome().cosmetics.hide);
  });

  it('randomize is undoable and keeps a full 3-species pool', () => {
    state().randomize();
    expect(state().genome.dna).toHaveLength(3);
    state().undo();
    expect(state().genome).toEqual(defaultGenome());
  });

  it('history is bounded', () => {
    for (let i = 0; i < 60; i++) {
      state().setAge(i % 2 === 0 ? 'juvenile' : 'adult');
    }
    expect(state().past.length).toBeLessThanOrEqual(50);
  });
});

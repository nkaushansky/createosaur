'use client';

import { create } from 'zustand';
import {
  defaultGenome,
  GENOME_VERSION,
  stableStringify,
  type AgeStage,
  type Genome,
  type Pattern,
} from '@createosaur/genome';
import type { PartSlot, SpeciesId } from '@createosaur/species-data';

/**
 * The lab store: ONE genome object plus undo/redo history over it.
 * v2's 25-useState hub is the anti-pattern this replaces — every control
 * writes through the store, and history snapshots the whole genome.
 *
 * History semantics (hardened by the M0 adversarial review):
 * - markHistory dedupes: touching a slider without moving it must not stack
 *   duplicate entries, and it must NOT wipe the redo stack (only actual
 *   changes do that).
 * - undo/redo skip entries equal to the current genome, so a no-op mark can
 *   never make the first Undo "do nothing".
 * - transient setters (slider ticks, color-picker micro-steps) never touch
 *   history; interactions mark once at gesture start.
 */
const HISTORY_LIMIT = 50;

const same = (a: Genome, b: Genome) => stableStringify(a) === stableStringify(b);

interface LabState {
  genome: Genome;
  past: Genome[];
  future: Genome[];
  /** dedupe-push the current genome onto history; call at gesture start */
  markHistory: () => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  /** transient: no history (mark at gesture start), clears redo */
  setShare: (species: SpeciesId, share: number) => void;
  /** transient: no history (mark at gesture start), clears redo */
  setSize: (size: number) => void;
  /** transient: color pickers fire per micro-step; mark once per interaction */
  setCosmeticTransient: (patch: Partial<Genome['cosmetics']>) => void;
  setPin: (slot: PartSlot, species: SpeciesId | null) => void;
  setAge: (age: AgeStage) => void;
  setPattern: (pattern: Pattern) => void;
  loadShares: (shares: Partial<Record<SpeciesId, number>>) => void;
  rerollSeed: () => void;
  randomize: () => void;
}

export const useLab = create<LabState>((set, get) => {
  /** discrete action: no-ops are ignored entirely; real changes get history */
  const applyWithHistory = (mutate: (g: Genome) => Genome) => {
    const next = mutate(structuredClone(get().genome));
    if (same(next, get().genome)) return;
    get().markHistory();
    set({ genome: next, future: [] });
  };

  /** transient tick during a gesture: change genome, clear redo, no history */
  const applyTransient = (mutate: (g: Genome) => Genome) => {
    set((s) => ({ genome: mutate(structuredClone(s.genome)), future: [] }));
  };

  return {
    genome: defaultGenome(),
    past: [],
    future: [],

    markHistory: () =>
      set((s) => {
        const top = s.past[s.past.length - 1];
        if (top && same(top, s.genome)) return s;
        return { past: [...s.past.slice(-(HISTORY_LIMIT - 1)), structuredClone(s.genome)] };
      }),

    undo: () =>
      set((s) => {
        // skip stale entries equal to the current genome (no-op gesture marks)
        const past = [...s.past];
        let target: Genome | undefined;
        while ((target = past.pop())) {
          if (!same(target, s.genome)) break;
        }
        if (!target) return { past };
        return {
          genome: target,
          past,
          future: [structuredClone(s.genome), ...s.future],
        };
      }),

    redo: () =>
      set((s) => {
        const future = [...s.future];
        let target: Genome | undefined;
        while ((target = future.shift())) {
          if (!same(target, s.genome)) break;
        }
        if (!target) return { future };
        return {
          genome: target,
          future,
          past: [...s.past.slice(-(HISTORY_LIMIT - 1)), structuredClone(s.genome)],
        };
      }),

    reset: () => applyWithHistory(() => defaultGenome()),

    setShare: (species, share) =>
      applyTransient((g) => ({
        ...g,
        dna: g.dna.map((d) => (d.species === species ? { ...d, share } : d)),
      })),

    setSize: (size) => applyTransient((g) => ({ ...g, size })),

    setCosmeticTransient: (patch) =>
      applyTransient((g) => ({ ...g, cosmetics: { ...g.cosmetics, ...patch } })),

    setPin: (slot, species) =>
      applyWithHistory((g) => {
        if (species) g.parts[slot] = species;
        else delete g.parts[slot];
        return g;
      }),

    setAge: (age) => applyWithHistory((g) => ({ ...g, age })),

    setPattern: (pattern) =>
      applyWithHistory((g) => ({ ...g, cosmetics: { ...g.cosmetics, pattern } })),

    loadShares: (shares) =>
      applyWithHistory((g) => ({
        ...g,
        dna: g.dna.map((d) => ({ ...d, share: shares[d.species] ?? 0 })),
      })),

    rerollSeed: () =>
      applyWithHistory((g) => ({ ...g, seed: Math.floor(Math.random() * 2 ** 31) })),

    randomize: () => {
      const r = () => Math.random() ** 2;
      const raw = [r(), r(), r()];
      const total = raw[0]! + raw[1]! + raw[2]!;
      const shares = raw.map((v) => Math.round((v / total) * 100));
      const hides = ['#6b8f4e', '#8f6a4e', '#4e7a8f', '#7d8f4e', '#8f4e5e', '#5d6f7a', '#a3814a'];
      const marks = ['#d9a441', '#c96f3a', '#7fb069', '#5c88b5', '#c9564a'];
      const patterns: Pattern[] = ['solid', 'stripes', 'spots', 'rings', 'countershade'];
      applyWithHistory(() => ({
        v: GENOME_VERSION,
        dna: [
          { species: 'tyrannosaurus', share: shares[0]! },
          { species: 'triceratops', share: shares[1]! },
          { species: 'stegosaurus', share: shares[2]! },
        ],
        parts: {},
        cosmetics: {
          hide: hides[Math.floor(Math.random() * hides.length)]!,
          markings: marks[Math.floor(Math.random() * marks.length)]!,
          pattern: patterns[Math.floor(Math.random() * patterns.length)]!,
        },
        size: 30 + Math.floor(Math.random() * 55),
        age: 'adult',
        seed: Math.floor(Math.random() * 2 ** 31),
      }));
    },
  };
});

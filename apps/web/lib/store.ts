'use client';

import { create } from 'zustand';
import {
  defaultGenome,
  GENOME_VERSION,
  type AgeStage,
  type Genome,
  type Pattern,
} from '@createosaur/genome';
import type { PartSlot, SpeciesId } from '@createosaur/species-data';

/**
 * The lab store: ONE genome object plus undo/redo history over it.
 * v2's 25-useState hub is the anti-pattern this replaces — every control
 * writes through `apply`, and history snapshots the whole genome.
 */
const HISTORY_LIMIT = 50;

interface LabState {
  genome: Genome;
  past: Genome[];
  future: Genome[];
  /** push the current genome onto history (call BEFORE a discrete change,
   * or once at the start of a slider drag) */
  markHistory: () => void;
  /** replace the genome; history is managed by the caller via markHistory */
  apply: (genome: Genome) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  setShare: (species: SpeciesId, share: number) => void;
  setPin: (slot: PartSlot, species: SpeciesId | null) => void;
  setCosmetic: (patch: Partial<Genome['cosmetics']>) => void;
  setSize: (size: number) => void;
  setAge: (age: AgeStage) => void;
  setPattern: (pattern: Pattern) => void;
  loadShares: (shares: Partial<Record<SpeciesId, number>>) => void;
  rerollSeed: () => void;
  randomize: () => void;
}

export const useLab = create<LabState>((set, get) => {
  const applyWithHistory = (mutate: (g: Genome) => Genome) => {
    get().markHistory();
    set({ genome: mutate(structuredClone(get().genome)) });
  };

  return {
    genome: defaultGenome(),
    past: [],
    future: [],

    markHistory: () =>
      set((s) => ({
        past: [...s.past.slice(-(HISTORY_LIMIT - 1)), structuredClone(s.genome)],
        future: [],
      })),

    apply: (genome) => set({ genome }),

    undo: () =>
      set((s) => {
        const prev = s.past[s.past.length - 1];
        if (!prev) return s;
        return {
          genome: prev,
          past: s.past.slice(0, -1),
          future: [structuredClone(s.genome), ...s.future],
        };
      }),

    redo: () =>
      set((s) => {
        const next = s.future[0];
        if (!next) return s;
        return {
          genome: next,
          past: [...s.past, structuredClone(s.genome)],
          future: s.future.slice(1),
        };
      }),

    reset: () => applyWithHistory(() => defaultGenome()),

    setShare: (species, share) =>
      set((s) => ({
        genome: {
          ...s.genome,
          dna: s.genome.dna.map((d) => (d.species === species ? { ...d, share } : d)),
        },
      })),

    setPin: (slot, species) =>
      applyWithHistory((g) => {
        if (species) g.parts[slot] = species;
        else delete g.parts[slot];
        return g;
      }),

    setCosmetic: (patch) =>
      applyWithHistory((g) => ({ ...g, cosmetics: { ...g.cosmetics, ...patch } })),

    setSize: (size) => set((s) => ({ genome: { ...s.genome, size } })),

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
      get().markHistory();
      set({
        genome: {
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
        },
      });
    },
  };
});

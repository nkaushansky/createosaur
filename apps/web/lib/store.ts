'use client';

import { create } from 'zustand';
import {
  defaultGenome,
  GENOME_VERSION,
  POOL_CAP,
  stableStringify,
  type AgeStage,
  type DnaEntry,
  type Genome,
  type Pattern,
} from '@createosaur/genome';
import { getSpecies, type PartSlot, type SpeciesId } from '@createosaur/species-data';

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

/** A transient "removed a species" notice with a one-tap restore (GAME-DESIGN §4). */
export interface Toast {
  id: number;
  message: string;
  /** the genome to restore if the user taps Undo */
  restore: Genome;
}

let toastSeq = 0;

interface LabState {
  genome: Genome;
  past: Genome[];
  future: Genome[];
  toast: Toast | null;
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
  /** replace the whole gene pool (browser presets); drops pins for dropped species */
  setPool: (entries: DnaEntry[]) => void;
  /** add a species to the pool as an average-share member (cap 4, D-007) */
  addSpecies: (species: SpeciesId) => void;
  /** remove a species; clears its pins and raises an undo toast (GAME-DESIGN §4) */
  removeSpecies: (species: SpeciesId) => void;
  /** replace one pool species with another, keeping its share; clears its pins */
  swapSpecies: (oldId: SpeciesId, newId: SpeciesId) => void;
  /** restore the genome captured in a toast, as its own undoable step */
  undoToast: () => void;
  dismissToast: () => void;
  rerollSeed: () => void;
  randomize: () => void;
}

export const useLab = create<LabState>((set, get) => {
  /** discrete action: no-ops are ignored entirely; real changes get history */
  const applyWithHistory = (mutate: (g: Genome) => Genome) => {
    const next = mutate(structuredClone(get().genome));
    if (same(next, get().genome)) return;
    get().markHistory();
    // any genome change invalidates a pending removal toast — its `restore`
    // snapshot would silently revert this edit (M1 review)
    set({ genome: next, future: [], toast: null });
  };

  /** transient tick during a gesture: change genome, clear redo, no history */
  const applyTransient = (mutate: (g: Genome) => Genome) => {
    set((s) => ({ genome: mutate(structuredClone(s.genome)), future: [], toast: null }));
  };

  return {
    genome: defaultGenome(),
    past: [],
    future: [],
    toast: null,

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
          toast: null, // a removal toast's restore snapshot is stale after undo
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
          toast: null,
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

    setPool: (entries) =>
      applyWithHistory((g) => {
        const ids = new Set(entries.map((e) => e.species));
        const parts = { ...g.parts };
        for (const slot of Object.keys(parts) as PartSlot[]) {
          if (!ids.has(parts[slot]!)) delete parts[slot];
        }
        return { ...g, dna: entries.map((e) => ({ ...e })), parts };
      }),

    addSpecies: (species) =>
      applyWithHistory((g) => {
        if (g.dna.some((d) => d.species === species) || g.dna.length >= POOL_CAP) return g;
        // join as an average-share member so the newcomer is visible at once;
        // floor at 1 so tiny pool totals can't round the newcomer to zero
        const total = g.dna.reduce((sum, d) => sum + d.share, 0);
        const share = total > 0 ? Math.max(1, Math.round(total / g.dna.length)) : 50;
        return { ...g, dna: [...g.dna, { species, share }] };
      }),

    removeSpecies: (species) => {
      const g = get().genome;
      if (g.dna.length <= 1 || !g.dna.some((d) => d.species === species)) return;
      const before = structuredClone(g);
      const next = structuredClone(g);
      next.dna = next.dna.filter((d) => d.species !== species);
      for (const slot of Object.keys(next.parts) as PartSlot[]) {
        if (next.parts[slot] === species) delete next.parts[slot];
      }
      get().markHistory();
      set({
        genome: next,
        future: [],
        toast: { id: ++toastSeq, message: `Removed ${getSpecies(species).name}`, restore: before },
      });
    },

    swapSpecies: (oldId, newId) =>
      applyWithHistory((g) => {
        if (!g.dna.some((d) => d.species === oldId) || g.dna.some((d) => d.species === newId)) {
          return g;
        }
        const parts = { ...g.parts };
        for (const slot of Object.keys(parts) as PartSlot[]) {
          if (parts[slot] === oldId) delete parts[slot];
        }
        return {
          ...g,
          dna: g.dna.map((d) => (d.species === oldId ? { species: newId, share: d.share } : d)),
          parts,
        };
      }),

    undoToast: () => {
      const t = get().toast;
      if (!t) return;
      // no-op if the genome already matches (e.g. Ctrl+Z raced the toast):
      // restoring would only wipe the redo stack and add a dead undo step
      if (same(t.restore, get().genome)) {
        set({ toast: null });
        return;
      }
      get().markHistory();
      set({ genome: t.restore, future: [], toast: null });
    },

    dismissToast: () => set({ toast: null }),

    rerollSeed: () =>
      applyWithHistory((g) => ({ ...g, seed: Math.floor(Math.random() * 2 ** 31) })),

    randomize: () => {
      // randomize over the CURRENT pool — the browser owns pool membership,
      // "surprise me" only re-rolls influence, cosmetics, size, and seed
      const pool = get().genome.dna;
      const raw = pool.map(() => Math.random() ** 2);
      const total = raw.reduce((sum, v) => sum + v, 0) || 1;
      const shares = raw.map((v) => Math.round((v / total) * 100));
      const hides = ['#6b8f4e', '#8f6a4e', '#4e7a8f', '#7d8f4e', '#8f4e5e', '#5d6f7a', '#a3814a'];
      const marks = ['#d9a441', '#c96f3a', '#7fb069', '#5c88b5', '#c9564a'];
      const patterns: Pattern[] = ['solid', 'stripes', 'spots', 'rings', 'countershade'];
      const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
      applyWithHistory((g) => ({
        ...g,
        v: GENOME_VERSION,
        dna: g.dna.map((d, i) => ({ ...d, share: shares[i]! })),
        parts: {},
        cosmetics: { hide: pick(hides), markings: pick(marks), pattern: pick(patterns) },
        size: 30 + Math.floor(Math.random() * 55),
        age: 'adult',
        seed: Math.floor(Math.random() * 2 ** 31),
      }));
    },
  };
});

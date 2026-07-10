'use client';

import { useRef } from 'react';
import { getSpecies } from '@createosaur/species-data';
import { normalizedShares, type DnaEntry } from '@createosaur/genome';
import { useLab } from '@/lib/store';

/** Preset gene pools (full pool + shares) that show off the roster's range. */
const PRESETS: Array<{ label: string; pool: DnaEntry[] }> = [
  { label: 'T-Rex', pool: [{ species: 'tyrannosaurus', share: 100 }] },
  {
    label: 'Chimera',
    pool: [
      { species: 'tyrannosaurus', share: 34 },
      { species: 'triceratops', share: 33 },
      { species: 'stegosaurus', share: 33 },
    ],
  },
  {
    label: 'Sailback',
    pool: [
      { species: 'spinosaurus', share: 60 },
      { species: 'tyrannosaurus', share: 40 },
    ],
  },
  {
    label: 'Long-neck tank',
    pool: [
      { species: 'brachiosaurus', share: 55 },
      { species: 'ankylosaurus', share: 45 },
    ],
  },
];

export function DnaPanel({ onOpenBrowser }: { onOpenBrowser: () => void }) {
  const genome = useLab((s) => s.genome);
  const setShare = useLab((s) => s.setShare);
  const markHistory = useLab((s) => s.markHistory);
  const setPool = useLab((s) => s.setPool);
  const removeSpecies = useLab((s) => s.removeSpecies);
  const randomize = useLab((s) => s.randomize);
  const shares = normalizedShares(genome);
  const canRemove = genome.dna.length > 1;
  // one history entry per keyboard adjustment burst, reset on blur
  const keyMarked = useRef(false);

  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between gap-2 border-b pb-1.5" style={{ borderColor: 'var(--line)' }}>
        <h2 className="section-title mb-0 border-0 p-0">DNA mix — the gene pool</h2>
        <button className="btn text-[12px]" onClick={onOpenBrowser} data-testid="open-browser">
          ＋ Species
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {genome.dna.map((d) => {
          const sp = getSpecies(d.species);
          return (
            <div
              key={d.species}
              className="grid grid-cols-[110px_1fr_40px_22px] items-center gap-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
                <span
                  className="h-3 w-3 flex-none rounded"
                  style={{ background: sp.uiColor }}
                  aria-hidden
                />
                <span className="truncate" title={sp.name}>
                  {sp.name.split(' ')[0]}
                </span>
              </span>
              <input
                type="range"
                id={`dna-${d.species}`}
                min={0}
                max={100}
                value={d.share}
                style={{ accentColor: sp.uiColor }}
                aria-label={`${sp.name} DNA share`}
                onPointerDown={() => markHistory()}
                onKeyDown={() => {
                  if (!keyMarked.current) {
                    markHistory();
                    keyMarked.current = true;
                  }
                }}
                onBlur={() => {
                  keyMarked.current = false;
                }}
                onChange={(e) => setShare(d.species, Number(e.target.value))}
              />
              <span
                className="text-right text-[13px] tabular-nums"
                style={{ color: 'var(--muted)' }}
                data-testid={`pct-${d.species}`}
              >
                {Math.round((shares[d.species] ?? 0) * 100)}%
              </span>
              <button
                className="justify-self-center text-[15px] leading-none disabled:opacity-25"
                onClick={() => removeSpecies(d.species)}
                disabled={!canRemove}
                aria-label={`Remove ${sp.name} from the pool`}
                title={canRemove ? `Remove ${sp.name}` : 'The pool needs at least one species'}
                style={{ color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} className="btn" onClick={() => setPool(p.pool)}>
            {p.label}
          </button>
        ))}
        <button className="btn" onClick={randomize}>
          🎲 Surprise me
        </button>
      </div>
    </section>
  );
}

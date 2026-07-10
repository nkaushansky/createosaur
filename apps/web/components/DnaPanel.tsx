'use client';

import { useRef } from 'react';
import { getSpecies, type SpeciesId } from '@createosaur/species-data';
import { normalizedShares } from '@createosaur/genome';
import { useLab } from '@/lib/store';

const PRESETS: Array<{ label: string; shares: Partial<Record<SpeciesId, number>> }> = [
  { label: 'T-Rex', shares: { tyrannosaurus: 100 } },
  { label: 'Triceratops', shares: { triceratops: 100 } },
  { label: 'Stegosaurus', shares: { stegosaurus: 100 } },
  { label: 'Tyrannoceratops', shares: { tyrannosaurus: 58, triceratops: 42 } },
  { label: 'Stegorex', shares: { stegosaurus: 55, tyrannosaurus: 45 } },
  { label: 'Chimera', shares: { tyrannosaurus: 34, triceratops: 33, stegosaurus: 33 } },
];

export function DnaPanel() {
  const genome = useLab((s) => s.genome);
  const setShare = useLab((s) => s.setShare);
  const markHistory = useLab((s) => s.markHistory);
  const loadShares = useLab((s) => s.loadShares);
  const randomize = useLab((s) => s.randomize);
  const shares = normalizedShares(genome);
  // one history entry per keyboard adjustment burst, reset on blur
  const keyMarked = useRef(false);

  return (
    <section>
      <h2 className="section-title">DNA mix — the sliders</h2>
      <div className="flex flex-col gap-2.5">
        {genome.dna.map((d) => {
          const sp = getSpecies(d.species);
          return (
            <div key={d.species} className="grid grid-cols-[118px_1fr_44px] items-center gap-2.5">
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
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} className="btn" onClick={() => loadShares(p.shares)}>
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

'use client';

import { useMemo, useState } from 'react';
import { renderPart } from '@createosaur/renderer';
import { POOL_CAP } from '@createosaur/genome';
import { getSpecies, type Diet, type SpeciesId } from '@createosaur/species-data';
import { useLab } from '@/lib/store';
import {
  allDiets,
  allPeriods,
  filterSpecies,
  sizeBucket,
  SIZE_BUCKETS,
  type SizeBucket,
} from '@/lib/browser';

/**
 * The species browser (GAME-DESIGN §4): search + filter the roster by period,
 * diet, and size, and add/remove/swap species in the gene pool (cap 4, D-007).
 * Adding a species is how parts enter the picker bin.
 */
export function SpeciesBrowser({ onClose }: { onClose: () => void }) {
  const genome = useLab((s) => s.genome);
  const addSpecies = useLab((s) => s.addSpecies);
  const removeSpecies = useLab((s) => s.removeSpecies);

  const [query, setQuery] = useState('');
  const [diets, setDiets] = useState<Set<Diet>>(new Set());
  const [periods, setPeriods] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Set<SizeBucket>>(new Set());

  const pool = useMemo(() => new Set(genome.dna.map((d) => d.species)), [genome.dna]);
  const full = genome.dna.length >= POOL_CAP;

  const results = useMemo(
    () => filterSpecies({ query, diets, periods, sizes }),
    [query, diets, periods, sizes]
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Species browser"
      onClick={onClose}
    >
      <div
        className="card-panel w-full max-w-3xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide">Species browser</h2>
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            Pool {genome.dna.length}/{POOL_CAP}
          </span>
          <button className="btn" onClick={onClose} aria-label="Close browser">
            Done
          </button>
        </div>

        <input
          type="search"
          className="select-input mb-2"
          placeholder="Search species…"
          aria-label="Search species"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="mb-3 flex flex-col gap-1.5">
          <FilterRow label="Period" values={allPeriods()} active={periods} onToggle={setPeriods} />
          <FilterRow label="Diet" values={allDiets()} active={diets} onToggle={setDiets} />
          <FilterRow label="Size" values={SIZE_BUCKETS} active={sizes} onToggle={setSizes} />
        </div>

        {results.length === 0 ? (
          <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
            No species match those filters. Clear one to widen the dig site.
          </p>
        ) : (
          <div className="grid max-h-[52vh] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {results.map((id) => (
              <SpeciesCard
                key={id}
                id={id}
                inPool={pool.has(id)}
                poolFull={full}
                onAdd={() => addSpecies(id)}
                onRemove={() => removeSpecies(id)}
                canRemove={genome.dna.length > 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  values,
  active,
  onToggle,
}: {
  label: string;
  values: readonly T[];
  active: Set<T>;
  onToggle: (next: Set<T>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-14 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      {values.map((v) => (
        <button
          key={v}
          className="btn text-[12px]"
          aria-pressed={active.has(v)}
          onClick={() => {
            const next = new Set(active);
            if (next.has(v)) next.delete(v);
            else next.add(v);
            onToggle(next);
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function SpeciesCard({
  id,
  inPool,
  poolFull,
  canRemove,
  onAdd,
  onRemove,
}: {
  id: SpeciesId;
  inPool: boolean;
  poolFull: boolean;
  canRemove: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const sp = getSpecies(id);
  const svg = useMemo(() => renderPart(id, 'head'), [id]);
  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg border p-2"
      style={{ borderColor: inPool ? sp.uiColor : 'var(--line)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex-none rounded-md border"
          style={{ borderColor: 'var(--paper-line)', width: 52, height: 52, background: 'var(--paper)' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold" title={sp.name}>
            {sp.name}
          </p>
          <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>
            {sp.facts.diet} · {sizeBucket(sp.facts.lengthMeters)}
          </p>
          <p className="truncate text-[11px]" style={{ color: 'var(--muted)' }}>
            {sp.facts.period}
          </p>
        </div>
      </div>
      {inPool ? (
        <button
          className="btn w-full text-[12px]"
          onClick={onRemove}
          disabled={!canRemove}
          aria-pressed="true"
          style={{ borderColor: sp.uiColor }}
        >
          {canRemove ? '✓ In pool — remove' : '✓ In pool'}
        </button>
      ) : (
        <button className="btn w-full text-[12px]" onClick={onAdd} disabled={poolFull}>
          {poolFull ? 'Pool full (4)' : '＋ Add to pool'}
        </button>
      )}
    </div>
  );
}

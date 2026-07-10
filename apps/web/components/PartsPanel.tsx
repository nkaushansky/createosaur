'use client';

import { useDeferredValue, useMemo } from 'react';
import { renderCreature, renderPart } from '@createosaur/renderer';
import type { Genome } from '@createosaur/genome';
import { getSpecies, type PartSlot, type SpeciesId } from '@createosaur/species-data';
import { useLab } from '@/lib/store';

/**
 * The Lego layer (GAME-DESIGN §4), picker v1: options are live part vignettes,
 * not words. Blend is always first and shows the *current* blended part, so
 * "auto" is a visible choice. Pins are ownership — they survive slider changes
 * and clear (with an undo toast) when their species leaves the pool.
 */
const SLOTS: Array<{ slot: PartSlot; label: string }> = [
  { slot: 'head', label: 'Head' },
  { slot: 'back', label: 'Back' },
  { slot: 'tail', label: 'Tail' },
  { slot: 'stance', label: 'Stance' },
  // skin owns integument (feathers shipped as a skin-slot gene in M1) —
  // GAME-DESIGN §2; without this row the gene is engine-reachable but
  // un-Lego-able (M1 review)
  { slot: 'skin', label: 'Skin' },
];

export function PartsPanel() {
  // blend vignettes re-render per slider tick; deferring keeps the main
  // stage at full frame rate on slow hardware (ARCHITECTURE <8ms budget)
  const genome = useDeferredValue(useLab((s) => s.genome));
  const setPin = useLab((s) => s.setPin);

  return (
    <section>
      <h2 className="section-title">Parts — pinned pictures, not words</h2>
      <div className="flex flex-col gap-3">
        {SLOTS.map(({ slot, label }) => (
          <SlotPicker
            key={slot}
            slot={slot}
            label={label}
            genome={genome}
            onPick={(species) => setPin(slot, species)}
          />
        ))}
      </div>
    </section>
  );
}

function SlotPicker({
  slot,
  label,
  genome,
  onPick,
}: {
  slot: PartSlot;
  label: string;
  genome: Genome;
  onPick: (species: SpeciesId | null) => void;
}) {
  const pinned = genome.parts[slot];

  // Blend thumbnail: the current creature cropped to this slot with the slot's
  // pin removed — i.e. what "auto" actually looks like right now.
  const blendSvg = useMemo(() => {
    const g: Genome = { ...genome, parts: { ...genome.parts } };
    delete g.parts[slot];
    return renderCreature(g, { crop: slot, idSuffix: `blend-${slot}` });
  }, [genome, slot]);

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {label}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Thumb
          label="Blend"
          svg={blendSvg}
          selected={!pinned}
          onClick={() => onPick(null)}
          testid={`part-${slot}-blend`}
        />
        {genome.dna.map((d) => (
          <PartThumb
            key={d.species}
            species={d.species}
            slot={slot}
            selected={pinned === d.species}
            onClick={() => onPick(d.species)}
          />
        ))}
      </div>
    </div>
  );
}

function PartThumb({
  species,
  slot,
  selected,
  onClick,
}: {
  species: SpeciesId;
  slot: PartSlot;
  selected: boolean;
  onClick: () => void;
}) {
  const svg = useMemo(() => renderPart(species, slot), [species, slot]);
  return (
    <Thumb
      label={getSpecies(species).name.split(' ')[0]!}
      svg={svg}
      selected={selected}
      accent={getSpecies(species).uiColor}
      onClick={onClick}
      testid={`part-${slot}-${species}`}
    />
  );
}

function Thumb({
  label,
  svg,
  selected,
  accent,
  onClick,
  testid,
}: {
  label: string;
  svg: string;
  selected: boolean;
  accent?: string;
  onClick: () => void;
  testid?: string;
}) {
  return (
    <button
      className="flex flex-none flex-col items-center gap-0.5"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testid}
      title={label}
    >
      <span
        className="rounded-lg border-2"
        style={{
          width: 62,
          height: 62,
          background: 'var(--paper)',
          borderColor: selected ? (accent ?? 'var(--ink)') : 'var(--paper-line)',
          boxShadow: selected ? `0 0 0 2px var(--card), 0 0 0 3px ${accent ?? 'var(--ink)'}` : 'none',
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <span
        className="max-w-[62px] truncate text-[10px]"
        style={{ color: selected ? 'var(--ink)' : 'var(--muted)', fontWeight: selected ? 700 : 400 }}
      >
        {label}
      </span>
    </button>
  );
}

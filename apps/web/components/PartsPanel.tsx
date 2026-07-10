'use client';

import { getSpecies, type PartSlot, type SpeciesId } from '@createosaur/species-data';
import { useLab } from '@/lib/store';

/**
 * The Lego layer (GAME-DESIGN §4): the bin shows only the gene pool, Blend
 * is always first and always a visible choice, and pins are ownership —
 * they hold regardless of slider values. The `skin` slot arrives with
 * integument rendering in M1.
 */
const SLOTS: Array<{ slot: PartSlot; label: string }> = [
  { slot: 'head', label: 'Head' },
  { slot: 'back', label: 'Back' },
  { slot: 'tail', label: 'Tail' },
  { slot: 'stance', label: 'Stance' },
];

export function PartsPanel() {
  const genome = useLab((s) => s.genome);
  const setPin = useLab((s) => s.setPin);

  return (
    <section>
      <h2 className="section-title">Parts — the Lego layer</h2>
      <div className="grid grid-cols-2 gap-2">
        {SLOTS.map(({ slot, label }) => (
          <div key={slot} className="flex flex-col gap-1">
            <label
              htmlFor={`pin-${slot}`}
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--muted)' }}
            >
              {label}
            </label>
            <select
              id={`pin-${slot}`}
              className="select-input"
              value={genome.parts[slot] ?? ''}
              onChange={(e) => setPin(slot, (e.target.value || null) as SpeciesId | null)}
            >
              <option value="">Blend (auto)</option>
              {genome.dna.map((d) => (
                <option key={d.species} value={d.species}>
                  {getSpecies(d.species).name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  );
}

'use client';

import { useMemo } from 'react';
import { derivePlacard } from '@createosaur/genome';
import { useLab } from '@/lib/store';

const METERS = ['attack', 'defense', 'speed', 'brains'] as const;

/** Museum placard: name, honest facts, playful fiction — clearly separated roles. */
export function Placard() {
  const genome = useLab((s) => s.genome);
  const placard = useMemo(() => derivePlacard(genome), [genome]);

  return (
    <div className="card-panel p-4">
      <p className="eyebrow">{placard.specimen}</p>
      <h2
        className="font-display text-3xl font-bold uppercase tracking-wide [text-wrap:balance]"
        data-testid="creature-name"
      >
        {placard.name}
      </h2>
      <p className="mb-2.5 text-sm italic" style={{ color: 'var(--muted)' }}>
        {placard.binomial} · {placard.composition.map((c) => `${c.percent}% ${c.label}`).join(' + ')}
      </p>
      <div className="mb-3.5 flex flex-wrap gap-2">
        <span className="chip">{placard.periodChip}</span>
        <span className="chip">{placard.dietChip}</span>
        <span className="chip">
          ~{placard.lengthMeters} m · {placard.weightKg.toLocaleString()} kg
        </span>
      </div>
      <div className="grid max-w-md grid-cols-[78px_1fr_34px] items-center gap-x-2.5 gap-y-2">
        {METERS.map((key) => (
          <MeterRow key={key} label={key} value={placard.stats[key]} />
        ))}
      </div>
    </div>
  );
}

function MeterRow({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span
        className="text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </span>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${value}%` }} />
      </span>
      <span className="text-right text-[13px] tabular-nums">{value}</span>
    </>
  );
}

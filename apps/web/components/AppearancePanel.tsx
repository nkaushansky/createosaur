'use client';

import { useRef } from 'react';
import { AGE_STAGES, PATTERNS, type AgeStage, type Pattern } from '@createosaur/genome';
import { useLab } from '@/lib/store';

const PATTERN_LABELS: Record<Pattern, string> = {
  solid: 'Solid',
  stripes: 'Stripes',
  spots: 'Spots',
  rings: 'Rings',
  countershade: 'Countershade',
};

const AGE_LABELS: Record<AgeStage, string> = {
  hatchling: 'Hatchling',
  juvenile: 'Juvenile',
  adult: 'Adult',
};

export function AppearancePanel() {
  const genome = useLab((s) => s.genome);
  const setCosmeticTransient = useLab((s) => s.setCosmeticTransient);
  const setPattern = useLab((s) => s.setPattern);
  const setAge = useLab((s) => s.setAge);
  const setSize = useLab((s) => s.setSize);
  const markHistory = useLab((s) => s.markHistory);
  const rerollSeed = useLab((s) => s.rerollSeed);
  const sizeKeyMarked = useRef(false);
  // a native color picker fires one event per micro-step of a drag; mark
  // history once per picker session so the whole edit is a single undo step
  const colorMarked = useRef(false);
  const colorProps = (key: 'hide' | 'markings') => ({
    value: genome.cosmetics[key],
    onFocus: () => {
      if (!colorMarked.current) {
        markHistory();
        colorMarked.current = true;
      }
    },
    onBlur: () => {
      colorMarked.current = false;
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!colorMarked.current) {
        markHistory();
        colorMarked.current = true;
      }
      setCosmeticTransient({ [key]: e.target.value });
    },
  });

  return (
    <section>
      <h2 className="section-title">Appearance</h2>
      <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
        <label className="text-[13px]" style={{ color: 'var(--muted)' }} htmlFor="hide-color">
          Hide
        </label>
        <input id="hide-color" type="color" {...colorProps('hide')} />
        <label className="text-[13px]" style={{ color: 'var(--muted)' }} htmlFor="markings-color">
          Markings
        </label>
        <input id="markings-color" type="color" {...colorProps('markings')} />
        <button className="btn" onClick={rerollSeed} title="Same DNA, new individual">
          🥚 Sibling
        </button>
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Pattern">
        {PATTERNS.map((p) => (
          <button
            key={p}
            className="btn"
            aria-pressed={genome.cosmetics.pattern === p}
            onClick={() => setPattern(p)}
          >
            {PATTERN_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mb-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Age stage">
        {AGE_STAGES.map((a) => (
          <button key={a} className="btn" aria-pressed={genome.age === a} onClick={() => setAge(a)}>
            {AGE_LABELS[a]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <label htmlFor="size" className="min-w-8 text-[13px]" style={{ color: 'var(--muted)' }}>
          Size
        </label>
        <input
          id="size"
          type="range"
          min={0}
          max={100}
          value={genome.size}
          className="flex-1"
          style={{ accentColor: 'var(--accent)' }}
          aria-label="Creature size"
          onPointerDown={() => markHistory()}
          onKeyDown={() => {
            if (!sizeKeyMarked.current) {
              markHistory();
              sizeKeyMarked.current = true;
            }
          }}
          onBlur={() => {
            sizeKeyMarked.current = false;
          }}
          onChange={(e) => setSize(Number(e.target.value))}
        />
      </div>
    </section>
  );
}

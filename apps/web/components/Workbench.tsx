'use client';

import { useMemo, useState } from 'react';
import { GENOME_VERSION, type AgeStage, type Genome, type Pattern } from '@createosaur/genome';
import {
  PART_SLOTS,
  SPECIES_IDS,
  getSpecies,
  type FeatureKind,
  type MorphVector,
  type SpeciesDef,
  type SpeciesId,
} from '@createosaur/species-data';
import { renderCreature } from '@createosaur/renderer';
import {
  ARCHETYPES,
  DIETS,
  FEATURE_KINDS,
  FEATURE_SLOT,
  MORPH_GROUPS,
  MORPH_RANGES,
  blankSpecies,
  cloneSpecies,
  speciesToSource,
} from '@/lib/workbench';

interface Preview {
  hide: string;
  markings: string;
  pattern: Pattern;
  size: number;
  age: AgeStage;
  seed: number;
}

const PREVIEW_DEFAULT: Preview = {
  hide: '#6b8f4e',
  markings: '#d9a441',
  pattern: 'solid',
  size: 55,
  age: 'adult',
  seed: 1,
};

/**
 * Dev-only species authoring workbench (ROADMAP M1). Every morph parameter is a
 * slider, every feature gene a toggle, and the live render goes through the
 * exact production pipeline via a species resolver — so what you tune is what
 * ships. "Copy species JSON" emits a `packages/species-data` entry verbatim.
 */
export function Workbench() {
  const [spec, setSpec] = useState<SpeciesDef>(() => cloneSpecies('tyrannosaurus'));
  const [preview, setPreview] = useState<Preview>(PREVIEW_DEFAULT);
  const [copied, setCopied] = useState(false);

  const genome = useMemo<Genome>(
    () => ({
      v: GENOME_VERSION,
      // the id is a placeholder key; the resolver below returns `spec` for it
      dna: [{ species: 'tyrannosaurus', share: 100 }],
      parts: {},
      cosmetics: { hide: preview.hide, markings: preview.markings, pattern: preview.pattern },
      size: preview.size,
      age: preview.age,
      seed: preview.seed,
    }),
    [preview]
  );

  const resolve = useMemo(() => () => spec, [spec]);
  const svg = useMemo(
    () => renderCreature(genome, { idSuffix: 'wb', resolveSpecies: resolve }),
    [genome, resolve]
  );
  const source = useMemo(() => speciesToSource(spec), [spec]);

  const patchMorph = (key: keyof MorphVector, value: number) =>
    setSpec((s) => ({ ...s, morph: { ...s.morph, [key]: value } }));

  const toggleFeature = (kind: FeatureKind) =>
    setSpec((s) => {
      const has = s.features.some((f) => f.kind === kind);
      return {
        ...s,
        features: has
          ? s.features.filter((f) => f.kind !== kind)
          : [...s.features, { kind, slot: FEATURE_SLOT[kind] }],
      };
    });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">
          <span className="font-display uppercase tracking-wide">Species Workbench</span>{' '}
          <span className="chip" style={{ verticalAlign: 'middle' }}>
            dev only
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <label className="text-[13px]" style={{ color: 'var(--muted)' }} htmlFor="base-load">
            Load base
          </label>
          <select
            id="base-load"
            className="select-input"
            style={{ width: 'auto' }}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value;
              if (v === '__blank__') setSpec(blankSpecies());
              else if (v) setSpec(cloneSpecies(v as SpeciesId));
              e.target.value = '';
            }}
          >
            <option value="" disabled>
              choose…
            </option>
            <option value="__blank__">Blank biped</option>
            {SPECIES_IDS.map((id) => (
              <option key={id} value={id}>
                {getSpecies(id).name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_1fr]">
        {/* left: live render + vignettes + export */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-3">
          <div
            className="viewport-paper rounded-xl border p-2"
            style={{ borderColor: 'var(--paper-line)' }}
            data-testid="workbench-stage"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="flex flex-wrap gap-2">
            {PART_SLOTS.map((slot) => (
              <div key={slot} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-lg border"
                  style={{ borderColor: 'var(--paper-line)', width: 76, height: 76, background: 'var(--paper)' }}
                  dangerouslySetInnerHTML={{
                    __html: renderPartPreview(slot, resolve),
                  }}
                />
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {slot}
                </span>
              </div>
            ))}
          </div>

          <PreviewControls preview={preview} setPreview={setPreview} />

          <div className="card-panel p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="section-title mb-0 border-0 p-0">Export</span>
              <button className="btn" onClick={copy} data-testid="copy-species">
                {copied ? '✓ Copied' : 'Copy species JSON'}
              </button>
            </div>
            <pre
              className="genome-pre max-h-64 overflow-auto"
              style={{ whiteSpace: 'pre', color: 'var(--ink)' }}
              data-testid="species-source"
            >
              {source}
            </pre>
          </div>
        </div>

        {/* right: the authoring controls */}
        <div className="card-panel flex flex-col gap-5 p-4">
          <IdentityFields spec={spec} setSpec={setSpec} />

          {MORPH_GROUPS.map((group) => (
            <section key={group.slot}>
              <h2 className="section-title">{group.label}</h2>
              <div className="flex flex-col gap-2">
                {group.keys.map((key) => (
                  <MorphSlider key={key} k={key} value={spec.morph[key]} onChange={patchMorph} />
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="section-title">Feature genes</h2>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {FEATURE_KINDS.map((kind) => {
                const on = spec.features.some((f) => f.kind === kind);
                return (
                  <button
                    key={kind}
                    className="btn text-left"
                    aria-pressed={on}
                    onClick={() => toggleFeature(kind)}
                  >
                    {on ? '● ' : '○ '}
                    {kind}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
              Slot is assigned automatically (head / back / tail / skin). Features render from the
              carrier species at full intensity in a pure preview.
            </p>
          </section>

          <FactsFields spec={spec} setSpec={setSpec} />
          <SyllableStatFields spec={spec} setSpec={setSpec} />
        </div>
      </div>
    </main>
  );
}

function renderPartPreview(slot: (typeof PART_SLOTS)[number], resolve: () => SpeciesDef): string {
  // The shipped picker uses renderPart (which builds its own DB-backed genome);
  // the workbench must reflect the *unsaved* vector, so it crops a resolver-
  // backed render instead — same crop path, live species.
  return renderCreature(
    {
      v: GENOME_VERSION,
      dna: [{ species: 'tyrannosaurus', share: 100 }],
      parts: {},
      cosmetics: { hide: '#6b8f4e', markings: '#d9a441', pattern: 'solid' },
      size: 55,
      age: 'adult',
      seed: 1,
    },
    { crop: slot, idSuffix: `wbpart-${slot}`, resolveSpecies: resolve }
  );
}

function MorphSlider({
  k,
  value,
  onChange,
}: {
  k: keyof MorphVector;
  value: number;
  onChange: (k: keyof MorphVector, v: number) => void;
}) {
  const r = MORPH_RANGES[k];
  return (
    <label className="grid grid-cols-[130px_1fr_48px] items-center gap-2 text-[12px]">
      <span title={k} className="truncate" style={{ color: 'var(--muted)' }}>
        {r.label}
      </span>
      <input
        type="range"
        min={r.min}
        max={r.max}
        step={r.step}
        value={value}
        aria-label={r.label}
        onChange={(e) => onChange(k, Number(e.target.value))}
      />
      <span className="text-right tabular-nums">{Math.round(value * 10) / 10}</span>
    </label>
  );
}

function PreviewControls({ preview, setPreview }: { preview: Preview; setPreview: (p: Preview) => void }) {
  const patterns: Pattern[] = ['solid', 'stripes', 'spots', 'rings', 'countershade'];
  const ages: AgeStage[] = ['hatchling', 'juvenile', 'adult'];
  return (
    <div className="card-panel flex flex-wrap items-center gap-2.5 p-3 text-[13px]">
      <span className="eyebrow">Preview</span>
      <input
        aria-label="Preview hide color"
        type="color"
        value={preview.hide}
        onChange={(e) => setPreview({ ...preview, hide: e.target.value })}
      />
      <input
        aria-label="Preview markings color"
        type="color"
        value={preview.markings}
        onChange={(e) => setPreview({ ...preview, markings: e.target.value })}
      />
      <select
        aria-label="Preview pattern"
        className="select-input"
        style={{ width: 'auto' }}
        value={preview.pattern}
        onChange={(e) => setPreview({ ...preview, pattern: e.target.value as Pattern })}
      >
        {patterns.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        aria-label="Preview age"
        className="select-input"
        style={{ width: 'auto' }}
        value={preview.age}
        onChange={(e) => setPreview({ ...preview, age: e.target.value as AgeStage })}
      >
        {ages.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5">
        size
        <input
          aria-label="Preview size"
          type="range"
          min={0}
          max={100}
          value={preview.size}
          onChange={(e) => setPreview({ ...preview, size: Number(e.target.value) })}
        />
      </label>
      <button className="btn" onClick={() => setPreview({ ...preview, seed: (preview.seed % 9999) + 1 })}>
        🥚 seed {preview.seed}
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 text-[12px] ${full ? 'col-span-2' : ''}`}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <input className="select-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[12px]">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <input
        className="select-input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function IdentityFields({ spec, setSpec }: { spec: SpeciesDef; setSpec: (u: (s: SpeciesDef) => SpeciesDef) => void }) {
  return (
    <section>
      <h2 className="section-title">Identity</h2>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="id" value={spec.id} onChange={(v) => setSpec((s) => ({ ...s, id: v }))} />
        <TextField label="name" value={spec.name} onChange={(v) => setSpec((s) => ({ ...s, name: v }))} />
        <label className="flex flex-col gap-1 text-[12px]">
          <span style={{ color: 'var(--muted)' }}>archetype</span>
          <select
            className="select-input"
            value={spec.archetype}
            onChange={(e) => setSpec((s) => ({ ...s, archetype: e.target.value as SpeciesDef['archetype'] }))}
          >
            {ARCHETYPES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3 text-[12px]">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={spec.inV1}
              onChange={(e) => setSpec((s) => ({ ...s, inV1: e.target.checked }))}
            />
            inV1
          </label>
          <label className="flex items-center gap-1.5">
            uiColor
            <input
              type="color"
              value={spec.uiColor}
              onChange={(e) => setSpec((s) => ({ ...s, uiColor: e.target.value }))}
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function FactsFields({ spec, setSpec }: { spec: SpeciesDef; setSpec: (u: (s: SpeciesDef) => SpeciesDef) => void }) {
  const f = spec.facts;
  const set = (patch: Partial<SpeciesDef['facts']>) =>
    setSpec((s) => ({ ...s, facts: { ...s.facts, ...patch } }));
  return (
    <section>
      <h2 className="section-title">Facts (paleo — from the database, never invented)</h2>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="scientificName" value={f.scientificName} onChange={(v) => set({ scientificName: v })} full />
        <TextField label="period" value={f.period} onChange={(v) => set({ period: v })} />
        <TextField label="era" value={f.era} onChange={(v) => set({ era: v })} />
        <label className="flex flex-col gap-1 text-[12px]">
          <span style={{ color: 'var(--muted)' }}>diet</span>
          <select
            className="select-input"
            value={f.diet}
            onChange={(e) => set({ diet: e.target.value as SpeciesDef['facts']['diet'] })}
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <TextField label="habitat" value={f.habitat} onChange={(v) => set({ habitat: v })} />
        <TextField label="description" value={f.description} onChange={(v) => set({ description: v })} full />
        <NumField label="lengthMeters" value={f.lengthMeters} onChange={(v) => set({ lengthMeters: v })} />
        <NumField label="weightKg" value={f.weightKg} onChange={(v) => set({ weightKg: v })} />
        <TextField label="discoveryLocation" value={f.discoveryLocation} onChange={(v) => set({ discoveryLocation: v })} full />
      </div>
    </section>
  );
}

function SyllableStatFields({
  spec,
  setSpec,
}: {
  spec: SpeciesDef;
  setSpec: (u: (s: SpeciesDef) => SpeciesDef) => void;
}) {
  const setSyl = (patch: Partial<SpeciesDef['syllables']>) =>
    setSpec((s) => ({ ...s, syllables: { ...s.syllables, ...patch } }));
  const setStat = (patch: Partial<SpeciesDef['stats']>) =>
    setSpec((s) => ({ ...s, stats: { ...s.stats, ...patch } }));
  return (
    <section>
      <h2 className="section-title">Naming & stats</h2>
      <div className="mb-2 grid grid-cols-4 gap-2">
        <TextField label="prefix" value={spec.syllables.prefix} onChange={(v) => setSyl({ prefix: v })} />
        <TextField label="duo" value={spec.syllables.duo} onChange={(v) => setSyl({ duo: v })} />
        <TextField label="mid" value={spec.syllables.mid} onChange={(v) => setSyl({ mid: v })} />
        <TextField label="suffix" value={spec.syllables.suffix} onChange={(v) => setSyl({ suffix: v })} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(['attack', 'defense', 'speed', 'brains'] as const).map((k) => (
          <NumField key={k} label={k} value={spec.stats[k]} onChange={(v) => setStat({ [k]: v })} />
        ))}
      </div>
    </section>
  );
}

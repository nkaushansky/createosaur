'use client';

import {
  MOTION_RANGES,
  PART_GROUPS,
  PRESET_NAMES,
  SPECIES_RIG_DEFS,
  TREX_PF_RIG_DEF,
  pureConfig,
  type HybridRigConfig,
  type IllustratedRigParams,
  type PartGroup,
  type PatternType,
  type PresetName,
  type SpeciesId,
} from '@createosaur/illustrated-rig';
import type { RigSource } from '@/lib/illustrated-rig/rigAssets';
import type { RigDebugFlags } from '@/lib/illustrated-rig/pixiRig';

const PRESET_LABELS: Record<PresetName, string> = {
  neutral: 'Neutral',
  inhale: 'Inhale',
  lookUp: 'Look Up',
  stride: 'Stride',
  stress: 'Stress Test',
};

/** Entering hybrid mode starts at this PoC's marquee mix. */
const MARQUEE_MIX: HybridRigConfig = { ...pureConfig('trex'), head: 'allosaurus' };

const MIX_PRESETS: { id: string; label: string; config: HybridRigConfig }[] = [
  { id: 'allo-head', label: 'Allosaurus head on T. rex', config: MARQUEE_MIX },
  {
    id: 'rex-head',
    label: 'T. rex head on Allosaurus',
    config: { ...pureConfig('allosaurus'), head: 'trex' },
  },
  {
    id: 'full-swap',
    label: 'Every part swapped',
    config: { body: 'trex', head: 'allosaurus', arms: 'allosaurus', legs: 'allosaurus', tail: 'allosaurus' },
  },
];

const GROUP_LABELS: Record<PartGroup, string> = {
  body: 'Body (torso · neck · pelvis)',
  head: 'Head & jaw',
  arms: 'Arms',
  legs: 'Legs',
  tail: 'Tail',
};

const PATTERN_OPTIONS: { value: PatternType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'mottle', label: 'Mottle' },
  { value: 'bands', label: 'Bands' },
];

interface Props {
  params: IllustratedRigParams;
  debug: RigDebugFlags;
  disabled: boolean;
  source: RigSource;
  strideRange: { min: number; max: number };
  jawRange: { min: number; max: number };
  onSource: (source: RigSource) => void;
  onParams: (patch: Partial<IllustratedRigParams>) => void;
  onPreset: (name: PresetName) => void;
  onDebug: (patch: Partial<RigDebugFlags>) => void;
}

function MotionSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-2">
      <label htmlFor={id} className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <output htmlFor={id} className="text-xs" style={{ color: 'var(--muted)' }}>
          {value.toFixed(unit === '°' ? 1 : 2)}
          {unit ?? ''}
        </output>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function DebugToggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="mt-2 flex items-center gap-2 text-sm">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function RigControls({
  params,
  debug,
  disabled,
  source,
  strideRange,
  jawRange,
  onSource,
  onParams,
  onPreset,
  onDebug,
}: Props) {
  const motionDisabled = disabled || params.autoIdle;
  const config = source.kind === 'hybrid' ? source.config : null;

  const setGroup = (group: PartGroup, species: SpeciesId): void => {
    if (!config) return;
    onSource({ kind: 'hybrid', config: { ...config, [group]: species } });
  };

  return (
    <div className="flex flex-col gap-4">
      <section className="card-panel p-4">
        <h2 className="section-title">Species</h2>
        <label htmlFor="rig-species" className="text-sm">
          Rig
        </label>
        <select
          id="rig-species"
          className="select-input mt-1"
          value={source.kind === 'hybrid' ? 'hybrid' : source.kind === 'parts' ? 'trex-pf' : source.species}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === 'hybrid') onSource({ kind: 'hybrid', config: MARQUEE_MIX });
            else if (e.target.value === 'trex-pf') onSource({ kind: 'parts', def: TREX_PF_RIG_DEF });
            else onSource({ kind: 'species', species: e.target.value as SpeciesId });
          }}
        >
          {Object.values(SPECIES_RIG_DEFS).map((def) => (
            <option key={def.speciesId} value={def.speciesId}>
              {def.label}
            </option>
          ))}
          <option value="trex-pf">{TREX_PF_RIG_DEF.label}</option>
          <option value="hybrid">Hybrid mix (PoC)</option>
        </select>

        {config ? (
          <div className="mt-3" data-testid="rig-mix-panel">
            {PART_GROUPS.map((group) => (
              <div className="mt-2" key={group}>
                <label htmlFor={`rig-mix-${group}`} className="text-sm">
                  {GROUP_LABELS[group]}
                </label>
                <select
                  id={`rig-mix-${group}`}
                  className="select-input mt-1"
                  value={config[group]}
                  disabled={disabled}
                  onChange={(e) => setGroup(group, e.target.value as SpeciesId)}
                >
                  {Object.values(SPECIES_RIG_DEFS).map((def) => (
                    <option key={def.speciesId} value={def.speciesId}>
                      {def.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="mt-3 flex flex-wrap gap-2">
              {MIX_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="btn"
                  data-testid={`rig-mix-preset-${preset.id}`}
                  disabled={disabled}
                  onClick={() => onSource({ kind: 'hybrid', config: preset.config })}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
              Parts swap by the packs&apos; shared-stage anchors — the body supplies the motion,
              donor parts keep their own joints, and feet stay planted on the body&apos;s ground
              line. Where a donor part is smaller than the opening the body leaves for it, the
              paper shows through: that gap is the finding, not a rendering bug.
            </p>
          </div>
        ) : null}
      </section>

      <section className="card-panel p-4">
        <h2 className="section-title">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              className="btn"
              data-testid={`rig-preset-${name}`}
              disabled={disabled}
              onClick={() => onPreset(name)}
            >
              {PRESET_LABELS[name]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Presets pause auto-idle so the pose holds still for inspection.
        </p>
      </section>

      <section className="card-panel p-4">
        <h2 className="section-title">Motion</h2>
        <MotionSlider
          id="rig-head"
          label="Head rotation"
          unit="°"
          value={params.headAngle}
          min={MOTION_RANGES.headAngle.min}
          max={MOTION_RANGES.headAngle.max}
          step={0.1}
          disabled={motionDisabled}
          onChange={(headAngle) => onParams({ headAngle })}
        />
        <MotionSlider
          id="rig-jaw"
          label="Jaw (clench ↔ open)"
          unit="°"
          value={params.jawAngle}
          min={jawRange.min}
          max={jawRange.max}
          step={0.1}
          disabled={motionDisabled}
          onChange={(jawAngle) => onParams({ jawAngle })}
        />
        <MotionSlider
          id="rig-breath"
          label="Breath"
          value={params.breath}
          min={0}
          max={1}
          step={0.01}
          disabled={motionDisabled}
          onChange={(breath) => onParams({ breath })}
        />
        <MotionSlider
          id="rig-stride"
          label="Stride"
          value={params.stride}
          min={strideRange.min}
          max={strideRange.max}
          step={0.01}
          disabled={motionDisabled}
          onChange={(stride) => onParams({ stride })}
        />
        <MotionSlider
          id="rig-tail"
          label="Tail sway"
          value={params.tailSway}
          min={-1}
          max={1}
          step={0.01}
          disabled={motionDisabled}
          onChange={(tailSway) => onParams({ tailSway })}
        />
        {params.autoIdle ? (
          <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            Auto-idle is driving the motion axes — switch it off (or pick a preset) to pose by hand.
          </p>
        ) : null}
        <DebugToggle
          id="rig-auto-idle"
          label="Auto-idle loop"
          checked={params.autoIdle}
          onChange={(autoIdle) => onParams({ autoIdle })}
        />
        <DebugToggle
          id="rig-reduced-motion"
          label="Reduced motion (freeze animation)"
          checked={params.reducedMotion}
          onChange={(reducedMotion) => onParams({ reducedMotion })}
        />
      </section>

      <section className="card-panel p-4">
        <h2 className="section-title">Pattern</h2>
        <label htmlFor="rig-pattern-type" className="text-sm">
          Pattern type
        </label>
        <select
          id="rig-pattern-type"
          className="select-input mt-1"
          value={params.pattern}
          disabled={disabled}
          onChange={(e) => onParams({ pattern: e.target.value as PatternType })}
        >
          {PATTERN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <MotionSlider
          id="rig-pattern-intensity"
          label="Pattern intensity"
          value={params.patternIntensity}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled || params.pattern === 'none'}
          onChange={(patternIntensity) => onParams({ patternIntensity })}
        />
        <div className="mt-2 flex items-center justify-between text-sm">
          <label htmlFor="rig-pattern-color">Pattern color</label>
          <input
            id="rig-pattern-color"
            type="color"
            value={params.patternColor}
            disabled={disabled || params.pattern === 'none'}
            onChange={(e) => onParams({ patternColor: e.target.value })}
          />
        </div>
      </section>

      <section className="card-panel p-4">
        <h2 className="section-title">Debug</h2>
        <DebugToggle
          id="rig-debug-master"
          label="Approved-master underlay"
          checked={debug.masterUnderlay}
          onChange={(masterUnderlay) => onDebug({ masterUnderlay })}
        />
        <DebugToggle
          id="rig-debug-overlap"
          label="Hidden-overlap map (glows through open seams)"
          checked={debug.overlapMap}
          onChange={(overlapMap) => onDebug({ overlapMap })}
        />
        <DebugToggle
          id="rig-debug-mesh"
          label="Mesh & pivot overlay"
          checked={debug.meshPivots}
          onChange={(meshPivots) => onDebug({ meshPivots })}
        />
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Motion ranges are intentionally conservative — if seams open here, the pack is not ready.
        </p>
      </section>
    </div>
  );
}

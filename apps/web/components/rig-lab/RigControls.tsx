'use client';

import {
  MOTION_RANGES,
  PRESET_NAMES,
  type IllustratedRigParams,
  type PatternType,
  type PresetName,
} from '@createosaur/illustrated-rig';
import type { RigDebugFlags } from '@/lib/illustrated-rig/pixiRig';

const PRESET_LABELS: Record<PresetName, string> = {
  neutral: 'Neutral',
  inhale: 'Inhale',
  lookUp: 'Look Up',
  stride: 'Stride',
  stress: 'Stress Test',
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

export function RigControls({ params, debug, disabled, onParams, onPreset, onDebug }: Props) {
  const motionDisabled = disabled || params.autoIdle;
  return (
    <div className="flex flex-col gap-4">
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
          label="Jaw angle"
          unit="°"
          value={params.jawAngle}
          min={MOTION_RANGES.jawAngle.min}
          max={MOTION_RANGES.jawAngle.max}
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
          min={-1}
          max={1}
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

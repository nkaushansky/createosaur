'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_RIG_PARAMS,
  SPECIES_RIG_DEFS,
  clampRigParams,
  hybridMotionRanges,
  parseHybridConfig,
  rigPresets,
  type IllustratedRigParams,
  type PresetName,
} from '@createosaur/illustrated-rig';
import { sourceBaseDef, type RigSource } from '@/lib/illustrated-rig/rigAssets';
import type { RigDebugFlags, RigHandle } from '@/lib/illustrated-rig/pixiRig';
import { IllustratedRigStage, type RigPhase } from './IllustratedRigStage';
import { RigControls } from './RigControls';

/**
 * IR0/IR1 experiment shell — deliberately isolated from the lab store and
 * production components. Each species' variation seed is its pack's own
 * pattern seed, so a given species is one specific individual everywhere:
 * here, in unit snapshots, and in Playwright's frozen-time screenshots. A
 * hybrid inherits its body's seed — the mixed creature is one individual too.
 */
const DEFAULT_DEBUG: RigDebugFlags = {
  masterUnderlay: false,
  overlapMap: false,
  meshPivots: false,
};

/** Read the deterministic screenshot clock (?t=2500) once on the client. */
function freezeTimeFromLocation(): number | null {
  const raw = new URLSearchParams(window.location.search).get('t');
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Read the requested rig once on the client: ?mix=body:trex,head:allosaurus
 * selects a hybrid; otherwise ?species=allosaurus selects a pack.
 */
function sourceFromLocation(): RigSource {
  const search = new URLSearchParams(window.location.search);
  const mix = parseHybridConfig(search.get('mix'));
  if (mix) return { kind: 'hybrid', config: mix };
  const species = search.get('species');
  return species !== null && species in SPECIES_RIG_DEFS
    ? { kind: 'species', species: species as keyof typeof SPECIES_RIG_DEFS }
    : { kind: 'species', species: 'trex' };
}

export function IllustratedRigLab() {
  const [mounted, setMounted] = useState(false);
  const [freezeTimeMs, setFreezeTimeMs] = useState<number | null>(null);
  const [source, setSource] = useState<RigSource>({ kind: 'species', species: 'trex' });
  const [params, setParams] = useState<IllustratedRigParams>(DEFAULT_RIG_PARAMS);
  const [debug, setDebug] = useState<RigDebugFlags>(DEFAULT_DEBUG);
  const [phase, setPhase] = useState<RigPhase>({ state: 'loading', message: 'Preparing…' });
  const [attempt, setAttempt] = useState(0);
  const handleRef = useRef<RigHandle | null>(null);
  const def = sourceBaseDef(source);
  const ranges = useMemo(
    () =>
      source.kind === 'hybrid'
        ? hybridMotionRanges(source.config)
        : { strideRange: def.strideRange, jawRange: def.jawRange },
    [source, def]
  );

  useEffect(() => {
    setFreezeTimeMs(freezeTimeFromLocation());
    setSource(sourceFromLocation());
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setParams((current) => ({ ...current, autoIdle: false, reducedMotion: true }));
    }
    setMounted(true);
  }, []);

  const onHandle = useCallback((handle: RigHandle | null) => {
    handleRef.current = handle;
  }, []);

  const patchParams = useCallback((patch: Partial<IllustratedRigParams>) => {
    setParams((current) => {
      let next = { ...current, ...patch };
      // Turning idle off (or freezing) captures the pose where it was, so the
      // creature doesn't snap — the sliders inherit the last idle values.
      const idleWasDriving = current.autoIdle && !current.reducedMotion;
      const idleStops = (patch.autoIdle === false || patch.reducedMotion === true) && idleWasDriving;
      if (idleStops && handleRef.current) {
        next = { ...next, ...handleRef.current.effectiveMotion() };
      }
      return clampRigParams(next);
    });
  }, []);

  const applyPreset = useCallback(
    (name: PresetName) => {
      const presets = rigPresets(ranges.strideRange.max, ranges.jawRange);
      setParams((current) => clampRigParams({ ...current, ...presets[name], autoIdle: false }));
    },
    [ranges]
  );

  const switchSource = useCallback((next: RigSource) => {
    setSource(next);
    setPhase({ state: 'loading', message: 'Loading rig…' });
    // Motion resets to a neutral static pose so the new rig loads predictably.
    setParams((current) =>
      clampRigParams({ ...current, headAngle: 0, jawAngle: 0, breath: 0, stride: 0, tailSway: 0 })
    );
  }, []);

  const patchDebug = useCallback((patch: Partial<RigDebugFlags>) => {
    setDebug((current) => ({ ...current, ...patch }));
  }, []);

  const stageInputs = useMemo(
    () => ({ params, debug, freezeTimeMs }),
    [params, debug, freezeTimeMs]
  );

  const rigState = phase.state;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold">Rig Lab</h1>
          <span className="chip">IR experiment</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Authored illustrated dinosaurs under deterministic deformation (D-020). Not linked from
          the product; the production lab is untouched.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* The stage leads the flow and sticks: on phones it pins to the top
            while the controls scroll beneath (you must see the creature
            respond — instant consequence); on wider screens it pins beside
            the scrolling control column. */}
        <div
          className="sticky top-0 z-10 -mx-4 flex flex-col gap-2 px-4 pb-2 md:order-2 md:top-4 md:m-0 md:self-start md:p-0"
          style={{ background: 'var(--bg)' }}
        >
          <div
            className="viewport-paper relative overflow-hidden rounded-xl border p-2"
            style={{ borderColor: 'var(--paper-line)' }}
            data-testid="rig-stage"
            data-rig-state={rigState}
          >
            {mounted ? (
              <IllustratedRigStage
                inputs={stageInputs}
                source={source}
                onPhase={setPhase}
                onHandle={onHandle}
                attempt={attempt}
              />
            ) : null}

            {rigState === 'loading' ? (
              <div className="p-8 text-sm" data-testid="rig-loading" role="status">
                {phase.state === 'loading' ? phase.message : ''}
              </div>
            ) : null}

            {phase.state === 'error' ? (
              <div className="p-8" data-testid="rig-error" role="alert">
                <p className="font-semibold">The rig could not load its artwork.</p>
                <p className="mt-1 text-sm">
                  Failed asset: <code>{phase.assetPath}</code>
                </p>
                {phase.details.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs" style={{ color: 'var(--muted)' }}>
                    {phase.details.slice(0, 8).map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  className="btn mt-3"
                  onClick={() => {
                    setPhase({ state: 'loading', message: 'Retrying…' });
                    setAttempt((n) => n + 1);
                  }}
                >
                  Retry load
                </button>
              </div>
            ) : null}
          </div>

          {freezeTimeMs !== null ? (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Clock frozen at t={freezeTimeMs}ms for deterministic screenshots (remove ?t= to
              resume).
            </p>
          ) : null}
        </div>

        <div className="md:order-1">
          <RigControls
            params={params}
            debug={debug}
            disabled={rigState !== 'ready'}
            source={source}
            strideRange={ranges.strideRange}
            jawRange={ranges.jawRange}
            onSource={switchSource}
            onParams={patchParams}
            onPreset={applyPreset}
            onDebug={patchDebug}
          />
        </div>
      </div>
    </main>
  );
}

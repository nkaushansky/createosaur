'use client';

import { useEffect, useRef } from 'react';
import {
  evaluateHybridRigPose,
  hybridLabel,
  hybridPosedPivots,
  type IllustratedRigParams,
} from '@createosaur/illustrated-rig';
import {
  sourceBaseDef,
  sourceKey,
  type LoadProgress,
  type RigSource,
} from '@/lib/illustrated-rig/rigAssets';
import type { PixiRigOptions, RigDebugFlags, RigHandle } from '@/lib/illustrated-rig/pixiRig';

/**
 * Mounts the Pixi rig into a plain div. Pixi and the asset pipeline are
 * imported dynamically inside the effect, so the static export never
 * evaluates browser-only code at build time and `/rig-lab` prerenders as an
 * empty shell that hydrates into the experiment.
 */

export type RigPhase =
  | { state: 'loading'; message: string }
  | { state: 'ready' }
  | { state: 'error'; assetPath: string; details: string[] };

export interface RigStageInputs {
  params: IllustratedRigParams;
  debug: RigDebugFlags;
  freezeTimeMs: number | null;
}

declare global {
  interface Window {
    /** Test hook for Playwright: pose introspection without pixel assertions. */
    __rigLab?: {
      ready: boolean;
      frameState: () => string;
      effectiveMotion: () => Record<string, number>;
      currentTimeMs: () => number;
      extractPng: () => Promise<string>;
      metrics: () => { assetBytes: number; avgFrameMs: number; frameSamples: number };
      setLayerVisible: (id: string, visible: boolean) => void;
      firstRigMs: number;
    };
  }
}

interface Props {
  inputs: RigStageInputs;
  source: RigSource;
  onPhase: (phase: RigPhase) => void;
  /** Called with the live rig handle once ready (for freeze-in-place snapshots). */
  onHandle: (handle: RigHandle | null) => void;
  /** Bump to retry after an asset error. */
  attempt: number;
}

export function IllustratedRigStage({ inputs, source, onPhase, onHandle, attempt }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RigHandle | null>(null);
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const sourceRef = useRef(source);
  sourceRef.current = source;

  // Build once per attempt; feed input changes through the handle.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let handle: RigHandle | null = null;
    const startedAt = performance.now();
    const buildSource = sourceRef.current;

    (async () => {
      onPhase({ state: 'loading', message: 'Loading manifest…' });
      const [{ loadRigAssets, loadHybridRigAssets, RigAssetError }, { createPixiRig }] =
        await Promise.all([
          import('@/lib/illustrated-rig/rigAssets'),
          import('@/lib/illustrated-rig/pixiRig'),
        ]);
      try {
        const onProgress = (progress: LoadProgress): void => {
          if (cancelled) return;
          onPhase({
            state: 'loading',
            message:
              progress.step === 'manifest'
                ? 'Loading manifest…'
                : `Loading artwork (${progress.loaded}/${progress.total})…`,
          });
        };
        const def = sourceBaseDef(buildSource);
        const assets =
          buildSource.kind === 'hybrid'
            ? await loadHybridRigAssets(buildSource.config, onProgress)
            : await loadRigAssets(def, onProgress);
        if (cancelled) return;
        const hybridOptions: Partial<PixiRigOptions> =
          buildSource.kind === 'hybrid'
            ? {
                evaluate: (params, opts) => evaluateHybridRigPose(buildSource.config, params, opts),
                posedPivots: (pose) => hybridPosedPivots(buildSource.config, pose),
                ariaLabel: `Illustrated hybrid rig — ${hybridLabel(buildSource.config)} (experimental part mixing)`,
              }
            : {};
        handle = await createPixiRig(host, assets, {
          def,
          initialInputs: inputsRef.current,
          ...hybridOptions,
        });
        if (cancelled) {
          handle.destroy();
          return;
        }
        handleRef.current = handle;
        onHandle(handle);
        const firstRigMs = performance.now() - startedAt;
        window.__rigLab = {
          ready: true,
          frameState: () => handleRef.current?.frameState() ?? '',
          effectiveMotion: () => handleRef.current?.effectiveMotion() ?? {},
          currentTimeMs: () => handleRef.current?.currentTimeMs() ?? 0,
          extractPng: () => handleRef.current?.extractPng() ?? Promise.reject(new Error('rig gone')),
          metrics: () =>
            handleRef.current?.metrics() ?? { assetBytes: 0, avgFrameMs: 0, frameSamples: 0 },
          setLayerVisible: (id, visible) => handleRef.current?.setLayerVisible(id, visible),
          firstRigMs,
        };
        onPhase({ state: 'ready' });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof RigAssetError) {
          onPhase({ state: 'error', assetPath: error.assetPath, details: error.details });
        } else {
          onPhase({ state: 'error', assetPath: '(renderer)', details: [String(error)] });
        }
      }
    })();

    return () => {
      cancelled = true;
      delete window.__rigLab;
      onHandle(null);
      handleRef.current = null;
      handle?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- build once per attempt/source; live inputs flow via the effect below
  }, [attempt, sourceKey(source)]);

  useEffect(() => {
    handleRef.current?.setInputs(inputs);
  }, [inputs]);

  return <div ref={hostRef} data-testid="rig-canvas-host" />;
}

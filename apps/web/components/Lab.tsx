'use client';

import { useEffect } from 'react';
import { useLab } from '@/lib/store';
import { CreatureStage } from './CreatureStage';
import { Placard } from './Placard';
import { DnaPanel } from './DnaPanel';
import { PartsPanel } from './PartsPanel';
import { AppearancePanel } from './AppearancePanel';
import { GenomeViewer } from './GenomeViewer';

export function Lab() {
  const undo = useLab((s) => s.undo);
  const redo = useLab((s) => s.redo);
  const canUndo = useLab((s) => s.past.length > 0);
  const canRedo = useLab((s) => s.future.length > 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-5">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-bold sm:text-4xl">
          <span className="font-display uppercase tracking-wide">Createosaur</span>{' '}
          <span className="text-lg font-normal" style={{ color: 'var(--muted)' }}>
            Morph Lab
          </span>
        </h1>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={undo} disabled={!canUndo} aria-label="Undo">
            ↶ Undo
          </button>
          <button className="btn" onClick={redo} disabled={!canRedo} aria-label="Redo">
            ↷ Redo
          </button>
        </div>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <CreatureStage />
          <Placard />
        </div>
        <div className="card-panel flex flex-col gap-5 p-4">
          <DnaPanel />
          <PartsPanel />
          <AppearancePanel />
          <GenomeViewer />
        </div>
      </div>

      <footer className="mt-5 max-w-2xl text-sm" style={{ color: 'var(--muted)' }}>
        Every pixel is drawn deterministically from the genome — no AI, no
        waiting, no cost. The genome is the creature: keep it, share it, and
        (soon) breed it.
      </footer>
    </main>
  );
}

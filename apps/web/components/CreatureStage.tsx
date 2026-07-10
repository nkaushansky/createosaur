'use client';

import { useMemo } from 'react';
import { renderCreature } from '@createosaur/renderer';
import { useLab } from '@/lib/store';

/**
 * The specimen viewport. The SVG string comes from our own pure renderer —
 * the same function the share service and tests use — so injecting it is
 * safe by construction (no user-authored markup enters the pipeline).
 */
export function CreatureStage() {
  const genome = useLab((s) => s.genome);
  const svg = useMemo(() => renderCreature(genome, { idSuffix: 'lab' }), [genome]);

  return (
    <div
      className="viewport-paper rounded-xl border p-2"
      style={{ borderColor: 'var(--paper-line)' }}
      data-testid="creature-stage"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

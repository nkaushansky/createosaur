'use client';

import { useLab } from '@/lib/store';

/** The thesis, visible: the creature IS this JSON (VISION principle 1). */
export function GenomeViewer() {
  const genome = useLab((s) => s.genome);

  return (
    <details className="rounded-lg border px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
      <summary className="eyebrow cursor-pointer">The genome (this is the product)</summary>
      <pre className="genome-pre mt-2.5">{JSON.stringify(genome, null, 2)}</pre>
    </details>
  );
}

import type { Metadata } from 'next';
import { Workbench } from '@/components/Workbench';

export const metadata: Metadata = {
  title: 'Species Workbench (dev) — Createosaur',
  robots: { index: false, follow: false },
};

/**
 * Dev-only authoring route (ROADMAP M1). It is never linked from the product
 * nav, and in a production build the tool is replaced by a stub — so the
 * static export (D-016) still succeeds; the prod route renders only this stub (the authoring chunk is emitted but never referenced or loaded),
 * while `next dev` serves the full workbench for tuning morph vectors.
 */
export default function WorkbenchPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="eyebrow">Createosaur</p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide">
          Species Workbench
        </h1>
        <p className="mt-3 text-lg" style={{ color: 'var(--muted)' }}>
          The species authoring tool runs in development only. Start the dev server
          (<code>npm run dev</code>) and open <code>/workbench</code> to tune morph vectors.
        </p>
      </main>
    );
  }
  return <Workbench />;
}

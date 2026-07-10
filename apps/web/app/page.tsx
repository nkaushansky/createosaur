import Link from 'next/link';

/**
 * Minimal landing. The product IS the lab; this page's one job is getting
 * people there in under a second. Bigger marketing moments are M2+ latitude.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow">Createosaur</p>
      <h1 className="font-display text-5xl font-bold uppercase tracking-wide sm:text-6xl">
        Mix your own dinosaur
      </h1>
      <p className="max-w-xl text-lg" style={{ color: 'var(--muted)' }}>
        Slide DNA between species and watch your hybrid morph live. Pin the
        parts you love. Name what you make.
      </p>
      {/* ink-on-card inversion: ~13:1 contrast in both themes (white on the
          dark-mode amber accent was 2.25:1 — a WCAG failure) */}
      <Link
        href="/lab"
        className="btn text-lg font-semibold"
        style={{ background: 'var(--ink)', borderColor: 'var(--ink)', color: 'var(--card)', padding: '12px 28px' }}
      >
        Enter the lab
      </Link>
    </main>
  );
}

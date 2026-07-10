'use client';

import { useEffect, useState } from 'react';
import { useLab } from '@/lib/store';

/**
 * The undo toast raised when a species leaves the gene pool (GAME-DESIGN §4).
 * Auto-dismisses, but the timer pauses under pointer hover or keyboard focus
 * (WCAG 2.2.1) so it can never unmount out from under the user (M1 review).
 */
export function Toast() {
  const toast = useLab((s) => s.toast);
  const undoToast = useLab((s) => s.undoToast);
  const dismissToast = useLab((s) => s.dismissToast);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setPaused(false); // a fresh toast restarts the clock
  }, [toast?.id]);

  useEffect(() => {
    if (!toast || paused) return;
    const t = setTimeout(dismissToast, 6000);
    return () => clearTimeout(t);
  }, [toast, paused, dismissToast]);

  if (!toast) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm shadow-lg"
        style={{ background: 'var(--ink)', color: 'var(--card)' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <span>{toast.message}</span>
        <button
          className="font-semibold underline underline-offset-2"
          onClick={undoToast}
          style={{ color: 'var(--card)' }}
        >
          Undo
        </button>
        <button aria-label="Dismiss" onClick={dismissToast} style={{ color: 'var(--card)', opacity: 0.7 }}>
          ✕
        </button>
      </div>
    </div>
  );
}

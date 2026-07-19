import type { Metadata } from 'next';
import { IllustratedRigLab } from '@/components/rig-lab/IllustratedRigLab';

/**
 * IR0 parallel experiment route (D-020). Unlinked from production navigation
 * and excluded from indexing — this page exists for owner review of the
 * illustrated-rig direction, beside (never instead of) the production /lab.
 */
export const metadata: Metadata = {
  title: 'Rig Lab (IR0) — Createosaur',
  robots: { index: false, follow: false },
};

export default function RigLabPage() {
  return <IllustratedRigLab />;
}

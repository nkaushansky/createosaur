import type { Metadata } from 'next';
import { Lab } from '@/components/Lab';

export const metadata: Metadata = {
  title: 'The Lab — Createosaur',
};

export default function LabPage() {
  return <Lab />;
}

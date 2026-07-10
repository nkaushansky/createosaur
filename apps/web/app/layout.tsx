import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Createosaur — Genetic Morph Lab',
  description:
    'Mix DNA across dinosaur species with sliders, pin parts Lego-style, and watch your hybrid morph live. Every creature is a tiny genome you can keep, share, and one day breed.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#edeee6' },
    { media: '(prefers-color-scheme: dark)', color: '#16140f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

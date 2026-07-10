import type { Config } from 'tailwindcss';

/**
 * The visual system rides on CSS custom properties defined in
 * app/globals.css (both themes); Tailwind consumes them as colors so
 * utilities stay theme-agnostic.
 */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        paper: 'var(--paper)',
        'paper-line': 'var(--paper-line)',
      },
      fontFamily: {
        display: [
          '"Avenir Next Condensed"',
          '"Franklin Gothic Medium"',
          '"Arial Narrow"',
          'Impact',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'legacy/**',
      'node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/next-env.d.ts',
      'playwright-report/**',
      'test-results/**',
      'docs/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // AGENT-GUIDE: no console.log in shipped code
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['**/*.test.ts', '**/e2e/**'],
    rules: { 'no-console': 'off' },
  }
);

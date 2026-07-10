import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Renderer purity invariant (CLAUDE.md, ARCHITECTURE): the renderer must run
 * identically in browser, server, and tests — so no DOM, no I/O, and no
 * nondeterminism may enter its source. This test is the tripwire.
 */
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /\bdocument\b/, why: 'DOM access' },
  { pattern: /\bwindow\b/, why: 'DOM access' },
  { pattern: /\bnavigator\b/, why: 'browser API' },
  { pattern: /\blocalStorage\b/, why: 'browser storage' },
  { pattern: /\bfetch\s*\(/, why: 'network I/O' },
  { pattern: /Math\.random/, why: 'nondeterminism — use genome.seed' },
  { pattern: /Date\.now|new Date\(/, why: 'nondeterminism' },
  { pattern: /from ['"]react/, why: 'renderer must stay framework-free' },
  { pattern: /require\s*\(/, why: 'use ESM imports only' },
  { pattern: /from ['"]node:/, why: 'no Node built-ins in renderer source' },
];

describe('renderer purity', () => {
  const files = readdirSync(srcDir).filter((f) => f.endsWith('.ts'));

  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file} is pure`, () => {
      const content = readFileSync(join(srcDir, file), 'utf8');
      for (const { pattern, why } of FORBIDDEN) {
        expect(pattern.test(content), `${file} violates purity (${why}): ${pattern}`).toBe(false);
      }
    });
  }

  it('depends only on workspace packages', () => {
    const pkg = JSON.parse(
      readFileSync(join(srcDir, '..', 'package.json'), 'utf8')
    ) as { dependencies?: Record<string, string> };
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual([
      '@createosaur/genome',
      '@createosaur/species-data',
    ]);
  });
});

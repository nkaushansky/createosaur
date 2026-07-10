import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Renderer purity invariant (CLAUDE.md, ARCHITECTURE): the renderer must run
 * identically in browser, server, and tests — so no DOM, no I/O, and no
 * nondeterminism may enter its source. This test is the tripwire.
 *
 * Hardened by the M0 adversarial review: recursive walk (new subdirectories
 * can't escape), .tsx included, env/locale/crypto nondeterminism patterns,
 * and an import allowlist checked against actual source (a manifest check
 * alone is bypassed by hoisted phantom dependencies).
 */
const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /\bdocument\b/, why: 'DOM access' },
  { pattern: /\bwindow\b/, why: 'DOM access' },
  { pattern: /\bnavigator\b/, why: 'browser API' },
  { pattern: /\bglobalThis\b/, why: 'ambient global access' },
  { pattern: /\blocalStorage\b|\bsessionStorage\b/, why: 'browser storage' },
  { pattern: /\bfetch\s*\(/, why: 'network I/O' },
  { pattern: /\bprocess\b/, why: 'environment access' },
  { pattern: /\bperformance\b/, why: 'nondeterministic clock' },
  { pattern: /\bcrypto\b/, why: 'nondeterminism — use genome.seed' },
  { pattern: /Math\.random/, why: 'nondeterminism — use genome.seed' },
  { pattern: /Date\.now|new Date\(/, why: 'nondeterminism' },
  { pattern: /\bIntl\b|toLocale\w*\(/, why: 'locale-dependent output' },
  { pattern: /from ['"]react/, why: 'renderer must stay framework-free' },
  { pattern: /require\s*\(/, why: 'use ESM imports only' },
  { pattern: /\bimport\s*\(/, why: 'no dynamic imports — keep the module graph static' },
];

/** Only these module specifiers may appear in renderer source imports. */
const ALLOWED_IMPORT = /^(\.{1,2}\/|@createosaur\/genome$|@createosaur\/species-data$)/;
const IMPORT_SPECIFIERS = /from\s+['"]([^'"]+)['"]/g;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe('renderer purity', () => {
  const files = walk(srcDir);

  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = file.slice(srcDir.length + 1);

    it(`${rel} is pure`, () => {
      const content = readFileSync(file, 'utf8');
      for (const { pattern, why } of FORBIDDEN) {
        expect(pattern.test(content), `${rel} violates purity (${why}): ${pattern}`).toBe(false);
      }
    });

    it(`${rel} imports only relative modules or the two allowed packages`, () => {
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(IMPORT_SPECIFIERS)) {
        const spec = match[1]!;
        expect(ALLOWED_IMPORT.test(spec), `${rel} imports "${spec}"`).toBe(true);
      }
    });
  }

  it('declares only workspace packages in its manifest', () => {
    const pkg = JSON.parse(
      readFileSync(join(srcDir, '..', 'package.json'), 'utf8')
    ) as { dependencies?: Record<string, string> };
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual([
      '@createosaur/genome',
      '@createosaur/species-data',
    ]);
  });
});

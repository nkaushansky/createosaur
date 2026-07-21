import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Purity invariant for the illustrated-rig package (same contract as the
 * production renderer's tripwire): pose math must run identically in browser,
 * node tests and any future server capture — so no DOM, no Pixi, no React,
 * no I/O, no nondeterminism, and no dependencies at all.
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
  { pattern: /\bcrypto\b/, why: 'nondeterminism — use the seed' },
  { pattern: /Math\.random/, why: 'nondeterminism — use the seed' },
  { pattern: /Date\.now|new Date\(/, why: 'nondeterminism — time is an explicit input' },
  { pattern: /\bIntl\b|toLocale\w*\(/, why: 'locale-dependent output' },
  { pattern: /from ['"]react/, why: 'must stay framework-free' },
  { pattern: /from ['"]pixi/, why: 'Pixi belongs to apps/web, never this package' },
  { pattern: /require\s*\(/, why: 'use ESM imports only' },
  { pattern: /\bimport\s*\(/, why: 'no dynamic imports — keep the module graph static' },
];

/** This package depends on nothing: only relative imports may appear. */
const ALLOWED_IMPORT = /^\.{1,2}\//;
const IMPORT_SPECIFIERS = /from\s+['"]([^'"]+)['"]/g;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

describe('illustrated-rig purity', () => {
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

    it(`${rel} imports only relative modules`, () => {
      const content = readFileSync(file, 'utf8');
      for (const match of content.matchAll(IMPORT_SPECIFIERS)) {
        const spec = match[1]!;
        expect(ALLOWED_IMPORT.test(spec), `${rel} imports "${spec}"`).toBe(true);
      }
    });
  }

  it('declares zero dependencies in its manifest', () => {
    const pkg = JSON.parse(readFileSync(join(srcDir, '..', 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([]);
    expect(Object.keys(pkg.devDependencies ?? {})).toEqual([]);
  });
});

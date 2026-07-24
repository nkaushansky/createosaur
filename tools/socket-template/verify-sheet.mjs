#!/usr/bin/env node
/**
 * Socket-era sheet verifier (D-024 / Template S). Mechanical checks on a
 * returned S-M / S-A / S-B image before slicing:
 *
 * - GRAYSCALE: chroma (max channel - min channel) of every pixel that is
 *   neither chroma-green nor magenta-guide; reports mean / p95 / max and the
 *   worst offender's coordinates. Target: p95 <= ~6.
 * - SCALE BAR: detects the longest horizontal near-black run in the bottom
 *   strip and reports its length vs the template's 200 px (the sheet-wide
 *   re-normalization factor).
 * - VALUE COVERAGE: 16-bin histogram of art values (is the range used, are
 *   near-black / near-white reserved).
 * - FURNITURE: confirms green background fraction and magenta presence
 *   (guides survived) for template sheets.
 *
 * Usage: node tools/socket-template/verify-sheet.mjs <image.png> [--master]
 *   --master: S-M full-body master (no magenta/furniture expectations).
 */

import { existsSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PREINSTALLED = '/opt/pw-browsers/chromium';
const [imagePath, flag] = process.argv.slice(2);
if (!imagePath) {
  console.error('usage: verify-sheet.mjs <image.png> [--master]');
  process.exit(1);
}
const isMaster = flag === '--master';
const b64 = readFileSync(imagePath).toString('base64');

const browser = await chromium.launch(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {});
try {
  const page = await browser.newPage();
  const report = await page.evaluate(async ([src]) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + src;
    await img.decode();
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, W, H);

    const isGreen = (r, g, b) => g > 90 && g > r + 40 && g > b + 40;
    const isMagenta = (r, g, b) => r > 90 && b > 90 && r > g + 40 && b > g + 40;

    let green = 0;
    let magenta = 0;
    let art = 0;
    let chromaSum = 0;
    let chromaMax = 0;
    let chromaMaxAt = null;
    const chromas = [];
    const hist = new Array(16).fill(0);

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (isGreen(r, g, b)) {
          green++;
          continue;
        }
        if (isMagenta(r, g, b)) {
          magenta++;
          continue;
        }
        art++;
        const c = Math.max(r, g, b) - Math.min(r, g, b);
        chromaSum += c;
        if (c > chromaMax) {
          chromaMax = c;
          chromaMaxAt = { x, y, r, g, b };
        }
        // Sample every 4th pixel for the percentile to bound memory.
        if ((x + y) % 4 === 0) chromas.push(c);
        hist[Math.min(15, Math.floor(((r + g + b) / 3 / 256) * 16))]++;
      }
    }
    chromas.sort((a, u) => a - u);
    const p95 = chromas[Math.floor(chromas.length * 0.95)] ?? 0;

    // Interior chroma: art pixels at least 6 px from any green/magenta pixel
    // (excludes key-edge antialiasing and guide halos — the honest measure of
    // whether the ART is grayscale).
    const mask = new Uint8Array(W * H); // 1 = green|magenta
    for (let p = 0, i = 0; p < W * H; p++, i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isGreen(r, g, b) || isMagenta(r, g, b)) mask[p] = 1;
    }
    const R = 6;
    const dil = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      let run = -1e9;
      for (let x = 0; x < W; x++) {
        if (mask[y * W + x]) run = x;
        if (x - run <= R) dil[y * W + x] = 1;
      }
      run = 1e9;
      for (let x = W - 1; x >= 0; x--) {
        if (mask[y * W + x]) run = x;
        if (run - x <= R) dil[y * W + x] = 1;
      }
    }
    const dil2 = new Uint8Array(dil);
    for (let x = 0; x < W; x++) {
      let run = -1e9;
      for (let y = 0; y < H; y++) {
        if (dil[y * W + x]) run = y;
        if (y - run <= R) dil2[y * W + x] = 1;
      }
      run = 1e9;
      for (let y = H - 1; y >= 0; y--) {
        if (dil[y * W + x]) run = y;
        if (run - y <= R) dil2[y * W + x] = 1;
      }
    }
    let inArt = 0;
    let inSum = 0;
    let inMax = 0;
    const inChromas = [];
    for (let p = 0, i = 0; p < W * H; p++, i += 4) {
      if (mask[p] || dil2[p]) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const c = Math.max(r, g, b) - Math.min(r, g, b);
      inArt++;
      inSum += c;
      if (c > inMax) inMax = c;
      if (p % 4 === 0) inChromas.push(c);
    }
    inChromas.sort((a, u) => a - u);
    const interiorP95 = inChromas[Math.floor(inChromas.length * 0.95)] ?? 0;
    const interior = {
      pixels: inArt,
      chromaMean: inSum / Math.max(1, inArt),
      chromaP95: interiorP95,
      chromaMax: inMax,
    };

    // Scale bar: longest horizontal dark run in the bottom 15% of the image.
    let barBest = 0;
    for (let y = Math.floor(H * 0.85); y < H; y++) {
      let run = 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const dark = data[i] < 70 && data[i + 1] < 70 && data[i + 2] < 70;
        run = dark ? run + 1 : 0;
        if (run > barBest) barBest = run;
      }
    }

    return {
      W,
      H,
      greenPct: (green / (W * H)) * 100,
      magentaPct: (magenta / (W * H)) * 100,
      artPct: (art / (W * H)) * 100,
      chromaMean: chromaSum / Math.max(1, art),
      chromaP95: p95,
      chromaMax,
      chromaMaxAt,
      interior,
      scaleBarPx: barBest,
      hist,
    };
  }, [b64]);

  const fail = [];
  if (report.interior.chromaP95 > 8)
    fail.push(`interior chroma p95 ${report.interior.chromaP95} > 8 — the art itself is not grayscale`);
  if (!isMaster && report.magentaPct < 0.005) fail.push('magenta guides missing — template furniture lost');
  if (report.greenPct < 30) fail.push(`green background only ${report.greenPct.toFixed(1)}% — wrong background?`);

  console.log(JSON.stringify(report, null, 2));
  console.log(fail.length ? `FAIL:\n- ${fail.join('\n- ')}` : 'PASS');
  process.exitCode = fail.length ? 2 : 0;
} finally {
  await browser.close();
}

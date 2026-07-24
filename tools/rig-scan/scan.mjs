#!/usr/bin/env node
/**
 * Enclosed-hole scan for /rig-lab states — the quantitative seam check the
 * IR seam rounds run before owner review (ROADMAP "the enclosed-hole scan
 * stays flat across the whole sweep").
 *
 * A "hole" is a transparent stage pixel tightly flanked by solid art on all
 * four sides (within FLANK px) — i.e. a slit or tear INSIDE the creature,
 * not the open background around it. Pure rigs have a small stable baseline
 * (mouth gap, leg crevices); a pose or part mix that opens seams shows up as
 * counts above its config's baseline.
 *
 * Usage: node tools/rig-scan/scan.mjs [--base-url http://localhost:3000]
 *        [--out <json path>]
 * Requires a served static export (npm run build && npm run start) and the
 * preinstalled Chromium (falls back to Playwright's own).
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const { values: args } = parseArgs({
  options: {
    'base-url': { type: 'string', default: 'http://localhost:3000' },
    out: { type: 'string', default: '' },
  },
});

/** Configs under test: label → rig-lab query (without ?t). */
const CONFIGS = [
  ['pure-trex', 'species=trex'],
  ['pure-allosaurus', 'species=allosaurus'],
  ['trex-socket', 'species=trex-sock'],
  ['allo-head-on-trex', 'mix=body:trex,head:allosaurus'],
  ['rex-head-on-allo', 'mix=body:allosaurus,head:trex'],
  ['trex-legs-on-allo', 'mix=body:allosaurus,legs:trex'],
  ['allo-tail-on-trex', 'mix=body:trex,tail:allosaurus'],
  ['full-swap', 'mix=body:trex,head:allosaurus,arms:allosaurus,legs:allosaurus,tail:allosaurus'],
];

/** Poses per config: label → motion slider values. */
const POSES = [
  ['neutral', { headAngle: 0, jawAngle: 0, breath: 0, stride: 0, tailSway: 0 }],
  ['inhale-clench', { headAngle: 0.5, jawAngle: -8, breath: 1, stride: 0, tailSway: -0.08 }],
  ['stride-fwd', { headAngle: -1.2, jawAngle: 0, breath: 0.35, stride: 1, tailSway: 0.55 }],
  ['stride-back', { headAngle: -1.2, jawAngle: 0, breath: 0.35, stride: -1, tailSway: -0.55 }],
  ['stress', { headAngle: 7.5, jawAngle: 0, breath: 1, stride: 1, tailSway: 1 }],
];

/** Solid-alpha threshold, hole-alpha threshold, flank search distance (px). */
const SCAN = { solid: 128, hole: 8, flank: 12 };

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function scanState(page, motion) {
  await setRange(page, '#rig-head', motion.headAngle);
  await setRange(page, '#rig-jaw', motion.jawAngle);
  await setRange(page, '#rig-breath', motion.breath);
  await setRange(page, '#rig-stride', motion.stride);
  await setRange(page, '#rig-tail', motion.tailSway);
  return page.evaluate(async (scan) => {
    const png = await window.__rigLab.extractPng();
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = png;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const alphaAt = (x, y) => data[4 * (y * w + x) + 3];
    const solidWithin = (x, y, dx, dy) => {
      for (let step = 1; step <= scan.flank; step++) {
        const nx = x + dx * step;
        const ny = y + dy * step;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return false;
        if (alphaAt(nx, ny) >= scan.solid) return true;
      }
      return false;
    };
    let holes = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (alphaAt(x, y) > scan.hole) continue;
        if (
          solidWithin(x, y, -1, 0) &&
          solidWithin(x, y, 1, 0) &&
          solidWithin(x, y, 0, -1) &&
          solidWithin(x, y, 0, 1)
        ) {
          holes += 1;
        }
      }
    }
    return holes;
  }, SCAN);
}

const browser = await chromium.launch(
  existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {}
);
const page = await browser.newPage();
const results = {};
for (const [configLabel, query] of CONFIGS) {
  await page.goto(`${args['base-url']}/rig-lab?${query}&t=0`);
  await page
    .getByTestId('rig-stage')
    .and(page.locator('[data-rig-state="ready"]'))
    .waitFor({ timeout: 60_000 });
  // Static sliders (idle off) so each pose is exactly the requested values.
  await page.getByTestId('rig-preset-neutral').click();
  const row = {};
  for (const [poseLabel, motion] of POSES) {
    row[poseLabel] = await scanState(page, motion);
    process.stdout.write(`${configLabel.padEnd(20)} ${poseLabel.padEnd(14)} ${row[poseLabel]}\n`);
  }
  results[configLabel] = row;
}
await browser.close();

if (args.out) {
  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, `${JSON.stringify({ scan: SCAN, results }, null, 2)}\n`);
  process.stdout.write(`wrote ${args.out}\n`);
}

#!/usr/bin/env node
/**
 * Socket-era template generator (D-024). Draws the two guide sheets a species
 * is generated onto — sheet A (head assembly: head-upper, jaw-lower, neck) and
 * sheet B (body: closed core, tail, arms, legs) — so every part terminates in a
 * standard socket profile and every sheet carries the same normalization
 * furniture (anchor, scale bar, value ramp).
 *
 * Design rules baked in here:
 * - Background + cell borders + labels are GREENS (chroma-keyable): the model
 *   and the owner can read them, the slicer keys them out with the background.
 * - Socket guides are MAGENTA dashed cut-lines/discs with px labels: they must
 *   survive the key so the slicer (and the eye) can check compliance.
 * - Furniture (anchor cross, scale bar, value ramp) is grayscale by necessity;
 *   it sits in a bottom strip away from the part cells and is matched/ignored
 *   by centroid during slicing.
 * - Socket sizes are in master-stage px (1536×1024), taken from the approved
 *   T. rex geometry: profiles standardize the CUT SIZE of each part end, not
 *   its position — bodies place apertures naturally per species.
 *
 * Usage: node tools/socket-template/make-template.mjs [outDir]
 *   (default outDir: docs/rebuild/asset-generation)
 *
 * Chromium via Playwright is the raster engine (no native image deps), same
 * as tools/sheet-slicer.
 */

import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const PREINSTALLED = '/opt/pw-browsers/chromium';

const W = 1536;
const H = 1024;
const OUT_DIR = process.argv[2] ?? 'docs/rebuild/asset-generation';

/** Standard socket profiles, master-stage px (the D-024 cut-size contract). */
const SOCKETS = {
  neckBody: 180, // neck → body collar
  neckHead: 110, // neck → head end
  headRear: 110, // upper-head rear collar (matches neckHead)
  jawRoot: 70, //   jaw → head root
  tailRoot: 150, // tail → pelvis root
  armRoot: 55, //   arm → shoulder disc
  legRoot: 130, // leg → hip (thigh top)
};

/** Everything below runs inside Chromium; ctx is a 2D canvas context. */
const DRAW_LIB = String.raw`
const GREEN_BG = '#00ff00';
const GREEN_LINE = '#00a800';
const GREEN_TEXT = '#006e00';
const MAGENTA = '#ff00ff';

function bg(ctx, W, H) {
  ctx.fillStyle = GREEN_BG;
  ctx.fillRect(0, 0, W, H);
}

function cell(ctx, x, y, w, h, label) {
  ctx.save();
  ctx.strokeStyle = GREEN_LINE;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.fillStyle = GREEN_TEXT;
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText(label, x + 14, y + 34);
  ctx.restore();
}

function note(ctx, x, y, lines, size = 18) {
  ctx.save();
  ctx.fillStyle = GREEN_TEXT;
  ctx.font = size + 'px Arial, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * (size + 6)));
  ctx.restore();
}

/** A dashed magenta cut-line of exact length with end ticks + label. */
function cutGuide(ctx, cx, cy, len, angleDeg, label) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 10]);
  ctx.beginPath();
  ctx.moveTo(0, -len / 2);
  ctx.lineTo(0, len / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const end of [-len / 2, len / 2]) {
    ctx.beginPath();
    ctx.moveTo(-12, end);
    ctx.lineTo(12, end);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.fillStyle = MAGENTA;
  ctx.font = 'bold 19px Arial, sans-serif';
  // Horizontal-ish guides get their label below the line, not through it.
  const horizontal = Math.abs(((angleDeg % 180) + 180) % 180 - 90) < 30;
  if (horizontal) ctx.fillText(label, cx - len / 2, cy + 32);
  else ctx.fillText(label, cx + 20, cy + 6);
  ctx.restore();
}

/** A dashed magenta socket disc (limb roots) with label. */
function discGuide(ctx, cx, cy, diameter, label) {
  ctx.save();
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = MAGENTA;
  ctx.font = 'bold 19px Arial, sans-serif';
  ctx.fillText(label, cx + diameter / 2 + 10, cy + 6);
  ctx.restore();
}

/** Bottom strip: anchor cross, scale bar, five-step value ramp. */
function furniture(ctx, W, H) {
  const y = H - 62;
  ctx.save();
  // Anchor cross in a circle.
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(80, y, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(80 - 38, y);
  ctx.lineTo(80 + 38, y);
  ctx.moveTo(80, y - 38);
  ctx.lineTo(80, y + 38);
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText('ANCHOR', 46, y + 56);
  // Scale bar: 200 px, end ticks.
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, y);
  ctx.lineTo(400, y);
  ctx.moveTo(200, y - 14);
  ctx.lineTo(200, y + 14);
  ctx.moveTo(400, y - 14);
  ctx.lineTo(400, y + 14);
  ctx.stroke();
  ctx.fillText('SCALE BAR — 200 px (do not redraw)', 200, y + 40);
  // Value ramp.
  const ramp = [0, 0.25, 0.5, 0.75, 1];
  ramp.forEach((v, i) => {
    const g = Math.round(v * 255);
    ctx.fillStyle = 'rgb(' + g + ',' + g + ',' + g + ')';
    ctx.fillRect(1160 + i * 60, y - 26, 60, 52);
  });
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(1160, y - 26, 300, 52);
  ctx.fillStyle = '#111';
  ctx.fillText('VALUE RANGE', 1160, y + 46);
  ctx.restore();
}
`;

const SHEET_A = String.raw`
bg(ctx, W, H);
note(ctx, 40, 28, [
  'SHEET A — HEAD ASSEMBLY · grayscale value art on green · all parts side view, FACING LEFT',
  'Magenta dashed lines are SOCKET CUTS: end each part flush on its line, at exactly that size. Leave all magenta + the bottom strip untouched.',
], 19);

cell(ctx, 40, 80, 720, 500, 'UPPER HEAD (skull, no lower jaw — mouth OPEN)');
cutGuide(ctx, 690, 330, ${SOCKETS.headRear}, 0, '${SOCKETS.headRear}px rear collar');
note(ctx, 60, 545, ['Rear of skull ends ON the cut; a longer soft-edged neck-cover flap PAST it is welcome.'], 17);

cell(ctx, 40, 620, 720, 280, 'LOWER JAW (matches the upper head, open gape)');
cutGuide(ctx, 690, 760, ${SOCKETS.jawRoot}, 0, '${SOCKETS.jawRoot}px root');
note(ctx, 60, 872, ['Jaw root ends ON the cut — nothing hangs past it (it tucks under the skull).'], 17);

cell(ctx, 800, 80, 696, 820, 'NECK (deep nape-to-throat wedge, complete)');
cutGuide(ctx, 900, 210, ${SOCKETS.neckHead}, -12, '${SOCKETS.neckHead}px head end');
cutGuide(ctx, 1360, 680, ${SOCKETS.neckBody}, 18, '${SOCKETS.neckBody}px body end');
note(ctx, 820, 852, ['Draw the neck running between its two cuts, head end upper-left, body end lower-right.'], 17);

furniture(ctx, W, H);
`;

/**
 * Sheet B comes in two stance variants: bipeds carry small arms (55 px root
 * discs, short cells), quadrupeds carry complete forelegs (leg-class 130 px
 * roots, leg-height cells). Cell positions are shared so the slicer's
 * expectCentroid conventions transfer between variants.
 */
function sheetB(stance) {
  const quad = stance === 'quad';
  const foreRoot = quad ? SOCKETS.legRoot : SOCKETS.armRoot;
  const foreH = quad ? 470 : 240;
  const foreLabel = quad ? 'FORELEG' : 'ARM';
  const foreGuide = (x, y) =>
    quad
      ? `cutGuide(ctx, ${x}, ${y}, ${SOCKETS.legRoot}, 90, '${SOCKETS.legRoot}px shoulder top');`
      : `discGuide(ctx, ${x}, ${y}, ${SOCKETS.armRoot}, '${SOCKETS.armRoot}px root');`;
  return `
bg(ctx, W, H);
note(ctx, 40, 28, [
  'SHEET B — BODY & LIMBS · grayscale value art on green · all parts side view, FACING LEFT',
  'Magenta dashed marks are SOCKET SIZES: end each part flush at exactly that size. Leave all magenta + the bottom strip untouched.',
], 19);

cell(ctx, 40, 80, 860, 480, 'CORE — torso through pelvis, one CLOSED shape');
note(ctx, 60, 136, [
  'Completely closed silhouette: no neck, head, limbs or tail, and no holes or',
  'openings — other parts are drawn OVER it. Where parts attach, shade a plain',
  'smooth region sized to the socket cuts:',
  'neck ${SOCKETS.neckBody}px (front top) · tail ${SOCKETS.tailRoot}px (rear) · hip ${SOCKETS.legRoot}px · shoulder ${foreRoot}px.',
], 18);

cell(ctx, 940, 80, 556, 300, 'TAIL (complete, thick root)');
cutGuide(ctx, 1000, 235, ${SOCKETS.tailRoot}, 0, '${SOCKETS.tailRoot}px root');

cell(ctx, 940, 420, 262, ${foreH}, 'FAR ${foreLabel}');
${foreGuide(1050, 500)}
cell(ctx, 1234, 420, 262, ${foreH}, 'NEAR ${foreLabel}');
${foreGuide(1344, 500)}

cell(ctx, 40, 610, 400, 280, 'FAR LEG (full thigh to toes)');
cutGuide(ctx, 240, 700, ${SOCKETS.legRoot}, 90, '${SOCKETS.legRoot}px thigh top');
cell(ctx, 480, 610, 400, 280, 'NEAR LEG (full thigh to toes)');
cutGuide(ctx, 680, 700, ${SOCKETS.legRoot}, 90, '${SOCKETS.legRoot}px thigh top');

furniture(ctx, W, H);
`;
}

async function render(page, body, outPath) {
  const dataUrl = await page.evaluate(
    ([lib, draw, width, height]) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      new Function('ctx', 'W', 'H', `${lib}\n${draw}`)(ctx, width, height);
      return canvas.toDataURL('image/png');
    },
    [DRAW_LIB, body, W, H]
  );
  const png = Buffer.from(dataUrl.split(',')[1], 'base64');
  await writeFile(outPath, png);
  console.log(`wrote ${outPath} (${(png.length / 1024).toFixed(0)} KB)`);
}

const browser = await chromium.launch(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {});
try {
  const page = await browser.newPage();
  await mkdir(OUT_DIR, { recursive: true });
  await render(page, SHEET_A, join(OUT_DIR, 'socket-template-a-v1.png'));
  await render(page, sheetB('biped'), join(OUT_DIR, 'socket-template-b-biped-v1.png'));
  await render(page, sheetB('quad'), join(OUT_DIR, 'socket-template-b-quad-v1.png'));
} finally {
  await browser.close();
}

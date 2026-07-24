#!/usr/bin/env node
/**
 * Identity tolerance vs the TRUE master (D-021/D-024 acceptance): silhouette
 * IoU, master coverage, and bbox comparison between a pack's assembled
 * debug/reassembled-transparent.png and its master image.
 *
 * Usage: node tools/sheet-slicer/identity.mjs <packDir> [masterPath]
 *   masterPath defaults to the pack's manifest masterFile beside the pack.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const PREINSTALLED = '/opt/pw-browsers/chromium';
const [packDir, masterArg] = process.argv.slice(2);
if (!packDir) {
  console.error('usage: identity.mjs <packDir> [masterPath]');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(join(packDir, 'manifest.json'), 'utf8'));
const masterPath =
  masterArg ?? join(packDir, manifest.masterFile ?? 'master.png');
const asmB64 = readFileSync(join(packDir, 'debug', 'reassembled-transparent.png')).toString('base64');
const masterB64 = readFileSync(
  existsSync(masterPath) ? masterPath : join(packDir, 'trex-sock-master.png')
).toString('base64');

const browser = await chromium.launch(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {});
try {
  const page = await browser.newPage();
  const r = await page.evaluate(async ([a64, m64]) => {
    async function silhouette(b64, keyGreen) {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, W, H);
      const mask = new Uint8Array(W * H);
      for (let p = 0, i = 0; p < W * H; p++, i += 4) {
        const solidAlpha = data[i + 3] > 128;
        if (!solidAlpha) continue;
        if (keyGreen) {
          const rr = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (g > 90 && g > rr + 40 && g > b + 40) continue; // background
        }
        mask[p] = 1;
      }
      return { mask, W, H };
    }
    const A = await silhouette(a64, false);
    const M = await silhouette(m64, true);
    let inter = 0;
    let aOnly = 0;
    let mOnly = 0;
    let aMin = [1e9, 1e9];
    let aMax = [-1, -1];
    let mMin = [1e9, 1e9];
    let mMax = [-1, -1];
    for (let y = 0; y < M.H; y++) {
      for (let x = 0; x < M.W; x++) {
        const p = y * M.W + x;
        const a = A.mask[p];
        const m = M.mask[p];
        if (a && m) inter++;
        else if (a) aOnly++;
        else if (m) mOnly++;
        if (a) {
          if (x < aMin[0]) aMin[0] = x;
          if (y < aMin[1]) aMin[1] = y;
          if (x > aMax[0]) aMax[0] = x;
          if (y > aMax[1]) aMax[1] = y;
        }
        if (m) {
          if (x < mMin[0]) mMin[0] = x;
          if (y < mMin[1]) mMin[1] = y;
          if (x > mMax[0]) mMax[0] = x;
          if (y > mMax[1]) mMax[1] = y;
        }
      }
    }
    const union = inter + aOnly + mOnly;
    return {
      iou: inter / union,
      masterCoverage: inter / (inter + mOnly),
      assemblyOutsideMaster: aOnly / (inter + aOnly),
      assemblyBbox: [...aMin, aMax[0] - aMin[0] + 1, aMax[1] - aMin[1] + 1],
      masterBbox: [...mMin, mMax[0] - mMin[0] + 1, mMax[1] - mMin[1] + 1],
    };
  }, [asmB64, masterB64]);
  const aAspect = r.assemblyBbox[2] / r.assemblyBbox[3];
  const mAspect = r.masterBbox[2] / r.masterBbox[3];
  console.log(JSON.stringify({ ...r, assemblyAspect: aAspect, masterAspect: mAspect }, null, 2));
} finally {
  await browser.close();
}

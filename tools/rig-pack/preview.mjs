/**
 * Segmentation preview: renders the ownership partition as tinted overlays on
 * the master, full-frame plus zoomed boundary crops.
 *   node tools/rig-pack/preview.mjs <master.png> <segmentation.json> <outDir> [x,y,w,h,scale ...]
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadSegmentation, openMaster, saveDataUrl } from './driver.mjs';

const [masterPath, segPath, outDir, ...crops] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const segmentation = loadSegmentation(segPath);
const { browser, page } = await openMaster(masterPath);

await page.evaluate((seg) => {
  const RP = window.RigPack;
  const src = window.__masterData;
  const alpha = RP.computeAlpha(src, seg.backgroundSample);
  const owner = RP.computeOwnership(alpha, seg);
  const colors = [
    [230, 60, 60], [60, 130, 230], [60, 200, 90], [230, 170, 40],
    [170, 70, 220], [70, 210, 210], [240, 110, 180], [140, 160, 60],
    [90, 90, 240], [240, 130, 60], [50, 170, 140], [200, 50, 120],
  ];
  const c = RP.newCanvas();
  const ctx = c.getContext('2d');
  const out = ctx.createImageData(RP.W, RP.H);
  for (let i = 0; i < RP.W * RP.H; i++) {
    const gray = Math.round(
      0.299 * src.data[i * 4] + 0.587 * src.data[i * 4 + 1] + 0.114 * src.data[i * 4 + 2]
    );
    if (alpha[i] === 0 || owner[i] < 0) {
      out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = 245;
    } else {
      const col = colors[owner[i] % colors.length];
      out.data[i * 4] = Math.round(gray * 0.45 + col[0] * 0.55);
      out.data[i * 4 + 1] = Math.round(gray * 0.45 + col[1] * 0.55);
      out.data[i * 4 + 2] = Math.round(gray * 0.45 + col[2] * 0.55);
    }
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  window.__overlay = c;
  window.__legend = seg.drawOrder.map((id, i) => `${id}: rgb(${colors[i % colors.length].join(',')})`);
}, segmentation);

console.log((await page.evaluate(() => window.__legend)).join('\n'));

const full = await page.evaluate(() => window.__overlay.toDataURL('image/png'));
saveDataUrl(full, join(outDir, 'ownership-full.png'));
console.log('saved ownership-full.png');

for (const spec of crops) {
  const [x, y, w, h, scale = 2] = spec.split(',').map(Number);
  const dataUrl = await page.evaluate(
    ({ x, y, w, h, scale }) => {
      const c = document.createElement('canvas');
      c.width = w * scale;
      c.height = h * scale;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.scale(scale, scale);
      ctx.drawImage(window.__overlay, -x, -y);
      return c.toDataURL('image/png');
    },
    { x, y, w, h, scale }
  );
  const name = `ownership-${x}x${y}.png`;
  saveDataUrl(dataUrl, join(outDir, name));
  console.log('saved', name);
}
await browser.close();

/**
 * Sheet measurement probe. Opens the parts contact sheet in Chromium, keys the
 * chroma-green background, labels connected components, and reports each
 * component's bbox / area / centroid plus the tan socket-stub extent inside it.
 *
 *   node tools/sheet-slicer/measure.mjs <sheet.png> [outJson]
 *
 * This is a read-only analysis used to author the slice manifest — it writes
 * nothing into the pack. The numbers it prints seed the pack's slice.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PREINSTALLED = '/opt/pw-browsers/chromium';
const [sheetPath, outJson] = process.argv.slice(2);
if (!sheetPath) {
  console.error('usage: measure.mjs <sheet.png> [outJson]');
  process.exit(1);
}

const browser = await chromium.launch(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {});
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
const b64 = readFileSync(sheetPath).toString('base64');

const result = await page.evaluate(async (data) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + data;
  await img.decode();
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const src = ctx.getImageData(0, 0, W, H).data;

  // Background = median of the four corners (chroma green).
  const corner = (x, y) => [src[4 * (y * W + x)], src[4 * (y * W + x) + 1], src[4 * (y * W + x) + 2]];
  const corners = [corner(2, 2), corner(W - 3, 2), corner(2, H - 3), corner(W - 3, H - 3)];
  const bg = [0, 1, 2].map((k) => Math.round(corners.reduce((s, cc) => s + cc[k], 0) / corners.length));

  // A pixel is "green background" if it is close to bg AND clearly green-dominant.
  const isBg = (i) => {
    const r = src[4 * i];
    const g = src[4 * i + 1];
    const b = src[4 * i + 2];
    const distBg = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
    const greenDom = g - Math.max(r, b);
    return distBg < 90 && greenDom > 25;
  };

  // Flood from borders so the faint interior grid lines (also greenish) inside
  // a piece don't get keyed — only background-connected green is removed.
  const fg = new Uint8Array(W * H); // 1 = foreground (art)
  const bgMask = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) {
    stack.push(x, (H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    stack.push(y * W, y * W + W - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    if (bgMask[i] || !isBg(i)) continue;
    bgMask[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * (H - 1)) stack.push(i + W);
  }
  for (let i = 0; i < W * H; i++) fg[i] = bgMask[i] ? 0 : 1;

  // Connected-component labeling (4-conn) over foreground.
  const label = new Int32Array(W * H).fill(-1);
  const comps = [];
  const isTan = (i) => {
    const r = src[4 * i];
    const g = src[4 * i + 1];
    const b = src[4 * i + 2];
    // Pale pinkish flesh stubs: light, low green-dominance, r>=g>=b-ish.
    return r > 175 && g > 140 && b > 110 && r >= g && g >= b - 10 && r - b < 90 && r - b > 8;
  };
  for (let s = 0; s < W * H; s++) {
    if (fg[s] !== 1 || label[s] !== -1) continue;
    const id = comps.length;
    let minX = W, minY = H, maxX = -1, maxY = -1, area = 0, sumX = 0, sumY = 0, tan = 0;
    let tMinX = W, tMinY = H, tMaxX = -1, tMaxY = -1;
    const q = [s];
    label[s] = id;
    while (q.length) {
      const i = q.pop();
      const x = i % W;
      const y = (i / W) | 0;
      area++;
      sumX += x;
      sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (isTan(i)) {
        tan++;
        if (x < tMinX) tMinX = x;
        if (x > tMaxX) tMaxX = x;
        if (y < tMinY) tMinY = y;
        if (y > tMaxY) tMaxY = y;
      }
      if (x > 0 && fg[i - 1] === 1 && label[i - 1] === -1) { label[i - 1] = id; q.push(i - 1); }
      if (x < W - 1 && fg[i + 1] === 1 && label[i + 1] === -1) { label[i + 1] = id; q.push(i + 1); }
      if (i >= W && fg[i - W] === 1 && label[i - W] === -1) { label[i - W] = id; q.push(i - W); }
      if (i < W * (H - 1) && fg[i + W] === 1 && label[i + W] === -1) { label[i + W] = id; q.push(i + W); }
    }
    comps.push({
      id,
      area,
      bbox: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
      centroid: { x: Math.round(sumX / area), y: Math.round(sumY / area) },
      tanPixels: tan,
      tanBbox: tan > 20 ? { x: tMinX, y: tMinY, width: tMaxX - tMinX + 1, height: tMaxY - tMinY + 1 } : null,
    });
  }
  comps.sort((a, b) => b.area - a.area);
  return { W, H, bg, comps };
}, b64);

await browser.close();

const big = result.comps.filter((c) => c.area > 800);
console.log(`sheet ${result.W}x${result.H}  bg=rgb(${result.bg.join(',')})  components(area>800)=${big.length}`);
for (const c of big) {
  const t = c.tanBbox
    ? ` tan@${c.tanBbox.x},${c.tanBbox.y} ${c.tanBbox.width}x${c.tanBbox.height} (${c.tanPixels}px)`
    : '';
  console.log(
    `  #${String(c.id).padStart(3)} area=${String(c.area).padStart(7)} bbox=${c.bbox.x},${c.bbox.y} ${c.bbox.width}x${c.bbox.height} cen=${c.centroid.x},${c.centroid.y}${t}`
  );
}

if (outJson) {
  writeFileSync(outJson, JSON.stringify(result, null, 2) + '\n');
  console.log(`wrote ${outJson}`);
}

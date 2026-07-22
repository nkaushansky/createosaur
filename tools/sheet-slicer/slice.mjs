/**
 * Parts-first sheet slicer.
 *   node tools/sheet-slicer/slice.mjs <sheet.png> <slice.json> <outDir>
 *
 * Chroma-keys the parts contact sheet, matches each segmented component to a
 * manifest piece, trims socket stubs per the keep|crop table, normalizes each
 * piece (scale + rotation) and places it in the 1536x1024 stage so the
 * assembled creature matches the TRUE approved master. Emits a pack the
 * existing rigAssets loader consumes: manifest.json, layers/, pattern-masks/,
 * value/ (desaturated D-023 variant), debug artifacts, layer-index.csv.
 *
 * Chromium is the raster engine (Playwright), reusing tools/rig-pack/page-lib
 * for the deterministic stage-aligned pattern fields — no native image deps.
 */
import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const PREINSTALLED = '/opt/pw-browsers/chromium';

const [sheetPath, slicePath, outDir] = process.argv.slice(2);
if (!outDir) {
  console.error('usage: slice.mjs <sheet.png> <slice.json> <outDir>');
  process.exit(1);
}
const slice = JSON.parse(readFileSync(slicePath, 'utf8'));
const masterPath = join(REPO, 'apps', 'web', 'public', slice.trueMaster);

for (const dir of ['layers', 'pattern-masks', 'value', 'debug']) {
  mkdirSync(join(outDir, dir), { recursive: true });
}

const browser = await chromium.launch(existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {});
const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.addScriptTag({ path: join(REPO, 'tools', 'rig-pack', 'page-lib.js') });
page.setDefaultTimeout(300_000);

const sheetB64 = readFileSync(sheetPath).toString('base64');
const masterB64 = readFileSync(masterPath).toString('base64');

const result = await page.evaluate(async ({ sheetB64, masterB64, slice }) => {
  const CW = slice.canvas.width;
  const CH = slice.canvas.height;

  // ---- load the sheet at native resolution ------------------------------
  const sheet = new Image();
  sheet.src = 'data:image/png;base64,' + sheetB64;
  await sheet.decode();
  const SW = sheet.naturalWidth;
  const SH = sheet.naturalHeight;
  const sc = document.createElement('canvas');
  sc.width = SW;
  sc.height = SH;
  const sctx = sc.getContext('2d', { willReadFrequently: true });
  sctx.drawImage(sheet, 0, 0);
  const src = sctx.getImageData(0, 0, SW, SH).data;

  // ---- chroma key: flood green from the borders -------------------------
  const bgc = [src[0], src[1], src[2]];
  const greenness = (i) => src[4 * i + 1] - (src[4 * i] + src[4 * i + 2]) / 2;
  const isBg = (i) => {
    const distBg =
      Math.abs(src[4 * i] - bgc[0]) + Math.abs(src[4 * i + 1] - bgc[1]) + Math.abs(src[4 * i + 2] - bgc[2]);
    return distBg < 90 && greenness(i) > 25;
  };
  const bgMask = new Uint8Array(SW * SH);
  const stack = [];
  for (let x = 0; x < SW; x++) stack.push(x, (SH - 1) * SW + x);
  for (let y = 0; y < SH; y++) stack.push(y * SW, y * SW + SW - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bgMask[i] || !isBg(i)) continue;
    bgMask[i] = 1;
    const x = i % SW;
    if (x > 0) stack.push(i - 1);
    if (x < SW - 1) stack.push(i + 1);
    if (i >= SW) stack.push(i - SW);
    if (i < SW * (SH - 1)) stack.push(i + SW);
  }
  // Soft-alpha: 0 on flooded green, a green-fringe-suppressing rim on pixels
  // adjacent to flooded background, 255 on solid art.
  const alpha = new Uint8Array(SW * SH);
  const softRim = (i) => Math.round(255 * Math.max(0, Math.min(1, (100 - greenness(i)) / 60)));
  for (let i = 0; i < SW * SH; i++) {
    if (bgMask[i]) { alpha[i] = 0; continue; }
    const x = i % SW;
    let nearBg = false;
    if (x > 0 && bgMask[i - 1]) nearBg = true;
    if (x < SW - 1 && bgMask[i + 1]) nearBg = true;
    if (i >= SW && bgMask[i - SW]) nearBg = true;
    if (i < SW * (SH - 1) && bgMask[i + SW]) nearBg = true;
    alpha[i] = nearBg ? softRim(i) : 255;
  }

  // ---- connected components over solid art ------------------------------
  const solid = new Uint8Array(SW * SH);
  for (let i = 0; i < SW * SH; i++) if (alpha[i] > 40) solid[i] = 1;
  const label = new Int32Array(SW * SH).fill(-1);
  const comps = [];
  for (let s = 0; s < SW * SH; s++) {
    if (solid[s] !== 1 || label[s] !== -1) continue;
    const id = comps.length;
    let minX = SW, minY = SH, maxX = -1, maxY = -1, area = 0, sumX = 0, sumY = 0;
    const q = [s];
    label[s] = id;
    while (q.length) {
      const i = q.pop();
      const x = i % SW;
      const y = (i / SW) | 0;
      area++; sumX += x; sumY += y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && solid[i - 1] && label[i - 1] === -1) { label[i - 1] = id; q.push(i - 1); }
      if (x < SW - 1 && solid[i + 1] && label[i + 1] === -1) { label[i + 1] = id; q.push(i + 1); }
      if (i >= SW && solid[i - SW] && label[i - SW] === -1) { label[i - SW] = id; q.push(i - SW); }
      if (i < SW * (SH - 1) && solid[i + SW] && label[i + SW] === -1) { label[i + SW] = id; q.push(i + SW); }
    }
    comps.push({ id, area, minX, minY, maxX, maxY, cx: sumX / area, cy: sumY / area });
  }
  const bigComps = comps.filter((c) => c.area > 800);

  // ---- extract one piece's cropped RGBA canvas --------------------------
  function extractPiece(piece) {
    // Match the component whose centroid is nearest the expected point.
    let best = null;
    let bestD = Infinity;
    for (const c of bigComps) {
      const d = (c.cx - piece.expectCentroid.x) ** 2 + (c.cy - piece.expectCentroid.y) ** 2;
      if (d < bestD) { bestD = d; best = c; }
    }
    const crop = piece.crop ?? {};
    // Socket-stub trim in sheet space (before rotation).
    const x0 = best.minX + Math.round((best.maxX - best.minX + 1) * (crop.left ?? 0));
    const x1 = best.maxX - Math.round((best.maxX - best.minX + 1) * (crop.right ?? 0));
    const y0 = best.minY + Math.round((best.maxY - best.minY + 1) * (crop.top ?? 0));
    const y1 = best.maxY - Math.round((best.maxY - best.minY + 1) * (crop.bottom ?? 0));
    const pw = x1 - x0 + 1;
    const ph = y1 - y0 + 1;
    const pc = document.createElement('canvas');
    pc.width = pw;
    pc.height = ph;
    const pctx = pc.getContext('2d', { willReadFrequently: true });
    const pimg = pctx.createImageData(pw, ph);
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        const si = (y0 + y) * SW + (x0 + x);
        // Only pixels belonging to THIS component (drops touching neighbours).
        const a = label[si] === best.id ? alpha[si] : 0;
        const di = (y * pw + x) * 4;
        const r = src[si * 4];
        let g = src[si * 4 + 1];
        const b = src[si * 4 + 2];
        // Green despill: the chroma-key leaves a faint green rim on thin bright
        // features (tooth tips). Clamp green so it never exceeds both other
        // channels — a no-op on brown hide, a fringe-killer on the teeth.
        const mx = Math.max(r, b);
        if (g > mx) g = mx;
        pimg.data[di] = r;
        pimg.data[di + 1] = g;
        pimg.data[di + 2] = b;
        pimg.data[di + 3] = a;
      }
    }
    pctx.putImageData(pimg, 0, 0);
    return { canvas: pc, pw, ph, component: { area: best.area, bbox: [best.minX, best.minY, best.maxX, best.maxY] } };
  }

  // ---- place a piece into a fresh full-canvas layer ---------------------
  function placeLayer(piece) {
    const { canvas: pc, pw, ph, component } = extractPiece(piece);
    const lc = document.createElement('canvas');
    lc.width = CW;
    lc.height = CH;
    const lctx = lc.getContext('2d', { willReadFrequently: true });
    lctx.imageSmoothingEnabled = true;
    lctx.imageSmoothingQuality = 'high';
    const anchorX = piece.anchor.u * pw;
    const anchorY = piece.anchor.v * ph;
    lctx.save();
    lctx.translate(piece.dest.x, piece.dest.y);
    lctx.rotate((piece.rotate * Math.PI) / 180);
    lctx.scale(piece.scale, piece.scale);
    lctx.drawImage(pc, -anchorX, -anchorY);
    lctx.restore();
    const data = lctx.getImageData(0, 0, CW, CH);
    // Tight bounds of placed alpha.
    let minX = CW, minY = CH, maxX = -1, maxY = -1, count = 0;
    for (let i = 0; i < CW * CH; i++) {
      if (data.data[i * 4 + 3] > 8) {
        const x = i % CW;
        const y = (i / CW) | 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        count++;
      }
    }
    const bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    return { canvas: lc, ctx: lctx, data, bounds, count, component };
  }

  // ---- deterministic stage-aligned pattern fields (reused from rig-pack) --
  const fields = window.RigPack.patternFields(slice.patternSeed, slice.groundY);
  const FIELD = { solid: fields.solidAt, mottle: fields.mottleAt, bands: fields.bandsAt };

  // ---- build every layer -------------------------------------------------
  const pieces = [...slice.pieces].sort((a, b) => a.z - b.z);
  const layers = [];
  for (const piece of pieces) {
    const placed = placeLayer(piece);
    const { data } = placed;

    // Layer PNG (color).
    layers.push({ piece, placed });

    // Pattern masks: stage field clipped to layer alpha, fixed details spared.
    const maskDataUrls = {};
    for (const kind of ['solid', 'mottle', 'bands']) {
      const mc = document.createElement('canvas');
      mc.width = CW;
      mc.height = CH;
      const mctx = mc.getContext('2d');
      const mimg = mctx.createImageData(CW, CH);
      for (let i = 0; i < CW * CH; i++) {
        const a = data.data[i * 4 + 3];
        let v = 0;
        if (a > 0) {
          const r = data.data[i * 4];
          const g = data.data[i * 4 + 1];
          const b = data.data[i * 4 + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          // Spare fixed details from the global multiply: bright teeth/claws
          // and the near-black eye keep their read.
          const detail = lum > 212 || lum < 34;
          const x = i % CW;
          const y = (i / CW) | 0;
          if (!detail) v = Math.round(Math.max(0, Math.min(1, FIELD[kind](x, y))) * (a / 255) * 255);
        }
        mimg.data[i * 4] = v;
        mimg.data[i * 4 + 1] = v;
        mimg.data[i * 4 + 2] = v;
        mimg.data[i * 4 + 3] = 255;
      }
      mctx.putImageData(mimg, 0, 0);
      maskDataUrls[kind] = mc.toDataURL('image/png');
    }

    // Value variant: Rec.601 desaturation, alpha preserved (D-023 storage).
    const vc = document.createElement('canvas');
    vc.width = CW;
    vc.height = CH;
    const vctx = vc.getContext('2d');
    const vimg = vctx.createImageData(CW, CH);
    for (let i = 0; i < CW * CH; i++) {
      const a = data.data[i * 4 + 3];
      if (a > 0) {
        const lum = Math.round(
          0.299 * data.data[i * 4] + 0.587 * data.data[i * 4 + 1] + 0.114 * data.data[i * 4 + 2]
        );
        vimg.data[i * 4] = vimg.data[i * 4 + 1] = vimg.data[i * 4 + 2] = lum;
      }
      vimg.data[i * 4 + 3] = a;
    }
    vctx.putImageData(vimg, 0, 0);

    placed.maskDataUrls = maskDataUrls;
    placed.colorDataUrl = placed.canvas.toDataURL('image/png');
    placed.valueDataUrl = vc.toDataURL('image/png');
  }

  // ---- reassembly composites (debug) ------------------------------------
  function composite(getUrl, bg) {
    const c = document.createElement('canvas');
    c.width = CW;
    c.height = CH;
    const ctx = c.getContext('2d');
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH); }
    return { c, ctx };
  }
  const reassembled = composite(null, null);
  const overMaster = composite(null, null);
  // true master underlay for the identity overlay
  const master = new Image();
  master.src = 'data:image/png;base64,' + masterB64;
  await master.decode();
  overMaster.ctx.globalAlpha = 0.55;
  overMaster.ctx.drawImage(master, 0, 0, CW, CH);
  overMaster.ctx.globalAlpha = 1;
  for (const { placed } of layers) {
    const img = new Image();
    img.src = placed.colorDataUrl;
    await img.decode();
    reassembled.ctx.drawImage(img, 0, 0);
    overMaster.ctx.drawImage(img, 0, 0);
  }

  // Hole-detector underlay: solid red silhouette of the assembled creature on
  // black; any seam the rig opens lets the red glow through (pixiRig underlay).
  const holeMap = composite(null, '#000000');
  {
    const rd = reassembled.ctx.getImageData(0, 0, CW, CH);
    const hd = holeMap.ctx.getImageData(0, 0, CW, CH);
    for (let i = 0; i < CW * CH; i++) {
      if (rd.data[i * 4 + 3] > 24) {
        hd.data[i * 4] = 220;
        hd.data[i * 4 + 1] = 40;
        hd.data[i * 4 + 2] = 48;
      }
      hd.data[i * 4 + 3] = 255;
    }
    holeMap.ctx.putImageData(hd, 0, 0);
  }

  return {
    SW,
    SH,
    bg: bgc,
    canvas: { width: CW, height: CH },
    layers: layers.map(({ piece, placed }) => ({
      id: piece.id,
      z: piece.z,
      mesh: !!piece.mesh,
      bounds: placed.bounds,
      count: placed.count,
      component: placed.component,
      colorDataUrl: placed.colorDataUrl,
      valueDataUrl: placed.valueDataUrl,
      maskDataUrls: placed.maskDataUrls,
    })),
    reassembledDataUrl: reassembled.c.toDataURL('image/png'),
    overMasterDataUrl: overMaster.c.toDataURL('image/jpeg', 0.9),
    holeMapDataUrl: holeMap.c.toDataURL('image/png'),
  };
}, { sheetB64, masterB64, slice });

await browser.close();

// ---- write the pack ---------------------------------------------------------
function save(dataUrl, filePath) {
  writeFileSync(filePath, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

const ordered = [...result.layers].sort((a, b) => a.z - b.z);
const manifestLayers = ordered.map((layer, i) => {
  const file = `layers/${String(i).padStart(2, '0')}-${layer.id}.png`;
  save(layer.colorDataUrl, join(outDir, file));
  save(layer.valueDataUrl, join(outDir, `value/${String(i).padStart(2, '0')}-${layer.id}.png`));
  for (const kind of ['solid', 'mottle', 'bands']) {
    mkdirSync(join(outDir, 'pattern-masks', layer.id), { recursive: true });
    save(layer.maskDataUrls[kind], join(outDir, 'pattern-masks', layer.id, `${kind}.png`));
  }
  return {
    id: layer.id,
    z: i,
    mesh: layer.mesh,
    source: file,
    fullCanvasOrigin: [0, 0],
    bounds: layer.bounds,
    visibleBounds: layer.bounds,
    visiblePixelCount: layer.count,
    overlapPixelCount: 0,
    patternMasks: {
      solid: `pattern-masks/${layer.id}/solid.png`,
      mottle: `pattern-masks/${layer.id}/mottle.png`,
      bands: `pattern-masks/${layer.id}/bands.png`,
    },
  };
});

// Master + debug + hole map the runtime loader / debug toggles expect.
save(result.reassembledDataUrl, join(outDir, 'debug', 'reassembled-transparent.png'));
save(result.overMasterDataUrl, join(outDir, 'debug', 'identity-over-master.jpg'));
save(result.holeMapDataUrl, join(outDir, 'debug', 'hidden-overlap-map.png'));
// The pack's master underlay is the TRUE approved master (identity truth).
save(`data:image/png;base64,${masterB64}`, join(outDir, 'trex-pf-master.png'));

const manifest = {
  rigId: slice.rigId,
  status: 'parts-first assembly pack',
  kind: slice.kind,
  source: slice.source,
  sourcePolicy: slice.sourcePolicy,
  canvas: slice.canvas,
  backgroundSample: result.bg,
  drawOrder: manifestLayers.map((l) => l.id),
  layers: manifestLayers,
  patterns: {
    seed: slice.patternSeed,
    types: ['solid', 'mottle', 'bands'],
    coordinatePolicy:
      'Shared stage-aligned procedural fields (tools/rig-pack page-lib), exported per layer so each mask moves with its part.',
  },
  verification: {
    note: 'Parts-first packs QA against the TRUE approved master by silhouette/identity tolerance, not byte reassembly (D-021).',
  },
  limitations: [
    'Assembled from the round-4 parts sheet; the master is the identity truth, not the pixel source.',
    'Painted first rig; value/ carries the desaturated variant for the D-023 runtime-paint work.',
    'Closed-core architecture: parts draw OVER the core; no hidden-overlap backing is cut.',
  ],
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const csv = [
  'z,layer_id,mesh,source,visible_pixels,bounds_x,bounds_y,bounds_width,bounds_height',
  ...manifestLayers.map(
    (l) =>
      `${l.z},${l.id},${l.mesh},${l.source},${l.visiblePixelCount},${l.bounds.x},${l.bounds.y},${l.bounds.width},${l.bounds.height}`
  ),
].join('\n');
writeFileSync(join(outDir, 'layer-index.csv'), csv + '\n');

console.log(`sheet ${result.SW}x${result.SH} bg=rgb(${result.bg.join(',')})`);
for (const l of manifestLayers) {
  console.log(
    `  z${l.z} ${l.id.padEnd(10)} bounds=${l.bounds.x},${l.bounds.y} ${l.bounds.width}x${l.bounds.height} px=${l.visiblePixelCount}`
  );
}
console.log(`wrote pack -> ${outDir}`);

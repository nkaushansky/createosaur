/**
 * Pack generator: master + segmentation → complete species pack.
 *   node tools/rig-pack/cut.mjs <master.png> <segmentation.json> <outDir> <packName>
 *
 * Produces layers (exact-source visible pixels + crease-following hidden
 * overlap), per-layer pattern masks from shared seeded stage fields, the
 * manifest/csv, debug artifacts, and a zero-error reassembly verification.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSegmentation, openMaster, saveDataUrl } from './driver.mjs';

const [masterPath, segPath, outDir, packName] = process.argv.slice(2);
if (!packName) {
  console.error('usage: cut.mjs <master.png> <segmentation.json> <outDir> <packName>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
for (const dir of ['layers', 'pattern-masks', 'debug']) mkdirSync(join(outDir, dir), { recursive: true });

const segmentation = loadSegmentation(segPath);
const { browser, page } = await openMaster(masterPath);
page.setDefaultTimeout(300_000);

const result = await page.evaluate(async (seg) => {
  const RP = window.RigPack;
  const { W, H } = RP;
  const src = window.__masterData;
  const alpha = RP.computeAlpha(src, seg.backgroundSample);
  const owner = RP.computeOwnership(alpha, seg);
  const ids = seg.drawOrder;

  // Interior distance: how far a pixel sits from any transparency — overlap
  // must stay ≥2 px inside so reassembled alpha is untouched at the rim.
  const notInterior = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (alpha[i] < 255) notInterior[i] = 1;
  const interiorDist = RP.bfsDistance(notInterior);

  const layers = [];
  const overlapUnion = new Uint8Array(W * H);

  for (let li = 0; li < ids.length; li++) {
    const id = ids[li];
    const visible = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) if (owner[i] === li) visible[i] = 1;
    const ownDist = RP.bfsDistance(visible);
    const radius = seg.overlapRadius[id] ?? seg.overlapRadius.default;
    // Optional no-grow zones: concealed extension must never copy structured
    // features (tooth rows) that would ghost when the covering layer departs.
    let exclude = null;
    const excludePolys = seg.overlapExclude?.[id];
    if (excludePolys) {
      exclude = new Uint8Array(W * H);
      for (const poly of excludePolys) {
        let ex0 = W, ex1 = 0, ey0 = H, ey1 = 0;
        for (const [px, py] of poly) {
          ex0 = Math.min(ex0, Math.floor(px)); ex1 = Math.max(ex1, Math.ceil(px));
          ey0 = Math.min(ey0, Math.floor(py)); ey1 = Math.max(ey1, Math.ceil(py));
        }
        for (let y = Math.max(0, ey0); y <= Math.min(H - 1, ey1); y++) {
          for (let x = Math.max(0, ex0); x <= Math.min(W - 1, ex1); x++) {
            if (RP.pointInPolygon(x + 0.5, y + 0.5, poly)) exclude[y * W + x] = 1;
          }
        }
      }
    }
    // Coverer-aware no-grow: a moving layer's rim under a STATIC layer slides
    // out and dangles when the mover swings, while its rim under a co-moving
    // layer (the knee) is what keeps joints closed — so exclusion is by the
    // identity of the covering layer, not by canvas region.
    let excludeOwners = null;
    const underIds = seg.overlapExcludeUnder?.[id];
    if (underIds) excludeOwners = new Set(underIds.map((uid) => ids.indexOf(uid)));
    const overlap = RP.computeOverlap(owner, alpha, li, radius, interiorDist, ownDist, exclude, excludeOwners);

    // Build the layer image: visible pixels carry the master's soft alpha,
    // overlap pixels are fully opaque copies of the neighbours above.
    const c = RP.newCanvas();
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(W, H);
    let visCount = 0;
    let ovCount = 0;
    let minX = W, minY = H, maxX = -1, maxY = -1;
    let vMinX = W, vMinY = H, vMaxX = -1, vMaxY = -1;
    for (let i = 0; i < W * H; i++) {
      const isVis = visible[i] === 1;
      const isOv = overlap[i] === 1;
      if (!isVis && !isOv) continue;
      const x = i % W;
      const y = (i / W) | 0;
      img.data[i * 4] = src.data[i * 4];
      img.data[i * 4 + 1] = src.data[i * 4 + 1];
      img.data[i * 4 + 2] = src.data[i * 4 + 2];
      img.data[i * 4 + 3] = isVis ? alpha[i] : 255;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (isVis) {
        visCount++;
        if (x < vMinX) vMinX = x;
        if (x > vMaxX) vMaxX = x;
        if (y < vMinY) vMinY = y;
        if (y > vMaxY) vMaxY = y;
      } else {
        ovCount++;
        overlapUnion[i] = 1;
      }
    }
    ctx.putImageData(img, 0, 0);
    layers.push({
      id,
      z: li,
      dataUrl: c.toDataURL('image/png'),
      bounds: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
      visibleBounds: { x: vMinX, y: vMinY, width: vMaxX - vMinX + 1, height: vMaxY - vMinY + 1 },
      visiblePixelCount: visCount,
      overlapPixelCount: ovCount,
    });
  }

  // --- reassembly verification (composite in draw order, compare) ---------
  // Premultiplied source-over composite, then unpremultiply for comparison.
  const comp = new Float32Array(W * H * 4);
  for (const layer of layers) {
    const img = new Image();
    img.src = layer.dataUrl;
    await img.decode();
    const d = RP.imageToData(img).data;
    for (let i = 0; i < W * H; i++) {
      const a = d[i * 4 + 3] / 255;
      if (a === 0) continue;
      const inv = 1 - a;
      comp[i * 4] = d[i * 4] * a + comp[i * 4] * inv;
      comp[i * 4 + 1] = d[i * 4 + 1] * a + comp[i * 4 + 1] * inv;
      comp[i * 4 + 2] = d[i * 4 + 2] * a + comp[i * 4 + 2] * inv;
      comp[i * 4 + 3] = a + comp[i * 4 + 3] * inv;
    }
  }
  for (let i = 0; i < W * H; i++) {
    const a = comp[i * 4 + 3];
    if (a > 0) {
      comp[i * 4] /= a;
      comp[i * 4 + 1] /= a;
      comp[i * 4 + 2] /= a;
    }
    comp[i * 4 + 3] = a * 255;
  }
  let maxRgbErr = 0;
  let sumRgbErr = 0;
  let visTotal = 0;
  let maxAlphaErr = 0;
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] === 0) {
      maxAlphaErr = Math.max(maxAlphaErr, Math.round(comp[i * 4 + 3]));
      continue;
    }
    const aErr = Math.abs(Math.round(comp[i * 4 + 3]) - alpha[i]);
    maxAlphaErr = Math.max(maxAlphaErr, aErr);
    if (alpha[i] === 255) {
      visTotal++;
      const e = Math.max(
        Math.abs(Math.round(comp[i * 4]) - src.data[i * 4]),
        Math.abs(Math.round(comp[i * 4 + 1]) - src.data[i * 4 + 1]),
        Math.abs(Math.round(comp[i * 4 + 2]) - src.data[i * 4 + 2])
      );
      maxRgbErr = Math.max(maxRgbErr, e);
      sumRgbErr += e;
    }
  }

  // --- clean master (transparent) -----------------------------------------
  const cleanCanvas = RP.newCanvas();
  const cleanCtx = cleanCanvas.getContext('2d');
  const cleanImg = cleanCtx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    if (alpha[i] === 0) continue;
    cleanImg.data[i * 4] = src.data[i * 4];
    cleanImg.data[i * 4 + 1] = src.data[i * 4 + 1];
    cleanImg.data[i * 4 + 2] = src.data[i * 4 + 2];
    cleanImg.data[i * 4 + 3] = alpha[i];
  }
  cleanCtx.putImageData(cleanImg, 0, 0);

  // --- pattern masks -------------------------------------------------------
  const fields = RP.patternFields(seg.patternSeed, seg.groundY);
  const inDetail = new Uint8Array(W * H);
  for (const poly of seg.fixedDetails ?? []) {
    let px0 = W, py0 = H, px1 = 0, py1 = 0;
    for (const [px, py] of poly) {
      px0 = Math.min(px0, px); py0 = Math.min(py0, py);
      px1 = Math.max(px1, px); py1 = Math.max(py1, py);
    }
    for (let y = Math.max(0, py0 | 0); y <= Math.min(H - 1, py1 | 0); y++) {
      for (let x = Math.max(0, px0 | 0); x <= Math.min(W - 1, px1 | 0); x++) {
        if (RP.pointInPolygon(x + 0.5, y + 0.5, poly)) inDetail[y * W + x] = 1;
      }
    }
  }
  const masks = [];
  for (const layer of layers) {
    const img = new Image();
    img.src = layer.dataUrl;
    await img.decode();
    const layerAlpha = RP.imageToData(img).data;
    for (const kind of ['solid', 'mottle', 'bands']) {
      const at = kind === 'solid' ? fields.solidAt : kind === 'mottle' ? fields.mottleAt : fields.bandsAt;
      const mc = RP.newCanvas();
      const mctx = mc.getContext('2d');
      const mimg = mctx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) {
        let v = 0;
        if (layerAlpha[i * 4 + 3] > 0 && !inDetail[i]) {
          const x = i % W;
          const y = (i / W) | 0;
          v = Math.round(Math.max(0, Math.min(1, at(x, y))) * (layerAlpha[i * 4 + 3] / 255) * 255);
        }
        mimg.data[i * 4] = v;
        mimg.data[i * 4 + 1] = v;
        mimg.data[i * 4 + 2] = v;
        mimg.data[i * 4 + 3] = 255;
      }
      mctx.putImageData(mimg, 0, 0);
      masks.push({ layerId: layer.id, kind, dataUrl: mc.toDataURL('image/png') });
    }
  }

  // --- debug artifacts -----------------------------------------------------
  const colors = [
    [230, 60, 60], [60, 130, 230], [60, 200, 90], [230, 170, 40],
    [170, 70, 220], [70, 210, 210], [240, 110, 180], [140, 160, 60],
    [90, 90, 240], [240, 130, 60], [50, 170, 140], [200, 50, 120],
  ];
  const ownershipCanvas = RP.newCanvas();
  {
    const ctx = ownershipCanvas.getContext('2d');
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      if (alpha[i] === 0) {
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 246;
      } else {
        const col = colors[owner[i] % colors.length];
        const gray = 0.3 * src.data[i * 4] + 0.59 * src.data[i * 4 + 1] + 0.11 * src.data[i * 4 + 2];
        img.data[i * 4] = Math.round(gray * 0.45 + col[0] * 0.55);
        img.data[i * 4 + 1] = Math.round(gray * 0.45 + col[1] * 0.55);
        img.data[i * 4 + 2] = Math.round(gray * 0.45 + col[2] * 0.55);
      }
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  const overlapCanvas = RP.newCanvas();
  {
    const ctx = overlapCanvas.getContext('2d');
    ctx.drawImage(window.__master, 0, 0);
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < W * H; i++) {
      if (overlapUnion[i]) {
        img.data[i * 4] = Math.round(img.data[i * 4] * 0.35 + 235 * 0.65);
        img.data[i * 4 + 1] = Math.round(img.data[i * 4 + 1] * 0.35 + 40 * 0.65);
        img.data[i * 4 + 2] = Math.round(img.data[i * 4 + 2] * 0.35 + 45 * 0.65);
      } else if (alpha[i] === 0) {
        img.data[i * 4 + 3] = 0;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  // Contact sheets: 4×3 grids at 1/3 scale.
  function contactSheet(items, drawItem, label) {
    const cols = 4;
    const rows = Math.ceil(items.length / cols);
    const cw = Math.round(W / 3);
    const ch = Math.round(H / 3);
    const c = document.createElement('canvas');
    c.width = cols * cw;
    c.height = rows * (ch + 18);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, c.width, c.height);
    items.forEach((item, i) => {
      const gx = (i % cols) * cw;
      const gy = ((i / cols) | 0) * (ch + 18);
      drawItem(ctx, item, gx, gy + 18, cw, ch);
      ctx.fillStyle = '#333';
      ctx.font = '12px monospace';
      ctx.fillText(label(item), gx + 4, gy + 13);
    });
    return c;
  }
  const layerImages = [];
  for (const layer of layers) {
    const img = new Image();
    img.src = layer.dataUrl;
    await img.decode();
    layerImages.push({ id: layer.id, img });
  }
  const layerSheet = contactSheet(
    layerImages,
    (ctx, item, x, y, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, w, h);
      ctx.drawImage(item.img, x, y, w, h);
      ctx.strokeStyle = '#bbb';
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },
    (item) => item.id
  );
  const maskImages = [];
  for (const m of masks.filter((m) => m.kind === 'mottle' || m.kind === 'bands' || m.kind === 'solid')) {
    const img = new Image();
    img.src = m.dataUrl;
    await img.decode();
    maskImages.push({ id: `${m.layerId}/${m.kind}`, img });
  }
  const maskSheet = contactSheet(
    maskImages,
    (ctx, item, x, y, w, h) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, w, h);
      ctx.drawImage(item.img, x, y, w, h);
    },
    (item) => item.id
  );
  // Preview jpg (master on paper).
  const previewCanvas = RP.newCanvas();
  {
    const ctx = previewCanvas.getContext('2d');
    ctx.fillStyle = `rgb(${seg.backgroundSample.join(',')})`;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(window.__master, 0, 0);
  }

  return {
    layers: layers.map(({ dataUrl, ...meta }) => meta),
    layerDataUrls: layers.map((l) => l.dataUrl),
    masks,
    verification: {
      maxVisibleRgbError: maxRgbErr,
      meanVisibleRgbError: visTotal ? sumRgbErr / visTotal : 0,
      maxAlphaError: maxAlphaErr,
      visiblePixelsChecked: visTotal,
    },
    cleanDataUrl: cleanCanvas.toDataURL('image/png'),
    ownershipDataUrl: ownershipCanvas.toDataURL('image/png'),
    overlapDataUrl: overlapCanvas.toDataURL('image/png'),
    layerSheetDataUrl: layerSheet.toDataURL('image/jpeg', 0.85),
    maskSheetDataUrl: maskSheet.toDataURL('image/jpeg', 0.85),
    previewDataUrl: previewCanvas.toDataURL('image/jpeg', 0.9),
  };
}, segmentation);

// --- write files ------------------------------------------------------------
const species = packName.split('-')[0];
segmentation.drawOrder.forEach((id, i) => {
  const file = `layers/${String(i).padStart(2, '0')}-${id}.png`;
  saveDataUrl(result.layerDataUrls[i], join(outDir, file));
});
for (const m of result.masks) {
  mkdirSync(join(outDir, 'pattern-masks', m.layerId), { recursive: true });
  saveDataUrl(m.dataUrl, join(outDir, 'pattern-masks', m.layerId, `${m.kind}.png`));
}
saveDataUrl(result.cleanDataUrl, join(outDir, `${species}-master-clean.png`));
saveDataUrl(result.previewDataUrl, join(outDir, `${species}-master-neutral-preview.jpg`));
saveDataUrl(result.cleanDataUrl, join(outDir, 'debug', 'reassembled-transparent.png'));
saveDataUrl(result.ownershipDataUrl, join(outDir, 'debug', 'visible-layer-ownership.png'));
saveDataUrl(result.overlapDataUrl, join(outDir, 'debug', 'hidden-overlap-map.png'));
saveDataUrl(result.layerSheetDataUrl, join(outDir, 'debug', 'layer-contact-sheet.jpg'));
saveDataUrl(result.maskSheetDataUrl, join(outDir, 'debug', 'pattern-mask-contact-sheet.jpg'));

const manifest = {
  rigId: segmentation.rigId,
  status: 'prototype extraction pack',
  source: segmentation.source,
  sourcePolicy: 'All visible pixels are copied from the approved full-body composite.',
  canvas: { width: 1536, height: 1024 },
  backgroundSample: segmentation.backgroundSample,
  drawOrder: segmentation.drawOrder,
  layers: result.layers.map((meta, i) => ({
    id: meta.id,
    z: meta.z,
    source: `layers/${String(i).padStart(2, '0')}-${meta.id}.png`,
    fullCanvasOrigin: [0, 0],
    bounds: meta.bounds,
    visibleBounds: meta.visibleBounds,
    visiblePixelCount: meta.visiblePixelCount,
    overlapPixelCount: meta.overlapPixelCount,
    patternMasks: {
      solid: `pattern-masks/${meta.id}/solid.png`,
      mottle: `pattern-masks/${meta.id}/mottle.png`,
      bands: `pattern-masks/${meta.id}/bands.png`,
    },
  })),
  patterns: {
    seed: segmentation.patternSeed,
    types: ['solid', 'mottle', 'bands'],
    coordinatePolicy:
      'Shared stage-aligned fields at the reference pose, exported separately per layer so each mask moves with its anatomical layer.',
  },
  verification: {
    maxVisibleRgbError: result.verification.maxVisibleRgbError,
    meanVisibleRgbError: Number(result.verification.meanVisibleRgbError.toFixed(6)),
    maxAlphaError: result.verification.maxAlphaError,
  },
  limitations: [
    'The source composite is 1536x1024, not a hand-authored production master.',
    'Concealed overlap is copied from neighboring approved composite pixels with crease-following cut edges.',
    'No trait pack is included.',
    'No new anatomy or generative repainting is present in this pack.',
  ],
};
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const csv = [
  'z,layer_id,source,visible_pixels,hidden_overlap_pixels,bounds_x,bounds_y,bounds_width,bounds_height',
  ...manifest.layers.map(
    (l) =>
      `${l.z},${l.id},${l.source},${l.visiblePixelCount},${l.overlapPixelCount},${l.bounds.x},${l.bounds.y},${l.bounds.width},${l.bounds.height}`
  ),
].join('\n');
writeFileSync(join(outDir, 'layer-index.csv'), csv + '\n');

console.log('verification:', JSON.stringify(result.verification));
console.log('layers:', manifest.layers.map((l) => `${l.id}(v${l.visiblePixelCount}/o${l.overlapPixelCount})`).join(' '));
await browser.close();

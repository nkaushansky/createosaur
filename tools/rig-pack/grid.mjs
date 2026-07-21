/**
 * Coordinate-reference crops for segmentation authoring:
 *   node tools/rig-pack/grid.mjs <master.png> <outDir> x,y,w,h[,scale] ...
 * Each crop gets a 32 px grid with stage-coordinate labels.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { openMaster, saveDataUrl } from './driver.mjs';

const [masterPath, outDir, ...regions] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const { browser, page } = await openMaster(masterPath);

for (const spec of regions) {
  const [x, y, w, h, scale = 2] = spec.split(',').map(Number);
  const dataUrl = await page.evaluate(
    ({ x, y, w, h, scale }) => {
      const c = document.createElement('canvas');
      c.width = w * scale;
      c.height = h * scale;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.save();
      ctx.scale(scale, scale);
      ctx.drawImage(window.__master, -x, -y);
      ctx.restore();
      ctx.strokeStyle = 'rgba(200,40,160,0.5)';
      ctx.fillStyle = 'rgba(160,20,120,1)';
      ctx.font = '11px monospace';
      const startX = Math.ceil(x / 32) * 32;
      const startY = Math.ceil(y / 32) * 32;
      for (let gx = startX; gx <= x + w; gx += 32) {
        const px = (gx - x) * scale;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, c.height);
        ctx.lineWidth = gx % 128 === 0 ? 1.5 : 0.5;
        ctx.stroke();
        if (gx % 128 === 0) ctx.fillText(String(gx), px + 2, 12);
      }
      for (let gy = startY; gy <= y + h; gy += 32) {
        const py = (gy - y) * scale;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(c.width, py);
        ctx.lineWidth = gy % 128 === 0 ? 1.5 : 0.5;
        ctx.stroke();
        if (gy % 128 === 0) ctx.fillText(String(gy), 2, py + 12);
      }
      return c.toDataURL('image/png');
    },
    { x, y, w, h, scale }
  );
  const name = `grid-${x}x${y}-${w}x${h}.png`;
  saveDataUrl(dataUrl, join(outDir, name));
  console.log('saved', name);
}
await browser.close();

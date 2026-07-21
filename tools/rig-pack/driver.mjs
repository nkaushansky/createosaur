/**
 * Shared node-side driver: Chromium page with the master image and page-lib
 * loaded. Playwright's bundled-or-preinstalled Chromium is the raster engine
 * so the pipeline needs no native image dependencies.
 */
import { Buffer } from 'node:buffer';
import { chromium } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PREINSTALLED = '/opt/pw-browsers/chromium';

export async function openMaster(masterPath) {
  const browser = await chromium.launch(
    existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {}
  );
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.addScriptTag({ path: join(HERE, 'page-lib.js') });
  const b64 = readFileSync(masterPath).toString('base64');
  await page.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    window.__master = img;
    window.__masterData = window.RigPack.imageToData(img);
  }, b64);
  return { browser, page };
}

export function saveDataUrl(dataUrl, filePath) {
  writeFileSync(filePath, Buffer.from(dataUrl.split(',')[1], 'base64'));
}

export function loadSegmentation(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

import { expect, test, type Page } from '@playwright/test';

/**
 * IR0 smoke suite for the parallel /rig-lab experiment. Assertions read the
 * rig's serialized frame state (transforms + mesh vertices) through the
 * deterministic test hook rather than comparing pixels, matching this repo's
 * DOM-not-pixels e2e convention — with one exception: the frozen-clock
 * extract must be byte-stable within a session, which is the whole point of
 * the ?t= screenshot mode.
 */

declare global {
  interface Window {
    __rigLab?: {
      ready: boolean;
      frameState: () => string;
      effectiveMotion: () => Record<string, number>;
      currentTimeMs: () => number;
      extractPng: () => Promise<string>;
      metrics: () => { assetBytes: number; avgFrameMs: number; frameSamples: number };
      setLayerVisible: (id: string, visible: boolean) => void;
      firstRigMs: number;
    };
  }
}

/** Set a React-controlled range input and fire its change handler. */
async function setRange(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, String(v));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function openRigLab(page: Page, url = '/rig-lab'): Promise<string[]> {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(url);
  await expect(page.getByTestId('rig-stage')).toHaveAttribute('data-rig-state', 'ready', {
    timeout: 30_000,
  });
  return pageErrors;
}

const frameState = (page: Page) => page.evaluate(() => window.__rigLab!.frameState());

test('rig-lab loads the illustrated rig with every asset resolving', async ({ page }) => {
  const failedAssets: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/rigs/') && response.status() >= 400) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  const pageErrors = await openRigLab(page);

  await expect(page.locator('canvas[role="img"]')).toBeVisible();
  expect(failedAssets).toEqual([]);
  expect(pageErrors).toEqual([]);
  // The route must stay invisible to crawlers and production nav.
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('a motion control changes the evaluated pose', async ({ page }) => {
  await openRigLab(page, '/rig-lab?t=0');
  await page.getByTestId('rig-preset-neutral').click(); // static sliders, idle off
  const before = await frameState(page);

  await setRange(page, '#rig-head', 6);

  await expect
    .poll(async () => {
      const after = await frameState(page);
      return after !== before;
    })
    .toBe(true);
  // The head assembly specifically must have moved.
  const after = JSON.parse(await frameState(page)) as { layers: Record<string, number[]> };
  const beforeParsed = JSON.parse(before) as { layers: Record<string, number[]> };
  expect(after.layers['head-upper']).not.toEqual(beforeParsed.layers['head-upper']);
});

test('the frozen clock renders an identical pose across reloads and extracts', async ({ page }) => {
  await openRigLab(page, '/rig-lab?t=2500');
  const firstState = await frameState(page);
  const firstPng = await page.evaluate(() => window.__rigLab!.extractPng());
  const secondPng = await page.evaluate(() => window.__rigLab!.extractPng());
  expect(secondPng).toBe(firstPng); // same session, same clock → byte-identical

  await page.reload();
  await expect(page.getByTestId('rig-stage')).toHaveAttribute('data-rig-state', 'ready', {
    timeout: 30_000,
  });
  expect(await frameState(page)).toBe(firstState); // deterministic across loads
});

test('pattern types swap without errors or rig reloads, and never move the pose', async ({
  page,
}) => {
  const rigRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/rigs/')) rigRequests.push(request.url());
  });
  const pageErrors = await openRigLab(page, '/rig-lab?t=1234');
  const requestsAfterLoad = rigRequests.length;
  const poseBefore = (JSON.parse(await frameState(page)) as { layers: unknown }).layers;

  for (const pattern of ['solid', 'mottle', 'bands', 'none', 'mottle']) {
    await page.selectOption('#rig-pattern-type', pattern);
    await expect(page.getByTestId('rig-stage')).toHaveAttribute('data-rig-state', 'ready');
  }
  await setRange(page, '#rig-pattern-intensity', 0.9);

  const poseAfter = (JSON.parse(await frameState(page)) as { layers: unknown }).layers;
  expect(poseAfter).toEqual(poseBefore); // patterns tint, they don't pose
  expect(rigRequests.length, 'pattern switches must not refetch assets').toBe(requestsAfterLoad);
  expect(pageErrors).toEqual([]);
});

test('reduced motion freezes the pose where it was', async ({ page }) => {
  await openRigLab(page); // live clock, auto-idle on
  const a = await frameState(page);
  await expect
    .poll(async () => (await frameState(page)) !== a, { timeout: 5_000 })
    .toBe(true); // idle loop is actually animating

  await page.locator('#rig-reduced-motion').check();
  const frozenA = await frameState(page);
  await page.waitForTimeout(400);
  const frozenB = await frameState(page);
  expect(frozenB).toBe(frozenA);
});

test('screenshot artifacts for the visual verify loop', async ({ page }, testInfo) => {
  await openRigLab(page, '/rig-lab?t=2500');
  await page.screenshot({ path: testInfo.outputPath('rig-lab-frozen.png'), fullPage: true });

  await page.getByTestId('rig-preset-stress').click();
  await page.selectOption('#rig-pattern-type', 'mottle');
  await page.waitForTimeout(150);
  await page.screenshot({ path: testInfo.outputPath('rig-lab-stress-mottle.png'), fullPage: true });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: testInfo.outputPath('rig-lab-dark.png'), fullPage: true });
});

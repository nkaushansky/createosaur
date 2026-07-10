import { expect, test, type Page } from '@playwright/test';

/**
 * M0 smoke suite (ROADMAP DoD): load → morph → pin → name → undo, plus
 * screenshot artifacts for the visual verify loop. Assertions are DOM-based
 * (not pixel-based) so CI stays stable across font-rendering environments;
 * screenshots are uploaded as artifacts for humans and agents to inspect.
 */

/** Set a React-controlled range input and fire its change handler. */
async function setRange(page: Page, selector: string, value: number): Promise<void> {
  await page.locator(selector).evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, String(v));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

const stageSvg = (page: Page) => page.locator('[data-testid="creature-stage"] svg');

test('landing page reaches the lab', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /enter the lab/i }).click();
  await expect(stageSvg(page)).toBeVisible();
});

test('lab loads with a pure T-Rex', async ({ page }) => {
  await page.goto('/lab');
  await expect(stageSvg(page)).toBeVisible();
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannosaurus Rex');
  await expect(page.getByTestId('pct-tyrannosaurus')).toHaveText('100%');
});

test('sliding DNA morphs the creature and renames it', async ({ page }) => {
  await page.goto('/lab');
  const before = await stageSvg(page).innerHTML();

  await setRange(page, '#dna-triceratops', 80);

  const after = await stageSvg(page).innerHTML();
  expect(after).not.toBe(before);
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');
  // horns cross the expression ramp at ~44% triceratops
  expect(after).toContain('#e6dcc0'); // bone-colored features present
});

test('pinning a head is ownership: full Trike head at 0% Trike DNA', async ({ page }) => {
  await page.goto('/lab');
  const before = await stageSvg(page).innerHTML();
  expect(before).not.toContain('rotate(-24'); // no frill on a pure rex

  await page.getByTestId('part-head-triceratops').click();

  const after = await stageSvg(page).innerHTML();
  expect(after).toContain('rotate(-24'); // frill marker
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');
  await expect(page.getByTestId('pct-triceratops')).toHaveText('0%');
});

test('undo and redo walk genome history', async ({ page }) => {
  await page.goto('/lab');
  await page.getByTestId('part-head-triceratops').click();
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');

  await page.getByRole('button', { name: /undo/i }).click();
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannosaurus Rex');

  await page.getByRole('button', { name: /redo/i }).click();
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');
});

test('keyboard undo/redo, including Shift-modified redo', async ({ page }) => {
  await page.goto('/lab');
  await page.getByTestId('part-head-triceratops').click();
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');

  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannosaurus Rex');

  // e.key reports 'Z' with Shift held — this gesture was a silent no-op once
  await page.keyboard.press('Control+Shift+z');
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');
});

test('a keyboard slider adjustment is one undoable step', async ({ page }) => {
  await page.goto('/lab');
  const slider = page.locator('#dna-triceratops');
  await slider.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('pct-triceratops')).not.toHaveText('0%');

  await page.keyboard.press('Control+z');
  await expect(page.getByTestId('pct-triceratops')).toHaveText('0%');
});

test('randomize and sibling reroll change the creature', async ({ page }) => {
  await page.goto('/lab');
  const before = await stageSvg(page).innerHTML();

  await page.getByRole('button', { name: /surprise me/i }).click();
  const randomized = await stageSvg(page).innerHTML();
  expect(randomized).not.toBe(before);

  // sibling: same DNA (name stays), new individual (drawing changes)
  const name = await page.getByTestId('creature-name').textContent();
  await page.getByRole('button', { name: /sibling/i }).click();
  expect(await stageSvg(page).innerHTML()).not.toBe(randomized);
  await expect(page.getByTestId('creature-name')).toHaveText(name!);
});

test('age stages transform the creature', async ({ page }) => {
  await page.goto('/lab');
  const adult = await stageSvg(page).innerHTML();
  await page.getByRole('button', { name: 'Hatchling' }).click();
  const hatchling = await stageSvg(page).innerHTML();
  expect(hatchling).not.toBe(adult);
});

test('species browser adds a species to the pool and into the parts bin', async ({ page }) => {
  await page.goto('/lab');
  await expect(page.getByTestId('part-back-spinosaurus')).toHaveCount(0); // not in bin yet

  await page.getByTestId('open-browser').click();
  await page.getByRole('button', { name: 'Piscivore' }).click(); // narrows to Spinosaurus
  await page.getByRole('button', { name: /add to pool/i }).first().click();
  await page.getByRole('button', { name: /close browser/i }).click();

  // Spinosaurus now has a DNA slider and a back-part vignette in the bin
  await expect(page.locator('#dna-spinosaurus')).toBeVisible();
  await expect(page.getByTestId('part-back-spinosaurus')).toBeVisible();
});

test('a pinned part survives DNA slider changes (ownership > influence)', async ({ page }) => {
  await page.goto('/lab');
  await page.getByTestId('part-head-triceratops').click();
  await expect(page.getByTestId('creature-name')).toHaveText('Tyrannoceratops');

  // sliding DNA must not drop the pin — it is ownership, not influence
  await setRange(page, '#dna-stegosaurus', 70);
  await expect(page.getByTestId('part-head-triceratops')).toHaveAttribute('aria-pressed', 'true');
});

test('removing a pooled species clears its pins and offers an undo toast', async ({ page }) => {
  await page.goto('/lab');
  await page.getByTestId('part-tail-stegosaurus').click(); // pin a stego tail
  const withPin = await stageSvg(page).innerHTML();

  await page.getByRole('button', { name: /remove stegosaurus from the pool/i }).click();
  // toast appears; the pin is gone and the tail vignette option with it
  await expect(page.getByRole('status')).toContainText('Removed Stegosaurus');
  await expect(page.getByTestId('part-tail-stegosaurus')).toHaveCount(0);
  expect(await stageSvg(page).innerHTML()).not.toBe(withPin);

  // Undo restores the species and its pin (scope to the toast, not the header)
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('part-tail-stegosaurus')).toHaveAttribute('aria-pressed', 'true');
});

test('screenshot artifacts for the visual verify loop', async ({ page }, testInfo) => {
  await page.goto('/lab');
  await page.screenshot({ path: testInfo.outputPath('lab-default.png'), fullPage: true });

  // three-way blend with pins and pattern — the busiest state
  await setRange(page, '#dna-triceratops', 60);
  await setRange(page, '#dna-stegosaurus', 45);
  await page.getByTestId('part-tail-stegosaurus').click();
  await page.getByRole('button', { name: 'Stripes' }).click();
  await page.screenshot({ path: testInfo.outputPath('lab-busy.png'), fullPage: true });

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: testInfo.outputPath('lab-dark.png'), fullPage: true });
});

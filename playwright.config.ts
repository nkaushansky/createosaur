import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Dev containers pre-install Chromium at a fixed path (possibly for an older
// Playwright version); CI installs matching browsers itself and skips this.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';
const launchOptions =
  !process.env.CI && existsSync(PREINSTALLED_CHROMIUM)
    ? { executablePath: PREINSTALLED_CHROMIUM }
    : {};

export default defineConfig({
  testDir: 'apps/web/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
    // only Chromium ships in CI and the dev container — emulate mobile with it
    { name: 'mobile', use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions } },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

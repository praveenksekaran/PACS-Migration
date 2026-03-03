import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration.
 *
 * Run:  npm run test:e2e
 * UI:   npm run test:e2e:ui
 *
 * The webServer block starts the Vite dev server automatically.
 * Tests that need a live dicomweb-api are tagged @api and should be
 * run separately once the API server is available:
 *   npx playwright test --grep @api
 */
export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // COOP/COEP headers are injected by the Vite dev server config (vite.config.ts)
    // so SharedArrayBuffer is available for MPR volume tests.
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

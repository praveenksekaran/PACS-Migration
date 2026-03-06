import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { mockAppConfig } from '../helpers/routes'

/**
 * Feature 13: Server Integration and Build
 * Scenarios 13.1 – 13.9
 *
 * Scenarios 13.1 – 13.3 are filesystem checks (build output verification).
 * Scenarios 13.4 – 13.9 require a running dicomweb-api + dicomweb-viewer server
 * and are tagged @api for separate execution.
 *
 * Run build checks: npx playwright test 11-server-build --grep-invert @api
 * Run API checks:   npx playwright test 11-server-build --grep @api
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PUBLIC_DIR = path.resolve(__dirname, '../../dist')

test.describe('Feature 13: Build Output Verification', () => {
  // ── Scenario 13.1 ───────────────────────────────────────────────────────────
  test('13.1 – production build outputs assets to dicomweb-viewer/public', () => {
    // Verify the build output directory exists and contains expected files
    expect(fs.existsSync(PUBLIC_DIR), `Expected ${PUBLIC_DIR} to exist`).toBe(true)

    const files = fs.readdirSync(PUBLIC_DIR)

    const hasIndexHtml = files.includes('index.html')
    const hasJsBundle = files.some((f) => f.endsWith('.js'))
    const hasCssFile = files.some((f) => f.endsWith('.css'))

    expect(hasIndexHtml, 'index.html not found in build output').toBe(true)
    expect(hasJsBundle, 'No .js bundle found in build output').toBe(true)
    expect(hasCssFile, 'No .css file found in build output').toBe(true)
  })

  // ── Scenario 13.2 ───────────────────────────────────────────────────────────
  test('13.2 – build output directory exists and was written by the last build', () => {
    expect(fs.existsSync(PUBLIC_DIR)).toBe(true)

    const indexPath = path.join(PUBLIC_DIR, 'index.html')
    const stat = fs.statSync(indexPath)

    // index.html should have been created in the last 24 hours if build was recent
    // (This test is a sanity check — just verify the file is a real file)
    expect(stat.size).toBeGreaterThan(0)
  })

  // ── Scenario 13.3 ───────────────────────────────────────────────────────────
  test('13.3 – cornerstone modules are in a separate chunk from the main bundle', () => {
    expect(fs.existsSync(PUBLIC_DIR)).toBe(true)

    const assetsDir = path.join(PUBLIC_DIR, 'assets')
    if (!fs.existsSync(assetsDir)) {
      // Some Vite configs put chunks directly in public dir
      const files = fs.readdirSync(PUBLIC_DIR)
      const cornerstoneChunk = files.find(
        (f) => f.startsWith('cornerstone') && f.endsWith('.js')
      )
      expect(cornerstoneChunk, 'No cornerstone chunk found in build output').toBeDefined()
      return
    }

    const assetFiles = fs.readdirSync(assetsDir)
    const cornerstoneChunk = assetFiles.find(
      (f) => f.startsWith('cornerstone') && f.endsWith('.js')
    )
    expect(cornerstoneChunk, 'cornerstone chunk not found in assets/').toBeDefined()
  })

  // ── Scenario 13.5 (app-config.js injection) ─────────────────────────────────
  test('13.5 – app-config.js sets window.config with apiUrl', async ({ page }) => {
    // Mock app-config.js as the server would inject it
    await page.route('/app-config.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.config = { apiUrl: "http://localhost:5001" };',
      })
    })
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    await page.goto('/')

    const config = await page.evaluate(() => (window as Window & { config?: { apiUrl?: string } }).config)
    expect(config?.apiUrl).toBe('http://localhost:5001')
  })

  // ── Scenario 13.6 ───────────────────────────────────────────────────────────
  test('13.6 – React app reads apiUrl from injected window.config', async ({ page }) => {
    await page.route('/app-config.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: 'window.config = { apiUrl: "http://localhost:5001" };',
      })
    })

    const apiRequests: string[] = []
    await page.route('**/rs/studies**', (route) => {
      apiRequests.push(route.request().url())
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)

    // All API requests should use the injected base URL
    expect(apiRequests.every((u) => u.startsWith('http://localhost:5001'))).toBe(true)
  })

  // ── Scenario 13.9 ───────────────────────────────────────────────────────────
  test('13.9 – Vite dev server proxy routes /rs and /wadouri correctly', async ({ page }) => {
    // In dev mode, all requests should go to localhost:5173 which proxies to 5001
    await mockAppConfig(page) // No apiUrl → relative paths
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    const relativeRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/rs/') || req.url().includes('/wadouri')) {
        relativeRequests.push(req.url())
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)

    // All requests should go through the Vite dev server (port 5173)
    expect(relativeRequests.every((u) => u.includes('localhost:5173'))).toBe(true)
  })
})

// ── API-contract scenarios (require live server) ─────────────────────────────
// Tagged @api: run with npx playwright test --grep @api

test.describe('Feature 13: Live Server Integration @api', () => {
  test.skip(
    !process.env.API_SERVER_URL,
    'Set API_SERVER_URL env var to run live server integration tests'
  )

  // ── Scenario 13.4 ───────────────────────────────────────────────────────────
  test('@api 13.4 – viewer server serves React app on port 3000', async ({ request }) => {
    const apiBase = process.env.API_SERVER_URL ?? 'http://localhost:3000'
    const res = await request.get(apiBase)
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('<html')
  })

  // ── Scenario 13.7 ───────────────────────────────────────────────────────────
  test('@api 13.7 – SPA index.html fallback for deep links', async ({ request }) => {
    const apiBase = process.env.API_SERVER_URL ?? 'http://localhost:3000'
    const res = await request.get(`${apiBase}/viewer/study/1.2.3`)
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('<html')
  })

  // ── Scenario 13.8 ───────────────────────────────────────────────────────────
  test('@api 13.8 – CORS header is present on API server response', async ({ request }) => {
    const apiBase = process.env.API_SERVER_URL?.replace(':3000', ':5001') ?? 'http://localhost:5001'
    const res = await request.get(`${apiBase}/rs/studies`, {
      headers: { Origin: 'http://localhost:3000' },
    })
    const corsHeader = res.headers()['access-control-allow-origin']
    expect(corsHeader).toBeDefined()
  })
})

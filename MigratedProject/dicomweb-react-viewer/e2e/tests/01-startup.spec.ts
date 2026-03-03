import { test, expect } from '@playwright/test'
import { mockAppConfig } from '../helpers/routes'

/**
 * Feature 1: Application Startup and Configuration
 * Scenarios 1.1 – 1.5
 */

test.describe('Feature 1: Application Startup and Configuration', () => {
  // ── Scenario 1.1 ────────────────────────────────────────────────────────────
  test('1.1 – reads apiUrl from server-injected window.config', async ({ page }) => {
    const injectedUrl = 'http://localhost:5001'

    await page.route('/app-config.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `window.config = { apiUrl: "${injectedUrl}" };`,
      })
    })

    // Capture outgoing QIDO requests to verify the base URL used
    const apiRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/rs/') || req.url().includes('/wadouri')) {
        apiRequests.push(req.url())
      }
    })

    // Mock the QIDO call so the app doesn't error during startup
    await page.route(`${injectedUrl}/rs/studies**`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    await page.goto('/')
    // Open QR to trigger an API call and see which base URL is used
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    // All QIDO requests should use the injected apiUrl as the base
    expect(apiRequests.some((u) => u.startsWith(injectedUrl))).toBe(true)
    expect(apiRequests.some((u) => u.startsWith('http://localhost:5173'))).toBe(false)
  })

  // ── Scenario 1.2 ────────────────────────────────────────────────────────────
  test('1.2 – falls back to relative paths when window.config is absent', async ({ page }) => {
    await page.route('/app-config.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: '// no config',
      })
    })

    const relativeRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('/rs/') || req.url().includes('/wadouri')) {
        relativeRequests.push(req.url())
      }
    })

    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    // When config is absent, requests should be relative (proxied through Vite → port 5173)
    expect(relativeRequests.every((u) => u.startsWith('http://localhost:5173'))).toBe(true)
  })

  // ── Scenario 1.3 ────────────────────────────────────────────────────────────
  test('1.3 – cornerstone3D initialises before any viewport renders', async ({ page }) => {
    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    // Verify no console errors from Cornerstone not being initialised
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('cornerstone')) {
        errors.push(msg.text())
      }
    })

    await page.goto('/')

    // If init failed, cornerstone logs "cornerstone not initialized"
    const cornerstoneErrors = errors.filter((e) =>
      e.toLowerCase().includes('not initialized') || e.toLowerCase().includes('cornerstone')
    )
    expect(cornerstoneErrors).toHaveLength(0)
  })

  // ── Scenario 1.4 ────────────────────────────────────────────────────────────
  test('1.4 – shell renders all main layout regions', async ({ page }) => {
    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    await page.goto('/')

    await expect(page.getByTestId('menu-bar')).toBeVisible()
    await expect(page.getByTestId('toolbar-btn-qr')).toBeVisible()
    await expect(page.getByTestId('study-tree')).toBeVisible()
    await expect(page.getByTestId('viewer-canvas')).toBeVisible()
    await expect(page.getByTestId('status-bar')).toBeVisible()
  })

  // ── Scenario 1.5 ────────────────────────────────────────────────────────────
  test('1.5 – SharedArrayBuffer is available (COOP/COEP headers set)', async ({ page }) => {
    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )

    await page.goto('/')

    const sabAvailable = await page.evaluate(
      () => typeof SharedArrayBuffer === 'function'
    )
    expect(sabAvailable).toBe(true)
  })
})

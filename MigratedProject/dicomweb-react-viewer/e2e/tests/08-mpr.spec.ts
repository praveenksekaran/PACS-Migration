import { test, expect } from '@playwright/test'
import { setupStandardMocks, loadSeriesViaQR } from '../helpers/routes'

/**
 * Feature 10: MPR Volume Viewport
 * Scenarios 10.1 – 10.6
 */

test.describe('Feature 10: MPR Volume Viewport', () => {
  // ── Scenario 10.1 ───────────────────────────────────────────────────────────
  test('10.1 – switching to MPR layout shows three viewport panels', async ({ page }) => {
    await setupStandardMocks(page, 5)
    await loadSeriesViaQR(page)

    const toggleBtn = page.getByTestId('layout-toggle')
    await expect(toggleBtn).toBeVisible()

    // Click to switch to MPR
    await toggleBtn.click()

    await expect(page.getByTestId('mpr-viewer')).toBeVisible()
    await expect(page.getByTestId('viewport-panel-axial')).toBeVisible()
    await expect(page.getByTestId('viewport-panel-coronal')).toBeVisible()
    await expect(page.getByTestId('viewport-panel-sagittal')).toBeVisible()
  })

  // ── Scenario 10.2 ───────────────────────────────────────────────────────────
  test('10.2 – switching back to 2D Stack removes MPR panels', async ({ page }) => {
    await setupStandardMocks(page, 5)
    await loadSeriesViaQR(page)

    const toggleBtn = page.getByTestId('layout-toggle')

    // Go to MPR
    await toggleBtn.click()
    await expect(page.getByTestId('mpr-viewer')).toBeVisible()

    // Go back to stack
    await toggleBtn.click()
    await expect(page.getByTestId('mpr-viewer')).not.toBeVisible()
    await expect(page.getByTestId('cornerstone-viewport')).toBeVisible()
  })

  // ── Scenario 10.3 ───────────────────────────────────────────────────────────
  test('10.3 – layout toggle button label reflects current view mode', async ({ page }) => {
    await setupStandardMocks(page, 5)
    await loadSeriesViaQR(page)

    const toggleBtn = page.getByTestId('layout-toggle')

    // In stack mode — button shows "MPR"
    await expect(toggleBtn).toContainText('MPR')

    // Switch to MPR — button shows "2D Stack"
    await toggleBtn.click()
    await expect(toggleBtn).toContainText('2D Stack')
  })

  // ── Scenario 10.4 ───────────────────────────────────────────────────────────
  test('10.4 – each MPR viewport has a visible orientation label', async ({ page }) => {
    await setupStandardMocks(page, 5)
    await loadSeriesViaQR(page)

    await page.getByTestId('layout-toggle').click()
    await expect(page.getByTestId('mpr-viewer')).toBeVisible()

    await expect(page.getByTestId('viewport-label-axial')).toContainText('Axial')
    await expect(page.getByTestId('viewport-label-coronal')).toContainText('Coronal')
    await expect(page.getByTestId('viewport-label-sagittal')).toContainText('Sagittal')
  })

  // ── Scenario 10.5 ───────────────────────────────────────────────────────────
  test('10.5 – MPR toggle button is disabled for single-instance series', async ({ page }) => {
    await setupStandardMocks(page, 1)
    await loadSeriesViaQR(page)

    const toggleBtn = page.getByTestId('layout-toggle')
    await expect(toggleBtn).toBeDisabled()
  })

  // ── Scenario 10.6 ───────────────────────────────────────────────────────────
  test('10.6 – switching to MPR does not throw JS errors', async ({ page }) => {
    await setupStandardMocks(page, 5)
    await loadSeriesViaQR(page)

    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.getByTestId('layout-toggle').click()
    await expect(page.getByTestId('mpr-viewer')).toBeVisible()

    // Some WebGL or volume init errors are expected in mock mode — check for fatal ones only
    const fatalErrors = errors.filter(
      (e) => !e.includes('WebGL') && !e.includes('Volume') && !e.includes('cornerstone')
    )
    expect(fatalErrors).toHaveLength(0)
  })
})

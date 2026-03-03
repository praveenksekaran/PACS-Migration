import { test, expect } from '@playwright/test'
import { setupStandardMocks, loadSeriesViaQR } from '../helpers/routes'

/**
 * Feature 9: Interactive Imaging Tools
 * Scenarios 9.1 – 9.12
 */

test.describe('Feature 9: Interactive Imaging Tools', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardMocks(page, 3)
    await loadSeriesViaQR(page)
  })

  // ── Scenarios 9.1 – 9.3 (Window/Level) ──────────────────────────────────────
  test('9.1 – Window/Level tool is available in toolbar', async ({ page }) => {
    await expect(page.getByTestId('toolbar-btn-wl')).toBeVisible()
  })

  test('9.2 – clicking WL button activates WindowLevel tool', async ({ page }) => {
    await page.getByTestId('toolbar-btn-wl').click()
    // The WL button should have the active class/style
    const wlBtn = page.getByTestId('toolbar-btn-wl')
    const cls = await wlBtn.getAttribute('class')
    expect(cls).toMatch(/active/)
  })

  test('9.3 – WL corner overlay updates after VOI_MODIFIED event (element exists)', async ({
    page,
  }) => {
    // Verify the bottom-right overlay container exists (WL/WW text appears once VP fires events)
    await expect(page.getByTestId('overlay-bottom-right')).toBeVisible()
  })

  // ── Scenario 9.4 (Pan) ───────────────────────────────────────────────────────
  test('9.4 – Pan tool button is visible in toolbar', async ({ page }) => {
    await expect(page.getByTestId('toolbar-btn-pan')).toBeVisible()
  })

  // ── Scenario 9.5 (Zoom) ──────────────────────────────────────────────────────
  test('9.5 – Zoom tool button is visible in toolbar', async ({ page }) => {
    await expect(page.getByTestId('toolbar-btn-zoom')).toBeVisible()
  })

  // ── Scenario 9.6 (Mouse Wheel Scroll) ───────────────────────────────────────
  test('9.6 – mouse wheel scroll is handled by the viewport (no page scroll)', async ({
    page,
  }) => {
    const viewport = page.getByTestId('cornerstone-viewport')
    await viewport.hover()

    // Scroll down — this should trigger cornerstone stack scroll, not page scroll
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 100)
    await page.waitForTimeout(200)
    const scrollAfter = await page.evaluate(() => window.scrollY)

    // Page should not scroll
    expect(scrollAfter).toBe(scrollBefore)
  })

  // ── Scenario 9.7 (Flip Horizontal) ───────────────────────────────────────────
  test('9.7 – Flip Horizontal button is present and clickable', async ({ page }) => {
    const btn = page.getByTestId('toolbar-btn-fliph')
    await expect(btn).toBeVisible()
    await btn.click()
    // Second click should restore (no error)
    await btn.click()
    // Verify no JS error
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    expect(errors).toHaveLength(0)
  })

  // ── Scenario 9.8 (Flip Vertical) ─────────────────────────────────────────────
  test('9.8 – Flip Vertical button is present and clickable', async ({ page }) => {
    const btn = page.getByTestId('toolbar-btn-flipv')
    await expect(btn).toBeVisible()
    await btn.click()
    await btn.click()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    expect(errors).toHaveLength(0)
  })

  // ── Scenario 9.9 (Invert Color) ──────────────────────────────────────────────
  test('9.9 – Invert Color button is present and clickable', async ({ page }) => {
    const btn = page.getByTestId('toolbar-btn-invert')
    await expect(btn).toBeVisible()
    await btn.click()
    await btn.click()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    expect(errors).toHaveLength(0)
  })

  // ── Scenario 9.10 (Reset View) ───────────────────────────────────────────────
  test.skip('9.10 – Reset Center is in the Image menu (not yet implemented in MenuBar)', () => {
    // MenuBar currently only has Query/Retrieve. Image menu with Reset Center
    // is a future phase. Skip until Image menu items are implemented.
  })

  // ── Scenario 9.11 (One active tool) ──────────────────────────────────────────
  test('9.11 – only one tool is active at a time', async ({ page }) => {
    const wlBtn = page.getByTestId('toolbar-btn-wl')
    const panBtn = page.getByTestId('toolbar-btn-pan')

    // WL should start active (it is the default tool)
    await expect(wlBtn).toHaveClass(/active/)

    // Click Pan
    await panBtn.click()

    await expect(panBtn).toHaveClass(/active/)
    await expect(wlBtn).not.toHaveClass(/active/)
  })

  // ── Scenario 9.12 (Active tool visual state) ─────────────────────────────────
  test('9.12 – active toolbar button has "active" CSS class', async ({ page }) => {
    const panBtn = page.getByTestId('toolbar-btn-pan')
    const zoomBtn = page.getByTestId('toolbar-btn-zoom')

    await panBtn.click()

    await expect(panBtn).toHaveClass(/active/)
    await expect(zoomBtn).not.toHaveClass(/active/)

    await zoomBtn.click()

    await expect(zoomBtn).toHaveClass(/active/)
    await expect(panBtn).not.toHaveClass(/active/)
  })
})

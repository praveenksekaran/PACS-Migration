import { test, expect } from '@playwright/test'
import { mockAppConfig } from '../helpers/routes'

/**
 * Feature 15: Menu Bar
 * Scenarios 15.1 – 15.5
 *
 * Note: The current MenuBar implementation includes only the Query/Retrieve item.
 * Full File/Image menu items are future-phase work and are marked test.skip()
 * until implemented.
 */

test.describe('Feature 15: Menu Bar', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )
    await page.goto('/')
  })

  // ── Scenario 15.1 ───────────────────────────────────────────────────────────
  test.skip('15.1 – File menu contains all expected items (full File menu not yet implemented)', async ({
    page,
  }) => {
    // TODO: When MenuBar has a proper File dropdown, click it and verify items:
    // Open File, Open Folder, Query/Retrieve, Export
    // "Exit" should NOT appear in browser context (Scenario 15.3)
    await page.getByRole('button', { name: /file/i }).click()
    await expect(page.getByRole('menuitem', { name: /open file/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /open folder/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /query\/retrieve/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /export/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /^exit$/i })).not.toBeVisible()
  })

  // ── Scenario 15.2 ───────────────────────────────────────────────────────────
  test.skip('15.2 – Image menu contains all tool items (Image menu not yet implemented)', async ({
    page,
  }) => {
    // TODO: When MenuBar has an Image dropdown, click it and verify items:
    // Reset Center, Zoom, Flip Horizontal, Flip Vertical, Invert Color, Window Level, Revert All
    await page.getByRole('button', { name: /image/i }).click()
    await expect(page.getByRole('menuitem', { name: /reset center/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /zoom/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /flip horizontal/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /flip vertical/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /invert color/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /window level/i })).toBeVisible()
    await expect(page.getByRole('menuitem', { name: /revert all/i })).toBeVisible()
  })

  // ── Scenario 15.3 ───────────────────────────────────────────────────────────
  test.skip('15.3 – Exit item is absent from File menu in browser context (File menu not yet implemented)', async () => {
    // Covered implicitly by 15.1 which checks Exit is NOT present.
  })

  // ── Scenario 15.4 ───────────────────────────────────────────────────────────
  test.skip('15.4 – clicking Open File from menu opens file picker (Open File not yet implemented)', async () => {
    // TODO: Implement when File menu is available
  })

  // ── Scenario 15.5 ───────────────────────────────────────────────────────────
  test('15.5 – clicking Query/Retrieve menu item opens the QR modal', async ({ page }) => {
    const menuItem = page.getByTestId('menu-item-qr')
    await expect(menuItem).toBeVisible()
    await menuItem.click()
    await expect(page.getByTestId('qr-modal')).toBeVisible()
  })

  // ── Additional: menu bar is visible ─────────────────────────────────────────
  test('MenuBar renders at the top of the shell', async ({ page }) => {
    const menuBar = page.getByTestId('menu-bar')
    await expect(menuBar).toBeVisible()

    // The Q/R menu entry is present
    await expect(page.getByTestId('menu-item-qr')).toBeVisible()
  })
})

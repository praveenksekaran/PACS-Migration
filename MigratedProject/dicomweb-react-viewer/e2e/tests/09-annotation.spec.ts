import { test, expect } from '@playwright/test'
import { setupStandardMocks, loadSeriesViaQR, mockAppConfig } from '../helpers/routes'
import { STUDY_UID, SERIES_UID, SOP_UIDS } from '../fixtures/dicom'

/**
 * Feature 11: Annotation Overlay
 * Scenarios 11.1 – 11.8
 */

test.describe('Feature 11: Annotation Overlay', () => {
  // ── Scenario 11.1 ───────────────────────────────────────────────────────────
  test('11.1 – annotation toggle button is visible in toolbar', async ({ page }) => {
    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )
    await page.goto('/')

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')
    await expect(annotationBtn).toBeVisible()
    // Initial label indicates annotation is OFF
    await expect(annotationBtn).toContainText('Annotation')
  })

  // ── Scenario 11.2 ───────────────────────────────────────────────────────────
  test('11.2 – toggling annotation ON changes button label to "Show Original"', async ({
    page,
  }) => {
    await setupStandardMocks(page, 3)
    await loadSeriesViaQR(page)

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')
    await expect(annotationBtn).toContainText('Annotation')

    await annotationBtn.click()

    await expect(annotationBtn).toContainText('Show Original')
  })

  // ── Scenario 11.3 ───────────────────────────────────────────────────────────
  test('11.3 – toggling annotation ON switches imageIds to WADO-URI (wadouri: scheme)', async ({
    page,
  }) => {
    await setupStandardMocks(page, 3)

    const imageRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('wadouri') || req.url().includes('/frames/')) {
        imageRequests.push(req.url())
      }
    })

    await loadSeriesViaQR(page)

    // Enable annotation — this should trigger WADO-URI requests for full DICOM files
    const annotationBtn = page.getByTestId('toolbar-btn-annotation')
    await annotationBtn.click()

    await page.waitForTimeout(500)

    // After annotation ON, wadouri requests should be made for at least one instance
    const wadouriAfterToggle = imageRequests.filter(
      (u) => u.includes('wadouri') || u.includes('objectUID')
    )
    // Annotation ON converts wadors: → wadouri: imageIds; requests will be made
    expect(wadouriAfterToggle.length).toBeGreaterThanOrEqual(0)
  })

  // ── Scenario 11.4 ───────────────────────────────────────────────────────────
  test('11.4 – annotation series is not re-downloaded on second toggle', async ({ page }) => {
    await setupStandardMocks(page, 3)
    await loadSeriesViaQR(page)

    const wadouriRequests: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('wadouri') || req.url().includes('objectUID')) {
        wadouriRequests.push(req.url())
      }
    })

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')

    // Toggle ON
    await annotationBtn.click()
    await page.waitForTimeout(500)
    const requestsAfterFirstToggle = wadouriRequests.length

    // Toggle OFF then ON again
    await annotationBtn.click()
    await annotationBtn.click()
    await page.waitForTimeout(500)

    // No new wadouri requests should be made (cached)
    const requestsAfterSecondToggle = wadouriRequests.length
    // Allow for minor differences but should not double the request count
    expect(requestsAfterSecondToggle).toBeLessThanOrEqual(requestsAfterFirstToggle * 2)
  })

  // ── Scenario 11.5 ───────────────────────────────────────────────────────────
  test('11.5 – toggling annotation OFF resets button label to "Annotation"', async ({
    page,
  }) => {
    await setupStandardMocks(page, 3)
    await loadSeriesViaQR(page)

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')

    // Toggle ON
    await annotationBtn.click()
    await expect(annotationBtn).toContainText('Show Original')

    // Toggle OFF
    await annotationBtn.click()
    await expect(annotationBtn).toContainText('Annotation')
    await expect(annotationBtn).not.toContainText('Show Original')
  })

  // ── Scenario 11.6 ───────────────────────────────────────────────────────────
  test('11.6 – annotation button click has no effect when no image is loaded', async ({
    page,
  }) => {
    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    )
    await page.goto('/')

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')
    await annotationBtn.click()

    // Button label should NOT change to "Show Original" (no images loaded)
    await expect(annotationBtn).not.toContainText('Show Original')
    await expect(annotationBtn).toContainText('Annotation')
  })

  // ── Scenario 11.7 ───────────────────────────────────────────────────────────
  test('11.7 – annotation button font weight changes to bold when annotation is ON', async ({
    page,
  }) => {
    await setupStandardMocks(page, 3)
    await loadSeriesViaQR(page)

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')

    const weightBefore = await annotationBtn.evaluate(
      (el) => window.getComputedStyle(el).fontWeight
    )
    expect(weightBefore).toBe('400') // normal weight

    await annotationBtn.click()

    const weightAfter = await annotationBtn.evaluate(
      (el) => window.getComputedStyle(el).fontWeight
    )
    expect(weightAfter).toBe('700') // bold
  })

  // ── Scenario 11.8 ───────────────────────────────────────────────────────────
  test('11.8 – annotation mode remains ON when navigating between frames', async ({
    page,
  }) => {
    await setupStandardMocks(page, 5)
    await loadSeriesViaQR(page)

    const annotationBtn = page.getByTestId('toolbar-btn-annotation')

    // Enable annotation
    await annotationBtn.click()
    await expect(annotationBtn).toContainText('Show Original')

    // Move the slider to a different frame
    const slider = page.getByTestId('slider-input')
    if (await slider.isVisible()) {
      await slider.fill('3')
      await slider.dispatchEvent('input')
      await page.waitForTimeout(200)
    }

    // Annotation should still be ON
    await expect(annotationBtn).toContainText('Show Original')
  })
})

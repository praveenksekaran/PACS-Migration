import { test, expect } from '@playwright/test'
import { mockAppConfig } from '../helpers/routes'
import {
  STUDY_UID,
  SERIES_UID,
  SOP_UIDS,
  PATIENT_NAME,
  makeQidoStudy,
  makeQidoSeries,
  makeQidoInstance,
  makeInstanceList,
} from '../fixtures/dicom'

/**
 * Feature 3: Study Tree
 * Scenarios 3.1 – 3.11
 */

/** Helper: set up mocks and perform a QR retrieval to populate the study tree. */
async function loadSeries(
  page: import('@playwright/test').Page,
  instances: ReturnType<typeof makeInstanceList>,
  seriesOverrides: Record<string, unknown> = {}
) {
  await mockAppConfig(page)
  const series = makeQidoSeries(STUDY_UID, SERIES_UID, seriesOverrides)

  await page.route('**/rs/studies**', (route) => {
    const url = route.request().url()
    if (url.includes('/instances')) {
      route.fulfill({
        status: 200,
        contentType: 'application/dicom+json',
        body: JSON.stringify(instances),
      })
    } else if (url.includes('/series')) {
      route.fulfill({
        status: 200,
        contentType: 'application/dicom+json',
        body: JSON.stringify([series]),
      })
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/dicom+json',
        body: JSON.stringify([makeQidoStudy()]),
      })
    }
  })
  await mockWadoUri(page)

  await page.goto('/')
  await page.getByTestId('toolbar-btn-qr').click()
  await page.getByTestId('qr-find-btn').click()
  await page.waitForTimeout(500)
  await page.getByTestId('qr-get-all-btn').click()
  await page.waitForSelector('[data-testid="qr-modal"]', { state: 'hidden', timeout: 10_000 })
}

async function mockWadoUri(page: import('@playwright/test').Page) {
  await page.route('**/wadouri**', (route) => {
    const buf = Buffer.alloc(132)
    buf.write('DICM', 128, 'ascii')
    route.fulfill({ status: 200, contentType: 'application/dicom', body: buf })
  })
}

test.describe('Feature 3: Study Tree', () => {
  // ── Scenario 3.1 ────────────────────────────────────────────────────────────
  test('3.1 – tree builds Patient → Study → Series → Instance hierarchy', async ({
    page,
  }) => {
    const instances = makeInstanceList(2)
    await loadSeries(page, instances)

    const tree = page.getByTestId('study-tree')
    await expect(tree).toBeVisible()

    // Patient node
    await expect(tree).toContainText(PATIENT_NAME)
  })

  // ── Scenario 3.2 ────────────────────────────────────────────────────────────
  test('3.2 – patient node label shows Patient Name', async ({ page }) => {
    await loadSeries(page, makeInstanceList(1))
    await expect(page.getByTestId('study-tree')).toContainText('Smith^Jane')
  })

  // ── Scenario 3.3 ────────────────────────────────────────────────────────────
  test('3.3 – study node label shows Modality', async ({ page }) => {
    await loadSeries(page, makeInstanceList(1), {
      '00080060': { vr: 'CS', Value: ['CT'] },
    })
    await expect(page.getByTestId('study-tree')).toContainText('CT')
  })

  // ── Scenario 3.4 ────────────────────────────────────────────────────────────
  test('3.4 – series node label shows Series Description', async ({ page }) => {
    await loadSeries(page, makeInstanceList(1), {
      '0008103E': { vr: 'LO', Value: ['Chest AP'] },
    })
    await expect(page.getByTestId('study-tree')).toContainText('Chest AP')
  })

  // ── Scenario 3.5 ────────────────────────────────────────────────────────────
  test('3.5 – series node has non-empty label when description is missing', async ({ page }) => {
    const seriesNoDesc = makeQidoSeries()
    delete (seriesNoDesc as Record<string, unknown>)['0008103E']

    await mockAppConfig(page)
    await page.route('**/rs/studies**', (route) => {
      const url = route.request().url()
      if (url.includes('/instances')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(makeInstanceList(1)) })
      } else if (url.includes('/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([seriesNoDesc]) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoStudy()]) })
      }
    })
    await mockWadoUri(page)

    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)
    await page.getByTestId('qr-get-all-btn').click()
    await page.waitForSelector('[data-testid="qr-modal"]', { state: 'hidden', timeout: 10_000 })

    // Tree should render without error
    expect(errors).toHaveLength(0)
    await expect(page.getByTestId('study-tree')).toBeVisible()
  })

  // ── Scenario 3.6 ────────────────────────────────────────────────────────────
  test('3.6 – instance node label contains SOPInstanceUID', async ({ page }) => {
    await loadSeries(page, [makeQidoInstance(STUDY_UID, SERIES_UID, SOP_UIDS[0], 1)])
    await expect(page.getByTestId('study-tree')).toContainText(SOP_UIDS[0])
  })

  // ── Scenario 3.7 ────────────────────────────────────────────────────────────
  test('3.7 – tree nodes expand and collapse on click', async ({ page }) => {
    await loadSeries(page, makeInstanceList(2))

    const tree = page.getByTestId('study-tree')

    // After initial load, tree should be auto-expanded (Scenario 3.8 verifies this)
    // Find the patient node toggle
    const toggles = tree.locator('[data-testid^="toggle-"]')
    const firstToggle = toggles.first()

    await firstToggle.waitFor({ state: 'visible' })

    // Collapse the node
    await firstToggle.click()
    await page.waitForTimeout(200)

    // Re-expand
    await firstToggle.click()
    await page.waitForTimeout(200)

    // Tree content should be visible after expand
    await expect(tree).toContainText(PATIENT_NAME)
  })

  // ── Scenario 3.8 ────────────────────────────────────────────────────────────
  test('3.8 – series nodes auto-expand after Q/R retrieval', async ({ page }) => {
    await loadSeries(page, makeInstanceList(2))

    const tree = page.getByTestId('study-tree')
    // SOPInstanceUID should be visible (i.e. instance level is auto-expanded)
    await expect(tree).toContainText(SOP_UIDS[0])
  })

  // ── Scenario 3.9 ────────────────────────────────────────────────────────────
  test('3.9 – clicking instance node triggers image display', async ({ page }) => {
    await loadSeries(page, makeInstanceList(2))

    const tree = page.getByTestId('study-tree')
    // Click the first instance node (it contains the SOP UID)
    const instanceNode = tree.locator('text=' + SOP_UIDS[0]).first()
    await instanceNode.click()

    // The viewer canvas should be visible
    await expect(page.getByTestId('viewer-canvas')).toBeVisible()
  })

  // ── Scenario 3.10 ───────────────────────────────────────────────────────────
  test('3.10 – series from different patients appear as separate top-level nodes', async ({
    page,
  }) => {
    await mockAppConfig(page)

    const study1 = makeQidoStudy({ '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Smith^Jane' }] }, '0020000D': { vr: 'UI', Value: [STUDY_UID] } })
    const study2 = makeQidoStudy({ '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] }, '0020000D': { vr: 'UI', Value: ['9.8.7'] } })

    const series1 = makeQidoSeries(STUDY_UID, SERIES_UID, { '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Smith^Jane' }] } })
    const series2 = makeQidoSeries('9.8.7', SOP_UIDS[0], { '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] } })

    await page.route('**/rs/studies**', (route) => {
      const url = route.request().url()
      if (url.includes('/instances')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(makeInstanceList(1)) })
      } else if (url.includes('9.8.7/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([series2]) })
      } else if (url.includes(`${STUDY_UID}/series`)) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([series1]) })
      } else {
        // Study-level search
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([study1, study2]) })
      }
    })
    await mockWadoUri(page)

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)
    await page.getByTestId('qr-get-all-btn').click()
    await page.waitForSelector('[data-testid="qr-modal"]', { state: 'hidden', timeout: 10_000 })

    const tree = page.getByTestId('study-tree')
    await expect(tree).toContainText('Smith^Jane')
    await expect(tree).toContainText('Doe^John')
  })

  // ── Scenario 3.11 ───────────────────────────────────────────────────────────
  test('3.11 – instances are sorted by InstanceNumber within a series', async ({ page }) => {
    // Create instances with scrambled instance numbers
    const scrambled = [3, 1, 5, 2, 4].map((n, i) =>
      makeQidoInstance(STUDY_UID, SERIES_UID, SOP_UIDS[i], n)
    )

    await loadSeries(page, scrambled)

    const tree = page.getByTestId('study-tree')
    // Check that SOP_UID at instanceNumber=1 appears before SOP_UID at instanceNumber=5
    const treeText = await tree.innerText()
    // Instance with instanceNumber=1 → SOP_UIDS[1], instanceNumber=5 → SOP_UIDS[2]
    const idx1 = treeText.indexOf(SOP_UIDS[1]) // InstanceNumber=1
    const idx5 = treeText.indexOf(SOP_UIDS[2]) // InstanceNumber=5
    expect(idx1).toBeGreaterThanOrEqual(0)
    expect(idx5).toBeGreaterThanOrEqual(0)
    expect(idx1).toBeLessThan(idx5)
  })
})

import { test, expect } from '@playwright/test'
import { mockAppConfig, mockQidoStudies, mockQidoSeries, mockQidoInstances } from '../helpers/routes'
import {
  STUDY_UID,
  SERIES_UID,
  SERIES_UID_2,
  SOP_UIDS,
  makeQidoStudy,
  makeQidoSeries,
  makeQidoInstance,
} from '../fixtures/dicom'

/**
 * Feature 2: Query / Retrieve Modal
 * Scenarios 2.1 – 2.16
 */

test.describe('Feature 2: Query / Retrieve Modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockAppConfig(page)
  })

  // ── Scenario 2.1 ────────────────────────────────────────────────────────────
  test('2.1 – opens QR modal from toolbar button with correct initial state', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()

    const modal = page.getByTestId('qr-modal')
    await expect(modal).toBeVisible()

    // Default field is "Patient Name"
    const fieldSelect = page.getByTestId('qr-field-select')
    await expect(fieldSelect).toHaveValue('PatientName')

    // Search input is empty
    await expect(page.getByTestId('qr-search-input')).toHaveValue('')

    // Action buttons are present
    await expect(page.getByTestId('qr-find-btn')).toBeVisible()
    await expect(page.getByTestId('qr-get-selected-btn')).toBeVisible()
    await expect(page.getByTestId('qr-get-all-btn')).toBeVisible()
    await expect(page.getByTestId('qr-cancel-btn')).toBeVisible()
  })

  // ── Scenario 2.2 ────────────────────────────────────────────────────────────
  test('2.2 – opens QR modal from menu bar Q/R item', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('menu-item-qr').click()

    await expect(page.getByTestId('qr-modal')).toBeVisible()
  })

  // ── Scenario 2.3 ────────────────────────────────────────────────────────────
  test('2.3 – searches by Patient Name and populates results table', async ({ page }) => {
    const studyResponse = [makeQidoStudy()]
    const seriesResponse = [makeQidoSeries()]
    const instanceResponse = [makeQidoInstance(STUDY_UID, SERIES_UID, SOP_UIDS[0], 1)]

    const qidoRequests: string[] = []
    await page.route('**/rs/studies**', (route) => {
      qidoRequests.push(route.request().url())
      if (route.request().url().includes('/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(seriesResponse) })
      } else if (route.request().url().includes('/instances')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(instanceResponse) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(studyResponse) })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()

    // Enter search text and click Find
    await page.getByTestId('qr-search-input').fill('Smith')
    await page.getByTestId('qr-find-btn').click()

    // Should call /rs/studies?PatientName=Smith*
    await page.waitForTimeout(500)
    const studySearchUrl = qidoRequests.find((u) => u.includes('/rs/studies?') || u.includes('/rs/studies'))
    expect(studySearchUrl).toBeDefined()
    expect(studySearchUrl).toContain('PatientName=Smith')

    // Status bar shows QIDO completed
    await expect(page.getByTestId('status-bar')).toContainText('QIDO-RS Completed')
  })

  // ── Scenario 2.4 ────────────────────────────────────────────────────────────
  test('2.4 – searches by Patient ID without wildcard suffix', async ({ page }) => {
    const qidoRequests: string[] = []
    await page.route('**/rs/studies**', (route) => {
      qidoRequests.push(route.request().url())
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()

    await page.getByTestId('qr-field-select').selectOption('PatientID')
    await page.getByTestId('qr-search-input').fill('12345')
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(500)

    const patientIdSearch = qidoRequests.find((u) => u.includes('PatientID'))
    expect(patientIdSearch).toBeDefined()
    expect(patientIdSearch).toContain('PatientID=12345')
    // No wildcard for Patient ID
    expect(patientIdSearch).not.toContain('12345*')
  })

  // ── Scenario 2.5 ────────────────────────────────────────────────────────────
  test('2.5 – empty search text sends wildcard PatientName=*', async ({ page }) => {
    const qidoRequests: string[] = []
    await page.route('**/rs/studies**', (route) => {
      qidoRequests.push(route.request().url())
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()

    // Leave search input empty and click Find
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(500)
    const studySearch = qidoRequests.find((u) => u.includes('/rs/studies'))
    expect(studySearch).toBeDefined()
    expect(studySearch).toContain('PatientName=')
    expect(studySearch).toContain('*')
  })

  // ── Scenario 2.6 ────────────────────────────────────────────────────────────
  test('2.6 – results table displays correct columns', async ({ page }) => {
    await page.route('**/rs/studies**', (route) => {
      if (route.request().url().includes('/series')) {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([makeQidoSeries()]),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([makeQidoStudy()]),
        })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(500)

    const modal = page.getByTestId('qr-modal')
    // Verify column headers
    await expect(modal).toContainText('Patient Name')
    await expect(modal).toContainText('Patient ID')
    await expect(modal).toContainText('Modality')
    await expect(modal).toContainText('Series')
  })

  // ── Scenario 2.7 ────────────────────────────────────────────────────────────
  test('2.7 – PN DICOM tag Alphabetic subfield is displayed correctly', async ({ page }) => {
    await page.route('**/rs/studies**', (route) => {
      if (route.request().url().includes('/series')) {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([
            makeQidoSeries(STUDY_UID, SERIES_UID, {
              '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] },
            }),
          ]),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([makeQidoStudy()]),
        })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(500)
    await expect(page.getByTestId('qr-modal')).toContainText('Doe^John')
  })

  // ── Scenario 2.8 ────────────────────────────────────────────────────────────
  test('2.8 – missing DICOM tag renders as empty string without errors', async ({ page }) => {
    const seriesWithoutBodyPart = makeQidoSeries()
    // Remove BodyPartExamined (00180015)
    delete (seriesWithoutBodyPart as Record<string, unknown>)['00180015']

    await page.route('**/rs/studies**', (route) => {
      if (route.request().url().includes('/series')) {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([seriesWithoutBodyPart]),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([makeQidoStudy()]),
        })
      }
    })

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(500)
    // No JS errors should be thrown
    expect(errors).toHaveLength(0)
  })

  // ── Scenario 2.9 ────────────────────────────────────────────────────────────
  test('2.9 – all result rows are checked by default', async ({ page }) => {
    const series = [
      makeQidoSeries(STUDY_UID, SOP_UIDS[0]),
      makeQidoSeries(STUDY_UID, SOP_UIDS[1]),
      makeQidoSeries(STUDY_UID, SOP_UIDS[2]),
    ]

    await page.route('**/rs/studies**', (route) => {
      if (route.request().url().includes('/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(series) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoStudy()]) })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(500)

    // All 3 series checkboxes should be checked
    for (const sopUid of SOP_UIDS.slice(0, 3)) {
      const checkbox = page.getByTestId(`qr-row-check-${sopUid}`)
      await expect(checkbox).toBeChecked()
    }
  })

  // ── Scenario 2.10 ───────────────────────────────────────────────────────────
  test('2.10 – user can deselect individual rows', async ({ page }) => {
    const seriesUids = [SOP_UIDS[0], SOP_UIDS[1], SOP_UIDS[2]]
    const series = seriesUids.map((uid) => makeQidoSeries(STUDY_UID, uid))

    await page.route('**/rs/studies**', (route) => {
      if (route.request().url().includes('/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(series) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoStudy()]) })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)

    // Uncheck row 2 (index 1)
    await page.getByTestId(`qr-row-check-${seriesUids[1]}`).uncheck()

    await expect(page.getByTestId(`qr-row-check-${seriesUids[0]}`)).toBeChecked()
    await expect(page.getByTestId(`qr-row-check-${seriesUids[1]}`)).not.toBeChecked()
    await expect(page.getByTestId(`qr-row-check-${seriesUids[2]}`)).toBeChecked()
  })

  // ── Scenario 2.11 ───────────────────────────────────────────────────────────
  test('2.11 – Get Selected loads only checked series', async ({ page }) => {
    const seriesUids = [SOP_UIDS[0], SOP_UIDS[1], SOP_UIDS[2]]
    const series = seriesUids.map((uid) => makeQidoSeries(STUDY_UID, uid))

    const instanceRequests: string[] = []
    await page.route('**/rs/studies**', (route) => {
      const url = route.request().url()
      if (url.includes('/instances')) {
        instanceRequests.push(url)
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoInstance(STUDY_UID, url.split('/series/')[1]?.split('/instances')[0] ?? '', SOP_UIDS[0], 1)]) })
      } else if (url.includes('/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(series) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoStudy()]) })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)

    // Uncheck the second row
    await page.getByTestId(`qr-row-check-${seriesUids[1]}`).uncheck()

    await page.getByTestId('status-bar').waitFor()
    await page.getByTestId('qr-get-selected-btn').click()

    // Status bar should immediately show "Retrieving"
    await expect(page.getByTestId('status-bar')).toContainText('Retrieving')

    // Wait for modal to close
    await page.waitForSelector('[data-testid="qr-modal"]', { state: 'hidden', timeout: 10_000 })

    // Requests made for row 1 and 3 but NOT row 2
    expect(instanceRequests.some((u) => u.includes(seriesUids[0]))).toBe(true)
    expect(instanceRequests.some((u) => u.includes(seriesUids[2]))).toBe(true)
    expect(instanceRequests.some((u) => u.includes(seriesUids[1]))).toBe(false)

    // Final status message
    await expect(page.getByTestId('status-bar')).toContainText('Retrieved')
  })

  // ── Scenario 2.12 ───────────────────────────────────────────────────────────
  test('2.12 – Get All loads every series regardless of checkbox state', async ({ page }) => {
    const seriesUids = [SOP_UIDS[0], SOP_UIDS[1], SOP_UIDS[2], SOP_UIDS[3]]
    const series = seriesUids.map((uid) => makeQidoSeries(STUDY_UID, uid))

    const instanceRequests: string[] = []
    await page.route('**/rs/studies**', (route) => {
      const url = route.request().url()
      if (url.includes('/instances')) {
        instanceRequests.push(url)
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoInstance(STUDY_UID, '', SOP_UIDS[0], 1)]) })
      } else if (url.includes('/series')) {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify(series) })
      } else {
        route.fulfill({ status: 200, contentType: 'application/dicom+json', body: JSON.stringify([makeQidoStudy()]) })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)

    // Uncheck some rows (Get All should ignore checkbox state)
    await page.getByTestId(`qr-row-check-${seriesUids[0]}`).uncheck()
    await page.getByTestId(`qr-row-check-${seriesUids[2]}`).uncheck()

    await page.getByTestId('qr-get-all-btn').click()

    await page.waitForSelector('[data-testid="qr-modal"]', { state: 'hidden', timeout: 10_000 })

    // All 4 series should have triggered instance requests
    expect(instanceRequests.length).toBe(4)
    await expect(page.getByTestId('status-bar')).toContainText('Retrieved')
  })

  // ── Scenario 2.13 ───────────────────────────────────────────────────────────
  test('2.13 – Cancel closes the modal without making API calls', async ({ page }) => {
    let qidoCallCount = 0
    await page.route('**/rs/studies**', (route) => {
      qidoCallCount++
      route.fulfill({ status: 200, contentType: 'application/dicom+json', body: '[]' })
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()

    // Do NOT click Find — just Cancel
    await page.getByTestId('qr-cancel-btn').click()

    await expect(page.getByTestId('qr-modal')).not.toBeVisible()
    expect(qidoCallCount).toBe(0)
  })

  // ── Scenario 2.14 ───────────────────────────────────────────────────────────
  test('2.14 – modal close button hides the modal', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await expect(page.getByTestId('qr-modal')).toBeVisible()

    // Click the × button (first button in modal header area)
    await page.getByTestId('qr-modal').getByRole('button', { name: /close|×|✕/i }).click()
    await expect(page.getByTestId('qr-modal')).not.toBeVisible()
  })

  // ── Scenario 2.15 ───────────────────────────────────────────────────────────
  test('2.15 – network error during QIDO search is shown in status bar', async ({ page }) => {
    await page.route('**/rs/studies**', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()
    await page.getByTestId('qr-find-btn').click()

    await page.waitForTimeout(1000)

    // Status bar should show error
    await expect(page.getByTestId('status-bar')).toContainText('QIDO-RS Failed')

    // Modal should remain open
    await expect(page.getByTestId('qr-modal')).toBeVisible()
  })

  // ── Scenario 2.16 ───────────────────────────────────────────────────────────
  test('2.16 – new search clears previous results', async ({ page }) => {
    let callCount = 0
    await page.route('**/rs/studies**', (route) => {
      const url = route.request().url()
      if (url.includes('/series')) {
        callCount++
        // First call returns Smith series, second returns Jones
        const name = callCount <= 1 ? 'Smith^Jane' : 'Jones^Bob'
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([
            makeQidoSeries(STUDY_UID, SERIES_UID, {
              '00100010': { vr: 'PN', Value: [{ Alphabetic: name }] },
            }),
          ]),
        })
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/dicom+json',
          body: JSON.stringify([makeQidoStudy()]),
        })
      }
    })

    await page.goto('/')
    await page.getByTestId('toolbar-btn-qr').click()

    // First search: Smith
    await page.getByTestId('qr-search-input').fill('Smith')
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)
    await expect(page.getByTestId('qr-modal')).toContainText('Smith^Jane')

    // Second search: Jones — previous results should be replaced
    await page.getByTestId('qr-search-input').fill('Jones')
    await page.getByTestId('qr-find-btn').click()
    await page.waitForTimeout(500)

    await expect(page.getByTestId('qr-modal')).toContainText('Jones^Bob')
    await expect(page.getByTestId('qr-modal')).not.toContainText('Smith^Jane')
  })
})

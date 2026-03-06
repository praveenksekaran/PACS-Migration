import { Page } from '@playwright/test'
import {
  STUDY_UID,
  SERIES_UID,
  SOP_UIDS,
  makeQidoStudy,
  makeQidoSeries,
  makeInstanceList,
  makeWadoMetadata,
} from '../fixtures/dicom'

const API_URL = 'http://3.27.26.186:5001'

// ── App-config mocking ────────────────────────────────────────────────────────

/**
 * Mock /app-config.js to inject window.config.
 * By default sets apiUrl to '' so all requests use relative paths (dev-proxy mode).
 */
export async function mockAppConfig(page: Page, apiUrl = '') {
  await page.route('/app-config.js', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: apiUrl
        ? `window.config = { apiUrl: "${apiUrl}" };`
        : 'window.config = {};',
    })
  })
}

/**
 * Mock /app-config.js to set apiUrl to the test API server.
 */
export async function mockAppConfigWithApiUrl(page: Page) {
  return mockAppConfig(page, API_URL)
}

// ── QIDO-RS mocking ───────────────────────────────────────────────────────────

/** Mock GET /rs/studies to return one study. */
export async function mockQidoStudies(
  page: Page,
  studies = [makeQidoStudy()]
) {
  await page.route('**/rs/studies**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/dicom+json',
      body: JSON.stringify(studies),
    })
  })
}

/** Mock GET /rs/studies/:studyUid/series to return one series. */
export async function mockQidoSeries(
  page: Page,
  studyUid = STUDY_UID,
  seriesList = [makeQidoSeries()]
) {
  await page.route(`**/rs/studies/${studyUid}/series**`, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/dicom+json',
      body: JSON.stringify(seriesList),
    })
  })
}

/** Mock GET /rs/studies/:studyUid/series/:seriesUid/instances. */
export async function mockQidoInstances(
  page: Page,
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID,
  instanceCount = 3
) {
  const instances = makeInstanceList(instanceCount, studyUid, seriesUid)
  await page.route(
    `**/rs/studies/${studyUid}/series/${seriesUid}/instances**`,
    (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/dicom+json',
        body: JSON.stringify(instances),
      })
    }
  )
}

/** Mock GET /rs/studies/:s/series/:s/instances/:s/metadata */
export async function mockWadorsMetadata(
  page: Page,
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID,
  sopUid: string,
  instanceNumber: number
) {
  await page.route(
    `**/rs/studies/${studyUid}/series/${seriesUid}/instances/${sopUid}/metadata**`,
    (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/dicom+json',
        body: JSON.stringify(makeWadoMetadata(studyUid, seriesUid, sopUid, instanceNumber)),
      })
    }
  )
}

/**
 * Mock all metadata endpoints for a series of N instances.
 * Must be called before mockWadorsFrames.
 */
export async function mockSeriesMetadata(
  page: Page,
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID,
  instanceCount = 3
) {
  const sops = SOP_UIDS.slice(0, instanceCount)
  for (let i = 0; i < sops.length; i++) {
    await mockWadorsMetadata(page, studyUid, seriesUid, sops[i], i + 1)
  }
}

/**
 * Mock WADO-RS frames endpoint.
 * Returns a minimal valid-ish multipart response.
 * Cornerstone may not render a real image but the request is fulfilled.
 */
export async function mockWadorsFrames(
  page: Page,
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID
) {
  await page.route(
    `**/rs/studies/${studyUid}/series/${seriesUid}/instances/*/frames/**`,
    (route) => {
      // Minimal multipart response with 4 bytes of pixel data
      const boundary = 'frameboundary'
      const body = [
        `--${boundary}`,
        'Content-Type: application/octet-stream',
        '',
        '\x00\x00\x00\x00',
        `--${boundary}--`,
      ].join('\r\n')
      route.fulfill({
        status: 200,
        headers: {
          'Content-Type': `multipart/related; type="application/octet-stream"; boundary="${boundary}"`,
        },
        body,
      })
    }
  )
}

/**
 * Mock WADO-URI endpoint.
 * Returns a minimal DICOM preamble so the loader doesn't hard-crash.
 * The 128-byte preamble + "DICM" magic + empty dataset.
 */
export async function mockWadoUri(page: Page) {
  await page.route('**/wadouri**', (route) => {
    const buf = Buffer.alloc(132)
    buf.write('DICM', 128, 'ascii')
    route.fulfill({
      status: 200,
      contentType: 'application/dicom',
      body: buf,
    })
  })
}

// ── Compound helpers ──────────────────────────────────────────────────────────

/**
 * Set up all standard mocks needed for a basic series load test.
 * Mocks: app-config, QIDO studies, QIDO series, QIDO instances,
 *        WADO-RS frames, WADO-URI.
 */
export async function setupStandardMocks(
  page: Page,
  instanceCount = 3
) {
  await mockAppConfig(page)
  await mockQidoStudies(page)
  await mockQidoSeries(page)
  await mockQidoInstances(page, STUDY_UID, SERIES_UID, instanceCount)
  await mockSeriesMetadata(page, STUDY_UID, SERIES_UID, instanceCount)
  await mockWadorsFrames(page)
  await mockWadoUri(page)
}

/**
 * Navigate to the app, open the QR modal, search, and click Get All.
 * Waits for the study tree to populate.
 */
export async function loadSeriesViaQR(page: Page) {
  await page.goto('/')
  await page.getByTestId('toolbar-btn-qr').click()
  await page.getByTestId('qr-find-btn').click()
  await page.getByTestId('qr-get-all-btn').click()
  // Wait for modal to close after retrieval
  await page.waitForSelector('[data-testid="qr-modal"]', {
    state: 'hidden',
    timeout: 10_000,
  })
}

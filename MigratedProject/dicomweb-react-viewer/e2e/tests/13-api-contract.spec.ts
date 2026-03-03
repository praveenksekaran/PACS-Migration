import { test, expect } from '@playwright/test'

/**
 * Feature 16: API Endpoint Contract
 * Scenarios 16.1 – 16.10
 *
 * These tests require a running dicomweb-api server.
 * All tests are tagged @api and skipped unless API_SERVER_URL is set.
 *
 * Run with:
 *   API_SERVER_URL=http://localhost:5001 npx playwright test 13-api-contract
 */

const API_BASE = process.env.API_SERVER_URL ?? 'http://localhost:5001'

test.describe('Feature 16: API Endpoint Contract @api', () => {
  test.skip(
    !process.env.API_SERVER_URL,
    'Set API_SERVER_URL env var (e.g. http://localhost:5001) to run API contract tests'
  )

  // ── Scenario 16.1 ───────────────────────────────────────────────────────────
  test('@api 16.1 – GET /rs/studies returns DICOM JSON array', async ({ request }) => {
    const res = await request.get(`${API_BASE}/rs/studies`)
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('application/dicom+json')
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  // ── Scenario 16.2 ───────────────────────────────────────────────────────────
  test('@api 16.2 – GET /rs/studies?PatientName=* returns matching results', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/rs/studies?PatientName=*`)
    expect(res.status()).toBe(200)
    const body = await res.json() as Record<string, unknown>[]
    expect(Array.isArray(body)).toBe(true)
    // Each result should have the PatientName tag
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('00100010')
    }
  })

  // ── Scenario 16.3 ───────────────────────────────────────────────────────────
  test('@api 16.3 – GET /rs/studies/:uid/series returns series list with SeriesInstanceUID', async ({
    request,
  }) => {
    // First get a study UID
    const studiesRes = await request.get(`${API_BASE}/rs/studies`)
    const studies = await studiesRes.json() as Record<string, { Value: string[] }>[]
    if (studies.length === 0) {
      test.skip()
      return
    }
    const studyUid = studies[0]['0020000D']?.Value?.[0]
    expect(studyUid).toBeDefined()

    const seriesRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series`)
    expect(seriesRes.status()).toBe(200)
    const series = await seriesRes.json() as Record<string, unknown>[]
    expect(Array.isArray(series)).toBe(true)
    if (series.length > 0) {
      expect(series[0]).toHaveProperty('0020000E')
    }
  })

  // ── Scenario 16.4 ───────────────────────────────────────────────────────────
  test('@api 16.4 – GET /rs/.../instances returns instance list with SOPInstanceUID', async ({
    request,
  }) => {
    const studiesRes = await request.get(`${API_BASE}/rs/studies`)
    const studies = await studiesRes.json() as Record<string, { Value: string[] }>[]
    if (studies.length === 0) { test.skip(); return }
    const studyUid = studies[0]['0020000D']?.Value?.[0]

    const seriesRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series`)
    const series = await seriesRes.json() as Record<string, { Value: string[] }>[]
    if (series.length === 0) { test.skip(); return }
    const seriesUid = series[0]['0020000E']?.Value?.[0]

    const instRes = await request.get(
      `${API_BASE}/rs/studies/${studyUid}/series/${seriesUid}/instances`
    )
    expect(instRes.status()).toBe(200)
    const instances = await instRes.json() as Record<string, unknown>[]
    expect(Array.isArray(instances)).toBe(true)
    if (instances.length > 0) {
      expect(instances[0]).toHaveProperty('00080018')
    }
  })

  // ── Scenario 16.5 ───────────────────────────────────────────────────────────
  test('@api 16.5 – GET /rs/.../frames/1 returns multipart pixel data', async ({ request }) => {
    const studiesRes = await request.get(`${API_BASE}/rs/studies`)
    const studies = await studiesRes.json() as Record<string, { Value: string[] }>[]
    if (studies.length === 0) { test.skip(); return }
    const studyUid = studies[0]['0020000D']?.Value?.[0]

    const seriesRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series`)
    const series = await seriesRes.json() as Record<string, { Value: string[] }>[]
    if (series.length === 0) { test.skip(); return }
    const seriesUid = series[0]['0020000E']?.Value?.[0]

    const instRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series/${seriesUid}/instances`)
    const instances = await instRes.json() as Record<string, { Value: string[] }>[]
    if (instances.length === 0) { test.skip(); return }
    const sopUid = instances[0]['00080018']?.Value?.[0]

    const framesRes = await request.get(
      `${API_BASE}/rs/studies/${studyUid}/series/${seriesUid}/instances/${sopUid}/frames/1`
    )
    expect(framesRes.status()).toBe(200)
    expect(framesRes.headers()['content-type']).toContain('multipart/related')
  })

  // ── Scenario 16.6 ───────────────────────────────────────────────────────────
  test('@api 16.6 – GET /wadouri returns full DICOM file with DICM magic bytes', async ({
    request,
  }) => {
    const studiesRes = await request.get(`${API_BASE}/rs/studies`)
    const studies = await studiesRes.json() as Record<string, { Value: string[] }>[]
    if (studies.length === 0) { test.skip(); return }
    const studyUid = studies[0]['0020000D']?.Value?.[0]

    const seriesRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series`)
    const series = await seriesRes.json() as Record<string, { Value: string[] }>[]
    if (series.length === 0) { test.skip(); return }
    const seriesUid = series[0]['0020000E']?.Value?.[0]

    const instRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series/${seriesUid}/instances`)
    const instances = await instRes.json() as Record<string, { Value: string[] }>[]
    if (instances.length === 0) { test.skip(); return }
    const sopUid = instances[0]['00080018']?.Value?.[0]

    const wadouriRes = await request.get(
      `${API_BASE}/wadouri?studyUID=${studyUid}&seriesUID=${seriesUid}&objectUID=${sopUid}`
    )
    expect(wadouriRes.status()).toBe(200)

    // Verify DICM magic bytes at offset 128
    const buffer = await wadouriRes.body()
    const magic = buffer.slice(128, 132).toString('ascii')
    expect(magic).toBe('DICM')
  })

  // ── Scenario 16.7 ───────────────────────────────────────────────────────────
  test('@api 16.7 – instance metadata applies default WindowCenter/Width if missing', async ({
    request,
  }) => {
    const studiesRes = await request.get(`${API_BASE}/rs/studies`)
    const studies = await studiesRes.json() as Record<string, { Value: string[] }>[]
    if (studies.length === 0) { test.skip(); return }
    const studyUid = studies[0]['0020000D']?.Value?.[0]

    const seriesRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series`)
    const series = await seriesRes.json() as Record<string, { Value: string[] }>[]
    if (series.length === 0) { test.skip(); return }
    const seriesUid = series[0]['0020000E']?.Value?.[0]

    const instRes = await request.get(`${API_BASE}/rs/studies/${studyUid}/series/${seriesUid}/instances`)
    const instances = await instRes.json() as Record<string, { Value: string[] }>[]
    if (instances.length === 0) { test.skip(); return }
    const sopUid = instances[0]['00080018']?.Value?.[0]

    const metaRes = await request.get(
      `${API_BASE}/rs/studies/${studyUid}/series/${seriesUid}/instances/${sopUid}/metadata`
    )
    expect(metaRes.status()).toBe(200)
    const meta = await metaRes.json() as Record<string, { Value: string[] }>[]
    // WindowCenter and WindowWidth should be present (server applies defaults)
    const firstMeta = meta[0] ?? {}
    expect(firstMeta['00281050'] ?? firstMeta['00281051']).toBeDefined()
  })

  // ── Scenario 16.8 ───────────────────────────────────────────────────────────
  test('@api 16.8 – GET /rs/studies?PatientName=ZZZNOMATCH* returns empty array', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/rs/studies?PatientName=ZZZNOMATCH*`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  // ── Scenario 16.9 ───────────────────────────────────────────────────────────
  test('@api 16.9 – frames endpoint returns 404 for non-existent instance', async ({
    request,
  }) => {
    const res = await request.get(
      `${API_BASE}/rs/studies/1.2.3/series/4.5.6/instances/0.0.0.0/frames/1`
    )
    expect(res.status()).toBe(404)
  })

  // ── Scenario 16.10 ──────────────────────────────────────────────────────────
  test('@api 16.10 – WADO-URI returns error when required parameters are missing', async ({
    request,
  }) => {
    const res = await request.get(`${API_BASE}/wadouri`)
    // Expect an error status (400, 500, etc.)
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})

/**
 * DICOM JSON test fixtures shared across all E2E spec files.
 *
 * UIDs use the 1.2.276.0.7230010 prefix (reserved for testing/examples).
 */

export const STUDY_UID = '1.2.276.0.7230010.3.1.2.1000000001'
export const SERIES_UID = '1.2.276.0.7230010.3.1.3.1000000001'
export const SERIES_UID_2 = '1.2.276.0.7230010.3.1.3.1000000002'

export const SOP_UIDS = [
  '1.2.276.0.7230010.3.1.4.1000000001',
  '1.2.276.0.7230010.3.1.4.1000000002',
  '1.2.276.0.7230010.3.1.4.1000000003',
  '1.2.276.0.7230010.3.1.4.1000000004',
  '1.2.276.0.7230010.3.1.4.1000000005',
]

// Patient used in the primary fixture
export const PATIENT_NAME = 'Smith^Jane'
export const PATIENT_ID = '00456'

// ── DICOM JSON builders ───────────────────────────────────────────────────────

/** Build a QIDO-RS study-level response object (one element of the array). */
export function makeQidoStudy(overrides: Record<string, unknown> = {}) {
  return {
    '0020000D': { vr: 'UI', Value: [STUDY_UID] },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: PATIENT_NAME }] },
    '00100020': { vr: 'LO', Value: [PATIENT_ID] },
    '00100040': { vr: 'CS', Value: ['F'] },
    '00081030': { vr: 'LO', Value: ['Chest X-Ray'] },
    '00080020': { vr: 'DA', Value: ['20240115'] },
    '00080030': { vr: 'TM', Value: ['103045'] },
    '00081090': { vr: 'LO', Value: ['SOMATOM CT'] },
    ...overrides,
  }
}

/** Build a QIDO-RS series-level response object. */
export function makeQidoSeries(
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID,
  overrides: Record<string, unknown> = {}
) {
  return {
    '0020000D': { vr: 'UI', Value: [studyUid] },
    '0020000E': { vr: 'UI', Value: [seriesUid] },
    '00080060': { vr: 'CS', Value: ['CT'] },
    '00180015': { vr: 'CS', Value: ['CHEST'] },
    '0008103E': { vr: 'LO', Value: ['Chest AP'] },
    '00200011': { vr: 'IS', Value: [1] },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: PATIENT_NAME }] },
    '00100020': { vr: 'LO', Value: [PATIENT_ID] },
    ...overrides,
  }
}

/** Build a QIDO-RS instance-level response object. */
export function makeQidoInstance(
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID,
  sopUid: string,
  instanceNumber: number,
  overrides: Record<string, unknown> = {}
) {
  return {
    '0020000D': { vr: 'UI', Value: [studyUid] },
    '0020000E': { vr: 'UI', Value: [seriesUid] },
    '00080018': { vr: 'UI', Value: [sopUid] },
    '00200013': { vr: 'IS', Value: [instanceNumber] },
    '00080060': { vr: 'CS', Value: ['CT'] },
    '00100010': { vr: 'PN', Value: [{ Alphabetic: PATIENT_NAME }] },
    '00100020': { vr: 'LO', Value: [PATIENT_ID] },
    '00281050': { vr: 'DS', Value: ['40'] },
    '00281051': { vr: 'DS', Value: ['400'] },
    ...overrides,
  }
}

/** Build a WADO-RS instance metadata response (array of one element). */
export function makeWadoMetadata(
  studyUid = STUDY_UID,
  seriesUid = SERIES_UID,
  sopUid: string,
  instanceNumber: number
) {
  return [
    {
      '0020000D': { vr: 'UI', Value: [studyUid] },
      '0020000E': { vr: 'UI', Value: [seriesUid] },
      '00080018': { vr: 'UI', Value: [sopUid] },
      '00200013': { vr: 'IS', Value: [instanceNumber] },
      '00280010': { vr: 'US', Value: [512] },
      '00280011': { vr: 'US', Value: [512] },
      '00280100': { vr: 'US', Value: [16] },
      '00280101': { vr: 'US', Value: [12] },
      '00280103': { vr: 'US', Value: [0] },
      '00280030': { vr: 'DS', Value: ['0.625', '0.625'] },
      '00200037': { vr: 'DS', Value: ['1', '0', '0', '0', '1', '0'] },
      '00200032': { vr: 'DS', Value: ['0', '0', `${(instanceNumber - 1) * 5}`] },
      '00281050': { vr: 'DS', Value: ['40'] },
      '00281051': { vr: 'DS', Value: ['400'] },
      '00080060': { vr: 'CS', Value: ['CT'] },
      '00100010': { vr: 'PN', Value: [{ Alphabetic: PATIENT_NAME }] },
      '00100020': { vr: 'LO', Value: [PATIENT_ID] },
      '00100040': { vr: 'CS', Value: ['F'] },
      '00081030': { vr: 'LO', Value: ['Chest X-Ray'] },
      '00080020': { vr: 'DA', Value: ['20240115'] },
      '00080030': { vr: 'TM', Value: ['103045'] },
      '00081090': { vr: 'LO', Value: ['SOMATOM CT'] },
      '00200011': { vr: 'IS', Value: [1] },
    },
  ]
}

/** Generate N instances for a series, instanceNumbers starting at 1. */
export function makeInstanceList(n: number, studyUid = STUDY_UID, seriesUid = SERIES_UID) {
  return SOP_UIDS.slice(0, n).map((sopUid, i) =>
    makeQidoInstance(studyUid, seriesUid, sopUid, i + 1)
  )
}

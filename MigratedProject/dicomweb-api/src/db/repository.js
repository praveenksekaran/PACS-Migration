const db = require('./connection');

// ---------------------------------------------------------------------------
// DICOM tag → { alias, col, vr } mapping
// alias: SQL table alias used in queries (st=studies, sr=series, inst=instances)
// col:   column name in that table (null = computed or fixed value)
// ---------------------------------------------------------------------------
const TAG_MAP = {
  '00080005': { alias: null,   col: null,                      vr: 'CS', fixed: ['ISO_IR 192'] },
  '00080020': { alias: 'st',   col: 'study_date',              vr: 'DA' },
  '00080030': { alias: 'st',   col: 'study_time',              vr: 'TM' },
  '00080050': { alias: 'st',   col: 'accession_number',        vr: 'SH' },
  '00080054': { alias: null,   col: null,                      vr: 'AE', fixed: ['DICOMWEB_PACS'] },
  '00080056': { alias: null,   col: null,                      vr: 'CS', fixed: ['ONLINE'] },
  '00080060': { alias: 'sr',   col: 'modality',                vr: 'CS' },
  '00080061': { alias: null,   col: 'modalities_in_study',     vr: 'CS', computed: true },
  '00080090': { alias: 'st',   col: 'referring_physician_name', vr: 'PN' },
  '0008103E': { alias: 'sr',   col: 'series_description',      vr: 'LO' },
  '00081190': { alias: null,   col: null,                      vr: 'UR', skip: true },
  '00100010': { alias: 'st',   col: 'patient_name',            vr: 'PN' },
  '00100020': { alias: 'st',   col: 'patient_id',              vr: 'LO' },
  '00100030': { alias: 'st',   col: 'patient_birth_date',      vr: 'DA' },
  '00100040': { alias: 'st',   col: 'patient_sex',             vr: 'CS' },
  '0020000D': { alias: 'st',   col: 'study_instance_uid',      vr: 'UI' },
  '0020000E': { alias: 'sr',   col: 'series_instance_uid',     vr: 'UI' },
  '00200010': { alias: 'st',   col: 'study_id',                vr: 'SH' },
  '00200011': { alias: 'sr',   col: 'series_number',           vr: 'IS' },
  '00200032': { alias: 'inst', col: 'image_position_patient',  vr: 'DS' },
  '00200037': { alias: 'inst', col: 'image_orientation_patient', vr: 'DS' },
  '00201206': { alias: null,   col: 'series_count',            vr: 'IS', computed: true },
  '00201208': { alias: null,   col: 'instance_count',          vr: 'IS', computed: true },
  '00201209': { alias: null,   col: 'instance_count',          vr: 'IS', computed: true },
  '00280002': { alias: 'inst', col: 'samples_per_pixel',       vr: 'US' },
  '00280004': { alias: 'inst', col: 'photometric_interpretation', vr: 'CS' },
  '00280010': { alias: 'inst', col: 'rows',                    vr: 'US' },
  '00280011': { alias: 'inst', col: 'columns',                 vr: 'US' },
  '00280030': { alias: 'inst', col: 'pixel_spacing',           vr: 'DS' },
  '00280100': { alias: 'inst', col: 'bits_allocated',          vr: 'US' },
  '00280101': { alias: 'inst', col: 'bits_stored',             vr: 'US' },
  '00280102': { alias: 'inst', col: 'high_bit',                vr: 'US' },
  '00280103': { alias: 'inst', col: 'pixel_representation',    vr: 'US' },
  '00281050': { alias: 'inst', col: 'window_center',           vr: 'DS' },
  '00281051': { alias: 'inst', col: 'window_width',            vr: 'DS' },
  '00281052': { alias: 'inst', col: 'rescale_intercept',       vr: 'DS' },
  '00281053': { alias: 'inst', col: 'rescale_slope',           vr: 'DS' },
  '00080016': { alias: 'inst', col: 'sop_class_uid',           vr: 'UI' },
  '00080018': { alias: 'inst', col: 'sop_instance_uid',        vr: 'UI' },
};

// ---------------------------------------------------------------------------
// Build a single DICOM+JSON tag entry from a DB row
// ---------------------------------------------------------------------------
function tagEntry(tag, row) {
  const m = TAG_MAP[tag];
  if (!m || m.skip) return null;

  // Fixed value (e.g. Retrieve AE Title, Instance Availability)
  if (m.fixed !== undefined) {
    return { vr: m.vr, Value: m.fixed };
  }

  const value = m.col !== null ? row[m.col] : undefined;
  if (value === null || value === undefined) return null;

  switch (m.vr) {
    case 'PN':
      return { vr: 'PN', Value: [{ Alphabetic: String(value) }] };
    case 'IS':
    case 'US': {
      const n = parseInt(value, 10);
      return Number.isNaN(n) ? null : { vr: m.vr, Value: [n] };
    }
    case 'CS':
      return { vr: 'CS', Value: Array.isArray(value) ? value : [String(value)] };
    default:
      return { vr: m.vr, Value: [String(value)] };
  }
}

// ---------------------------------------------------------------------------
// Build DICOM+JSON response array from DB rows + requested tags
// ---------------------------------------------------------------------------
function buildDicomResponse(rows, requestedTags) {
  return rows.map((row) => {
    const obj = {};
    for (const tag of requestedTags) {
      const entry = tagEntry(tag, row);
      if (entry !== null) {
        obj[tag] = entry;
      }
    }
    return obj;
  });
}

// ---------------------------------------------------------------------------
// Build SQL WHERE clause from parsed conditions
// conditions: [{ tag, value, vr }] — produced by utils.doFindPg
// ---------------------------------------------------------------------------
function buildWhere(conditions) {
  const clauses = [];
  const values = [];
  let idx = 1;

  const STRING_VRS = ['PN', 'LO', 'LT', 'SH', 'ST', 'AE'];

  for (const cond of conditions) {
    const m = TAG_MAP[cond.tag];
    if (!m || !m.col || m.computed || m.fixed !== undefined) continue;

    const colRef = `${m.alias}.${m.col}`;
    if (STRING_VRS.includes(cond.vr) && String(cond.value).endsWith('%')) {
      clauses.push(`${colRef} ILIKE $${idx}`);
    } else {
      clauses.push(`${colRef} = $${idx}`);
    }
    values.push(cond.value);
    idx += 1;
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

// ---------------------------------------------------------------------------
// Query: STUDY level
// ---------------------------------------------------------------------------
async function findStudies(conditions, offset) {
  const { sql: where, values } = buildWhere(conditions);
  const offsetIdx = values.length + 1;

  const result = await db.query(
    `SELECT
       st.study_instance_uid, st.patient_id, st.patient_name,
       st.patient_birth_date, st.patient_sex, st.study_date, st.study_time,
       st.accession_number, st.study_id, st.referring_physician_name,
       ARRAY_AGG(DISTINCT sr.modality) FILTER (WHERE sr.modality IS NOT NULL) AS modalities_in_study,
       COUNT(DISTINCT sr.series_instance_uid) AS series_count,
       COUNT(inst.sop_instance_uid) AS instance_count
     FROM studies st
     LEFT JOIN series sr   ON sr.study_instance_uid = st.study_instance_uid
     LEFT JOIN instances inst ON inst.study_instance_uid = st.study_instance_uid
     ${where}
     GROUP BY st.id
     ORDER BY st.study_date DESC NULLS LAST
     OFFSET $${offsetIdx}`,
    [...values, offset]
  );

  return result.rows;
}

// ---------------------------------------------------------------------------
// Query: SERIES level
// ---------------------------------------------------------------------------
async function findSeries(conditions, offset) {
  const { sql: where, values } = buildWhere(conditions);
  const offsetIdx = values.length + 1;

  const result = await db.query(
    `SELECT
       sr.series_instance_uid, sr.modality, sr.series_description, sr.series_number,
       st.study_instance_uid, st.patient_id, st.patient_name,
       st.patient_birth_date, st.patient_sex, st.study_date, st.study_time,
       st.accession_number, st.study_id, st.referring_physician_name,
       COUNT(inst.sop_instance_uid) AS instance_count
     FROM series sr
     JOIN studies st   ON st.study_instance_uid = sr.study_instance_uid
     LEFT JOIN instances inst ON inst.series_instance_uid = sr.series_instance_uid
     ${where}
     GROUP BY sr.id, st.id
     ORDER BY sr.series_number NULLS LAST
     OFFSET $${offsetIdx}`,
    [...values, offset]
  );

  return result.rows;
}

// ---------------------------------------------------------------------------
// Query: IMAGE level
// ---------------------------------------------------------------------------
async function findInstances(conditions, offset) {
  const { sql: where, values } = buildWhere(conditions);
  const offsetIdx = values.length + 1;

  const result = await db.query(
    `SELECT
       inst.sop_instance_uid, inst.sop_class_uid,
       inst.samples_per_pixel, inst.photometric_interpretation,
       inst.rows, inst.columns, inst.pixel_spacing,
       inst.bits_allocated, inst.bits_stored, inst.high_bit, inst.pixel_representation,
       inst.window_center, inst.window_width, inst.rescale_intercept, inst.rescale_slope,
       inst.image_position_patient, inst.image_orientation_patient,
       sr.series_instance_uid, sr.modality, sr.series_description, sr.series_number,
       st.study_instance_uid, st.patient_id, st.patient_name, st.study_date
     FROM instances inst
     JOIN series sr  ON sr.series_instance_uid = inst.series_instance_uid
     JOIN studies st ON st.study_instance_uid  = inst.study_instance_uid
     ${where}
     ORDER BY inst.id
     OFFSET $${offsetIdx}`,
    [...values, offset]
  );

  return result.rows;
}

// ---------------------------------------------------------------------------
// Entry point called from utils.doFindPg
// ---------------------------------------------------------------------------
async function doFind(queryLevel, conditions, requestedTags, offset) {
  let rows;
  if (queryLevel === 'STUDY') {
    rows = await findStudies(conditions, offset);
  } else if (queryLevel === 'SERIES') {
    rows = await findSeries(conditions, offset);
  } else {
    rows = await findInstances(conditions, offset);
  }
  return buildDicomResponse(rows, requestedTags);
}

// ---------------------------------------------------------------------------
// Upsert a single DICOM instance (called from storescu.js and migration script)
// ---------------------------------------------------------------------------
async function upsertInstance(meta) {
  await db.query(
    `INSERT INTO studies
       (study_instance_uid, patient_id, patient_name, patient_birth_date, patient_sex,
        study_date, study_time, accession_number, study_id, referring_physician_name)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (study_instance_uid) DO UPDATE SET
       patient_id               = EXCLUDED.patient_id,
       patient_name             = EXCLUDED.patient_name,
       patient_birth_date       = EXCLUDED.patient_birth_date,
       patient_sex              = EXCLUDED.patient_sex,
       study_date               = EXCLUDED.study_date,
       study_time               = EXCLUDED.study_time,
       accession_number         = EXCLUDED.accession_number,
       study_id                 = EXCLUDED.study_id,
       referring_physician_name = EXCLUDED.referring_physician_name`,
    [
      meta.studyInstanceUid, meta.patientId, meta.patientName,
      meta.patientBirthDate, meta.patientSex, meta.studyDate, meta.studyTime,
      meta.accessionNumber, meta.studyId, meta.referringPhysicianName,
    ]
  );

  await db.query(
    `INSERT INTO series
       (series_instance_uid, study_instance_uid, modality, series_description, series_number)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (series_instance_uid) DO UPDATE SET
       modality           = EXCLUDED.modality,
       series_description = EXCLUDED.series_description,
       series_number      = EXCLUDED.series_number`,
    [meta.seriesInstanceUid, meta.studyInstanceUid, meta.modality, meta.seriesDescription, meta.seriesNumber]
  );

  await db.query(
    `INSERT INTO instances
       (sop_instance_uid, series_instance_uid, study_instance_uid, sop_class_uid,
        samples_per_pixel, photometric_interpretation, rows, columns, pixel_spacing,
        bits_allocated, bits_stored, high_bit, pixel_representation,
        window_center, window_width, rescale_intercept, rescale_slope,
        image_position_patient, image_orientation_patient, file_path)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     ON CONFLICT (sop_instance_uid) DO NOTHING`,
    [
      meta.sopInstanceUid, meta.seriesInstanceUid, meta.studyInstanceUid, meta.sopClassUid,
      meta.samplesPerPixel, meta.photometricInterpretation, meta.rows, meta.columns, meta.pixelSpacing,
      meta.bitsAllocated, meta.bitsStored, meta.highBit, meta.pixelRepresentation,
      meta.windowCenter, meta.windowWidth, meta.rescaleIntercept, meta.rescaleSlope,
      meta.imagePositionPatient, meta.imageOrientationPatient, meta.filePath,
    ]
  );
}

module.exports = { doFind, upsertInstance };

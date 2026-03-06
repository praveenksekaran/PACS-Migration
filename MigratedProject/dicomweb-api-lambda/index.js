/* eslint-disable no-console */
const {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const dicomParser = require('dicom-parser');

// ---------------------------------------------------------------------------
// AWS clients — initialised once per Lambda container (warm reuse)
// ---------------------------------------------------------------------------
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-2' });

// Keep the pool small — Lambda concurrency handles scale-out
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:      { rejectUnauthorized: false },
      max: 2,
    });
  }
  return pool;
}

// ---------------------------------------------------------------------------
// Stream an S3 response body into a Buffer
// ---------------------------------------------------------------------------
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ---------------------------------------------------------------------------
// Extract DICOM metadata from a Buffer
// Returns null if the buffer is not a valid DICOM file or missing key UIDs
// ---------------------------------------------------------------------------
function extractMetadata(data, filePath) {
  const dataset = dicomParser.parseDicom(data);

  function str(tag) {
    try { return dataset.string(tag)?.trim() || null; } catch { return null; }
  }
  function intStr(tag) {
    try {
      const v = dataset.intString(tag);
      return (v != null && !Number.isNaN(v)) ? v : null;
    } catch { return null; }
  }

  const studyInstanceUid  = str('x0020000d');
  const seriesInstanceUid = str('x0020000e');
  const sopInstanceUid    = str('x00080018');

  if (!studyInstanceUid || !seriesInstanceUid || !sopInstanceUid) return null;

  return {
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid,
    sopClassUid:               str('x00080016'),
    patientId:                 str('x00100020'),
    patientName:               str('x00100010'),
    patientBirthDate:          str('x00100030'),
    patientSex:                str('x00100040'),
    studyDate:                 str('x00080020'),
    studyTime:                 str('x00080030'),
    accessionNumber:           str('x00080050'),
    studyId:                   str('x00200010'),
    referringPhysicianName:    str('x00080090'),
    modality:                  str('x00080060'),
    seriesDescription:         str('x0008103e'),
    seriesNumber:              intStr('x00200011'),
    samplesPerPixel:           intStr('x00280002'),
    photometricInterpretation: str('x00280004'),
    rows:                      intStr('x00280010'),
    columns:                   intStr('x00280011'),
    pixelSpacing:              str('x00280030'),
    bitsAllocated:             intStr('x00280100'),
    bitsStored:                intStr('x00280101'),
    highBit:                   intStr('x00280102'),
    pixelRepresentation:       intStr('x00280103'),
    windowCenter:              str('x00281050'),
    windowWidth:               str('x00281051'),
    rescaleIntercept:          str('x00281052'),
    rescaleSlope:              str('x00281053'),
    imagePositionPatient:      str('x00200032'),
    imageOrientationPatient:   str('x00200037'),
    filePath,
  };
}

// ---------------------------------------------------------------------------
// Upsert study → series → instance into PostgreSQL RDS
// ---------------------------------------------------------------------------
async function upsertInstance(client, meta) {
  await client.query(
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

  await client.query(
    `INSERT INTO series
       (series_instance_uid, study_instance_uid, modality, series_description, series_number)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (series_instance_uid) DO UPDATE SET
       modality           = EXCLUDED.modality,
       series_description = EXCLUDED.series_description,
       series_number      = EXCLUDED.series_number`,
    [meta.seriesInstanceUid, meta.studyInstanceUid, meta.modality, meta.seriesDescription, meta.seriesNumber]
  );

  await client.query(
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

// ---------------------------------------------------------------------------
// Lambda handler — triggered by S3 ObjectCreated events on dicomweb-import
// ---------------------------------------------------------------------------
exports.handler = async (event) => {
  const importBucket = process.env.IMPORT_BUCKET;
  const dataBucket   = process.env.DATA_BUCKET;
  const db = getPool();

  for (const record of event.Records) {
    const rawKey = record.s3.object.key;
    const key    = decodeURIComponent(rawKey.replace(/\+/g, ' '));

    console.log(`Processing: s3://${importBucket}/${key}`);

    // 1. Download from import bucket
    let data;
    try {
      const response = await s3.send(new GetObjectCommand({ Bucket: importBucket, Key: key }));
      data = await streamToBuffer(response.Body);
    } catch (err) {
      console.error(`Failed to download ${key}:`, err.message);
      continue;
    }

    // 2. Parse DICOM metadata
    let meta;
    try {
      const destKey = `placeholder`; // filled after UID extraction
      meta = extractMetadata(data, destKey);
    } catch (err) {
      console.warn(`Skipping non-DICOM file ${key}:`, err.message);
      continue;
    }

    if (!meta) {
      console.warn(`Skipping ${key}: missing required DICOM UIDs`);
      continue;
    }

    // 3. Determine destination S3 key and update filePath in metadata
    const destKey = `${meta.studyInstanceUid}/${meta.sopInstanceUid}`;
    meta.filePath = `s3://${dataBucket}/${destKey}`;

    // 4. Copy file to data bucket
    try {
      await s3.send(new CopyObjectCommand({
        CopySource: `${importBucket}/${key}`,
        Bucket: dataBucket,
        Key: destKey,
      }));
      console.log(`  Copied to s3://${dataBucket}/${destKey}`);
    } catch (err) {
      console.error(`Failed to copy ${key} to data bucket:`, err.message);
      continue;
    }

    // 5. Upsert metadata into PostgreSQL RDS
    try {
      await upsertInstance(db, meta);
      console.log(`  Metadata upserted for SOPInstanceUID: ${meta.sopInstanceUid}`);
    } catch (err) {
      console.error(`Failed to upsert metadata for ${key}:`, err.message);
      // Don't delete from import if DB write failed — allows retry
      continue;
    }

    // 6. Delete from import bucket
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: importBucket, Key: key }));
      console.log(`  Deleted from import bucket: ${key}`);
    } catch (err) {
      // Non-fatal — file will be re-triggered but upsert is idempotent
      console.warn(`Could not delete ${key} from import bucket:`, err.message);
    }
  }

  return { statusCode: 200 };
};

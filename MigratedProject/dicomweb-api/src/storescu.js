/* eslint-disable no-console */
// Local import script: walks ./import/, parses DICOM files, upserts to PostgreSQL.
// For cloud imports use: npm run upload (S3 → Lambda → RDS)
const path = require('path');
const fs = require('fs');
const walk = require('fs-walk');
const dicomParser = require('dicom-parser');
const config = require('config');
const repository = require('./db/repository');

const importPath = path.join(__dirname, '../import');
const storagePath = config.get('storagePath');

function extractMetadata(filePath) {
  const data = fs.readFileSync(filePath);
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

  const studyInstanceUid = str('x0020000d');
  const seriesInstanceUid = str('x0020000e');
  const sopInstanceUid = str('x00080018');

  if (!studyInstanceUid || !seriesInstanceUid || !sopInstanceUid) return null;

  return {
    studyInstanceUid,
    seriesInstanceUid,
    sopInstanceUid,
    sopClassUid: str('x00080016'),
    patientId: str('x00100020'),
    patientName: str('x00100010'),
    patientBirthDate: str('x00100030'),
    patientSex: str('x00100040'),
    studyDate: str('x00080020'),
    studyTime: str('x00080030'),
    accessionNumber: str('x00080050'),
    studyId: str('x00200010'),
    referringPhysicianName: str('x00080090'),
    modality: str('x00080060'),
    seriesDescription: str('x0008103e'),
    seriesNumber: intStr('x00200011'),
    samplesPerPixel: intStr('x00280002'),
    photometricInterpretation: str('x00280004'),
    rows: intStr('x00280010'),
    columns: intStr('x00280011'),
    pixelSpacing: str('x00280030'),
    bitsAllocated: intStr('x00280100'),
    bitsStored: intStr('x00280101'),
    highBit: intStr('x00280102'),
    pixelRepresentation: intStr('x00280103'),
    windowCenter: str('x00281050'),
    windowWidth: str('x00281051'),
    rescaleIntercept: str('x00281052'),
    rescaleSlope: str('x00281053'),
    imagePositionPatient: str('x00200032'),
    imageOrientationPatient: str('x00200037'),
    filePath: path.join(storagePath, studyInstanceUid, sopInstanceUid),
  };
}

async function importToPg() {
  const files = [];
  walk.walkSync(importPath, (basedir, filename, stat) => {
    if (stat.isFile()) {
      files.push(path.join(basedir, filename));
    }
  });

  let success = 0;
  let skipped = 0;

  for (const filePath of files) {
    try {
      const meta = extractMetadata(filePath);
      if (meta) {
        await repository.upsertInstance(meta);
        success += 1;
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  console.log(`PG import complete: ${success} upserted, ${skipped} skipped.`);
}

importToPg().catch(console.error);

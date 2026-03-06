/* eslint-disable no-console */
/**
 * Uploads all files from ./import/ to the dicomweb-import S3 bucket.
 * This replaces `npm run import` (DIMSE-based) for the cloud workflow.
 *
 * Usage:  npm run upload
 *
 * After upload, the Lambda function is triggered automatically for each file
 * and will parse the DICOM metadata, store it in RDS PostgreSQL, and move
 * the file to the dicomweb-data bucket.
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const config = require('config');
const path = require('path');
const fs = require('fs');
const walk = require('fs-walk');

const client = new S3Client({ region: config.get('aws.region') });
const importBucket = config.get('aws.importBucket');
const importPath = path.join(__dirname, '../../import');

async function upload() {
  if (!fs.existsSync(importPath)) {
    console.error(`Import directory not found: ${importPath}`);
    process.exit(1);
  }

  const files = [];
  walk.walkSync(importPath, (basedir, filename, stat) => {
    if (stat.isFile()) {
      files.push(path.join(basedir, filename));
    }
  });

  if (files.length === 0) {
    console.log('No files found in ./import/');
    return;
  }

  console.log(`Uploading ${files.length} file(s) to s3://${importBucket}/`);

  let success = 0;
  for (const filePath of files) {
    const key = path.relative(importPath, filePath).replace(/\\/g, '/');
    const body = fs.readFileSync(filePath);
    await client.send(new PutObjectCommand({ Bucket: importBucket, Key: key, Body: body }));
    console.log(`  Uploaded: ${key}`);
    success += 1;
  }

  console.log(`\nDone. ${success} file(s) uploaded to s3://${importBucket}/`);
  console.log('Lambda will process each file automatically and move it to dicomweb-data.');
}

upload().catch((err) => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});

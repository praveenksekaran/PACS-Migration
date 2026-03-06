const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const config = require('config');

const client = new S3Client({ region: config.get('aws.region') });

async function getObjectBuffer(bucket, key) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = { getObjectBuffer };

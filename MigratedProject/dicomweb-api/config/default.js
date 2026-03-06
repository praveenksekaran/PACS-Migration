const config = {

  logDir: './logs',
  storagePath: './data',

  // Port this API server listens on
  apiPort: 5001,

  // Origin of the viewer — used to configure CORS so the browser allows cross-origin requests
  viewerOrigin: 'http://localhost:3000',

  qidoMinChars: 0,
  qidoAppendWildcard: true,

  // AWS — S3 buckets for DICOM import (drop zone) and permanent storage
  aws: {
    region: 'ap-south-2',
    importBucket: 'dicomweb-import',
    dataBucket: 'dicomweb-data',
  },

  // PostgreSQL connection — override in config/local.js or via NODE_CONFIG env var
  db: {
    host: '<host url>',
    port: 5432,
    database: 'dicomweb',
    user: 'postgres',
    password: '<password>',
  },
};

module.exports = config;

const config = {

  source: {
    aet: "DICOMWEB_PACS",
    ip: "127.0.0.1",
    port: "8888"
  },
  peers: [
    {
      aet: "CONQUESTSRV1",
      ip: "127.0.0.1",
      port: "5678"
    }],

  /*
  Supported Transfer Syntaxes:
  1.2.840.10008.1.2       Implicit VR Endian: Default Transfer Syntax for DICOM
  1.2.840.10008.1.2.1     Explicit VR Little Endian
  1.2.840.10008.1.2.2     Explicit VR Big Endian
  1.2.840.10008.1.2.4.50  JPEG Baseline (Process 1) - Lossy JPEG 8-bit Image Compression
  1.2.840.10008.1.2.4.51  JPEG Baseline (Processes 2 & 4) - Lossy JPEG 12-bit Image Compression
  1.2.840.10008.1.2.4.70  JPEG Lossless, Nonhierarchical, First-Order Prediction
  1.2.840.10008.1.2.4.80  JPEG-LS Lossless Image Compression   <-- recommended
  1.2.840.10008.1.2.4.81  JPEG-LS Lossy (Near-Lossless) Image Compression
  1.2.840.10008.1.2.4.90  JPEG 2000 Image Compression (Lossless Only)
  1.2.840.10008.1.2.4.91  JPEG 2000 Image Compression
  1.2.840.10008.1.2.5     RLE Lossless
  */

  // transfer syntax used for transmission via wado and proposed to peers
  transferSyntax: '1.2.840.10008.1.2',
  logDir: './logs',
  storagePath: './data',

  // Port this API server listens on
  apiPort: 5001,

  // Origin of the viewer — used to configure CORS so the browser allows cross-origin requests
  viewerOrigin: 'http://localhost:3000',

  qidoMinChars: 0,
  qidoAppendWildcard: true,
  permissiveMode: true,
  verboseLogging: false,
};

module.exports = config;

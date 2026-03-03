# PACS-Migration
simple project to show code modernization using AI 

# Dicomweb-Server
  The dicom-dimse-native library (a native C++ binding wrapping DCMTK) handles the DICOM C-STORE negotiation. The
  receiving node at 127.0.0.1:8888 (the same dicomweb-api server's built-in DIMSE listener) accepts the files and writes
   them to the data/ storage directory — the same store that the QIDO/WADO/STOW REST endpoints read from.

  In short

  npm run import = bulk-load all the test DICOM files from import/ into the PACS database so they become available via
  the DICOMweb REST API (/rs/studies, /rs/studies/.../series, WADO-RS frames, WADO-URI, etc.).

  You run this once to seed the PACS with test data before using the React viewer.

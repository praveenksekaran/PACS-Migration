# Test Results — dicomweb-react-viewer

**Date:** 2026-03-05

---

## Unit Tests (Vitest)

**Result: 246 / 246 PASSED**
- Test files: 26 passed
- Duration: 63.37s

### Files
| File | Tests |
|---|---|
| viewerStore.test.ts | 33 passed |
| studyTreeStore.test.ts | 14 passed |
| QRModal.test.tsx | 14 passed |
| qrStore.test.ts | 15 passed |
| Toolbar.test.tsx | 18 passed |
| MPRViewer.test.tsx | 8 passed |
| StudyTree.test.tsx | 8 passed |
| Viewer2D.test.tsx | 10 passed |
| CornerOverlay.test.tsx | 9 passed |
| dicomWebClient.test.ts | 9 passed |
| buildChunks.test.ts | 10 passed |
| config.test.ts | 6 passed |
| cornerstone.test.ts | 8 passed |
| InstanceSlider.test.tsx | 7 passed |
| volumeLoader.test.ts | 4 passed |
| toolStore.test.ts | 9 passed |
| App.test.tsx | 3 passed |
| LayoutToggle.test.tsx | 5 passed |
| MenuBar.test.tsx | 5 passed |
| Shell.test.tsx | 5 passed |
| ViewportPanel.test.tsx | 4 passed |
| dicomUtils.test.ts | 5 passed |
| StatusBar.test.tsx | 3 passed |
| statusStore.test.ts | 3 passed |
| uiStore.test.ts | 3 passed |

### Notes
- MPRViewer tests emit `act(...)` warnings (cosmetic only — all tests pass)

---

## E2E Tests (Playwright)

**Status: STOPPED by user during run**
- Results below are from the partial run (tests 1–67 of 111)

### Partial Results (67 of 111 run)

| # | Test | Result |
|---|---|---|
| 1 | 1.1 reads apiUrl from server-injected window.config | FAIL |
| 2 | 1.2 falls back to relative paths when window.config is absent | PASS |
| 3 | 1.3 cornerstone3D initialises before any viewport renders | PASS |
| 4 | 1.4 shell renders all main layout regions | FAIL |
| 5 | 1.5 SharedArrayBuffer is available (COOP/COEP headers set) | PASS |
| 6 | 2.1 opens QR modal from toolbar button with correct initial state | FAIL |
| 7 | 2.2 opens QR modal from menu bar Q/R item | FAIL |
| 8 | 2.3 searches by Patient Name and populates results table | PASS |
| 9 | 2.4 searches by Patient ID without wildcard suffix | FAIL |
| 10 | 2.5 empty search text sends wildcard PatientName=* | PASS |
| 11 | 2.6 results table displays correct columns | PASS |
| 12 | 2.7 PN DICOM tag Alphabetic subfield is displayed correctly | FAIL |
| 13 | 2.8 missing DICOM tag renders as empty string without errors | PASS |
| 14 | 2.9 all result rows are checked by default | PASS |
| 15 | 2.10 user can deselect individual rows | PASS |
| 16 | 2.11 Get Selected loads only checked series | PASS |
| 17 | 2.12 Get All loads every series regardless of checkbox state | PASS |
| 18 | 2.13 Cancel closes the modal without making API calls | PASS |
| 19 | 2.14 modal close button hides the modal | FAIL |
| 20 | 2.15 network error during QIDO search is shown in status bar | PASS |
| 21 | 2.16 new search clears previous results | FAIL |
| 22 | 3.1 tree builds Patient → Study → Series → Instance hierarchy | FAIL |
| 23 | 3.2 patient node label shows Patient Name | FAIL |
| 24 | 3.3 study node label shows Modality | FAIL |
| 25 | 3.4 series node label shows Series Description | FAIL |
| 26 | 3.5 series node has non-empty label when description is missing | FAIL |
| 27 | 3.6 instance node label contains SOPInstanceUID | FAIL |
| 28 | 3.7 tree nodes expand and collapse on click | FAIL |
| 29 | 3.8 series nodes auto-expand after Q/R retrieval | FAIL |
| 30 | 3.9 clicking instance node triggers image display | FAIL |
| 31 | 3.10 series from different patients appear as separate top-level nodes | FAIL |
| 32 | 3.11 instances are sorted by InstanceNumber within a series | FAIL |
| 33–36 | Feature 4 (file open) | SKIPPED (not implemented) |
| 37 | 5.1 selecting a series builds WADO-URI imageIds | FAIL |
| 38 | 5.2 viewer canvas element is present after series load | FAIL |
| 39 | 5.3 WADO-RS/URI request made with correct query parameters | FAIL |
| 40 | 5.4 viewer area has a black background before any image loads | FAIL |
| 41 | 6.1 top-left overlay shows patient demographics | FAIL |
| 42 | 6.2 top-right overlay shows scanner model and study date/time | FAIL |
| 43 | 6.3 bottom-left overlay shows modality and frame position | FAIL |
| 44 | 6.4 bottom-right overlay shows WL/WW when available | FAIL |
| 45 | 6.5 corner overlays are absolutely positioned over the canvas | FAIL |
| 46 | 7.1 slider initialises with min=1, max=N, value=1 | FAIL |
| 47 | 7.2 changing slider value updates current frame | FAIL |
| 48 | 7.3 slider is not visible when no series is loaded | PASS |
| 49 | 7.4 slider is not visible for single-instance series | FAIL |
| 50 | 8.1 WADO-RS imageId uses the /frames/1 endpoint format | FAIL |
| 51 | 8.2 WADO-RS request includes Accept: multipart/related header | FAIL |
| 52 | 8.3 viewer canvas exists while remaining instances load (streaming) | FAIL |
| 53 | 8.4 at least 2 frame fetch requests can be in-flight simultaneously | FAIL |
| 54 | 8.5 no .dcm files are written to the filesystem during loading | FAIL |
| 55 | 9.1 Window/Level tool is available in toolbar | FAIL |
| 56 | 9.2 clicking WL button activates WindowLevel tool | FAIL |
| 57 | 9.3 WL corner overlay updates after VOI_MODIFIED event | FAIL |
| 58 | 9.4 Pan tool button is visible in toolbar | FAIL |
| 59 | 9.5 Zoom tool button is visible in toolbar | FAIL |
| 60 | 9.6 mouse wheel scroll handled by viewport (no page scroll) | FAIL |
| 61 | 9.7 Flip Horizontal button is present and clickable | FAIL |
| 62 | 9.8 Flip Vertical button is present and clickable | FAIL |
| 63 | 9.9 Invert Color button is present and clickable | FAIL |
| 64 | 9.10 Reset Center is in the Image menu | SKIPPED |
| 65 | 9.11 only one tool is active at a time | FAIL |
| 66 | 9.12 active toolbar button has "active" CSS class | FAIL |
| 67 | 10.1 switching to MPR layout shows three viewport panels | FAIL (run stopped) |
| 68–111 | Features 10–16 | NOT RUN |

### Partial E2E Summary (of 67 run)
- Passed: 13
- Failed: 50
- Skipped: 4
- Not run: 44

### Failure Pattern
Most E2E failures are **30.1s timeouts** — the Vite dev server is not running during the E2E test run. Playwright's `webServer` config starts it on port 5173, but the server likely failed to start or timed out. Tests that don't require the dev server (mock-only tests) passed fine.

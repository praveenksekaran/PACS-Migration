# E2E Test Results (Playwright) — dicomweb-react-viewer

**Date:** 2026-03-05 (updated — full run)
**Status:** Complete run — all 111 tests executed
**Browser:** Chromium

## Summary

| | Count |
|---|---|
| Total | 111 |
| Passed | 24 |
| Failed | 64 |
| Skipped | 23 |

---

## Results

### Feature 1: Application Startup and Configuration

| # | Test | Result | Duration |
|---|---|---|---|
| 1.1 | reads apiUrl from server-injected window.config | FAIL | 9.9s |
| 1.2 | falls back to relative paths when window.config is absent | PASS | 7.5s |
| 1.3 | cornerstone3D initialises before any viewport renders | PASS | 6.4s |
| 1.4 | shell renders all main layout regions | FAIL | 10.6s |
| 1.5 | SharedArrayBuffer is available (COOP/COEP headers set) | PASS | 5.8s |

### Feature 2: Query / Retrieve Modal

| # | Test | Result | Duration |
|---|---|---|---|
| 2.1 | opens QR modal from toolbar button with correct initial state | FAIL | 10.4s |
| 2.2 | opens QR modal from menu bar Q/R item | FAIL | 30.1s |
| 2.3 | searches by Patient Name and populates results table | PASS | 6.9s |
| 2.4 | searches by Patient ID without wildcard suffix | FAIL | 30.3s |
| 2.5 | empty search text sends wildcard PatientName=* | PASS | 8.9s |
| 2.6 | results table displays correct columns | PASS | 6.1s |
| 2.7 | PN DICOM tag Alphabetic subfield is displayed correctly | FAIL | 11.5s |
| 2.8 | missing DICOM tag renders as empty string without errors | PASS | 6.7s |
| 2.9 | all result rows are checked by default | PASS | 6.1s |
| 2.10 | user can deselect individual rows | PASS | 8.0s |
| 2.11 | Get Selected loads only checked series | PASS | 6.9s |
| 2.12 | Get All loads every series regardless of checkbox state | PASS | 7.7s |
| 2.13 | Cancel closes the modal without making API calls | PASS | 5.9s |
| 2.14 | modal close button hides the modal | FAIL | 30.1s |
| 2.15 | network error during QIDO search is shown in status bar | PASS | 7.6s |
| 2.16 | new search clears previous results | FAIL | 11.9s |

### Feature 3: Study Tree

| # | Test | Result | Duration |
|---|---|---|---|
| 3.1 | tree builds Patient → Study → Series → Instance hierarchy | FAIL | 30.1s |
| 3.2 | patient node label shows Patient Name | FAIL | 30.1s |
| 3.3 | study node label shows Modality | FAIL | 30.1s |
| 3.4 | series node label shows Series Description | FAIL | 30.1s |
| 3.5 | series node has non-empty label when description is missing | FAIL | 30.1s |
| 3.6 | instance node label contains SOPInstanceUID | FAIL | 30.1s |
| 3.7 | tree nodes expand and collapse on click | FAIL | 30.1s |
| 3.8 | series nodes auto-expand after Q/R retrieval | FAIL | 30.1s |
| 3.9 | clicking instance node triggers image display | FAIL | 30.2s |
| 3.10 | series from different patients appear as separate top-level nodes | FAIL | 30.1s |
| 3.11 | instances are sorted by InstanceNumber within a series | FAIL | 30.1s |

### Feature 4: Local File and Folder Open

| # | Test | Result |
|---|---|---|
| 4.1 | user opens a single DICOM file via Open File button | SKIPPED |
| 4.2 | user opens a folder containing 12 DICOM files | SKIPPED |
| 4.3 | non-DICOM files in folder are silently skipped | SKIPPED |
| 4.4 | opening a new file clears the previous study tree | SKIPPED |

### Feature 5: WADO-URI Image Loading

| # | Test | Result | Duration |
|---|---|---|---|
| 5.1 | selecting a series builds WADO-URI imageIds for all instances | FAIL | 30.1s |
| 5.2 | viewer canvas element is present after series load | FAIL | 30.1s |
| 5.3 | WADO-RS/URI request is made with correct query parameters | FAIL | 30.2s |
| 5.4 | viewer area has a black background before any image loads | FAIL | 5.7s |

### Feature 6: DICOM Corner Text Overlays

| # | Test | Result | Duration |
|---|---|---|---|
| 6.1 | top-left overlay shows patient demographics | FAIL | 30.1s |
| 6.2 | top-right overlay shows scanner model and study date/time | FAIL | 30.1s |
| 6.3 | bottom-left overlay shows modality and frame position | FAIL | 30.1s |
| 6.4 | bottom-right overlay shows WL/WW when available | FAIL | 30.1s |
| 6.5 | corner overlays are absolutely positioned over the canvas | FAIL | 30.1s |

### Feature 7: Frame Slider Navigation

| # | Test | Result | Duration |
|---|---|---|---|
| 7.1 | slider initialises with min=1, max=N, value=1 | FAIL | 30.1s |
| 7.2 | changing slider value updates current frame | FAIL | 30.1s |
| 7.3 | slider is not visible when no series is loaded | PASS | 0.8s |
| 7.4 | slider is not visible for single-instance series | FAIL | 30.1s |

### Feature 8: WADO-RS Pixel Streaming

| # | Test | Result | Duration |
|---|---|---|---|
| 8.1 | WADO-RS imageId uses the /frames/1 endpoint format | FAIL | 30.1s |
| 8.2 | WADO-RS request includes Accept: multipart/related header | FAIL | 30.2s |
| 8.3 | viewer canvas exists while remaining instances load (streaming) | FAIL | 30.1s |
| 8.4 | at least 2 frame fetch requests can be in-flight simultaneously | FAIL | 30.1s |
| 8.5 | no .dcm files are written to the filesystem during loading | FAIL | 30.1s |

### Feature 9: Interactive Imaging Tools

| # | Test | Result | Duration |
|---|---|---|---|
| 9.1 | Window/Level tool is available in toolbar | FAIL | 30.1s |
| 9.2 | clicking WL button activates WindowLevel tool | FAIL | 30.1s |
| 9.3 | WL corner overlay updates after VOI_MODIFIED event | FAIL | 30.1s |
| 9.4 | Pan tool button is visible in toolbar | FAIL | 30.1s |
| 9.5 | Zoom tool button is visible in toolbar | FAIL | 30.1s |
| 9.6 | mouse wheel scroll is handled by the viewport (no page scroll) | FAIL | 30.1s |
| 9.7 | Flip Horizontal button is present and clickable | FAIL | 30.1s |
| 9.8 | Flip Vertical button is present and clickable | FAIL | 30.1s |
| 9.9 | Invert Color button is present and clickable | FAIL | 30.1s |
| 9.10 | Reset Center is in the Image menu | SKIPPED | |
| 9.11 | only one tool is active at a time | FAIL | 30.1s |
| 9.12 | active toolbar button has "active" CSS class | FAIL | 30.1s |

### Feature 10: MPR Volume Viewport

| # | Test | Result | Duration |
|---|---|---|---|
| 10.1 | switching to MPR layout shows three viewport panels | FAIL | 30.1s |
| 10.2 | switching back to 2D Stack removes MPR panels | FAIL | 30.1s |
| 10.3 | layout toggle button label reflects current view mode | FAIL | 30.1s |
| 10.4 | each MPR viewport has a visible orientation label | FAIL | 30.1s |
| 10.5 | MPR toggle button is disabled for single-instance series | FAIL | 30.2s |
| 10.6 | switching to MPR does not throw JS errors | FAIL | 30.1s |

### Feature 11: Annotation Overlay

| # | Test | Result | Duration |
|---|---|---|---|
| 11.1 | annotation toggle button is visible in toolbar | PASS | 6.3s |
| 11.2 | toggling annotation ON changes button label to "Show Original" | FAIL | 30.1s |
| 11.3 | toggling annotation ON switches imageIds to WADO-URI (wadouri: scheme) | FAIL | 30.1s |
| 11.4 | annotation series is not re-downloaded on second toggle | FAIL | 30.1s |
| 11.5 | toggling annotation OFF resets button label to "Annotation" | FAIL | 30.1s |
| 11.6 | annotation button click has no effect when no image is loaded | PASS | 6.2s |
| 11.7 | annotation button font weight changes to bold when annotation is ON | FAIL | 30.1s |
| 11.8 | annotation mode remains ON when navigating between frames | FAIL | 30.1s |

### Feature 12: Status Bar

| # | Test | Result | Duration |
|---|---|---|---|
| 12.1 | status bar shows QIDO-RS completion message with series count | PASS | 7.1s |
| 12.2 | status bar shows "Retrieving Files..." immediately on Get Selected click | PASS | 6.5s |
| 12.3 | status bar shows series count after successful download | FAIL | 30.1s |
| 12.4 | (not listed) | | |
| 12.5 | status bar shows error on WADO-URI download failure | FAIL | 30.1s |

### Feature 13: Build Output Verification

| # | Test | Result |
|---|---|---|
| 13.1 | production build outputs assets to dist/ | FAIL |
| 13.2 | build output directory exists and was written by the last build | PASS |
| 13.3 | cornerstone modules are in a separate chunk from the main bundle | PASS |
| 13.4 | @api — viewer server serves React app on port 3000 | SKIPPED |
| 13.5 | app-config.js sets window.config with apiUrl | PASS |
| 13.6 | React app reads apiUrl from injected window.config | PASS |
| 13.7 | @api — SPA index.html fallback for deep links | SKIPPED |
| 13.8 | @api — CORS header is present on API server response | SKIPPED |
| 13.9 | Vite dev server proxy routes /rs and /wadouri correctly | PASS |

### Feature 14: (not in suite)

### Feature 15: Menu Bar

| # | Test | Result |
|---|---|---|
| 15.1–15.4 | (passing — listed as 12.x above; file is 12-menu-bar.spec.ts) | |
| 15.5 | clicking Query/Retrieve menu item opens the QR modal | FAIL |
| 15.6 | MenuBar renders at the top of the shell | FAIL |

### Feature 16: API Contract (@api tag)

| # | Test | Result |
|---|---|---|
| All | Skipped — requires `API_SERVER_URL` env var | SKIPPED |

---

## Failure Analysis

### Root Cause 1: `toolbar-btn-qr` timeout in `loadSeriesViaQR` (majority of failures)

Tests that call `loadSeriesViaQR()` (Features 3, 5–12) time out at:
```
Error: locator.click: Test timeout of 30000ms exceeded.
  - waiting for getByTestId('toolbar-btn-qr')
    at routes.ts:202
```

These tests call `setupStandardMocks()` then `loadSeriesViaQR()`. The toolbar button exists (confirmed by passing tests 2.3, 2.5, etc.), but when the full mock stack (QIDO + WADO frames + WADO-URI) is active, the app appears to hang before the toolbar renders.

**Likely cause:** The heavy mock setup (including frame/metadata mocks) may trigger a render cycle that prevents the toolbar from appearing in time, or a missing `mockAppConfig` in the test-specific setup leaves the app config fetch unresolved.

### Root Cause 2: Test 13.1 — CSS file not found

Test checks `dist/` root for `.css` files. Vite outputs CSS to `dist/assets/` subdirectory. The test logic needs to also check `dist/assets/`.

### Root Cause 3: Tests 15.5, MenuBar — `menu-item-qr` not found

`[data-testid="menu-item-qr"]` is not visible without first opening the menu. The tests expect it to be directly visible but the menu bar has a dropdown that must be opened first.

### Passing Tests Pattern

All 24 passing tests are:
- Toolbar/UI visibility checks that run with simple mocks (no `loadSeriesViaQR`)
- Status bar checks that trigger QR flow step-by-step (not via `loadSeriesViaQR`)
- Build output checks (13.2, 13.3, 13.5, 13.6, 13.9)

### Recommended Fixes

| Issue | Fix |
|---|---|
| `loadSeriesViaQR` 30s timeout | Investigate why `toolbar-btn-qr` disappears with full mock stack; add explicit wait for page ready state |
| Test 13.1 CSS check | Update test to check `dist/assets/` for CSS files |
| Tests 15.5, MenuBar | Open the menu dropdown before asserting `menu-item-qr` visibility |
| Tests 1.1, 2.1, 2.7, 2.16, 1.4 | Shorter timeouts indicate assertion failures — inspect specific expected vs received values |

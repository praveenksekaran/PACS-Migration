import { test } from '@playwright/test'

/**
 * Feature 4: Local File and Folder Open
 * Scenarios 4.1 – 4.4
 *
 * NOTE: The current React viewer does not yet implement a FilePicker or
 * FolderPicker component (this is a future phase). These scenarios are
 * tracked here so they can be enabled when the feature is implemented.
 */

test.describe('Feature 4: Local File and Folder Open', () => {
  test.skip(
    true,
    'FilePicker/FolderPicker not yet implemented in the React viewer'
  )

  // ── Scenario 4.1 ────────────────────────────────────────────────────────────
  test('4.1 – user opens a single DICOM file via Open File button', async ({
    page: _page,
  }) => {
    // TODO: Click "Open File" toolbar button
    // TODO: Use page.setInputFiles() to provide a test .dcm file
    // TODO: Verify study tree is populated with 1 instance
    // TODO: Verify status bar shows "Open File Successfully!"
  })

  // ── Scenario 4.2 ────────────────────────────────────────────────────────────
  test('4.2 – user opens a folder containing 12 DICOM files', async ({
    page: _page,
  }) => {
    // TODO: Click "Open Folder" toolbar button
    // TODO: Use page.setInputFiles() to provide 12 test .dcm files
    // TODO: Verify status bar message contains "12 Instances"
  })

  // ── Scenario 4.3 ────────────────────────────────────────────────────────────
  test('4.3 – non-DICOM files in folder are silently skipped', async ({
    page: _page,
  }) => {
    // TODO: Provide mix of .dcm and .txt files
    // TODO: Verify only valid DICOM files are parsed
  })

  // ── Scenario 4.4 ────────────────────────────────────────────────────────────
  test('4.4 – opening a new file clears the previous study tree', async ({
    page: _page,
  }) => {
    // TODO: Load first file, verify tree
    // TODO: Load second file, verify previous tree is cleared
  })
})

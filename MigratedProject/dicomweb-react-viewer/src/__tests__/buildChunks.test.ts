import { describe, it, expect } from 'vitest'
import { chunkFor } from '../lib/buildChunks'

describe('chunkFor()', () => {
  // ── cornerstone chunk ─────────────────────────────────────────────────────

  it('assigns @cornerstonejs/core to cornerstone chunk', () => {
    expect(chunkFor('node_modules/@cornerstonejs/core/dist/index.js')).toBe('cornerstone')
  })

  it('assigns @cornerstonejs/tools to cornerstone chunk', () => {
    expect(chunkFor('node_modules/@cornerstonejs/tools/dist/index.js')).toBe('cornerstone')
  })

  it('assigns @cornerstonejs/dicom-image-loader to cornerstone chunk', () => {
    expect(chunkFor('node_modules/@cornerstonejs/dicom-image-loader/dist/index.js')).toBe('cornerstone')
  })

  it('assigns dicom-parser to cornerstone chunk', () => {
    expect(chunkFor('node_modules/dicom-parser/dist/dicom-parser.js')).toBe('cornerstone')
  })

  it('assigns vtk.js paths to cornerstone chunk', () => {
    expect(chunkFor('node_modules/@kitware/vtk.js/Sources/index.js')).toBe('cornerstone')
  })

  // ── react-vendor chunk ────────────────────────────────────────────────────

  it('assigns react to react-vendor chunk', () => {
    expect(chunkFor('node_modules/react/index.js')).toBe('react-vendor')
  })

  it('assigns react-dom to react-vendor chunk', () => {
    expect(chunkFor('node_modules/react-dom/client.js')).toBe('react-vendor')
  })

  // ── state chunk ───────────────────────────────────────────────────────────

  it('assigns zustand to state chunk', () => {
    expect(chunkFor('node_modules/zustand/dist/index.js')).toBe('state')
  })

  // ── default (app code) ────────────────────────────────────────────────────

  it('returns undefined for app source files', () => {
    expect(chunkFor('src/components/Toolbar.tsx')).toBeUndefined()
  })

  it('returns undefined for other third-party modules', () => {
    expect(chunkFor('node_modules/lodash/index.js')).toBeUndefined()
  })
})

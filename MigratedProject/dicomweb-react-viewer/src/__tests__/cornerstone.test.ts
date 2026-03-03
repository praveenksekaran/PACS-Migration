import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all cornerstone packages — they require WebGL/Workers not available in jsdom
vi.mock('@cornerstonejs/core', () => ({
  init: vi.fn().mockResolvedValue(undefined),
  RenderingEngine: vi.fn(),
  Enums: { ViewportType: { STACK: 'stack' } },
}))
vi.mock('@cornerstonejs/dicom-image-loader', () => ({
  init: vi.fn(),
  wadouri: { register: vi.fn() },
  wadors: { register: vi.fn() },
}))
vi.mock('@cornerstonejs/tools', () => ({
  init: vi.fn().mockResolvedValue(undefined),
}))

import { initCornerstone } from '../lib/cornerstone'
import * as cornerstoneCore from '@cornerstonejs/core'
import * as dicomImageLoader from '@cornerstonejs/dicom-image-loader'
import * as cornerstoneTools from '@cornerstonejs/tools'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('initCornerstone', () => {
  it('returns a Promise', () => {
    expect(initCornerstone()).toBeInstanceOf(Promise)
  })

  it('resolves without error', async () => {
    await expect(initCornerstone()).resolves.toBeUndefined()
  })

  it('calls cornerstoneCore.init()', async () => {
    await initCornerstone()
    expect(cornerstoneCore.init).toHaveBeenCalledTimes(1)
  })

  it('calls dicomImageLoader.init()', async () => {
    await initCornerstone()
    expect(dicomImageLoader.init).toHaveBeenCalledTimes(1)
  })

  it('registers the wadouri loader with cornerstone core', async () => {
    await initCornerstone()
    expect(dicomImageLoader.wadouri.register).toHaveBeenCalledWith(cornerstoneCore)
  })

  it('registers the wadors loader with cornerstone core', async () => {
    await initCornerstone()
    expect(dicomImageLoader.wadors.register).toHaveBeenCalledWith(cornerstoneCore)
  })

  it('calls cornerstoneTools.init()', async () => {
    await initCornerstone()
    expect(cornerstoneTools.init).toHaveBeenCalledTimes(1)
  })
})

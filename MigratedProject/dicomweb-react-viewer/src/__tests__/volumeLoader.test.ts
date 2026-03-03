import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockRegisterVolumeLoader, mockLoad, mockCreateAndCacheVolume, mockStreamingLoader } =
  vi.hoisted(() => {
    const mockLoad = vi.fn()
    const mockRegisterVolumeLoader = vi.fn()
    const mockCreateAndCacheVolume = vi.fn().mockResolvedValue({ load: mockLoad })
    const mockStreamingLoader = vi.fn()
    return { mockRegisterVolumeLoader, mockLoad, mockCreateAndCacheVolume, mockStreamingLoader }
  })

vi.mock('@cornerstonejs/core', () => ({
  volumeLoader: {
    registerVolumeLoader: mockRegisterVolumeLoader,
    createAndCacheVolume: mockCreateAndCacheVolume,
  },
  cornerstoneStreamingImageVolumeLoader: mockStreamingLoader,
}))

import { registerVolumeLoader, createVolume } from '../lib/volumeLoader'

beforeEach(() => {
  vi.clearAllMocks()
  mockCreateAndCacheVolume.mockResolvedValue({ load: mockLoad })
})

describe('registerVolumeLoader()', () => {
  it('registers the cornerstoneStreamingImageVolume loader', () => {
    registerVolumeLoader()
    expect(mockRegisterVolumeLoader).toHaveBeenCalledWith(
      'cornerstoneStreamingImageVolume',
      mockStreamingLoader
    )
  })
})

describe('createVolume()', () => {
  it('calls createAndCacheVolume with the correct volumeId and imageIds', async () => {
    const ids = ['wadors://a', 'wadors://b']
    await createVolume('cornerstoneStreamingImageVolume:test', ids)
    expect(mockCreateAndCacheVolume).toHaveBeenCalledWith(
      'cornerstoneStreamingImageVolume:test',
      { imageIds: ids }
    )
  })

  it('calls volume.load() to start streaming', async () => {
    await createVolume('cornerstoneStreamingImageVolume:test', ['wadors://a'])
    expect(mockLoad).toHaveBeenCalledTimes(1)
  })

  it('resolves without error', async () => {
    await expect(
      createVolume('cornerstoneStreamingImageVolume:test', ['wadors://a'])
    ).resolves.toBeUndefined()
  })
})

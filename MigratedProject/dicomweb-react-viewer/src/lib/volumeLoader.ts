import { volumeLoader, cornerstoneStreamingImageVolumeLoader } from '@cornerstonejs/core'

export function registerVolumeLoader(): void {
  volumeLoader.registerVolumeLoader(
    'cornerstoneStreamingImageVolume',
    cornerstoneStreamingImageVolumeLoader as unknown as Parameters<typeof volumeLoader.registerVolumeLoader>[1]
  )
}

export async function createVolume(volumeId: string, imageIds: string[]): Promise<void> {
  const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds })
  volume.load()
}

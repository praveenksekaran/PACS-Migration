import * as cornerstoneCore from '@cornerstonejs/core'
import * as dicomImageLoader from '@cornerstonejs/dicom-image-loader'
import * as cornerstoneTools from '@cornerstonejs/tools'
import { registerVolumeLoader } from './volumeLoader'

export async function initCornerstone(): Promise<void> {
  await cornerstoneCore.init()
  dicomImageLoader.init({ maxWebWorkers: 1 })
  dicomImageLoader.wadouri.register()
  dicomImageLoader.wadors.register()
  registerVolumeLoader()
  await cornerstoneTools.init()
}

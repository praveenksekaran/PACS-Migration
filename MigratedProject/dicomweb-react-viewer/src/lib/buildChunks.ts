/**
 * Rollup manualChunks function for production builds.
 * Splits vendor code into named chunks so browsers can cache them
 * independently from application code that changes more frequently.
 */
export function chunkFor(id: string): string | undefined {
  if (id.includes('@cornerstonejs') || id.includes('vtk.js') || id.includes('dicom-parser')) {
    return 'cornerstone'
  }
  if (id.includes('react-dom') || id.includes('react/')) {
    return 'react-vendor'
  }
  if (id.includes('zustand')) {
    return 'state'
  }
  return undefined
}

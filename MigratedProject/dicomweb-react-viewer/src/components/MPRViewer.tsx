import { useEffect, useRef } from 'react'
import { RenderingEngine, Enums, setVolumesForViewports } from '@cornerstonejs/core'
import ViewportPanel from './ViewportPanel'
import { useViewerStore } from '../store/viewerStore'
import { createVolume } from '../lib/volumeLoader'

const MPR_ENGINE_ID = 'mpr-engine'

export default function MPRViewer() {
  const axialRef = useRef<HTMLDivElement>(null)
  const coronalRef = useRef<HTMLDivElement>(null)
  const sagittalRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<InstanceType<typeof RenderingEngine> | null>(null)

  const volumeId = useViewerStore((s) => s.volumeId)
  const imageIds = useViewerStore((s) => s.imageIds)

  // Create engine and enable 3 ORTHOGRAPHIC viewports on mount
  useEffect(() => {
    if (!axialRef.current || !coronalRef.current || !sagittalRef.current) return

    const engine = new RenderingEngine(MPR_ENGINE_ID)
    engineRef.current = engine

    engine.enableElement({
      viewportId: 'axial',
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: axialRef.current,
      defaultOptions: { orientation: Enums.OrientationAxis.AXIAL },
    })
    engine.enableElement({
      viewportId: 'coronal',
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: coronalRef.current,
      defaultOptions: { orientation: Enums.OrientationAxis.CORONAL },
    })
    engine.enableElement({
      viewportId: 'sagittal',
      type: Enums.ViewportType.ORTHOGRAPHIC,
      element: sagittalRef.current,
      defaultOptions: { orientation: Enums.OrientationAxis.SAGITTAL },
    })

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  // Load and display volume when volumeId or imageIds change
  useEffect(() => {
    if (!engineRef.current || !volumeId || imageIds.length === 0) return
    const engine = engineRef.current

    createVolume(volumeId, imageIds).then(() => {
      if (!engineRef.current) return
      setVolumesForViewports(engine, [{ volumeId }], ['axial', 'coronal', 'sagittal']).then(() => {
        engineRef.current?.renderViewports(['axial', 'coronal', 'sagittal'])
      })
    })
  }, [volumeId, imageIds])

  return (
    <div
      data-testid="mpr-viewer"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', width: '100%', height: '100%' }}
    >
      <ViewportPanel ref={axialRef} viewportId="axial" label="Axial" />
      <ViewportPanel ref={coronalRef} viewportId="coronal" label="Coronal" />
      <ViewportPanel ref={sagittalRef} viewportId="sagittal" label="Sagittal" />
    </div>
  )
}

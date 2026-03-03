import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../api/dicomWebClient', () => ({
  searchInstances: vi.fn(),
}))
vi.mock('../config', () => ({ API_URL: 'http://test-server' }))

import { useStudyTreeStore } from '../store/studyTreeStore'
import { useViewerStore } from '../store/viewerStore'
import { searchInstances } from '../api/dicomWebClient'
import type { QRResult } from '../types/dicom'

const series1: QRResult = {
  studyUid: '1.2.3',
  seriesUid: '4.5.6',
  patientName: 'Doe^John',
  patientId: 'P001',
  modality: 'CT',
  bodyPart: 'CHEST',
  seriesDescription: 'Chest AP',
  selected: true,
}

const instanceDatasets = [
  { '00080018': { vr: 'UI', Value: ['sop-1'] }, '00200013': { vr: 'IS', Value: ['1'] } },
  { '00080018': { vr: 'UI', Value: ['sop-2'] }, '00200013': { vr: 'IS', Value: ['2'] } },
  { '00080018': { vr: 'UI', Value: ['sop-3'] }, '00200013': { vr: 'IS', Value: ['3'] } },
]

const outOfOrderInstances = [
  { '00080018': { vr: 'UI', Value: ['sop-3'] }, '00200013': { vr: 'IS', Value: ['3'] } },
  { '00080018': { vr: 'UI', Value: ['sop-1'] }, '00200013': { vr: 'IS', Value: ['1'] } },
  { '00080018': { vr: 'UI', Value: ['sop-2'] }, '00200013': { vr: 'IS', Value: ['2'] } },
]

beforeEach(() => {
  useStudyTreeStore.setState({ nodes: [], selectedInstanceId: null })
  vi.clearAllMocks()
  vi.mocked(searchInstances).mockResolvedValue(instanceDatasets)
})

describe('studyTreeStore initial state', () => {
  it('has empty nodes', () => {
    expect(useStudyTreeStore.getState().nodes).toHaveLength(0)
  })
  it('has no selected instance', () => {
    expect(useStudyTreeStore.getState().selectedInstanceId).toBeNull()
  })
})

describe('studyTreeStore.addSeries()', () => {
  it('builds Patient → Study → Series → Instance hierarchy', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    const { nodes } = useStudyTreeStore.getState()
    expect(nodes).toHaveLength(1)
    const patient = nodes[0]
    expect(patient.type).toBe('patient')
    expect(patient.children).toHaveLength(1)
    const study = patient.children[0]
    expect(study.type).toBe('study')
    expect(study.children).toHaveLength(1)
    const series = study.children[0]
    expect(series.type).toBe('series')
    expect(series.children).toHaveLength(3)
    expect(series.children[0].type).toBe('instance')
  })

  it('sets patient node label to Patient Name', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    expect(useStudyTreeStore.getState().nodes[0].label).toBe('Doe^John')
  })

  it('sets study node label to Modality', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    const study = useStudyTreeStore.getState().nodes[0].children[0]
    expect(study.label).toBe('CT')
  })

  it('sets series node label to Series Description', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    const series = useStudyTreeStore.getState().nodes[0].children[0].children[0]
    expect(series.label).toBe('Chest AP')
  })

  it('sets instance node label to SOPInstanceUID', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    const inst = useStudyTreeStore.getState().nodes[0].children[0].children[0].children[0]
    expect(inst.label).toContain('sop-1')
  })

  it('sorts instances by InstanceNumber', async () => {
    vi.mocked(searchInstances).mockResolvedValue(outOfOrderInstances)
    await useStudyTreeStore.getState().addSeries(series1)
    const instances = useStudyTreeStore.getState().nodes[0].children[0].children[0].children
    expect(instances[0].data.sopUid).toBe('sop-1')
    expect(instances[1].data.sopUid).toBe('sop-2')
    expect(instances[2].data.sopUid).toBe('sop-3')
  })

  it('does NOT create duplicate patient nodes for the same patient', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    const series2: QRResult = { ...series1, seriesUid: '7.8.9', seriesDescription: 'Lateral' }
    vi.mocked(searchInstances).mockResolvedValue(instanceDatasets)
    await useStudyTreeStore.getState().addSeries(series2)
    expect(useStudyTreeStore.getState().nodes).toHaveLength(1)
  })

  it('creates separate top-level nodes for different patients', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    const series2: QRResult = {
      ...series1,
      seriesUid: '7.8.9',
      patientId: 'P002',
      patientName: 'Smith^Jane',
    }
    vi.mocked(searchInstances).mockResolvedValue(instanceDatasets)
    await useStudyTreeStore.getState().addSeries(series2)
    expect(useStudyTreeStore.getState().nodes).toHaveLength(2)
  })
})

describe('studyTreeStore.selectInstance()', () => {
  it('sets selectedInstanceId', () => {
    useStudyTreeStore.getState().selectInstance('sop-1')
    expect(useStudyTreeStore.getState().selectedInstanceId).toBe('sop-1')
  })

  it('builds WADO-URI imageIds for all instances in the series and calls setActiveStack', async () => {
    useViewerStore.setState({ imageIds: [], currentIndex: 0 })
    await useStudyTreeStore.getState().addSeries(series1)

    useStudyTreeStore.getState().selectInstance('sop-1')

    const { imageIds, currentIndex } = useViewerStore.getState()
    expect(imageIds).toHaveLength(3)
    expect(imageIds[0]).toBe(
      'wadouri:http://test-server/wadouri?studyUID=1.2.3&seriesUID=4.5.6&objectUID=sop-1'
    )
    expect(imageIds[1]).toBe(
      'wadouri:http://test-server/wadouri?studyUID=1.2.3&seriesUID=4.5.6&objectUID=sop-2'
    )
    expect(currentIndex).toBe(0)
  })

  it('sets the correct startIndex when a non-first instance is selected', async () => {
    useViewerStore.setState({ imageIds: [], currentIndex: 0 })
    await useStudyTreeStore.getState().addSeries(series1)

    useStudyTreeStore.getState().selectInstance('sop-3')

    const { currentIndex } = useViewerStore.getState()
    expect(currentIndex).toBe(2)
  })
})

describe('studyTreeStore.clear()', () => {
  it('resets nodes and selection', async () => {
    await useStudyTreeStore.getState().addSeries(series1)
    useStudyTreeStore.getState().selectInstance('sop-1')
    useStudyTreeStore.getState().clear()
    expect(useStudyTreeStore.getState().nodes).toHaveLength(0)
    expect(useStudyTreeStore.getState().selectedInstanceId).toBeNull()
  })
})

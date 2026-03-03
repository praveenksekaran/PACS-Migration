import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../api/dicomWebClient', () => ({
  searchStudies: vi.fn(),
  searchSeries: vi.fn(),
}))

vi.mock('../store/studyTreeStore', () => ({
  useStudyTreeStore: {
    getState: vi.fn(() => ({ addSeries: vi.fn() })),
  },
}))

import { useQRStore } from '../store/qrStore'
import { useStatusStore } from '../store/statusStore'
import { searchStudies, searchSeries } from '../api/dicomWebClient'
import { useStudyTreeStore } from '../store/studyTreeStore'

const studyDataset = {
  '0020000D': { vr: 'UI', Value: ['1.2.3'] },
  '00100010': { vr: 'PN', Value: [{ Alphabetic: 'Doe^John' }] },
  '00100020': { vr: 'LO', Value: ['P001'] },
}

const seriesDataset = {
  '0020000E': { vr: 'UI', Value: ['4.5.6'] },
  '00080060': { vr: 'CS', Value: ['CT'] },
  '00180015': { vr: 'CS', Value: ['CHEST'] },
  '0008103E': { vr: 'LO', Value: ['Chest AP'] },
}

function resetStores() {
  useQRStore.setState({
    searchField: 'patientName',
    searchText: '',
    results: [],
  })
  useStatusStore.setState({ message: '' })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
  vi.mocked(searchStudies).mockResolvedValue([studyDataset])
  vi.mocked(searchSeries).mockResolvedValue([seriesDataset])
})

describe('qrStore initial state', () => {
  it('has empty results', () => {
    expect(useQRStore.getState().results).toEqual([])
  })
  it('defaults to patientName search field', () => {
    expect(useQRStore.getState().searchField).toBe('patientName')
  })
  it('has empty searchText', () => {
    expect(useQRStore.getState().searchText).toBe('')
  })
})

describe('qrStore setters', () => {
  it('setSearchText updates searchText', () => {
    useQRStore.getState().setSearchText('Smith')
    expect(useQRStore.getState().searchText).toBe('Smith')
  })
  it('setSearchField updates searchField', () => {
    useQRStore.getState().setSearchField('patientId')
    expect(useQRStore.getState().searchField).toBe('patientId')
  })
})

describe('qrStore.search()', () => {
  it('calls searchStudies with current searchText and searchField', async () => {
    useQRStore.setState({ searchText: 'Smith', searchField: 'patientName' })
    await useQRStore.getState().search()
    expect(searchStudies).toHaveBeenCalledWith('Smith', 'patientName')
  })

  it('calls searchSeries for each study returned', async () => {
    await useQRStore.getState().search()
    expect(searchSeries).toHaveBeenCalledWith('1.2.3')
  })

  it('populates results with one row per series', async () => {
    await useQRStore.getState().search()
    const results = useQRStore.getState().results
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      studyUid: '1.2.3',
      seriesUid: '4.5.6',
      patientName: 'Doe^John',
      patientId: 'P001',
      modality: 'CT',
      bodyPart: 'CHEST',
      seriesDescription: 'Chest AP',
      selected: true,
    })
  })

  it('sets status to "QIDO-RS Completed: Found N Series" after success', async () => {
    await useQRStore.getState().search()
    expect(useStatusStore.getState().message).toBe('QIDO-RS Completed: Found 1 Series')
  })

  it('clears previous results before new search', async () => {
    useQRStore.setState({ results: [{ studyUid: 'old', seriesUid: 'old' } as never] })
    await useQRStore.getState().search()
    const results = useQRStore.getState().results
    expect(results.every((r) => r.studyUid !== 'old')).toBe(true)
  })

  it('sets error status on API failure', async () => {
    vi.mocked(searchStudies).mockRejectedValue(new Error('Network error'))
    await useQRStore.getState().search()
    expect(useStatusStore.getState().message).toMatch(/QIDO-RS Failed/)
    expect(useQRStore.getState().results).toHaveLength(0)
  })
})

describe('qrStore.toggleSelect()', () => {
  it('toggles selected state of a series', async () => {
    await useQRStore.getState().search()
    useQRStore.getState().toggleSelect('4.5.6')
    expect(useQRStore.getState().results[0].selected).toBe(false)
    useQRStore.getState().toggleSelect('4.5.6')
    expect(useQRStore.getState().results[0].selected).toBe(true)
  })
})

describe('qrStore.loadSelected()', () => {
  it('calls addSeries only for selected results', async () => {
    const mockAddSeries = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useStudyTreeStore.getState).mockReturnValue({ addSeries: mockAddSeries } as never)
    await useQRStore.getState().search()
    useQRStore.getState().toggleSelect('4.5.6') // deselect
    await useQRStore.getState().loadSelected()
    expect(mockAddSeries).not.toHaveBeenCalled()
  })

  it('calls addSeries for selected results and updates status', async () => {
    const mockAddSeries = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useStudyTreeStore.getState).mockReturnValue({ addSeries: mockAddSeries } as never)
    await useQRStore.getState().search()
    await useQRStore.getState().loadSelected()
    expect(mockAddSeries).toHaveBeenCalledTimes(1)
    expect(useStatusStore.getState().message).toMatch(/1 Series Retrieved/)
  })
})

describe('qrStore.loadAll()', () => {
  it('calls addSeries for all results regardless of selection', async () => {
    const mockAddSeries = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useStudyTreeStore.getState).mockReturnValue({ addSeries: mockAddSeries } as never)
    await useQRStore.getState().search()
    useQRStore.getState().toggleSelect('4.5.6') // deselect
    await useQRStore.getState().loadAll()
    expect(mockAddSeries).toHaveBeenCalledTimes(1)
    expect(useStatusStore.getState().message).toMatch(/1 Series Retrieved/)
  })
})

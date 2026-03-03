import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import QRModal from '../components/QRModal'
import { useUIStore } from '../store/uiStore'
import { useQRStore } from '../store/qrStore'
import { useStatusStore } from '../store/statusStore'
import type { QRResult } from '../types/dicom'

// Mock API so search() doesn't hit network
vi.mock('../api/dicomWebClient', () => ({
  searchStudies: vi.fn().mockResolvedValue([]),
  searchSeries: vi.fn().mockResolvedValue([]),
}))
vi.mock('../store/studyTreeStore', () => ({
  useStudyTreeStore: { getState: vi.fn(() => ({ addSeries: vi.fn() })) },
}))

const sampleResult: QRResult = {
  studyUid: '1.2.3',
  seriesUid: '4.5.6',
  patientName: 'Doe^John',
  patientId: 'P001',
  modality: 'CT',
  bodyPart: 'CHEST',
  seriesDescription: 'Chest AP',
  selected: true,
}

function resetStores() {
  useUIStore.setState({ isQROpen: false })
  useQRStore.setState({ searchField: 'patientName', searchText: '', results: [] })
  useStatusStore.setState({ message: '' })
}

beforeEach(() => {
  vi.clearAllMocks()
  resetStores()
})

describe('QRModal visibility', () => {
  it('is not in the DOM when isQROpen is false', () => {
    render(<QRModal />)
    expect(screen.queryByTestId('qr-modal')).not.toBeInTheDocument()
  })

  it('renders when isQROpen is true', () => {
    useUIStore.setState({ isQROpen: true })
    render(<QRModal />)
    expect(screen.getByTestId('qr-modal')).toBeInTheDocument()
  })

  it('shows modal title "Query / Retrieve"', () => {
    useUIStore.setState({ isQROpen: true })
    render(<QRModal />)
    expect(screen.getByText('Query / Retrieve')).toBeInTheDocument()
  })
})

describe('QRModal search form', () => {
  beforeEach(() => useUIStore.setState({ isQROpen: true }))

  it('defaults search field selector to Patient Name', () => {
    render(<QRModal />)
    const select = screen.getByTestId('qr-field-select') as HTMLSelectElement
    expect(select.value).toBe('patientName')
  })

  it('search text input starts empty', () => {
    render(<QRModal />)
    const input = screen.getByTestId('qr-search-input') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('typing in search input calls setSearchText', () => {
    render(<QRModal />)
    fireEvent.change(screen.getByTestId('qr-search-input'), {
      target: { value: 'Smith' },
    })
    expect(useQRStore.getState().searchText).toBe('Smith')
  })

  it('changing field selector calls setSearchField', () => {
    render(<QRModal />)
    fireEvent.change(screen.getByTestId('qr-field-select'), {
      target: { value: 'patientId' },
    })
    expect(useQRStore.getState().searchField).toBe('patientId')
  })

  it('Find button triggers search()', async () => {
    const searchSpy = vi.fn().mockResolvedValue(undefined)
    useQRStore.setState({ search: searchSpy } as never)
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-find-btn'))
    await waitFor(() => expect(searchSpy).toHaveBeenCalledTimes(1))
  })
})

describe('QRModal results table', () => {
  beforeEach(() => {
    useUIStore.setState({ isQROpen: true })
    useQRStore.setState({ results: [sampleResult] })
  })

  it('renders correct column headers', () => {
    render(<QRModal />)
    expect(screen.getByRole('columnheader', { name: 'Patient Name' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Patient ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Modality' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Body Part' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Series Description' })).toBeInTheDocument()
  })

  it('displays patient name from result', () => {
    render(<QRModal />)
    expect(screen.getByText('Doe^John')).toBeInTheDocument()
  })

  it('all rows are checked by default', () => {
    render(<QRModal />)
    const checkbox = screen.getByTestId('qr-row-check-4.5.6') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('unchecking a row calls toggleSelect', () => {
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-row-check-4.5.6'))
    expect(useQRStore.getState().results[0].selected).toBe(false)
  })
})

describe('QRModal action buttons', () => {
  beforeEach(() => {
    useUIStore.setState({ isQROpen: true })
    useQRStore.setState({ results: [sampleResult] })
  })

  it('Cancel button closes the modal', () => {
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-cancel-btn'))
    expect(useUIStore.getState().isQROpen).toBe(false)
  })

  it('Get Selected button calls loadSelected()', async () => {
    const loadSelectedSpy = vi.fn().mockResolvedValue(undefined)
    useQRStore.setState({ loadSelected: loadSelectedSpy } as never)
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-get-selected-btn'))
    await waitFor(() => expect(loadSelectedSpy).toHaveBeenCalledTimes(1))
  })

  it('Get All button calls loadAll()', async () => {
    const loadAllSpy = vi.fn().mockResolvedValue(undefined)
    useQRStore.setState({ loadAll: loadAllSpy } as never)
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-get-all-btn'))
    await waitFor(() => expect(loadAllSpy).toHaveBeenCalledTimes(1))
  })

  it('Get Selected closes modal after retrieval', async () => {
    useQRStore.setState({ loadSelected: vi.fn().mockResolvedValue(undefined) } as never)
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-get-selected-btn'))
    await waitFor(() => expect(useUIStore.getState().isQROpen).toBe(false))
  })

  it('Get All closes modal after retrieval', async () => {
    useQRStore.setState({ loadAll: vi.fn().mockResolvedValue(undefined) } as never)
    render(<QRModal />)
    fireEvent.click(screen.getByTestId('qr-get-all-btn'))
    await waitFor(() => expect(useUIStore.getState().isQROpen).toBe(false))
  })
})

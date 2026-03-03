import { create } from 'zustand'
import type { QRResult, SearchField } from '../types/dicom'
import { searchStudies, searchSeries } from '../api/dicomWebClient'
import { getTagValue } from '../utils/dicomUtils'
import { useStatusStore } from './statusStore'
import { useStudyTreeStore } from './studyTreeStore'

// DICOM tag constants
const TAG = {
  STUDY_UID: '0020000D',
  SERIES_UID: '0020000E',
  PATIENT_NAME: '00100010',
  PATIENT_ID: '00100020',
  MODALITY: '00080060',
  BODY_PART: '00180015',
  SERIES_DESC: '0008103E',
}

interface QRState {
  searchField: SearchField
  searchText: string
  results: QRResult[]
  setSearchField: (field: SearchField) => void
  setSearchText: (text: string) => void
  toggleSelect: (seriesUid: string) => void
  search: () => Promise<void>
  loadSelected: () => Promise<void>
  loadAll: () => Promise<void>
}

async function retrieve(results: QRResult[]) {
  const status = useStatusStore.getState()
  const { addSeries } = useStudyTreeStore.getState()
  status.set('Retrieving Files...')
  for (const r of results) {
    await addSeries(r)
  }
  status.set(`${results.length} Series Retrieved`)
}

export const useQRStore = create<QRState>((set, get) => ({
  searchField: 'patientName',
  searchText: '',
  results: [],

  setSearchField: (field) => set({ searchField: field }),
  setSearchText: (text) => set({ searchText: text }),

  toggleSelect: (seriesUid) =>
    set((state) => ({
      results: state.results.map((r) =>
        r.seriesUid === seriesUid ? { ...r, selected: !r.selected } : r
      ),
    })),

  search: async () => {
    const { searchText, searchField } = get()
    const status = useStatusStore.getState()
    set({ results: [] })
    try {
      status.set('Searching...')
      const studies = await searchStudies(searchText, searchField)
      const results: QRResult[] = []
      for (const study of studies) {
        const studyUid = getTagValue(study, TAG.STUDY_UID)
        const seriesList = await searchSeries(studyUid)
        for (const series of seriesList) {
          results.push({
            studyUid,
            seriesUid: getTagValue(series, TAG.SERIES_UID),
            patientName: getTagValue(study, TAG.PATIENT_NAME),
            patientId: getTagValue(study, TAG.PATIENT_ID),
            modality: getTagValue(series, TAG.MODALITY),
            bodyPart: getTagValue(series, TAG.BODY_PART),
            seriesDescription: getTagValue(series, TAG.SERIES_DESC),
            selected: true,
          })
        }
      }
      set({ results })
      status.set(`QIDO-RS Completed: Found ${results.length} Series`)
    } catch (e) {
      status.set(`QIDO-RS Failed: ${(e as Error).message}`)
    }
  },

  loadSelected: async () => {
    const selected = get().results.filter((r) => r.selected)
    await retrieve(selected)
  },

  loadAll: async () => {
    await retrieve(get().results)
  },
}))

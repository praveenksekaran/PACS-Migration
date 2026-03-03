import { API_URL } from '../config'
import type { DicomDataset, SearchField } from '../types/dicom'

async function qido(url: string): Promise<DicomDataset[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`QIDO-RS request failed: ${res.status}`)
  return res.json() as Promise<DicomDataset[]>
}

export function searchStudies(query: string, field: SearchField): Promise<DicomDataset[]> {
  const param = field === 'patientId' ? 'PatientID' : 'PatientName'
  const value = query || '*'
  return qido(`${API_URL}/rs/studies?${param}=${value}`)
}

export function searchSeries(studyUid: string): Promise<DicomDataset[]> {
  return qido(`${API_URL}/rs/studies/${studyUid}/series`)
}

export function searchInstances(studyUid: string, seriesUid: string): Promise<DicomDataset[]> {
  return qido(`${API_URL}/rs/studies/${studyUid}/series/${seriesUid}/instances`)
}

// DICOM JSON value representation
export interface DicomTag {
  vr: string
  Value?: (string | number | { Alphabetic?: string } | Record<string, unknown>)[]
}

export type DicomDataset = Record<string, DicomTag>

// Q/R result — one row in the QR modal results table
export interface QRResult {
  studyUid: string
  seriesUid: string
  patientName: string
  patientId: string
  modality: string
  bodyPart: string
  seriesDescription: string
  selected: boolean
}

// Tree node types for the Study Tree panel
export type TreeNodeType = 'patient' | 'study' | 'series' | 'instance'

export interface TreeNode {
  id: string
  label: string
  type: TreeNodeType
  expanded: boolean
  selected: boolean
  children: TreeNode[]
  data: {
    studyUid?: string
    seriesUid?: string
    sopUid?: string
    instanceNumber?: number
  }
}

export type SearchField = 'patientName' | 'patientId'

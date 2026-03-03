import type { DicomDataset } from '../types/dicom'

/**
 * Extracts a string value from a DICOM JSON dataset element.
 * Handles PN (Person Name) type which uses { Alphabetic: "..." } subfield.
 */
export function getTagValue(dataset: DicomDataset, tag: string): string {
  const el = dataset[tag]
  if (!el?.Value?.length) return ''
  const v = el.Value[0]
  if (typeof v === 'object' && v !== null && 'Alphabetic' in v) {
    return (v as { Alphabetic?: string }).Alphabetic ?? ''
  }
  return typeof v === 'string' ? v : String(v)
}

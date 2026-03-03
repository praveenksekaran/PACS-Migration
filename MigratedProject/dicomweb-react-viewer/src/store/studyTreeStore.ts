import { create } from 'zustand'
import type { TreeNode, QRResult } from '../types/dicom'
import { searchInstances } from '../api/dicomWebClient'
import { getTagValue } from '../utils/dicomUtils'

// DICOM tag constants
const TAG = {
  SOP_UID: '00080018',
  INSTANCE_NUMBER: '00200013',
}

interface StudyTreeState {
  nodes: TreeNode[]
  selectedInstanceId: string | null
  addSeries: (result: QRResult) => Promise<void>
  selectInstance: (sopUid: string) => void
  clear: () => void
}

function findOrCreate(
  nodes: TreeNode[],
  id: string,
  factory: () => TreeNode
): [TreeNode[], TreeNode] {
  const existing = nodes.find((n) => n.id === id)
  if (existing) return [nodes, existing]
  const node = factory()
  return [[...nodes, node], node]
}

export const useStudyTreeStore = create<StudyTreeState>((set, get) => ({
  nodes: [],
  selectedInstanceId: null,

  addSeries: async (result) => {
    const instances = await searchInstances(result.studyUid, result.seriesUid)

    // Sort by instance number
    const sorted = [...instances].sort((a, b) => {
      const na = parseInt(getTagValue(a, TAG.INSTANCE_NUMBER) || '0', 10)
      const nb = parseInt(getTagValue(b, TAG.INSTANCE_NUMBER) || '0', 10)
      return na - nb
    })

    const instanceNodes: TreeNode[] = sorted.map((inst, idx) => ({
      id: getTagValue(inst, TAG.SOP_UID) || `inst-${idx}`,
      label: getTagValue(inst, TAG.SOP_UID) || `Instance ${idx + 1}`,
      type: 'instance',
      expanded: false,
      selected: false,
      children: [],
      data: {
        studyUid: result.studyUid,
        seriesUid: result.seriesUid,
        sopUid: getTagValue(inst, TAG.SOP_UID),
        instanceNumber: parseInt(getTagValue(inst, TAG.INSTANCE_NUMBER) || '0', 10),
      },
    }))

    const seriesNode: TreeNode = {
      id: result.seriesUid,
      label: result.seriesDescription || result.modality || result.seriesUid,
      type: 'series',
      expanded: true,
      selected: false,
      children: instanceNodes,
      data: { studyUid: result.studyUid, seriesUid: result.seriesUid },
    }

    const studyNode: TreeNode = {
      id: result.studyUid,
      label: result.modality || result.studyUid,
      type: 'study',
      expanded: true,
      selected: false,
      children: [seriesNode],
      data: { studyUid: result.studyUid },
    }

    set((state) => {
      const patientId = `patient-${result.patientId}`
      let [newNodes, patientNode] = findOrCreate(state.nodes, patientId, () => ({
        id: patientId,
        label: result.patientName || result.patientId,
        type: 'patient',
        expanded: true,
        selected: false,
        children: [],
        data: {},
      }))

      // Merge series into existing study if present
      const studyExists = patientNode.children.find((n) => n.id === result.studyUid)
      const updatedStudy = studyExists
        ? { ...studyExists, children: [...studyExists.children, seriesNode] }
        : studyNode

      const updatedPatient: TreeNode = {
        ...patientNode,
        children: studyExists
          ? patientNode.children.map((n) => (n.id === result.studyUid ? updatedStudy : n))
          : [...patientNode.children, studyNode],
      }

      return {
        nodes: newNodes.map((n) => (n.id === patientId ? updatedPatient : n)),
      }
    })
  },

  selectInstance: (sopUid) => set({ selectedInstanceId: sopUid }),

  clear: () => set({ nodes: [], selectedInstanceId: null }),
}))

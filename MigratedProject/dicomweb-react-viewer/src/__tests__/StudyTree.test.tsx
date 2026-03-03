import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StudyTree from '../components/StudyTree'
import { useStudyTreeStore } from '../store/studyTreeStore'
import type { TreeNode } from '../types/dicom'

vi.mock('../api/dicomWebClient', () => ({
  searchInstances: vi.fn(),
}))

function makeTree(): TreeNode[] {
  return [
    {
      id: 'patient-P001',
      label: 'Doe^John',
      type: 'patient',
      expanded: true,
      selected: false,
      children: [
        {
          id: '1.2.3',
          label: 'CT',
          type: 'study',
          expanded: true,
          selected: false,
          children: [
            {
              id: '4.5.6',
              label: 'Chest AP',
              type: 'series',
              expanded: true,
              selected: false,
              children: [
                { id: 'sop-1', label: 'sop-1', type: 'instance', expanded: false, selected: false, children: [], data: { sopUid: 'sop-1', studyUid: '1.2.3', seriesUid: '4.5.6' } },
                { id: 'sop-2', label: 'sop-2', type: 'instance', expanded: false, selected: false, children: [], data: { sopUid: 'sop-2', studyUid: '1.2.3', seriesUid: '4.5.6' } },
              ],
              data: { studyUid: '1.2.3', seriesUid: '4.5.6' },
            },
          ],
          data: { studyUid: '1.2.3' },
        },
      ],
      data: {},
    },
  ]
}

beforeEach(() => {
  useStudyTreeStore.setState({ nodes: [], selectedInstanceId: null })
  vi.clearAllMocks()
})

describe('StudyTree', () => {
  it('renders the study-tree region', () => {
    render(<StudyTree />)
    expect(screen.getByTestId('study-tree')).toBeInTheDocument()
  })

  it('shows patient node label', () => {
    useStudyTreeStore.setState({ nodes: makeTree() })
    render(<StudyTree />)
    expect(screen.getByText('Doe^John')).toBeInTheDocument()
  })

  it('shows study node label (Modality)', () => {
    useStudyTreeStore.setState({ nodes: makeTree() })
    render(<StudyTree />)
    expect(screen.getByText('CT')).toBeInTheDocument()
  })

  it('shows series node label (Series Description)', () => {
    useStudyTreeStore.setState({ nodes: makeTree() })
    render(<StudyTree />)
    expect(screen.getByText('Chest AP')).toBeInTheDocument()
  })

  it('shows instance node labels', () => {
    useStudyTreeStore.setState({ nodes: makeTree() })
    render(<StudyTree />)
    expect(screen.getByText('sop-1')).toBeInTheDocument()
    expect(screen.getByText('sop-2')).toBeInTheDocument()
  })

  it('clicking an instance node calls selectInstance', () => {
    useStudyTreeStore.setState({ nodes: makeTree() })
    render(<StudyTree />)
    fireEvent.click(screen.getByText('sop-1'))
    expect(useStudyTreeStore.getState().selectedInstanceId).toBe('sop-1')
  })

  it('collapses children when patient node is toggled', () => {
    useStudyTreeStore.setState({ nodes: makeTree() })
    render(<StudyTree />)
    // Click the expand toggle — CT is visible before
    expect(screen.getByText('CT')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('toggle-patient-P001'))
    expect(screen.queryByText('CT')).not.toBeInTheDocument()
  })

  it('shows two top-level patient nodes for two different patients', () => {
    const twoPatients: TreeNode[] = [
      { ...makeTree()[0] },
      {
        id: 'patient-P002',
        label: 'Smith^Jane',
        type: 'patient',
        expanded: true,
        selected: false,
        children: [],
        data: {},
      },
    ]
    useStudyTreeStore.setState({ nodes: twoPatients })
    render(<StudyTree />)
    expect(screen.getByText('Doe^John')).toBeInTheDocument()
    expect(screen.getByText('Smith^Jane')).toBeInTheDocument()
  })
})

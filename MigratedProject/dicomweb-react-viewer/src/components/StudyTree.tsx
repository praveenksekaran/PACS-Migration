import { useState } from 'react'
import { useStudyTreeStore } from '../store/studyTreeStore'
import type { TreeNode } from '../types/dicom'

interface NodeProps {
  node: TreeNode
  depth?: number
}

function TreeNodeItem({ node, depth = 0 }: NodeProps) {
  const [expanded, setExpanded] = useState(node.expanded)
  const selectInstance = useStudyTreeStore((s) => s.selectInstance)
  const selectedId = useStudyTreeStore((s) => s.selectedInstanceId)

  const hasChildren = node.children.length > 0
  const isSelected = node.type === 'instance' && selectedId === node.id

  function handleClick() {
    if (node.type === 'instance') {
      selectInstance(node.id)
    } else {
      setExpanded((e) => !e)
    }
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setExpanded((e) => !e)
  }

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div
        onClick={handleClick}
        style={{
          cursor: 'pointer',
          background: isSelected ? '#cce5ff' : 'transparent',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {hasChildren && (
          <span
            data-testid={`toggle-${node.id}`}
            onClick={handleToggle}
            style={{ userSelect: 'none', width: 12 }}
          >
            {expanded ? '▾' : '▸'}
          </span>
        )}
        {!hasChildren && <span style={{ width: 12 }} />}
        <span>{node.label}</span>
      </div>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  )
}

export default function StudyTree() {
  const nodes = useStudyTreeStore((s) => s.nodes)

  return (
    <div data-testid="study-tree" style={{ overflowY: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
      {nodes.map((node) => (
        <TreeNodeItem key={node.id} node={node} />
      ))}
    </div>
  )
}

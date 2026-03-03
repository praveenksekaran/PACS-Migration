import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import ViewportPanel from '../components/ViewportPanel'

describe('ViewportPanel', () => {
  it('renders the panel container with viewportId testid', () => {
    render(<ViewportPanel viewportId="axial" label="Axial" />)
    expect(screen.getByTestId('viewport-panel-axial')).toBeInTheDocument()
  })

  it('renders the canvas div with viewportId testid', () => {
    render(<ViewportPanel viewportId="coronal" label="Coronal" />)
    expect(screen.getByTestId('viewport-canvas-coronal')).toBeInTheDocument()
  })

  it('renders the label', () => {
    render(<ViewportPanel viewportId="sagittal" label="Sagittal" />)
    expect(screen.getByTestId('viewport-label-sagittal').textContent).toBe('Sagittal')
  })

  it('forwards ref to the canvas div', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ViewportPanel viewportId="axial" label="Axial" ref={ref} />)
    expect(ref.current).toBe(screen.getByTestId('viewport-canvas-axial'))
  })
})

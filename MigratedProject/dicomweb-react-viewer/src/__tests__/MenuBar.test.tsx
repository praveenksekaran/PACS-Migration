import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MenuBar from '../components/MenuBar'
import { useUIStore } from '../store/uiStore'

beforeEach(() => {
  useUIStore.setState({ isQROpen: false })
})

describe('MenuBar', () => {
  it('renders the menu-bar region', () => {
    render(<MenuBar />)
    expect(screen.getByTestId('menu-bar')).toBeInTheDocument()
  })

  it('renders a File menu label', () => {
    render(<MenuBar />)
    expect(screen.getByText('File')).toBeInTheDocument()
  })

  it('clicking File shows the Query/Retrieve menu item', () => {
    render(<MenuBar />)
    fireEvent.click(screen.getByText('File'))
    expect(screen.getByTestId('menu-item-qr')).toBeInTheDocument()
  })

  it('clicking Query/Retrieve opens the QR modal', () => {
    render(<MenuBar />)
    fireEvent.click(screen.getByText('File'))
    fireEvent.click(screen.getByTestId('menu-item-qr'))
    expect(useUIStore.getState().isQROpen).toBe(true)
  })

  it('File menu closes after selecting an item', () => {
    render(<MenuBar />)
    fireEvent.click(screen.getByText('File'))
    fireEvent.click(screen.getByTestId('menu-item-qr'))
    expect(screen.queryByTestId('menu-item-qr')).not.toBeInTheDocument()
  })
})

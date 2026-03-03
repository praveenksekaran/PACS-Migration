import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBar from '../components/StatusBar'
import { useStatusStore } from '../store/statusStore'

beforeEach(() => {
  useStatusStore.setState({ message: '' })
})

describe('StatusBar', () => {
  it('renders the status-bar region', () => {
    render(<StatusBar />)
    expect(screen.getByTestId('status-bar')).toBeInTheDocument()
  })

  it('displays the current status message', () => {
    useStatusStore.setState({ message: 'QIDO-RS Completed: Found 5 Series' })
    render(<StatusBar />)
    expect(screen.getByText('QIDO-RS Completed: Found 5 Series')).toBeInTheDocument()
  })

  it('shows empty text when message is empty', () => {
    render(<StatusBar />)
    expect(screen.getByTestId('status-bar').textContent).toBe('')
  })
})

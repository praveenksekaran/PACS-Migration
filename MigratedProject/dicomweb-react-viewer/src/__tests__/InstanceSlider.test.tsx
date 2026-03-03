import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InstanceSlider from '../components/InstanceSlider'
import { useViewerStore } from '../store/viewerStore'

beforeEach(() => {
  useViewerStore.setState({ imageIds: [], currentIndex: 0 })
})

describe('InstanceSlider', () => {
  it('is not rendered when imageIds is empty', () => {
    render(<InstanceSlider />)
    expect(screen.queryByTestId('instance-slider')).not.toBeInTheDocument()
  })

  it('is not rendered when there is only 1 image', () => {
    useViewerStore.setState({ imageIds: ['wad://1'], currentIndex: 0 })
    render(<InstanceSlider />)
    expect(screen.queryByTestId('instance-slider')).not.toBeInTheDocument()
  })

  it('is rendered when there are multiple images', () => {
    useViewerStore.setState({ imageIds: ['wad://1', 'wad://2', 'wad://3'], currentIndex: 0 })
    render(<InstanceSlider />)
    expect(screen.getByTestId('instance-slider')).toBeInTheDocument()
  })

  it('range input has min=0 and max=imageIds.length-1', () => {
    useViewerStore.setState({ imageIds: ['a', 'b', 'c', 'd', 'e'], currentIndex: 0 })
    render(<InstanceSlider />)
    const input = screen.getByTestId('slider-input') as HTMLInputElement
    expect(input.min).toBe('0')
    expect(input.max).toBe('4')
  })

  it('range input value reflects currentIndex', () => {
    useViewerStore.setState({ imageIds: ['a', 'b', 'c'], currentIndex: 2 })
    render(<InstanceSlider />)
    const input = screen.getByTestId('slider-input') as HTMLInputElement
    expect(input.value).toBe('2')
  })

  it('changing slider calls setCurrentIndex', () => {
    useViewerStore.setState({ imageIds: ['a', 'b', 'c'], currentIndex: 0 })
    render(<InstanceSlider />)
    fireEvent.change(screen.getByTestId('slider-input'), { target: { value: '2' } })
    expect(useViewerStore.getState().currentIndex).toBe(2)
  })

  it('displays "currentIndex+1 / total" label', () => {
    useViewerStore.setState({ imageIds: ['a', 'b', 'c'], currentIndex: 1 })
    render(<InstanceSlider />)
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })
})

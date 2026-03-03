import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../store/uiStore'

beforeEach(() => {
  useUIStore.setState({ isQROpen: false })
})

describe('uiStore', () => {
  it('isQROpen is false initially', () => {
    expect(useUIStore.getState().isQROpen).toBe(false)
  })

  it('openQR() sets isQROpen to true', () => {
    useUIStore.getState().openQR()
    expect(useUIStore.getState().isQROpen).toBe(true)
  })

  it('closeQR() sets isQROpen to false', () => {
    useUIStore.setState({ isQROpen: true })
    useUIStore.getState().closeQR()
    expect(useUIStore.getState().isQROpen).toBe(false)
  })
})

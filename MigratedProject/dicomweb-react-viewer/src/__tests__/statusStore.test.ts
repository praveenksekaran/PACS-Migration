import { describe, it, expect, beforeEach } from 'vitest'
import { useStatusStore } from '../store/statusStore'

beforeEach(() => {
  useStatusStore.setState({ message: '' })
})

describe('statusStore', () => {
  it('has empty message initially', () => {
    expect(useStatusStore.getState().message).toBe('')
  })

  it('set() updates the message', () => {
    useStatusStore.getState().set('QIDO-RS Completed: Found 3 Series')
    expect(useStatusStore.getState().message).toBe('QIDO-RS Completed: Found 3 Series')
  })

  it('clear() resets message to empty string', () => {
    useStatusStore.getState().set('something')
    useStatusStore.getState().clear()
    expect(useStatusStore.getState().message).toBe('')
  })
})

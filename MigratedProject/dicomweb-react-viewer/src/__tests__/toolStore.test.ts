import { describe, it, expect, beforeEach } from 'vitest'
import { useToolStore } from '../store/toolStore'

beforeEach(() => {
  useToolStore.setState({ activeTool: 'Wwwl', pendingAction: null })
})

describe('toolStore initial state', () => {
  it('activeTool defaults to Wwwl', () => {
    expect(useToolStore.getState().activeTool).toBe('Wwwl')
  })
  it('pendingAction defaults to null', () => {
    expect(useToolStore.getState().pendingAction).toBeNull()
  })
})

describe('toolStore.setActiveTool()', () => {
  it('changes activeTool to Pan', () => {
    useToolStore.getState().setActiveTool('Pan')
    expect(useToolStore.getState().activeTool).toBe('Pan')
  })
  it('changes activeTool to Zoom', () => {
    useToolStore.getState().setActiveTool('Zoom')
    expect(useToolStore.getState().activeTool).toBe('Zoom')
  })
  it('switches back to Wwwl', () => {
    useToolStore.getState().setActiveTool('Pan')
    useToolStore.getState().setActiveTool('Wwwl')
    expect(useToolStore.getState().activeTool).toBe('Wwwl')
  })
})

describe('toolStore.triggerAction()', () => {
  it('sets pendingAction to FlipH', () => {
    useToolStore.getState().triggerAction('FlipH')
    expect(useToolStore.getState().pendingAction).toBe('FlipH')
  })
  it('sets pendingAction to FlipV', () => {
    useToolStore.getState().triggerAction('FlipV')
    expect(useToolStore.getState().pendingAction).toBe('FlipV')
  })
  it('sets pendingAction to Invert', () => {
    useToolStore.getState().triggerAction('Invert')
    expect(useToolStore.getState().pendingAction).toBe('Invert')
  })
})

describe('toolStore.clearPendingAction()', () => {
  it('resets pendingAction to null', () => {
    useToolStore.getState().triggerAction('FlipH')
    useToolStore.getState().clearPendingAction()
    expect(useToolStore.getState().pendingAction).toBeNull()
  })
})

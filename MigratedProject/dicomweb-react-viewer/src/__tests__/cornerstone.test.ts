import { describe, it, expect } from 'vitest'
import { initCornerstone } from '../lib/cornerstone'

describe('initCornerstone', () => {
  it('returns a Promise', () => {
    const result = initCornerstone()
    expect(result).toBeInstanceOf(Promise)
  })

  it('resolves without error', async () => {
    await expect(initCornerstone()).resolves.toBeUndefined()
  })
})

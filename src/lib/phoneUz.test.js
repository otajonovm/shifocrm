import { describe, it, expect } from 'vitest'
import {
  formatPhoneForStorage,
  phoneAuthLookupVariants,
} from './phoneUz'

describe('phoneUz auth lookup', () => {
  it('formatPhoneForStorage normalizes masked input', () => {
    expect(formatPhoneForStorage('+998 (90) 123-45-67')).toBe('+998901234567')
  })

  it('phoneAuthLookupVariants includes + and without +', () => {
    const variants = phoneAuthLookupVariants('+998 (90) 123-45-67')
    expect(variants).toContain('+998901234567')
    expect(variants).toContain('998901234567')
  })
})

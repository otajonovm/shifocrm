import { describe, it, expect } from 'vitest'
import { parseCsvText, markDuplicatePhones } from './importParse'

describe('importParse', () => {
  it('parseCsvText reads semicolon-separated Uzbek headers', () => {
    const csv = `Ism;Telefon;Tugilgan sana;Izoh
Ali Valiyev;+998901234567;1990-05-12;Eslatma
Malika Karimova;998907654321;;`

    const rows = parseCsvText(csv)
    expect(rows).toHaveLength(2)
    expect(rows[0].full_name).toBe('Ali Valiyev')
    expect(rows[0].phone).toMatch(/998/)
    expect(rows[0].birth_date).toBe('1990-05-12')
    expect(rows[0].notes).toBe('Eslatma')
  })

  it('parseCsvText reads rows when header is generic', () => {
    const csv = `Ism;Telefon
Bemor A;901112233
Bemor B;902223344`

    const rows = parseCsvText(csv)
    expect(rows[0].full_name).toBe('Bemor A')
    expect(rows[0].phone).toBeTruthy()
  })

  it('markDuplicatePhones flags existing and batch duplicates', () => {
    const existing = [{ phone: '+998901234567' }]
    const rows = [
      { full_name: 'A', phone: '+998901234567' },
      { full_name: 'B', phone: '+998907654321' },
      { full_name: 'C', phone: '+998907654321' },
    ]

    const marked = markDuplicatePhones(rows, existing)
    expect(marked[0].duplicate).toBe(true)
    expect(marked[0].duplicateReason).toBe('existing_patient')
    expect(marked[1].duplicate).toBe(false)
    expect(marked[1].selected).toBe(true)
    expect(marked[2].duplicate).toBe(true)
    expect(marked[2].duplicateReason).toBe('batch_duplicate')
  })
})

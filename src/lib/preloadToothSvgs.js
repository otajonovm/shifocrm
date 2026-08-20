import { PERMANENT_TEETH } from '@/domain/odontogram'

let started = false

/** Odontogramma ochilishidan oldin 32 ta tish SVG ni brauzer keshiga oladi. */
export function preloadToothSvgs() {
  if (started || typeof window === 'undefined') return
  started = true
  for (const id of PERMANENT_TEETH) {
    const img = new Image()
    img.decoding = 'async'
    img.src = `/teeth/${id}.svg`
  }
}

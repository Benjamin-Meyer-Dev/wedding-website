import { useEffect } from 'react'

// Tracks the pointer and writes normalized offsets (-1..1) as CSS custom
// properties (--px, --py) onto the given element. Children with the `.plx`
// class then drift by their own `--d` depth — one listener powers the whole
// scene's parallax.
export default function useParallax(ref) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(hover: hover)').matches) return // skip on touch

    let raf = 0
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', x.toFixed(3))
        el.style.setProperty('--py', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [ref])
}

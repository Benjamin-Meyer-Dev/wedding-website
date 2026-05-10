import { useEffect, useMemo, useState } from 'react'
import './loading.css'

const STAR_COUNT = 75

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  // Stars distributed across the viewport, each with a target offset from
  // center so they burst outward from the monogram.
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, () => ({
        tx: (Math.random() - 0.5) * 105, // -52.5 to 52.5 vw
        ty: (Math.random() - 0.5) * 105, // -52.5 to 52.5 vh
        size: 1 + Math.random() * 2.5,
        delay: Math.random() * 650,
      })),
    []
  )

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1050) // burst stars after & blooms
    const t2 = setTimeout(() => setPhase(2), 3000) // begin fade out
    const t3 = setTimeout(() => onDone && onDone(), 3550) // unmount
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  return (
    <div className={`loading-screen phase-${phase}`} aria-hidden="true">
      <div className="loading-rings">
        <span className="loading-ring" />
        <span className="loading-ring loading-ring-soft" style={{ animationDelay: '260ms' }} />
      </div>

      <div className="loading-stars">
        {stars.map((s, i) => (
          <span
            key={i}
            className="ls-star"
            style={{
              '--tx': `${s.tx}vw`,
              '--ty': `${s.ty}vh`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}ms`,
            }}
          />
        ))}
      </div>

      <div className="loading-monogram">
        <span className="lm-letter lm-e">E</span>
        <span className="lm-amp">&amp;</span>
        <span className="lm-letter lm-b">B</span>
      </div>
    </div>
  )
}

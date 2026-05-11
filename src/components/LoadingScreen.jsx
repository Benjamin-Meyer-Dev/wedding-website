import { useEffect, useMemo, useState } from 'react'
import './loading.css'

const STAR_COUNT = 75

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

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
    const t1 = setTimeout(() => setPhase(1), 1600) // stars drift
    const t2 = setTimeout(() => setPhase(2), 4400) // begin fade out
    const t3 = setTimeout(() => onDone && onDone(), 5100) // unmount after fade
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  return (
    <div className={`loading-screen phase-${phase}`} aria-hidden="true">
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
        <span className="lm-rule lm-rule-l" />
        <div className="lm-letters">
          <span className="lm-letter lm-e">E</span>
          <span className="lm-amp">&amp;</span>
          <span className="lm-letter lm-b">B</span>
        </div>
        <span className="lm-rule lm-rule-r" />
      </div>
    </div>
  )
}

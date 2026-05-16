import { useEffect, useState } from 'react'
import './loading.css'

export default function LoadingScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    const t2 = setTimeout(() => setPhase(2), 1900)
    const t3 = setTimeout(() => onDone && onDone(), 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onDone])

  return (
    <div className={`loading-screen phase-${phase}`}>
      <div className="loading-mark">
        <p className="lm-tag">Save the Date</p>
        <h1 className="lm-names">
          <span>E</span>
          <span className="lm-amp">&amp;</span>
          <span>B</span>
        </h1>
        <p className="lm-date">29 May 2027</p>
        <span className="lm-rule" />
      </div>
    </div>
  )
}

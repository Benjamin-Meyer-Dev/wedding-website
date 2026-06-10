import { useEffect, useState } from 'react'
import './loading.css'

export default function LoadingScreen({ onExit, onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 80)
    // Hold the settled mark a touch longer, then begin the fade-out AND tell the
    // app to mount the page beneath us, so the loader crossfades to reveal it.
    const t2 = setTimeout(() => { setPhase(2); onExit && onExit() }, 2800)
    // Unmount only once the (longer) fade has finished.
    const t3 = setTimeout(() => onDone && onDone(), 3700)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onExit, onDone])

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

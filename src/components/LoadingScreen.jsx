import { useEffect, useState } from 'react'
import './Loading.css'

export default function LoadingScreen({ onExit, onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    let f1 = 0
    let f2 = 0
    const t1 = setTimeout(() => setPhase(1), 80)
    // Hold the settled mark a touch longer, then tell the app to mount the page
    // beneath us, and begin the fade-out once that has painted. Mounting the
    // page is the heaviest frame of the visit (100-200ms on a phone); started in
    // the same frame as the fade, it froze the crossfade's first steps. Two
    // frame callbacks put the fade after the mount's paint, while the loader is
    // still fully opaque over it.
    const t2 = setTimeout(() => {
      onExit && onExit()
      f1 = requestAnimationFrame(() => { f2 = requestAnimationFrame(() => setPhase(2)) })
    }, 2800)
    // Unmount only once the 900ms fade has finished (it starts ~2 frames after 2800).
    const t3 = setTimeout(() => onDone && onDone(), 3760)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      cancelAnimationFrame(f1)
      cancelAnimationFrame(f2)
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

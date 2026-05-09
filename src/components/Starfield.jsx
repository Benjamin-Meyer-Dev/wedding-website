import { useMemo } from 'react'
import './starfield.css'

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RANGE = 480 // px each waypoint can drift from origin

export default function Starfield({ count = 80 }) {
  const { stars, css } = useMemo(() => {
    const rand = mulberry32(7)
    const stars = Array.from({ length: count }, (_, i) => {
      const waypoints = Array.from({ length: 5 }, () => ({
        x: Math.round((rand() - 0.5) * 2 * RANGE),
        y: Math.round((rand() - 0.5) * 2 * RANGE),
      }))
      return {
        id: i,
        x: rand() * 100,
        y: rand() * 100,
        size: 1.2 + rand() * 2.4,
        delay: rand() * 8,
        duration: 180 + rand() * 200,
        opacity: 0.4 + rand() * 0.5,
        waypoints,
      }
    })

    const css = stars
      .map(s => {
        const w = s.waypoints
        return `@keyframes star-drift-${s.id} {
  0%     { transform: translate(0, 0); }
  16.66% { transform: translate(${w[0].x}px, ${w[0].y}px); }
  33.33% { transform: translate(${w[1].x}px, ${w[1].y}px); }
  50%    { transform: translate(${w[2].x}px, ${w[2].y}px); }
  66.66% { transform: translate(${w[3].x}px, ${w[3].y}px); }
  83.33% { transform: translate(${w[4].x}px, ${w[4].y}px); }
  100%   { transform: translate(0, 0); }
}`
      })
      .join('\n')

    return { stars, css }
  }, [count])

  return (
    <>
      <style>{css}</style>
      <div className="starfield" aria-hidden="true">
        {stars.map(s => (
          <span
            key={s.id}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              opacity: s.opacity,
              animationName: `star-drift-${s.id}`,
              animationDuration: `${s.duration}s`,
              animationDelay: `${s.delay}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>
    </>
  )
}

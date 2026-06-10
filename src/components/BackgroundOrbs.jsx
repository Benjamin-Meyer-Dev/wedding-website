import './backgroundOrbs.css'

// A handful of soft, blurred gradient orbs scattered behind everything.
// Hand-placed (not random) so the composition reads as deliberate — the
// orbs anchor opposite corners and the middle so the page has depth from
// edge to edge.
const ORBS = [
  { size: 460, x: 6,  y: 8,  hue: 'bright', driftX: 24,  driftY: 18,  duration: 28 },
  { size: 360, x: 82, y: 14, hue: 'soft',   driftX: -22, driftY: 24,  duration: 32 },
  { size: 300, x: 38, y: 46, hue: 'bright', driftX: 18,  driftY: -16, duration: 26 },
  { size: 420, x: 88, y: 72, hue: 'accent', driftX: -28, driftY: -20, duration: 34 },
  { size: 280, x: 12, y: 78, hue: 'soft',   driftX: 20,  driftY: -22, duration: 24 },
  { size: 340, x: 60, y: 92, hue: 'bright', driftX: -18, driftY: 16,  duration: 30 },
]

const HUE_STOPS = {
  bright: ['rgba(168, 204, 224, 0.55)', 'rgba(168, 204, 224, 0)'],
  soft:   ['rgba(110, 167, 201, 0.45)', 'rgba(110, 167, 201, 0)'],
  accent: ['rgba(58, 111, 149, 0.32)',  'rgba(58, 111, 149, 0)'],
}

export default function BackgroundOrbs() {
  return (
    <div className="bg-orbs">
      {ORBS.map((o, i) => {
        const [stop0, stop1] = HUE_STOPS[o.hue]
        return (
          <span
            key={i}
            className="bg-orb"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: `${o.size}px`,
              height: `${o.size}px`,
              background: `radial-gradient(circle at 35% 30%, ${stop0} 0%, ${stop1} 70%)`,
              '--dx': `${o.driftX}px`,
              '--dy': `${o.driftY}px`,
              // The .bg-orb rule reads `var(--duration)` in its animation
              // shorthand — set the custom property, not animation-duration,
              // or the shorthand is invalid and the orbs never drift.
              '--duration': `${o.duration}s`,
              animationDelay: `${-i * 3}s`,
            }}
          />
        )
      })}
    </div>
  )
}

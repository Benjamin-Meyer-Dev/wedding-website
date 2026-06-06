// Shared storybook decoration: drifting botanical sprigs in the corners and a
// field of faint sparkles. Everything is a parallax layer (.plx) at a different
// depth, so the scene gains foreground/background separation as the pointer
// moves. Purely decorative.

const Sprig = ({ className }) => (
  <span className={`decor-sprig ${className}`} aria-hidden="true">
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.4"
         strokeLinecap="round" strokeLinejoin="round">
      <path d="M60 116 C60 86 60 64 60 18" />
      <path d="M60 96 C44 92 34 80 33 64 C49 64 60 78 60 96Z" />
      <path d="M60 80 C76 76 86 64 87 48 C71 48 60 62 60 80Z" />
      <path d="M60 58 C46 55 38 45 37 31 C51 31 60 44 60 58Z" />
      <path d="M60 44 C74 41 82 31 83 19 C69 19 60 31 60 44Z" />
      <path d="M60 26 C54 20 52 12 53 4 C61 6 62 18 60 26Z" />
    </svg>
  </span>
)

const sparkles = [
  { top: '14%', left: '12%', d: 6, s: 7, delay: '0s' },
  { top: '22%', left: '82%', d: 10, s: 9, delay: '1.1s' },
  { top: '9%', left: '54%', d: 4, s: 6, delay: '2.3s' },
  { top: '34%', left: '30%', d: 14, s: 8, delay: '0.7s' },
  { top: '18%', left: '68%', d: 8, s: 5, delay: '1.8s' },
  { top: '44%', left: '88%', d: 16, s: 7, delay: '3.0s' },
  { top: '40%', left: '6%', d: 12, s: 6, delay: '2.6s' },
]

export default function SceneDecor() {
  return (
    <div className="decor" aria-hidden="true">
      {sparkles.map((p, i) => (
        <i
          key={i}
          className="decor-spark"
          style={{ top: p.top, left: p.left, '--s': `${p.s}px`, animationDelay: p.delay }}
        />
      ))}
      <Sprig className="decor-sprig--tl" />
      <Sprig className="decor-sprig--br" />
    </div>
  )
}

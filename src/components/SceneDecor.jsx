// Shared storybook decoration: drifting magnolia sprigs in the corners and a
// field of faint sparkles. Purely decorative.

// A magnolia branch in the same minimal line-art style as before: a gently
// curved branch, one open bloom (broad petals around the magnolia's signature
// central cone), a closed bud on an offshoot, and a single leaf. Same 120x120
// footprint, so the corner placement / rotation / scale are unchanged.
const Sprig = ({ className }) => (
  <span className={`decor-sprig ${className}`} aria-hidden="true">
    <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.4"
         strokeLinecap="round" strokeLinejoin="round">
      {/* branch + offshoot to the bud */}
      <path d="M64 118 C60 96 66 82 60 64 C56 50 61 38 58 26" />
      <path d="M61 66 C69 62 75 56 80 52" />
      {/* open bloom — five broad petals radiating from the branch tip */}
      <path d="M58 26 C54 15 55 7 58 2 C61 7 62 15 58 26Z" />
      <path d="M58 26 C47 21 40 15 36 10 C43 17 50 23 58 26Z" />
      <path d="M58 26 C69 21 76 15 80 10 C73 17 66 23 58 26Z" />
      <path d="M58 26 C49 30 43 36 40 42 C48 38 54 32 58 26Z" />
      <path d="M58 26 C67 30 73 36 76 42 C68 38 62 32 58 26Z" />
      {/* central cone (the magnolia's signature) */}
      <path d="M58 19 C55 19 55 27 58 27 C61 27 61 19 58 19Z" />
      {/* closed bud at the offshoot tip */}
      <path d="M80 52 C74 47 75 38 82 37 C89 41 87 50 80 52Z" />
      {/* leaf lower on the branch */}
      <path d="M62 92 C73 91 81 84 84 74 C72 75 64 82 62 92Z" />
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

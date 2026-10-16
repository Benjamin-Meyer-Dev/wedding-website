import { Smartphone } from 'lucide-react'
import './OrientationGate.css'

// Sideways is the one shape these scenes can't take: every page is a
// full-screen, scroll-free scene measured off the viewport height, and a phone
// in landscape leaves roughly 350-420px of it — not enough for the navbar plus
// a scene, so cards overlap and headers collide.
//
// The web cannot actually force an orientation. screen.orientation.lock() does
// not exist on iOS Safari at all, and elsewhere it is only honoured in
// fullscreen or in an installed app — the manifest's "orientation": "portrait"
// covers that installed case. For an ordinary browser tab, which is how nearly
// every guest will open the link, the honest fix is to stop showing the broken
// layout and ask for the phone back upright.
//
// Whether this is visible is decided entirely by the media query in the
// stylesheet: no resize listener, no state, nothing to re-render while the
// device is mid-rotation.
export default function OrientationGate() {
  return (
    <div className="orientation-gate">
      <div className="og-mark">
        <span className="og-icon">
          <Smartphone size={40} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <p className="og-tag">Please rotate</p>
        <h2 className="og-title">Best held upright</h2>
        <p className="og-note">
          Turn your phone back to portrait and we&rsquo;ll pick up right where you left off.
        </p>
        <span className="og-rule" />
      </div>
    </div>
  )
}

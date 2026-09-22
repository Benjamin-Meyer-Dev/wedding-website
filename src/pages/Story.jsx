import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Camera, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import './Story.css'

// Milestone photos live in src/assets, named after the milestone. Keyed by
// filename minus the extension, so either .jpg or .jpeg works and dropping a new
// photo into that folder is all it takes - no code change. A name with no
// matching file falls back to the themed camera tile, so the build never breaks
// on a photo that hasn't been added yet.
const PHOTOS = Object.fromEntries(
  Object.entries(import.meta.glob('../assets/*.{jpg,jpeg}', { eager: true, import: 'default' }))
    .map(([path, url]) => [path.split('/').pop().replace(/\.jpe?g$/i, ''), url])
)
const photo = (name) => PHOTOS[name] ?? ''

// One entry per year, 2016 through 2027. `title` is optional - a year with none
// still renders as a dated slot on the timeline, ready to fill in. Add a `text`
// field to any entry to show a description under its title.
const STORY = [
  { date: '2016', title: 'First Met', photo: photo('First Met') },
  { date: '2017', title: 'Started Dating', photo: photo('Started Dating') },
  { date: '2018', title: 'Prom', photo: photo('Prom') },
  { date: '2019', title: 'Helicopter Ride', photo: photo('Helicopter Ride') },
  { date: '2020', title: 'Mexico', photo: photo('Mexico') },
  { date: '2021', title: 'Uncle And Aunt', photo: photo('Uncle And Aunt') },
  { date: '2022', title: 'Egypt', photo: photo('Egypt') },
  { date: '2023', title: 'Alberta', photo: photo('Alberta') },
  { date: '2024', title: 'Disney', photo: photo('Disney') },
  { date: '2025', title: 'Proposal', photo: photo('Proposal') },
  { date: '2026', title: '', photo: '' },
  { date: '2027', title: '', photo: '' },
]

// The collage at the foot of the page is whatever sits in src/assets/gallery -
// drop in as many photos as you like, in any mix of shapes, and the spill
// arranges them on its own. Sorted by filename (numerically, so 2.jpg lands
// before 10.jpg) to give the composition a stable order between builds.
const GALLERY = Object.entries(
  import.meta.glob('../assets/gallery/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url)

// Until the folder has anything in it, stand in a full wall of themed tiles, so
// the section reads as the collage it will be rather than a sparse handful. The
// stand-ins take the mix of shapes real photos come in - portraits, squares,
// wide landscapes - so the composition previews the real thing instead of a
// grid of identical boxes. The moment a photo lands in the folder the whole
// fallback drops out.
const PLACEHOLDER_COUNT = 40
const PLACEHOLDER_RATIOS = [0.75, 1.33, 1, 0.67, 1.5, 0.56, 0.8, 1.78]
const GALLERY_CELLS = GALLERY.length ? GALLERY : Array.from({ length: PLACEHOLDER_COUNT }, () => '')

/* ================================================================
   Favourites: a stack of prints that spills across the table
   ================================================================ */

// How far the stage keeps scrolling past the point where it pins, as a multiple
// of the pinned height. This is the entire length of the spill and the one
// number to turn if it should feel quicker or slower.
const SPILL_TRAVEL = 1.9

// Deterministic pseudo-random (mulberry32), seeded per photo. The pile and the
// spread land in exactly the same places on every visit and every build, so the
// collage has a fixed composition rather than reshuffling itself each load.
function seeded(seed) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// How big the stack is next to a spread print. It shrinks to 1 as the prints
// travel, which reads as the view pulling back to take in the whole table.
const STACK_SCALE = 1.45

// How much of the table the spread occupies, leaving a margin around it, and
// how much of its own cell a print is allowed to fill. FILL below 1 is what
// guarantees the collage never overlaps: every print is sized so that its
// rotated bounding box fits inside its cell, the leftover is what the jitter is
// allowed to spend, and the cells themselves never touch.
const SPREAD_X = 99
const SPREAD_Y = 99
const SPREAD_X0 = (100 - SPREAD_X) / 2
const SPREAD_Y0 = (100 - SPREAD_Y) / 2
const FILL = 0.95
const GUTTER = 3 // px held clear between cells, on top of what FILL leaves

// Tilt costs size: a rotated rectangle needs a bigger box than an upright one,
// so every degree here makes the prints that have to fit inside a cell smaller.
// 13 is about as far as it goes before the photos start paying for it.
const MAX_TILT = 13

// How tall a print `w` wide stands. The photo scales with the print; the white
// mount around it is the same few pixels whatever size it's printed at, so the
// border is carried through rather than folded into one aspect ratio - a few
// pixels out is enough to put the corner of one print over its neighbour.
function slotHeight(w, ratio, pad) {
  return (w - pad) / ratio + pad
}

// The widest a print of this shape can be at this tilt and still fit the cell.
// A print `w` wide is `w / ratio + k` tall (slotHeight, rearranged), and tilted
// it needs a box of (w·cos + h·sin) by (w·sin + h·cos); both sides are linear
// in `w`, so solve each against the cell and take the tighter constraint.
function fitWidth(ratio, pad, rot, cellW, cellH) {
  const rad = (Math.abs(rot) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const k = pad * (1 - 1 / ratio)
  return Math.max(24, Math.min(
    (cellW * FILL - k * sin) / (cos + sin / ratio),
    (cellH * FILL - k * cos) / (sin + cos / ratio),
  ))
}

// The grid that makes the photos biggest, found by trying every column count
// and keeping the one with the most printed area. Squarest cells is the obvious
// guess and it is usually close, but not always right: the count has to divide
// the set into whole rows, and whatever the last row leaves empty is wasted.
// Measuring the real total beats guessing, and it costs one pass over a few
// hundred combinations on resize only.
function bestGrid(ratios, tilts, pad, tw, th) {
  const count = ratios.length
  let best = { cols: Math.max(1, Math.round(Math.sqrt(count))), rows: count, area: -1 }
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const cellW = tw / cols - GUTTER
    const cellH = th / rows - GUTTER
    if (cellW <= 0 || cellH <= 0) continue
    let area = 0
    for (let i = 0; i < count; i++) {
      const w = fitWidth(ratios[i], pad, tilts[i], cellW, cellH)
      area += w * slotHeight(w, ratios[i], pad)
    }
    if (area > best.area) best = { cols, rows, area }
  }
  return best
}

// The order the prints leave the stack in. A seeded Fisher-Yates shuffle, so
// every print still gets its own evenly spaced turn - the pile empties at a
// steady rate rather than in clumps - but which one goes next has nothing to do
// with where it lands. Keyed off the index alone, the spread filled in like
// text on a page, left to right and top to bottom; dealt at random it opens out
// from all over at once.
function shuffledQueue(count) {
  const queue = Array.from({ length: count }, (_, i) => i)
  const r = seeded(count * 7919 + 31)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    const swap = queue[i]
    queue[i] = queue[j]
    queue[j] = swap
  }
  return queue
}

// The fixed, seeded part of each print's composition: where it sits in the
// stack, how far it ends up tilted, which corner of its cell it leans towards,
// and when its turn comes. Sizes and the actual nudge are settled in `measure`,
// which is the only place that knows how big a cell is and what shape the photo
// turned out to be.
function compose(count, queue) {
  return Array.from({ length: count }, (_, i) => {
    const r = seeded(i * 48271 + 101)
    return {
      // The stack: near-centred, with just enough scatter that it reads as a
      // pile of separate prints and not one thick card.
      from: { x: 50 + (r() - 0.5) * 3, y: 50 + (r() - 0.5) * 2.4, rot: (r() - 0.5) * 10 },
      rot: (r() - 0.5) * 2 * MAX_TILT,
      lean: { x: (r() - 0.5) * 2, y: (r() - 0.5) * 2 },
      order: count > 1 ? queue[i] / (count - 1) : 0,
    }
  })
}

function Favourites({ photos }) {
  const stageRef = useRef(null)
  const pinRef = useRef(null)
  const tableRef = useRef(null)
  const cueRef = useRef(null)
  const slots = useRef([])
  const places = useRef([])
  const [open, setOpen] = useState(-1)

  // Shared by the render and the spill: a print that leaves the stack early
  // should be sitting near the top of it, which is what `--z` below is for.
  const queue = useMemo(() => shuffledQueue(photos.length), [photos.length])

  // Put every print where a 0..1 spill progress says it goes. Written straight
  // to the elements rather than through state: this runs on every scroll frame,
  // and forty React re-renders a frame is not a thing to ask for.
  const paint = useCallback((p) => {
    // The nudge to keep going. Gone by the time the stack has visibly opened -
    // once the prints are moving, the movement is its own invitation.
    if (cueRef.current) cueRef.current.style.opacity = `${Math.max(0, 1 - p / 0.18)}`
    const n = slots.current.length
    for (let i = 0; i < n; i++) {
      const el = slots.current[i]
      const place = places.current[i]
      if (!el || !place || !place.to || !place.fromPx || !place.toPx) continue
      // Staggered, so the stack peels apart print by print instead of every one
      // of them leaving at once. `order` is the print's turn in the shuffled
      // queue, so the spread fills in from all over rather than in reading
      // order.
      const local = Math.min(1, Math.max(0, (p - place.order * 0.34) / 0.6))
      const e = 1 - (1 - local) ** 3 // ease-out only - it settles, never overshoots
      // Most prints are stationary at either end of their stagger. Do not keep
      // sending the same transform back through style/compositing as another
      // print moves.
      if (place.lastE != null && Math.abs(place.lastE - e) < 0.0005) continue
      place.lastE = e
      const { from, to } = place
      const x = place.fromPx.x + (place.toPx.x - place.fromPx.x) * e
      const y = place.fromPx.y + (place.toPx.y - place.fromPx.y) * e
      el.style.transform =
        `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)` +
        ` rotate(${(from.rot + (to.rot - from.rot) * e).toFixed(3)}deg)` +
        ` scale(${(STACK_SCALE + (1 - STACK_SCALE) * e).toFixed(4)})`
    }
  }, [])

  useLayoutEffect(() => {
    const stage = stageRef.current
    const pin = pinRef.current
    const table = tableRef.current
    const scene = stage?.closest('.scene')
    if (!stage || !pin || !table || !scene) return

    // The seeded half of the composition. Fixed for the life of the section;
    // `measure` fills in each print's size and landing spot on top of it.
    places.current = compose(photos.length, queue)

    let frame = 0
    let pending = 0
    // Geometry is cached between scroll frames and refreshed by the observer
    // whenever the viewport, content host or any print changes size.
    let stickyTop = 0
    let rangeStart = 0
    let rangeEnd = 0

    // Scroll frames must contain no layout reads: reading client rects and then
    // writing forty positions forced a synchronous layout on every frame. The
    // range is refreshed by measure() whenever the host or a photo resizes.
    const track = () => {
      paint(rangeEnd > rangeStart
        ? Math.min(1, Math.max(0, (scene.scrollTop - rangeStart) / (rangeEnd - rangeStart)))
        : 1)
    }

    const measure = () => {
      // The pinned height comes from the scene's own measurement rather than a
      // vh unit: this page scrolls inside `.scene.story`, and on a phone that
      // and the viewport differ by the height of the browser chrome. 48px is
      // the gap `.scene.story::after` keeps at the foot of the page.
      stickyTop = parseFloat(getComputedStyle(pin).top) || 0
      const pinH = Math.min(1100, Math.max(320, scene.clientHeight - stickyTop - 48))
      stage.style.setProperty('--fav-pin-h', `${pinH}px`)
      stage.style.height = `${Math.round(pinH * (1 + SPILL_TRAVEL))}px`

      // The collage runs the full width of the scene rather than sitting inside
      // `.story-inner`'s 1520px column - on a wide monitor that column was the
      // single biggest thing holding the photos down. Measured off the scene
      // rather than set in `vw`, which would count the scrollbar and push the
      // page sideways.
      const host = stage.parentElement
      const bleed = Math.max(0, (scene.clientWidth - host.clientWidth) / 2)
      stage.style.width = `${host.clientWidth + bleed * 2}px`
      stage.style.marginLeft = `${-bleed}px`

      const tw = table.clientWidth
      const th = table.clientHeight
      if (!tw || !th) return

      // Shapes come from the photo's own proportions, never from the laid-out
      // slot. Measuring the element fed the width this function had just
      // written straight back into its next run, and because offsetWidth and
      // offsetHeight are whole pixels that loop never settled: it flipped
      // between two roundings for ever, and forty prints sat there buzzing.
      // A photo that hasn't loaded yet has no proportions to give and stands in
      // as a square until its `load` re-runs this.
      const ratios = places.current.map((_, i) => {
        const img = slots.current[i]?.querySelector('img')
        if (!img) return PLACEHOLDER_RATIOS[i % PLACEHOLDER_RATIOS.length]
        return img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1
      })
      // The white mount, taken from the stylesheet rather than repeated here.
      const mount = slots.current.find(Boolean)?.firstElementChild
      const pad = mount ? 2 * parseFloat(getComputedStyle(mount).paddingLeft) : 0

      const spreadW = (tw * SPREAD_X) / 100
      const spreadH = (th * SPREAD_Y) / 100
      const { cols, rows } = bestGrid(ratios, places.current.map((q) => q.rot), pad, spreadW, spreadH)
      // A cell the print must fit inside, less a gutter. Widths come out
      // fractional and the browser rounds them, which was enough on its own to
      // put a stray pixel of one print over its neighbour.
      const cellW = spreadW / cols - GUTTER
      const cellH = spreadH / rows - GUTTER

      const count = places.current.length
      for (let i = 0; i < count; i++) {
        const el = slots.current[i]
        const place = places.current[i]
        if (!el || !place) continue
        // The last row is rarely full - 40 prints over 6 columns leaves 4 - and
        // a short row left where it fell hung off the left of the spread. Half
        // of what it's missing, in cells, centres it under the rows above.
        const row = Math.floor(i / cols)
        const inRow = Math.min(cols, count - row * cols)
        const indent = (cols - inRow) / 2
        const rad = (Math.abs(place.rot) * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const w = fitWidth(ratios[i], pad, place.rot, cellW, cellH)
        el.style.width = `${w}px`

        // Whatever room the fitted print leaves in its cell is the jitter's to
        // spend - 80% of it, so a gap always survives. Nothing can reach a
        // neighbouring cell, which is what keeps the spread free of overlap.
        const h = slotHeight(w, ratios[i], pad)
        const slackX = Math.max(0, cellW - (w * cos + h * sin)) * 0.5 * 0.8
        const slackY = Math.max(0, cellH - (w * sin + h * cos)) * 0.5 * 0.8
        place.to = {
          x: SPREAD_X0 + (((i % cols) + indent + 0.5) / cols) * SPREAD_X + ((place.lean.x * slackX) / tw) * 100,
          y: SPREAD_Y0 + ((row + 0.5) / rows) * SPREAD_Y + ((place.lean.y * slackY) / th) * 100,
          rot: place.rot,
        }
        // left/top stay fixed at the table centre. Converting both endpoints to
        // pixels lets scroll frames change transform only, so the movement can
        // remain on the compositor instead of relaying out all forty prints.
        place.fromPx = {
          x: ((place.from.x - 50) / 100) * tw,
          y: ((place.from.y - 50) / 100) * th,
        }
        place.toPx = {
          x: ((place.to.x - 50) / 100) * tw,
          y: ((place.to.y - 50) / 100) * th,
        }
        place.lastE = null
      }

      // Refresh the cached scroll range after every geometry change. The host
      // is observed below, so lazy timeline photos above this section cannot
      // leave these values stale as they load.
      const box = stage.getBoundingClientRect()
      const sceneBox = scene.getBoundingClientRect()
      rangeStart = scene.scrollTop + box.top - sceneBox.top - stickyTop
      rangeEnd = Math.min(
        rangeStart + box.height - pin.offsetHeight,
        scene.scrollHeight - scene.clientHeight,
      )
      track()
    }

    // Debounced: the observer fires for the scene resizing, for the prints
    // changing size, and again for the re-layout `measure` itself causes.
    const schedule = () => {
      if (pending) return
      pending = requestAnimationFrame(() => { pending = 0; measure() })
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => { frame = 0; track() })
    }

    measure()
    scene.addEventListener('scroll', onScroll, { passive: true })
    // The scene and the column it sits in, but deliberately not the prints:
    // their size is this effect's own output, so observing it had every measure
    // schedule the next one.
    const ro = new ResizeObserver(schedule)
    ro.observe(scene)
    ro.observe(stage.parentElement)
    // What the prints are observed for instead. They're lazy, so most of them
    // report their proportions long after the first measure has run.
    const loading = []
    for (const el of slots.current) {
      const img = el?.querySelector('img')
      if (!img || img.complete) continue
      img.addEventListener('load', schedule)
      img.addEventListener('error', schedule)
      loading.push(img)
    }
    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (pending) cancelAnimationFrame(pending)
      scene.removeEventListener('scroll', onScroll)
      for (const img of loading) {
        img.removeEventListener('load', schedule)
        img.removeEventListener('error', schedule)
      }
      ro.disconnect()
    }
  }, [photos.length, queue, paint])

  // Freeze the page behind the lightbox. The scene keeps its scroll position -
  // `overflow: hidden` only stops the scrolling, and `scrollbar-gutter: stable`
  // means losing the scrollbar doesn't shift the layout underneath.
  useEffect(() => {
    if (open < 0) return
    const scene = stageRef.current?.closest('.scene')
    if (!scene) return
    const previous = scene.style.overflowY
    scene.style.overflowY = 'hidden'
    return () => { scene.style.overflowY = previous }
  }, [open])

  const step = useCallback((d) => {
    setOpen((i) => (i < 0 ? i : (i + d + photos.length) % photos.length))
  }, [photos.length])

  return (
    <section className="story-fav">
      <div className="story-fav-stage" ref={stageRef}>
        <div className="story-fav-pin" ref={pinRef}>
          <h2 className="story-gallery-title rev-fade" style={{ '--rd': '120ms' }}>A Few of Our Favourites</h2>
          <div className="story-fav-table rev-fade" ref={tableRef} style={{ '--rd': '220ms' }}>
            {photos.map((src, i) => (
              <div
                className="story-fav-slot"
                key={i}
                ref={(el) => { slots.current[i] = el }}
                /* Top of the pile goes first: the earlier a print's turn in the
                   queue, the higher it sits while the stack is still whole. */
                style={{ '--z': 10 + (photos.length - queue[i]) }}
              >
                <button
                  type="button"
                  className="story-fav-print"
                  onClick={() => setOpen(i)}
                  aria-label={`Open photo ${i + 1} of ${photos.length}`}
                >
                  {src
                    ? <img src={src} alt="" loading="lazy" draggable={false} />
                    : (
                      /* The stand-in sits INSIDE the mount rather than replacing
                         it, so an empty wall previews the real one - white
                         border and all - instead of a flat card. */
                      <span
                        className={`story-fav-blank tone-${i % 3}`}
                        style={{ '--fav-ratio': PLACEHOLDER_RATIOS[i % PLACEHOLDER_RATIOS.length] }}
                      >
                        <Camera aria-hidden="true" />
                      </span>
                    )}
                </button>
              </div>
            ))}
          </div>
          <span className="story-fav-cue" ref={cueRef} aria-hidden="true">
            Keep scrolling
            <ChevronDown />
          </span>
        </div>
      </div>
      {open >= 0 && photos[open] && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(-1)}
          onStep={step}
        />
      )}
    </section>
  )
}

// Rendered through a portal rather than in place: `.main` and the scene both
// clip their overflow, and `.story-inner`'s entrance animation makes it a
// containing block for anything fixed inside it.
function Lightbox({ photos, index, onClose, onStep }) {
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onStep(-1)
      else if (e.key === 'ArrowRight') onStep(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onStep])

  return createPortal(
    <div
      className="story-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${photos.length}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <img src={photos[index]} alt="" draggable={false} />
      <button type="button" className="story-lb-btn story-lb-prev" onClick={() => onStep(-1)} aria-label="Previous photo">
        <ChevronLeft aria-hidden="true" />
      </button>
      <button type="button" className="story-lb-btn story-lb-next" onClick={() => onStep(1)} aria-label="Next photo">
        <ChevronRight aria-hidden="true" />
      </button>
      <button type="button" className="story-lb-btn story-lb-close" onClick={onClose} ref={closeRef} aria-label="Close">
        <X aria-hidden="true" />
      </button>
      <span className="story-lb-count">{index + 1} / {photos.length}</span>
    </div>,
    document.body
  )
}

export default function Story() {
  const ref = useRef(null)
  useEffect(() => { if (ref.current) ref.current.scrollTop = 0 }, [])

  return (
    <section className="scene story" ref={ref}>
      <div className="story-inner">
        <header className="page-head story-head">
          <h1 className="page-title rev" style={{ '--rd': '70ms' }}>Once Upon a Time</h1>
        </header>

        <div className="story-timeline">
          {STORY.map((s, i) => (
            <article
              className={`story-item${i % 2 ? ' story-item--right' : ''} rev-fade`}
              style={{ '--rd': `${180 + i * 50}ms`, '--i': `${i}`, '--n': `${STORY.length}` }}
              key={i}
            >
              <figure className={`story-photo${s.photo ? '' : ` story-photo--empty tone-${i % 3}`}`}>
                {s.photo
                  ? <img src={s.photo} alt={s.title || s.date} loading="lazy" draggable={false} />
                  : <Camera aria-hidden="true" />}
              </figure>
              <span className="story-dot" aria-hidden="true" />
              <div className="story-content">
                <span className="story-date">{s.date}</span>
                {s.title && <h2 className="story-title">{s.title}</h2>}
                {s.text && <p className="story-text">{s.text}</p>}
              </div>
            </article>
          ))}
        </div>

        <Favourites photos={GALLERY_CELLS} />
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import { Camera } from 'lucide-react'
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
// drop in as many photos as you like, in any mix of shapes, and they flow into
// the masonry columns on their own. Sorted by filename (numerically, so 2.jpg
// lands before 10.jpg) to give the wall a stable order between builds.
const GALLERY = Object.entries(
  import.meta.glob('../assets/gallery/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, url]) => url)

// Until the folder has anything in it, stand in a handful of themed tiles so the
// section reads as a gallery-to-be rather than an empty page.
const GALLERY_CELLS = GALLERY.length ? GALLERY : ['', '', '', '', '', '']

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

        <h2 className="story-gallery-title rev-fade" style={{ '--rd': '180ms' }}>A Few of Our Favourites</h2>
        <div className="story-gallery">
          {GALLERY_CELLS.map((src, i) => (
            <figure
              key={i}
              className={`story-gallery-cell${src ? '' : ` story-gallery-cell--empty tone-${i % 3}`} rev-fade`}
              /* The stagger caps out after a dozen cells - with 40+ photos an
                 uncapped delay would leave the last of them fading in seconds
                 after the rest. */
              style={{ '--rd': `${220 + Math.min(i, 12) * 40}ms` }}
            >
              {src
                ? <img src={src} alt="" loading="lazy" draggable={false} />
                : <Camera aria-hidden="true" />}
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

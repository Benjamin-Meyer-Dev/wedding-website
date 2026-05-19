import './schedule.css'

const CEREMONY = {
  eyebrow: 'The Vows',
  title: 'Ceremony',
  time: '4:00 PM',
  venue: 'St. Mary’s Chapel',
  address: '123 Main Street, Town',
  items: [
    { time: '3:30 PM', label: 'Guests arrive' },
    { time: '4:00 PM', label: 'Ceremony begins' },
    { time: '4:45 PM', label: 'Recessional & portraits' },
  ],
}

const RECEPTION = {
  eyebrow: 'The Celebration',
  title: 'Reception',
  time: '6:00 PM',
  venue: 'The Riverside Estate',
  address: '456 River Road, Town',
  items: [
    { time: '6:00 PM', label: 'Cocktail hour' },
    { time: '7:00 PM', label: 'Dinner is served' },
    { time: '8:30 PM', label: 'First dance' },
    { time: '9:00 PM', label: 'Dancing until midnight' },
  ],
}

function ScheduleSide({ data, tone }) {
  return (
    <section className={`sched-half sched-half--${tone}`} tabIndex={0}>
      <div className="sched-half-inner">
        <p className="sched-eyebrow">
          <span className="sched-eyebrow-rule" />
          <span>{data.eyebrow}</span>
          <span className="sched-eyebrow-rule" />
        </p>
        <h2 className="sched-title">{data.title}</h2>
        <p className="sched-time">{data.time}</p>
        <p className="sched-venue-overview">{data.venue}</p>
        <p className="sched-hint" aria-hidden="true">Hover for details</p>

        <div className="sched-detail">
          <div className="sched-detail-track">
            <div className="sched-detail-inner">
              <div className="sched-venue">
                <p className="sched-venue-name">{data.venue}</p>
                <p className="sched-venue-addr">{data.address}</p>
              </div>
              <ol className="sched-timeline" aria-label={`${data.title} timeline`}>
                {data.items.map((item, idx) => (
                  <li className="sched-timeline-item" key={idx}>
                    <span className="sched-timeline-dot" aria-hidden="true" />
                    <span className="sched-timeline-time">{item.time}</span>
                    <span className="sched-timeline-label">{item.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Schedule() {
  return (
    <section className="sched">
      <header className="sched-header">
        <p className="sched-page-eyebrow">
          <span className="sched-page-eyebrow-rule" />
          <span>The Day</span>
          <span className="sched-page-eyebrow-rule" />
        </p>
        <h1 className="sched-page-title">Schedule</h1>
        <p className="sched-page-sub">Saturday &middot; 29 May 2027</p>
      </header>

      <div className="sched-split">
        <ScheduleSide data={CEREMONY} tone="light" />
        <ScheduleSide data={RECEPTION} tone="dark" />
      </div>
    </section>
  )
}

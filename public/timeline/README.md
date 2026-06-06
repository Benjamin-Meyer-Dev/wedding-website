# Timeline photos

Drop images here to fill the rotating stage on the Schedule page. Until a
file exists, that event shows a themed placeholder (gradient + icon) instead.

Expected filenames (referenced by `src/pages/Schedule.jsx`):

| File                 | Event               |
|----------------------|---------------------|
| `arrival.jpg`        | Guests Arrive       |
| `mass.jpg`           | Mass Starts         |
| `travel.jpg`         | Travel to Reception |
| `cocktails.jpg`      | Cocktail Hour       |
| `dinner.jpg`         | Dinner Start        |
| `party.jpg`          | Party Time          |
| `last-call.jpg`      | Last Call           |
| `heading-home.jpg`   | Heading Home        |

Tips
- Landscape orientation works best; the stage crops to a tall-ish panel
  (focal point favors the upper-center via `object-position: center 28%`).
- Any size works, but ~1200px wide keeps things crisp without bloating load.
- To change a filename or path, edit the `photo:` field on that event in
  `src/pages/Schedule.jsx`.

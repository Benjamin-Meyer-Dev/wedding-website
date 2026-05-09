# Elizabeth & Benjamin

A wedding landing page built with Vite + React.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → /dist
npm run preview  # preview the production build
```

## Adding your photo

Drop your engagement photo into `public/couple.jpg` and it will appear on the
right side of the hero automatically. Any aspect ratio works — it's set to
`background-size: cover`. If you'd rather use a different filename or path,
edit the `background-image` URL in `src/pages/home.css`.

## Structure

```
src/
├── App.jsx              # shell + theme state
├── main.jsx             # entry
├── components/
│   ├── Sidebar.jsx      # left rail with monogram + nav icons
│   ├── Starfield.jsx    # animated stars behind the hero
│   └── *.css
├── pages/
│   ├── Home.jsx         # the hero with names + countdown
│   └── home.css
└── styles/
    ├── global.css       # design tokens, reset, fonts
    └── app.css          # layout grid
```

## Customizing

- **Wedding date** — change `WEDDING_DATE` at the top of `src/pages/Home.jsx`.
  The countdown updates live every second.
- **Names** — edit the `<h1 className="names">` block in `src/pages/Home.jsx`.
- **Colors / theme** — design tokens live at the top of `src/styles/global.css`.
  Both dark and light palettes are defined there; the moon/sun button in the
  bottom of the sidebar toggles between them and remembers the choice in
  `localStorage`.
- **Fonts** — Fraunces (display), Cormorant Garamond italic (the ampersand),
  and Jost (small caps labels). Loaded via Google Fonts in `index.html`.

## Notes on the design

- The blue ampersand uses Cormorant Garamond italic at 500 weight to get that
  high-contrast swash shape from the original.
- The starfield only renders on the dark left half thanks to a CSS mask, so
  stars don't appear on top of your photo.
- The fade between the dark hero side and the photo side is a single
  `linear-gradient` overlay — adjust the percent stops in `home.css` under
  `.hero-photo-fade` to push the seam left or right.

# chan-updated-portfolio

A portfolio template: a pinned, scroll-driven project showcase plus a long-form
case study page, in a CRT / terminal / one-bit-dither aesthetic.

The showcase is one window that every project passes through. Scrolling does
not move the covers down the page — the next cover **wipes up over** the current
one, with the artwork inside counter-moving so it reads as anchored in the
window rather than sliding past it. The title rides its own masked track.

No build step, no framework, no dependencies, no network requests. Three HTML
files, three stylesheets, four scripts. Open `index.html` and it runs.

```
DESIGN.md         the design language: colour, type, motion, voice
index.html        showcase — the pinned deck of projects
project.html      case study — renders project.html?p=<slug>
css/base.css      tokens, reset, CRT overlays, shared chrome
css/home.css      showcase layout
css/project.css   case study layout
js/content.js     >>> everything you edit lives here <<<
js/app.js         theme, cursor, boot sequence, transitions, reveals
js/home.js        builds the showcase
js/project.js     builds the case study
tools/gen_artwork.py   regenerates the artwork
assets/           generated dithered SVGs
```

## Make it yours

Edit **`js/content.js`**. It is the only file you need to touch. It holds a
`SITE` object (name, role, contact, ticker text, boot log) and a `PROJECTS`
array. Both pages read from it, so a project added there appears on the home
page *and* gets a working case study at `project.html?p=<slug>`.

A project looks like this:

```js
{
  slug: "densendither",      // the ?p= value; also the anchor id
  index: "01",
  title: "Densendither",
  subtitle: "One or two sentences. The only thing most people read.",
  year: "2025–26",
  role: "Solo project",
  client: "Personal",
  status: "Maintained",
  accent: "#ffb000",         // this project's phosphor colour
  tags: ["Go", "CLI", "Imaging"],
  cover: "assets/densendither-cover.svg",
  coverAlt: "…",             // described for screen readers
  caption: "Fig. 01 — caption shown under the cover",
  blocks: [ /* the case study, see below */ ]
}
```

### Case study blocks

`blocks` is an ordered list; the renderer walks it and emits one section per
entry. Available types:

| type      | fields                                       |
| --------- | -------------------------------------------- |
| `text`    | `heading`, `body: [...paragraphs]`            |
| `steps`   | `heading`, `items: [{ title, text }]`         |
| `quote`   | `text`, `attribution`                         |
| `figure`  | `src`, `alt`, `caption`, `bleed: true/false`  |
| `gallery` | `heading`, `items: [{ src, alt, caption }]`   |
| `specs`   | `heading`, `rows: [[label, value]]`           |
| `links`   | `heading`, `items: [{ label, href, note }]`   |

Paragraph strings accept inline `<b>` (renders as a highlighted span) and
`<a href>`. Headings automatically become anchors and populate the section nav.

## Artwork

`assets/` holds SVGs shaded with a 4×4 ordered-Bayer dither, so the images
match the rest of the site. They are generated, not hand-drawn:

```sh
python3 tools/gen_artwork.py
```

Output is deterministic — same seed, same file. Two kinds live in there:

- **Project art**, named after the project (`densendither-cover.svg`,
  `vex-cover.svg`, `words-cover.svg`, and a `-plate` each). Each one is drawn
  to say something about that specific project rather than to decorate: a
  tonal ramp with palette chips for the ditherer, a node graph with a lit
  neighbourhood for the notes search, the angle between two distant vectors
  for the word scorer.
- **Spares** (`spare-01..03.svg`, `spare-plate.svg`) — abstract stand-ins for
  a project that doesn't have its own drawing yet.

To draw something specific for a new project, add a composition function to
`tools/gen_artwork.py` and list it in `PROJECT_ART`. The existing ones are
short — `comp_cosine` is about thirty lines.

Replace any of it with your own JPG/PNG/WebP whenever you like; nothing depends
on the format. Images are tinted to the active phosphor colour at render time
by a `multiply` blend, so **artwork should be light-on-black** to tint
correctly.

## Theming

Six palettes ship in `css/base.css`: `auto`, `amber`, `green`, `cyan`, `rose`,
`bone`. The switcher sits in the status bar and the choice persists in
`localStorage`.

`auto` is the default and the interesting one: the accent follows whichever
project you are looking at, so the whole page re-tints as you scroll. Picking an
explicit colour locks it. To remove the switcher entirely, hard-code
`data-theme` on `<html>` and delete the `.themes` block from `buildChrome()`.

Change the base look in the `:root` block of `css/base.css` — background, ink,
type stack, scanline and grain opacity are all tokens.

## Tuning the deck

The showcase transition has three knobs at the top of the deck engine in
`js/home.js`:

| constant  | default | does                                                      |
| --------- | ------- | --------------------------------------------------------- |
| `DRIFT`   | `14`    | how far (%) a passed cover creeps upward — adds depth      |
| `COUNTER` | `0.55`  | artwork travel as a fraction of its mask's travel          |
| `EASE`    | `0.18`  | scroll-follow damping; lower is heavier and more floaty    |

`COUNTER` is the one that matters. At `1` the artwork is perfectly still and
only the window wipes; at `0` the cover slides as one piece like a carousel.
Anywhere between reads as a reveal with parallax.

Each project occupies one viewport of scroll, so the deck is
`PROJECTS.length × 100svh` tall. The structure is a sticky pane plus one
invisible `.deck__step` spacer per remaining project — the spacers exist only to
supply that scroll length and to give each project a snap point.

## Keyboard

| key   | does                          |
| ----- | ----------------------------- |
| `1`–`9` | jump to that project        |
| `0`   | back to the top               |
| `T`   | cycle phosphor colour         |
| `Esc` | leave a case study / skip boot |

## Deploying

It is static. Any host works — GitHub Pages, Neocities, Netlify, a folder on a
VPS. There is nothing to compile.

For GitHub Pages: push, then Settings → Pages → deploy from branch `main`,
folder `/`.

## Notes and trade-offs

- **Both pages render from JavaScript.** That is what makes `content.js` a
  single source of truth, but it means no-JS visitors get the `<noscript>`
  fallback in `index.html` rather than the real page. If you need the markup to
  exist statically — for better SEO or principle — hand-write the panels into
  `index.html` and drop `home.js`.
- The first visit plays a short boot sequence, then sets a `sessionStorage` flag
  so it does not replay on every navigation. Delete `initBoot` to remove it.
- **The deck is not scroll-jacking.** It pins with `position: sticky` and reads
  native scroll position, so the scrollbar, keyboard, trackpad momentum and
  find-in-page all keep working. Nothing intercepts the wheel.
- `prefers-reduced-motion` turns the deck off entirely: it adds `.deck--static`,
  which unpins the sticky pane and lays the projects out as ordinary stacked
  panels with no transforms. It also disables the sweep, grain, flicker, smooth
  scrolling and page-transition wipe.
- Scroll snapping relaxes to `proximity` on short or narrow viewports so content
  taller than the screen stays reachable.
- Tested in current Chrome and Firefox. Uses `color-mix()`, `svh` units and
  `:has()`-free CSS — Safari 16.4+ and anything newer than ~2023.

## Licence

MIT — see `LICENSE`. The template, the
placeholder copy and the generated artwork are all original; the sample
projects are fiction, so replace them before anyone reads them.

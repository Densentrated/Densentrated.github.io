# Design language

What this site is made of, and the reasoning behind each rule. If you add a
page, a component or a project, this is the thing to stay consistent with.

The short version: **a monochrome terminal with one colour in it.** Everything
is black, bone-white and a single phosphor hue that changes depending on what
you're looking at. One typeface. No photographs — all imagery is one-bit
dithered artwork. The interface behaves like a CRT that happens to be showing a
portfolio, not a portfolio with CRT stickers on it.

---

## 1. Principles

These generated everything below. When a decision isn't covered by the rest of
this document, work it out from these.

1. **One accent, everything else neutral.** Colour is information, not
   decoration. If two things on screen are coloured, the user has to work out
   which one matters. Only one does.
2. **The texture is the brand.** Scanlines, grain and dither are applied
   globally and uniformly, so individual components don't need personality.
   This is why a plain `<table>` still looks like it belongs here.
3. **Left-aligned, always.** Every heading, paragraph, figure and caption hangs
   off the same vertical line. Centred text appears in exactly three places,
   all of them full-width moments rather than content: the next-project footer
   (`.nextup`), the 404 state (`.notfound`) and the page-transition overlay
   (`.wipe__inner`). If you're centring something inside a case study, stop.
4. **Monospace is the grid.** Using one mono family means character cells line
   up for free. Labels, numbers and tables need no extra alignment work.
5. **Motion explains structure.** Nothing animates to be lively. The deck
   transition tells you the projects are a stack; the accent shift tells you
   you've moved. If an animation doesn't carry information, it's texture and
   belongs in the global overlay layer instead.
6. **Degrade to something honest.** With motion off it becomes stacked panels.
   With JavaScript off it becomes a list of links. Neither is an apology.

---

## 2. Colour

### Surfaces and ink

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0a0a0c` | Page. Not pure black — pure black kills the scanlines. |
| `--bg-raise` | `#101014` | Table headers, anything a step forward. |
| `--bg-sink` | `#060607` | Behind imagery, anything a step back. |
| `--ink` | `#e8e4d8` | Primary text. Warm bone, not white: pure white on near-black vibrates. |
| `--ink-dim` | `#8e8a80` | Body copy, secondary text. Most prose is this, not `--ink`. |
| `--ink-faint` | `#514e49` | Labels, captions, metadata. Legible, never competing. |
| `--line` | `#22222a` | Rules and borders. Slightly blue to sit against the warm ink. |

The ink ramp is the main tool for hierarchy. Reach for a tone before you reach
for a size or a weight.

### Accent

One hue at a time, from five fixed palettes:

| Theme | Value |
| --- | --- |
| `amber` | `#ffb000` |
| `green` | `#4ef08a` |
| `cyan` | `#4ad5ff` |
| `rose` | `#ff5f8d` |
| `bone` | `#e8e4d8` |

Plus **`auto`**, the default, where the accent follows whichever project is on
screen — each project declares its own. The whole page re-tints as you scroll,
including the artwork. This is why the switcher's auto swatch is a rotating
colour wheel rather than a sixth fixed colour: it has to look like what it does.

`--accent-soft` (18% accent) is for highlight backgrounds behind inline bold.
`--on-accent` is the page background, for text sitting *on* a filled accent.

**Accent is for:** the active state, the one link you want clicked, the current
item in a list, the figure that matters. **Not for:** decoration, borders in
general, or more than roughly 5% of any screen.

### Tinting imagery

Artwork is authored light-on-black and tinted at render time by an accent
overlay in `mix-blend-mode: multiply`. White ink becomes accent, black stays
black. This is the single mechanism that keeps generated artwork, CSS and type
in the same colour at all times.

The consequence: **any image you add must be light-on-black** or it won't tint.
A normal photo will go muddy. If you need photographs, convert them to one-bit
dither first — which is conveniently the house style anyway.

---

## 3. Typography

**One family**, a monospace stack headed by Berkeley Mono / JetBrains Mono /
IBM Plex Mono and falling back to whatever the machine has. No fonts are loaded
over the network, so the site is never waiting on a stylesheet to render.

Three registers, and nothing else:

**Display** — uppercase, tight. Tracking `-0.04em` to `-0.045em`, line-height
`0.88`–`0.95`. Mono at display size is wide, so it must be pulled in hard and
set tight, otherwise it reads as a loose sprawl.

| Element | Size |
| --- | --- |
| Hero name | `clamp(2.6rem, 11.5vw, 10rem)` |
| Case study title | `clamp(2.4rem, 9vw, 7.5rem)` |
| Deck project title | `clamp(2rem, 6.2vw, 5.1rem)` |
| Next-project / outro | `clamp(1.8rem, 7vw, 6rem)` |

**Body** — `clamp(0.8rem, 0.74rem + 0.3vw, 0.95rem)`, line-height `1.65`,
colour `--ink-dim`, capped at `--measure` (`64ch`). Mono needs more leading than
a proportional face; 1.65 is the floor, not a flourish.

**Label** — `0.62rem`–`0.7rem`, uppercase, colour `--ink-faint`, tracking
`0.14em` to `0.3em`. Used for everything structural: metadata keys, captions,
nav, the status bar, tags.

> The tracking rule: **the smaller and more uppercase it is, the more tracking
> it gets.** Tight tracking is reserved for display; wide tracking says "this is
> a label, not a sentence." That single inversion does most of the typographic
> work on the site.

Section headings in case studies are prefixed with `//` in accent, which is a
terminal comment marker and also a free bullet that needs no indent.

---

## 4. Space and layout

| Token | Value | Use |
| --- | --- | --- |
| `--pad` | `clamp(1.1rem, 4vw, 3.5rem)` | The page gutter. Everything respects it. |
| `--bar` | `2.4rem` | Height of the top bar and status bar. Content clears both. |
| `--measure` | `64ch` | Maximum line length for prose. |

### The document grid

Case studies use a named-line grid with three widths:

```
full   ├─────────────────────────────────────────┤   edge to edge
wide   │   ├─────────────────────────────────┤   │   figures
main   │   ├──────────────────────┤          │   │   reading column, max 58rem
```

`wide` shares its **left edge** with `main` and only extends right. That's
deliberate: it keeps every heading, paragraph and figure on one vertical line
while still letting figures breathe. Centring `wide` instead would put figures
on a different left edge from the text, and the page would lose its spine.

### The deck

The showcase is `PROJECTS.length × 100svh` tall: a `position: sticky` pane plus
one invisible spacer per remaining project. Each project owns exactly one
viewport of scroll. Desktop splits `1.05fr / 0.95fr` — text slightly wider than
image, because the text column has to hold a measure and the image doesn't.

---

## 5. Surface texture

Five fixed overlays, all `pointer-events: none`, applied once globally rather
than per component.

| Layer | What | Default |
| --- | --- | --- |
| `fx--scan` | 1px dark line every 3px | opacity `0.5` |
| `fx--grain` | SVG fractal noise, 3-step shuffle | opacity `0.045` |
| `fx--vignette` | Radial darkening from 48% out | — |
| `fx--sweep` | 28vh accent band crossing every 7.5s | — |
| `fx--flicker` | Accent overlay blipping for ~1% of a 6s cycle | max `0.05` |

The two tunable knobs are `--scan-opacity` and `--grain-opacity`. **To make the
site calmer, lower those two before touching anything else** — they carry most
of the character, so a small reduction reads as a big change in restraint.

Scanlines are deliberately *not* applied per-image on the deck: covers stack
during a transition, and two overlays would double-darken the same rows.

---

## 6. Motion

`--ease` is `cubic-bezier(0.22, 0.68, 0.14, 1)` — fast out, long settle.
`--fast` (`0.18s`) is for anything under the cursor. `--slow` (`0.65s`) is for
things that move on their own.

### The deck

Scroll position becomes a fractional slide index. For slide `i` at distance
`t = i − position`:

| Track | Behaviour |
| --- | --- |
| Mask | `t ≥ 0` → `+t × 100%` (waiting below); `t < 0` → `t × DRIFT%` (passed, creeping up) |
| Artwork | counter-moves at `−mask × COUNTER` |
| Text block | fades `1 − |t| × 2.2`, drifts `t × 42px` |
| Title | own masked track, `clamp(t, −1, 1) × 105%` |
| Culled | `t > 1.02` or `t < −1.35` |

Three constants, in `js/home.js`:

- **`DRIFT = 14`** — how far a passed cover creeps up. Depth cue.
- **`COUNTER = 0.55`** — the one that matters. At `1` the artwork is perfectly
  still and only the window wipes; at `0` the whole cover slides like a
  carousel. Between the two it reads as a reveal with parallax.
- **`EASE = 0.18`** — scroll-follow damping. Lower is heavier.

Each segment is eased with smoothstep so slides rest at the ends and cross
quickly in the middle. The text fades out on a much shorter curve than the image
travels, so the two never blur together mid-transition.

It pins with `position: sticky` and reads native scroll. **Nothing intercepts
the wheel** — scrollbar, keyboard, momentum and find-in-page all keep working.

### Reduced motion

`prefers-reduced-motion` isn't a degraded variant, it's a supported layout. The
deck unpins into ordinary stacked panels (`.deck--static`), and the sweep,
grain, flicker, parallax, smooth scrolling and page wipe all stop. Nothing is
hidden and no content is lost.

---

## 7. Components

**Plate** — the house image frame. A bordered window, accent-tinted artwork,
and four hairline corner brackets. The brackets are the single most repeated
motif; they say "this is a captured thing" and cost four `<i>` elements.

**Tag** — uppercase label in a 1px box. Never filled, never accent.

**Button** — 1px accent outline, accent text, inverting to a filled accent block
on hover. There is one button style. A second would imply a hierarchy that
doesn't exist here.

**Link** — accent text with a rule that wipes in from the left on hover
(`transform-origin` flips between hover and rest so it wipes out the way it came
in).

**Rail** — fixed right-hand index of zero-padded numbers. Current item is accent
with a longer tick. Hidden below 760px.

**Status bar** — fixed footer: a paused-on-hover marquee plus the theme
switcher. It's the site's "chrome" in the hardware sense — always present,
never interactive unless you want it.

**Boot sequence** — a short fake POST log on first visit, then a
`sessionStorage` flag so it never replays. It exists to establish the CRT frame
before any content appears. Skippable with any key.

**Page wipe** — a dotted accent screen between page loads, masking the
navigation so the site feels continuous.

---

## 8. Imagery

All artwork is generated by `tools/gen_artwork.py` as SVG shaded with a 4×4
ordered-Bayer dither. Deterministic: same seed, same file.

The rule that matters: **a cover should say something about its project, not
decorate it.** The existing ones each depict the thing itself — a sphere lit and
then quantised for the ditherer, a node graph with a lit neighbourhood for the
notes search, the angle between two distant vectors for the word scorer, three
lake layers growing more ordered for the transit archive.

When adding one, write a composition function and list it in `PROJECT_ART`.
Compositions are short — most are under 40 lines. `spare-*.svg` exists for
projects that don't have their own drawing yet.

Constraints for any replacement image: light-on-black (see §2), and keep the
content inside roughly the middle 80% — covers are `object-fit: cover`, so the
edges get trimmed depending on the window's aspect.

---

## 9. Voice

The copy is as much a part of the design as the type.

- **Plain and first-person.** Contractions, ordinary words, varied sentence
  length. "I kept ending up in a GUI, clicking the same four things."
- **Concrete over impressive.** Say what it does and why you made it. Specifics
  are what read as human; polish reads as marketing.
- **No aphorisms.** Avoid the tidy triad and the quotable closing line. One
  wry observation per project is plenty.
- **Quotes sound like notes**, because they are — a thing you actually thought,
  attributed to where you thought it.
- **Never invent a number.** Specs list only verifiable facts: real
  dependencies, real algorithms, real deployment. If you have no benchmark,
  omit the row. A fabricated latency figure is the fastest way to lose a reader
  who knows the domain.

---

## 10. Accessibility

- Skip link, focus-visible rings in accent at 2px/3px offset, semantic headings
  that feed the section nav automatically.
- Only the legible slide in the deck takes pointer events or tab stops;
  neighbours are culled with `visibility: hidden`.
- The decorative cover link is `aria-hidden` with `tabindex="-1"`, since the
  title link already goes to the same place — one destination, one tab stop.
- Every image carries real alt text describing the composition.
- Colour is never the sole signal: the active rail item also has a longer tick,
  the active nav item also changes tone.

---

## Quick reference

**Do:** use the ink ramp for hierarchy · keep one accent · left-align everything
· set display type tight and labels wide · put texture in the global layer ·
make motion mean something.

**Don't:** add a second accent · centre body text · introduce a second typeface
· apply scanlines per component · animate for liveliness · invent a metric ·
ship an image that isn't light-on-black.

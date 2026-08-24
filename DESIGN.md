---
name: Stallion CRM
description: A near-black instrument deck where one lime accent carries every action.
colors:
  advertising-lime: "#bafc0c"
  lime-soft: "#d4fe6b"
  green-mid: "#8abc1b"
  green-deep: "#678c1c"
  brand-grey: "#cfcfcf"
  deck-void: "#060706"
  deck-rail: "#080908"
  deck-bar: "#0a0b0a"
  deck-panel: "#0a0b0a"
  deck-surface: "#0e0f0e"
  deck-card: "#101110"
  deck-popover: "#141614"
  ink: "#ecefe8"
  ink-soft: "#a6ada0"
  ink-muted: "#7d857a"
  ink-faint: "#454a43"
  hairline: "rgb(255 255 255 / 0.07)"
  hairline-strong: "rgb(255 255 255 / 0.13)"
  stage-1: "#3f5c14"
  stage-2: "#567c17"
  stage-3: "#6f9c19"
  stage-4: "#93c81a"
  stage-5: "#bafc0c"
  stage-neutral: "#4a4f47"
  status-good: "#9ae65c"
  status-warning: "#f0a63a"
  status-critical: "#f87171"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Georgia, serif"
    fontSize: "2.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "tnum 1"
  headline:
    fontFamily: "Bricolage Grotesque, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Bricolage Grotesque, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  headline-sm:
    fontFamily: "Bricolage Grotesque, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  figure-sm:
    fontFamily: "Bricolage Grotesque, Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tnum 1"
  body-lg:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  caption:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  micro:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  label-lg:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.14em"
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.16em"
rounded:
  sm: "0.45rem"
  md: "0.6rem"
  lg: "0.75rem"
  xl: "1.05rem"
  2xl: "1.35rem"
  full: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1.25rem"
  lg: "1.5rem"
  cell-x: "1.25rem"
  cell-y: "0.875rem"
components:
  button-primary:
    backgroundColor: "{colors.advertising-lime}"
    textColor: "{colors.deck-void}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.lime-soft}"
    textColor: "{colors.deck-void}"
  button-ghost:
    backgroundColor: "rgb(255 255 255 / 0.03)"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xl}"
    padding: "0 1rem"
    height: "2.5rem"
  button-ghost-hover:
    backgroundColor: "rgb(255 255 255 / 0.06)"
    textColor: "{colors.ink}"
  panel:
    backgroundColor: "{colors.deck-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  input-field:
    backgroundColor: "rgb(255 255 255 / 0.02)"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0 0.875rem"
    height: "2.5rem"
  input-field-focus:
    backgroundColor: "rgb(255 255 255 / 0.05)"
    textColor: "{colors.ink}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.xl}"
    padding: "0 0.75rem"
    height: "2.75rem"
  nav-item-active:
    backgroundColor: "{colors.advertising-lime}"
    textColor: "{colors.deck-void}"
    rounded: "{rounded.xl}"
    height: "2.75rem"
  status-pill:
    typography: "{typography.body}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.625rem"
---

# Design System: Stallion CRM

## Overview

**Creative North Star: "The Command Deck"**

Stallion CRM is a near-black instrument housing. Not a dark theme laid over a
light design — a surface that was drawn dark, where panels are machined into the
deck rather than floating above it, where measurement language (blueprint
ruling, registration ticks, tick rulers, tabular figures) does the decorating,
and where exactly one colour is allowed to mean anything.

That colour is Advertising Lime, sampled from the agency's own logo artwork. Its
power comes entirely from its rarity: on a screen of greys and hairlines, a
single lime element is unmissable, and that is precisely why it is spent on the
two things worth pointing at — the action you should take, and where you
currently are. The moment a second lime element appears beside the first,
neither means anything.

The deck runs at two intensities. `/login` is a lobby: seen once, full
atmosphere (film grain at 0.045, a lime bloom, an oversized horse mark bleeding
off-canvas, 0.7s reveals). The console is a cockpit: opened dozens of times a
day, every atmosphere knob roughly halved, reveals shortened to 0.45s. Same
materials, different volume. A screen that performs every single time you open
it stops being atmosphere and becomes an obstacle.

**Key Characteristics:**

- Near-black surfaces (#060706 to #0e0f0e) separated by ~0.05 lightness steps, never by shadow
- A single accent, spent sparingly; a five-step lime ramp reserved for pipeline progression
- Three typefaces with one job each: Bricolage display, Instrument Sans body, JetBrains Mono micro-labels
- Depth by hairline and inner highlight, not by cast shadow
- Atmosphere as tunable layers (grid, grain, bloom, spot, vignette) that never touch layout
- Dark only. The single exception is the print stylesheet, which inverts the entire token set

## Colors

A near-monochrome greyscale deck carrying one high-chroma accent, with a
sequential lime ramp reserved for pipeline progression and three fixed status
hues that may never be borrowed.

### Primary

- **Advertising Lime** (`#bafc0c`): The single action colour. Filled lime is reserved for the primary action on a screen and the active navigation item. Also used as caret colour, focus ring, and the terminal step of the stage ramp.
- **Lime Soft** (`#d4fe6b`): Hover and highlight tint only. Never a resting fill.
- **Green Mid** (`#8abc1b`) and **Green Deep** (`#678c1c`): Sampled from the horse mark's gradient. Used for the login button's gradient and the cooler counter-light in the atmosphere bloom — not as UI fills.

### Secondary

The pipeline stage ramp — a monotonic sequential scale, dark to bright, so
"further along the pipeline" always reads as "brighter", with no exceptions.
Referenced by tone index from `config/pipeline.ts`, never hard-coded.

- **Stage 1 to 5** (`#3f5c14`, `#567c17`, `#6f9c19`, `#93c81a`, `#bafc0c`): Pipeline stages in order. The last step lands on Advertising Lime because winning *is* the accent.
- **Stage Neutral** (`#4a4f47`): Lost. A different hue family on purpose — a lost deal is not a dimmer version of winning, it is a different kind of outcome, so it must not sit anywhere on the lime ramp.

### Tertiary

The reserved status palette. These three are for state only.

- **Status Good** (`#9ae65c`): Paid, done, active, positive delta.
- **Status Warning** (`#f0a63a`): Pending, in progress.
- **Status Critical** (`#f87171`): Overdue, destructive action, negative delta. Also the console's `--destructive`.

### Neutral

Surfaces, darkest to lightest — the separation between them is roughly 0.05 in
lightness, which is deliberately small. On a dark deck that is enough to read as
a distinct plane, and anything larger starts looking like a light theme.

- **Deck Void** (`#060706`): Page backdrop and the document root, so overscroll never flashes white.
- **Deck Rail** (`#080908`): The console sidebar — the darkest chrome, so the content beside it advances.
- **Deck Bar** (`#0a0b0a`) and **Deck Panel** (`#0a0b0a`): The console topbar (at 90% behind a backdrop blur) and the login's auth column.
- **Deck Surface** (`#0e0f0e`): Every console panel and card.
- **Deck Card** (`#101110`): The login's raised sign-in card — the one genuinely floating surface in the product.
- **Deck Popover** (`#141614`): Menus and dialogs, lifted above the deck.

Text runs as a four-step ramp, and each step has one job:

- **Ink** (`#ecefe8`): Headings, figures, input text.
- **Ink Soft** (`#a6ada0`): Body copy, inactive nav labels.
- **Ink Muted** (`#7d857a`): Labels, helper text, column headers, timestamps, ranks, ids, and every other secondary string a reader has to be able to read. One value for the whole product — it clears 4.5:1 on every deck surface, `/login` included.
- **Ink Faint** (`#454a43`): Rulers, ticks, registration marks, and inactive controls. **Decoration only** — it measures ~2.1:1 everywhere, so anything readable put here is invisible.

Lines are white at low alpha rather than a grey hex, so they hold up over any
deck surface: **Hairline** (`rgb(255 255 255 / 0.07)`) for borders and dividers,
**Hairline Strong** (`rgb(255 255 255 / 0.13)`) for input strokes and scrollbar
thumbs.

### Named Rules

**The One Lime Answer Rule.** **One lime fill in the rail, and at most one in
the content column.** Lime answers exactly two questions — "where am I" and
"what do I do here" — and each gets exactly one answer per screen.

The rail's answer is the active navigation item, and it is always lit, on every
screen. That is why this is stated as two budgets rather than one: the first
version said "one lime fill per screen, the primary action or the active nav
item, never both", which no console screen could satisfy, because the rail is
never dark. A rule the system breaks by construction trains people to ignore
the rules beside it.

The content column's answer is the screen's primary action — and a screen that
has one must not also spend lime on a selected segment, a selected list row, or
an avatar. Everything else that needs the accent takes it as a hairline, a
focus ring, a caret, or a tint at or below 15% alpha. An identity is never a
fill: see the tinted avatar in `components/deck/initials-avatar.tsx`.

**The Reserved Palette Rule.** `--status-good`, `--status-warning` and
`--status-critical` are for state and nothing else. Never reuse them as a chart
series or a decorative accent; the moment orange means both "pending" and "the
third bar", it means neither.

**The Never Colour Alone Rule.** No state is carried by hue by itself. Every
status pill ships an icon and a text label; every delta chip carries its sign in
the text. An overdue invoice tinted red and a paid one tinted green are the same
pill to a colourblind reader — and identical again in a printout.

**The Muted Floor Rule.** There is no readable step below `--ink-muted`. It
measures 4.77:1 on the lightest surface in the product (the popover) and 5.29:1
on the darkest, so it is the floor for anything a reader must read — including
the small mono figures that look like they want to recede further. They recede
by size and weight instead. `--ink-faint` is not a quieter text colour; it is
decoration, and text placed there is text nobody can read.

The value that shipped first, `#757c72`, measured 4.40:1 on the login card —
the *lightest* content surface in the product, not the darkest. Check any new
muted value against the surface it will actually sit on.

## Typography

**Display Font:** Bricolage Grotesque (with Georgia, serif)
**Body Font:** Instrument Sans (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace)

**Character:** Bricolage brings a tight, slightly editorial confidence to figures
and titles — negative tracking pulls it into a compact block rather than letting
it sprawl. Instrument Sans stays neutral and legible underneath it at working
sizes. JetBrains Mono does all the micro-labelling, widely tracked and
uppercased, which is what gives the deck its instrument-panel readout quality.
Three faces, one job each; swapping any of them is a one-line change in
`app/layout.tsx`.

### Hierarchy

Eleven steps, and there are exactly eleven on purpose. A literal size that is not on
this list is drift, not a decision — the detector reads these values, so an
undocumented step is reported the moment it is written.

- **Display** (600, 2.5rem, line-height 1, tracking -0.04em): KPI figures only. Always with tabular figures.
- **Figure Small** (600, 1.75rem, tracking -0.03em): The sidebar stat readout and the login card heading — a display voice where 2.5rem will not fit.
- **Headline** (600, 1.5rem, tracking -0.03em): The console topbar page title at `sm` and above. One per screen.
- **Headline Small** (600, 1.375rem, tracking -0.03em): The same title below `sm`.
- **Title** (600, 1.0625rem, tracking -0.02em): Panel headings and dialog titles.
- **Body Large** (400, 0.9375rem): Form inputs and nav labels — anything a pointer or a caret lands in.
- **Body** (400, 0.875rem, line-height 1.5): All other UI copy, table cells, buttons.
- **Caption** (400, 0.8125rem): Sub-copy, helper text, secondary table cells. Usually Ink Muted.
- **Micro** (400, 0.75rem): Pills, badges, chips, and the smallest supporting text.
- **Label** (400, 0.625rem, uppercase, mono) and **Label Large** (0.6875rem, tracking 0.14em): Column headers, KPI labels, panel hints, form labels, sidebar section eyebrows. The widest tracking (0.22em) is reserved for the nav section eyebrow, the quietest thing on the screen.

Nothing goes below 0.625rem. 10px uppercase mono is already at the edge of
legibility, and the four places that had reached 0.5625rem were doing it to fit
a layout rather than to express a level.

### Named Rules

**The Tabular Figures Rule.** Every number in the console wears `.deck-nums`
(`font-variant-numeric: tabular-nums`). Without it, a column of dials,
appointments and conversions does not line up vertically, because proportional
digits are different widths — and a column of figures that does not align is not
a table, it is a list.

**The Mono-Is-A-Label Rule.** JetBrains Mono is never used for content, only for
labelling content. If a mono string can be read as data rather than as the name
of data, it is in the wrong face.

## Layout

The console is a fixed sidebar rail (16.25rem expanded, 4.5rem collapsed, set in
`config/console.ts`) beside a scrolling content column capped at 105rem — one
value, not nine copies of a max-width literal that will drift. Below `lg` the
rail becomes a sheet behind a menu button; the collapse state is stored in a
cookie and read on the server so the sidebar renders at the right width on the
very first paint rather than flashing expanded-then-collapsed.

Panels are the only container. They tile in a responsive grid with 1.25rem to
1.5rem gaps, carry 1.25rem padding (1.5rem at `sm`), and go flush when they hold
an edge-to-edge table. Table cells use a single shared padding constant
(`px-5 py-3.5 sm:px-6`) exported from the table component so header and body
cells can never drift apart.

Density is the console's defining spatial quality: control heights sit at
2.5rem, nav rows at 2.75rem, the topbar at a 4.5rem minimum, and vertical rhythm
runs on 0.25rem steps. This is a screen scanned all day, not read once.

### Named Rules

**The Table Never Widens The Page Rule.** Wide tables scroll horizontally inside
their own container with the first column pinned, because on a wide table the
row identity is the one thing that must stay on screen. Screens with more than
about four columns render a card list below `md` instead of shrinking the table.

**The One Container Rule.** Every block on every console screen is a Panel.
There is no second container component, and restyling the app's surfaces is one
file.

## Elevation & Depth

This system is almost entirely flat by cast shadow and layered by tone instead.
Depth comes from three things stacked: a hard 1px black ring that separates a
surface at any zoom, an inner top highlight that implies a light source above,
and a surface tone one step lighter than its ground. A dozen containers on a
dashboard, each with a cast shadow, reads as clutter — nothing recedes, so
nothing stands out.

Cast shadow is therefore a *statement about position in space*, spent only on
things genuinely above the page.

### Shadow Vocabulary

- **Inset** (`box-shadow: 0 0 0 1px rgb(0 0 0 / 0.5), inset 0 1px 0 0 rgb(255 255 255 / 0.045)`): Every console panel and card. Machined into the deck.
- **Lift** (`box-shadow: 0 0 0 1px rgb(0 0 0 / 0.55), 0 44px 96px -40px rgb(0 0 0 / 0.95), 0 12px 28px -18px rgb(0 0 0 / 0.7), inset 0 1px 0 0 rgb(255 255 255 / 0.055)`): The login card, menus, dialogs, and the card being dragged. A wide soft cast plus a tighter contact shadow, so it floats without looking detached.
- **Vignette** (`box-shadow: inset 0 0 10rem 1.5rem rgb(0 0 0 / var(--deck-vignette-strength))`): Corner darkening on large surfaces, which is what stops the ambient spot from reading as a flat grey wash.
- **Accent glow** (`0 10px 26px -14px rgb(186 252 12 / 0.9)`): Only under a lime-filled element, and only to seat it — never as decoration.

### Named Rules

**The Inset-By-Default Rule.** `.deck-inset` is the default for anything that
holds content. `.deck-lift` is reserved for surfaces that are genuinely above
the page: menus, dialogs, drag ghosts, and the login card. If it does not
overlay something, it does not cast.

**The One Slot Rule.** Each atmosphere utility owns exactly one painting slot —
`.deck-grid` takes `::before`, `.deck-grain` takes `::after`, `.deck-glow` and
`.deck-spot` both write `background-image`, and `.deck-vignette`, `.deck-lift`
and `.deck-inset` all write `box-shadow`. Two utilities sharing a slot silently
overwrite each other. The SLOT MAP comment in `app/globals.css` is the register;
keep it true when adding a layer.

## Shapes

Generously but not softly rounded, on a scale derived from a single `--radius`
(0.75rem in the console, 0.625rem in the shadcn base): panels and cards at
1.35rem (`rounded-2xl`), interactive controls — buttons, inputs, nav rows, icon
buttons — at 1.05rem (`rounded-xl`), small chips and inner affordances at
0.75rem, and pills, avatars, progress tracks and scrollbar thumbs fully round.
Nothing is square-cornered on screen; the print stylesheet strips radius
entirely, because a rounded corner on paper reads as a screenshot rather than a
document.

Borders are always hairlines — 1px of white at 7% or 13% alpha — never a solid
grey. The recurring geometry beyond the rectangle is drawn, not filled:
crosshair registration ticks in panel corners, and repeating 1px tick rulers
that fade out to the right so a ruling never ends on a hard edge.

### Named Rules

**The Ticks Are A Signature Rule.** Corner registration marks go on hero panels
only. On every panel they stop being a signature and become wallpaper — and at
full size next to real controls, a crosshair starts reading as a "+" button,
which is the last thing a decorative mark should suggest.

## Components

### Buttons

- **Shape:** Control-scale corners (1.05rem), 2.5rem tall, 1rem horizontal padding.
- **Primary:** Advertising Lime fill with near-black text (`#0a1000` on the login gradient, Deck Void in the console), 600 weight, over a tight lime glow. One per screen.
- **Hover / Focus:** Hover lifts brightness ~6% and, on the login's hero button, translates up 2px with a light sweep across the face. Focus is always a 2px lime ring with a 2px offset in the host surface's colour — never a browser default outline.
- **Secondary / Ghost:** `rgb(255 255 255 / 0.03)` on a hairline border with Ink Soft text; hover raises the fill to 6% and the text to Ink. This is the default for every non-primary action, including icon buttons.
- **Destructive:** Tinted rather than filled — Status Critical text on a 10% wash of itself. Destructive actions always route through a confirmation dialog.

### Chips

- **Style:** Fully round, 0.75rem text, a 12% tint of the tone over a 28% border of the same tone.
- **Status:** Four tones (good / warning / critical / neutral), each shipping an icon *and* a text label.
- **Delta:** Mono, 0.625rem, sign carried in the text so direction survives greyscale.

### Cards / Containers

- **Corner Style:** 1.35rem.
- **Background:** Deck Surface (`#0e0f0e`) in the console; Deck Card (`#101110`) for the login's floating card.
- **Shadow Strategy:** `.deck-inset` — see Elevation & Depth. Never a cast shadow on a console panel.
- **Border:** Hairline.
- **Internal Padding:** 1.25rem, 1.5rem at `sm`. Flush when holding a table.

### Inputs / Fields

- **Style:** 2.5rem tall, 1.05rem radius, `rgb(255 255 255 / 0.02)` fill on a hairline border, Ink text, lime caret.
- **Focus:** Border shifts to lime at 55%, fill lifts to 5%, and a 4px lime ring at 10% blooms outward. A leading icon shifts from Ink Muted to lime with it, so the whole field acknowledges focus rather than just its edge.
- **Error / Disabled:** Errors render Status Critical text beneath the field and mark the input `aria-invalid`; disabled drops to 60% opacity and removes the hover transform.
- Chrome's autofill background is repainted to match the deck, so a returning user never sees two mismatched inputs.

### Navigation

- **Style:** 2.75rem rows at 1.05rem radius, 0.9375rem labels, section eyebrows in tracked uppercase mono at Ink Faint.
- **Default:** Ink Soft label with an Ink Muted icon.
- **Hover:** `rgb(255 255 255 / 0.045)` fill, label to Ink.
- **Active:** Lime fill, Deck Void label at 600, plus a lime glow. This is the single strongest use of lime in the app — nothing else in the rail competes with it. `aria-current="page"` always accompanies it, because the lime pill only speaks to people who can see colour.
- **Collapsed:** Icon-only at 4.5rem with labels kept as screen-reader text, so links keep their accessible names.
- **Mobile:** The rail becomes a sheet; one nav implementation serves both, because two copies of a nav list drift and the one you are not looking at goes stale.

### Panel Header

Title in Bricolage at 1.0625rem, with an optional mono uppercase hint beneath
saying what the panel measures, and an actions slot on the right for filters and
toggles. The hint is what turns a heading into an instrument label.

### Segmented Control

Built as a `radiogroup`, not buttons: a view switch *is* a single choice from a
set, so arrow keys move between options, the group is announced as one control,
and a roving tabindex makes the whole thing one tab stop. The selected segment
takes a lime fill — which is why a screen carrying a segmented control should
not also carry a lime primary button.

### Tick Ruler

A repeating 1px ruling in Ink Faint, masked to fade out before its right edge
(`--deck-ruler-fade`, default 92%). Used beneath the KPI cluster so four gauges
read as one instrument rather than four unrelated cards, and in the login footer
at 78%. This is the system's most transferable signature: it groups without
drawing a box.

## Do's and Don'ts

### Do:

- **Do** spend lime on one element per screen — the primary action or the active nav item, never both. Everything else takes it as a ring, caret, or sub-15% tint.
- **Do** reach for `.deck-inset` by default and `.deck-lift` only for surfaces genuinely above the page.
- **Do** put every number in `.deck-nums`, and every micro-label in tracked uppercase mono.
- **Do** ship an icon and a text label with every status colour, and carry the sign in every delta chip's text.
- **Do** tune mood through the atmosphere knobs (`--deck-grid-*`, `--deck-grain-opacity`, `--deck-glow-strength`, `--deck-spot-strength`, `--deck-vignette-strength`, `--deck-mark-opacity`) rather than by adding new layers. Setting one to `0` must remain a complete off switch.
- **Do** keep the console at roughly half the login's atmosphere intensity, and its reveals at 0.45s against the login's 0.7s.
- **Do** pair every animation with a `prefers-reduced-motion` branch that holds the final state — never one that leaves an element at `opacity: 0`.
- **Do** check any new muted text value against the surface it will actually sit on, at 4.5:1.
- **Do** remap tokens under `[data-surface="console"]` when a whole surface needs to change, instead of overriding shadcn components file by file — that is what keeps `shadcn add` upgradeable.

### Don't:

- **Don't** drift toward the generic SaaS dashboard: purple-to-blue gradients, `rounded-3xl` everywhere, stock illustrations, a card with a chart in every corner. Near-black, hairlines, and one lime is the whole identity.
- **Don't** add a light mode, a white panel, or a light-themed dialog. Dark only; the print stylesheet is the single sanctioned inversion.
- **Don't** cast a shadow on a console panel, or give more than one surface per screen a `.deck-lift`.
- **Don't** borrow `--status-*` for a chart series, or place a "lost" or neutral outcome anywhere on the lime stage ramp.
- **Don't** hard-code a stage colour in a component — reference it by tone index from `config/pipeline.ts`.
- **Don't** stack two atmosphere utilities that share a painting slot (see The One Slot Rule); the second silently erases the first.
- **Don't** put registration ticks on ordinary panels, or let a decorative mark sit close enough to real controls to read as a button.
- **Don't** let a table widen the page, and don't shrink a five-column table below `md` — switch to cards.
- **Don't** carry meaning in colour alone anywhere in this system.

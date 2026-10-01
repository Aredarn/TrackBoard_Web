---
name: TrackBoard
description: Best-lap classifications posted like official timing sheets pinned to a paddock noticeboard.
colors:
  board: "#dad9d4"
  board-deep: "#cfcec8"
  board-ink: "#1c1d20"
  board-ink-dim: "#4d4f55"
  board-rule: "#bdbcb5"
  board-focus: "#5b3fc4"
  rail: "#1d1f23"
  rail-ink: "#eceef1"
  rail-ink-dim: "#a9adb4"
  rail-rule: "#30333a"
  paper: "#fbfbf8"
  paper-2: "#f1f0ea"
  ink: "#17181a"
  ink-2: "#45474c"
  ink-3: "#64666c"
  rule: "#d6d5ce"
  rule-strong: "#17181a"
  stamp: "#5b3fc4"
  stamp-deep: "#4a31a8"
  on-stamp: "#ffffff"
  stamp-soft: "rgb(91 63 196 / 0.09)"
  pb: "#0f7a43"
  pb-soft: "rgb(15 122 67 / 0.1)"
  hl-bg: "#f7e86a"
  hl-ink: "#17181a"
  fault: "#b3261e"
  fault-soft: "rgb(179 38 30 / 0.08)"
  tape: "#121212"
  tape-ink: "#f2f2ee"
  marker: "#1b1b1d"
  marker-red: "#d3302a"
typography:
  hand:
    fontFamily: "'Caveat Variable', 'Caveat', 'Segoe Print', cursive"
    fontSize: "1.55rem"
    fontWeight: 700
    lineHeight: 1
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.2rem + 2.6vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 112"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 800
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 118"
  figure:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 700
    fontFeature: "'tnum' 1, 'lnum' 1"
    fontVariation: "'wdth' 86"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "'tnum' 1, 'lnum' 1"
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    letterSpacing: "0.1em"
  typed:
    fontFamily: "'Courier Prime', 'Courier New', monospace"
    fontSize: "0.78rem"
    fontWeight: 400
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  tag: "2px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "72px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.marker}"
    typography: "{typography.hand}"
    padding: "2px 14px 6px"
    height: "44px"
  button-plain:
    backgroundColor: "transparent"
    textColor: "{colors.marker}"
    typography: "{typography.hand}"
    padding: "2px 14px 6px"
    height: "44px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.fault}"
    typography: "{typography.hand}"
    padding: "2px 14px 6px"
    height: "44px"
  field-input:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
    typography: "{typography.typed}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "46px"
  timing-tag:
    textColor: "currentColor"
    rounded: "{rounded.tag}"
    padding: "1px 4px 0"
  rail-header:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-ink}"
    height: "64px"
  dymo-label:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.tape-ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
  dymo-label-current:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.on-stamp}"
  tab-bar:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-ink-dim}"
    height: "64px"
  tab-bar-current:
    textColor: "{colors.rail-ink}"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(20px, 3.4vw, 44px) clamp(16px, 3.4vw, 44px)"
  sheet-phone:
    padding: "18px 14px 20px"
  index-row:
    textColor: "{colors.ink}"
    padding: "12px 8px"
    height: "64px"
  index-row-hover:
    backgroundColor: "{colors.stamp-soft}"
  classification-row-own:
    backgroundColor: "{colors.hl-bg}"
    textColor: "{colors.hl-ink}"
---

# Design System: TrackBoard

## Overview

**Creative North Star: "The Paddock Noticeboard"**

Every page is paper on a cork board: results posted the way the timekeeper posts them. Three kinds of paper share the board: classification sheets torn off a pad and pinned up (a perforated stub with the pins above the tear), spiral-notebook pages for the driver's own records (forms and single-document pages), and pastel sticky notes stuck on by hand, each at its own small angle and a little off the line. Sheets are bright paper with hard ink rules and dense, tabular classifications. The board is warm tan cork, with granules and flecks so it plainly reads as a board. A dark graphite rail runs along the top (wordmark, Dymo-tape places, theme toggle, Me) and the bottom (footer, and on phones the tab bar), the same dark in both themes. Violet rubber-stamp ink is the one accent, and it only ever means something: overall best, the primary action, the current place, or a stamp. Because every time is self-reported, the classification carries a PROVISIONAL stamp rather than any claim of verification.

Density is that of a timing sheet: condensed Archivo figures in tabular numerals, hairline row rules, heavy caps rubrics over 2px rules, typed Courier metadata. Decoration is limited to what a real noticeboard would have: glossy push pins, strips of clear tape, notched Dymo tape, worn stamp ink, a highlighter stroke across your own line. There is one theme, light; there is no night mode.

This system explicitly refuses the dark racing dashboard with a red timing tower. The sister Android app TrackPro keeps its own, deliberately different DESIGN.md; the two are related by name and timing conventions, not by look.

**Key Characteristics:**
- Cork board ground, paper on top. Nothing to read sits on bare cork: intros are taped paper pages, the board heading is a Dymo label, and the few loose links are paper tags.
- A dark graphite rail carries the chrome: sticky header, footer and the phone tab bar.
- One accent, violet stamp ink, with a fixed meaning set; green is reserved for personal bests; yellow highlighter marks only your own row.
- Hard ink rules (2px strong, 1px light) do the structural work; corners are square.
- Two type voices: condensed/expanded Archivo for figures and headings, Courier Prime for typed metadata.
- One light theme only; no night mode and no theme toggle.

## Colors

A cork board, a dark graphite rail, near-white paper, pale sticky notes, near-black ink, and three meaningful inks (violet, green, yellow highlighter) plus a fault red.

### Primary
- **Stamp Violet** (stamp): overall best times and splits, the lap-record impression, every rubber stamp, the current Dymo place in the rail, the top strip on the lit phone tab, the outline of the lit Me button, focus rings on paper and on the day board, the best-sector callouts on the circuit map. Hover deepens to **Stamp Violet Deep** (stamp-deep). **Stamp Wash** (stamp-soft) is the hover fill for clickable classification rows and Me index rows.

### Secondary
- **Personal-Best Green** (pb): personal bests only (the PB tag and PB lap times), the "ok" notice, and the PB stamp tone. **PB Wash** (pb-soft) backs success notices.

### Tertiary
- **Highlighter Yellow** (hl-bg, with hl-ink text): the signed-in driver's own row in any classification or top list, the "you are P-n" line when your row is off the sheet, and the legend swatch. Also the text selection colour and the focus ring on the dark rail and tab bar.
- **Steward Red** (fault, fault-soft): errors, voided sessions, the danger button's handwriting, the not-found stamp. Never used for "slower".

### Neutral
- **Cork Board** (board, #c39a6b) and **Cork Shade** (board-deep): page ground under a cork texture (`--cork`, an SVG noise tile of mottling, dark granules and pale flecks); board-deep is the hover fill for plain buttons on the board. **Board Rule** (board-rule) is the divider on the board.
- **Board Ink** (board-ink) and **Board Ink Dim** (board-ink-dim): text on the board (intros, welcome line, "Track boards" heading, back links).
- **Board Focus** (board-focus): the focus ring for anything sitting on the board; deep violet (#2d1b85).
- **Rail Graphite** (rail), **Rail Ink** (rail-ink), **Rail Ink Dim** (rail-ink-dim), **Rail Rule** (rail-rule): the header, footer and phone tab bar. Dark graphite. Dim ink is footer prose and unlit tabs; the rule is the 1px edge against the board and the outline of the theme toggle and Me button.
- **Sheet White** (paper) and **Sheet Tint** (paper-2): sheet surface; tint fills input boxes, and photo initials.
- **Ink** (ink), **Ink 2** (ink-2), **Ink 3** (ink-3): primary, secondary (dim, letterheads, table heads, sub-lines) and tertiary (meta labels, placeholders, gapped laps) text on paper.
- **Hairline** (rule) and **Ink Rule** (rule-strong): row rules and the heavy rules under letterheads, rubrics and table heads.
- **Dymo Tape** (tape, tape-ink) and **Pin Head** (pin-head): navigation labels and drawing pins.

- **Sticky notes** (note-yellow #fbe68c, note-pink #f6c8d2, note-blue #c3dcef, note-lilac #dcd0f6): pale stock with dark ink (#1f1a10); inside a note the sheet tokens are remapped so tables, buttons and stamps keep their contrast.


### Named Rules
**The Neutral Ground Rule.** The board (the 60% ground) is warm tan cork. Never green, orange, red or bright blue. Colour belongs to the inks on the sheets and to the pale sticky notes.

**The Rail Rule.** Chrome lives on the dark rail, which is dark graphite; sheets never carry site navigation.

**The Stamp Ink Rule.** Violet means overall best, the current place, or a stamp; never a button. Nothing else. A session best is plain ink with an SB tag (bold, with a plain-ink square mark on best sectors); a PB is green with a PB tag.

**The Colour-Plus-Print Rule.** A timing colour is never the only cue: every coloured time carries a printed tag (OB, PB, SB, You) or a square best-mark, and fastest splits carry screen-reader text.

**The One Highlighter Rule.** Yellow belongs to your own line. It is never a decorative fill, never a hover, and clickable-row hover does not override it. (Focus rings on dark grounds are the one exception: an outline, never a fill.)

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui)
**Body Font:** Archivo Variable (same family; width axis does the role work)
**Label/Mono Font:** Courier Prime (with Courier New, monospace)

**Character:** One grotesque stretched in both directions: expanded heavy caps for titles, rubrics, stamps and tape; condensed bold for figures so long time columns stay tight. Courier Prime is the typewriter on the timekeeper's desk, used for anything typed onto the sheet rather than printed.

### Hierarchy
- **Display** (800, clamp(2rem, 1.2rem + 2.6vw, 3.4rem), 1.02, width 112%): the sheet title, one per sheet (track name, driver name, page name). On phones it drops to clamp(1.7rem, 7.5vw, 2.2rem) and may break anywhere.
- **Headline** (800, 1.3rem, 1.1, width 112%): the heading of a small sheet: dashboard tiles, the "Running a track day?" notice, empty-board sheets.
- **Title / Rubric** (800, 0.95rem, 0.08em, uppercase, width 118%): section headings on a sheet, sitting on a 2px ink rule with an optional typed aside at the right. On the board the same caps voice (1rem) heads "Track boards", without a rule.
- **Figure** (700, 1.08rem, width 86%, tabular lining numerals): lap times; positions go to 800 at 1.35rem. Dashboard big figures (a position or best lap) are 800 at 2.6rem, width 80%. The lap-record impression uses 800 at width 72%.
- **Body** (400, 1rem, 1.5, tabular lining numerals everywhere): prose and table cells; prose capped at 46 to 70ch.
- **Label** (700, 0.7rem, 0.1em, uppercase): table heads and meta labels (meta labels sit under their value, 600 in ink-3). Phone tabs use 700 at 0.68rem, 0.08em, width 108%.
- **Typed** (Courier Prime, 0.78rem, 0.02em): letterheads, rubric asides, sheet footers, rig codes, record byline, map callout notes and captions.

### Named Rules
**The Tabular Rule.** Every number is tabular and lining, site-wide (set on body). Time columns are right-aligned.

**The Typewriter Rule.** Courier is for facts typed onto a sheet (refs, printed time, rig, provenance notes). It is not used for headings or for buttons; buttons are handwritten in Caveat.

## Layout

Content sits in a centered page column (max 1240px) with a fluid gutter (clamp(16px, 3.2vw, 40px)). Spacing follows an 8-step scale from 4px to 72px; sheet padding is fluid (about 20 to 44px). The rail header is sticky, 64px tall, full-bleed with its row inside the page column.

Places: Home, Tracks, Events and My laps (signed in only) as Dymo tape in the rail, plus Me (or Sign in). Everything on the account side (Me, Garage, My tracks, Account) lights Me. Single-document pages (My laps, Events, event management, Me, Garage, My tracks, Account) share one spiral-notebook layout: one spiral page in the page column, at least 60vh tall. My laps switches between Personal bests and Sessions with a two-cell ink-ruled switch beside the sheet title; the lit cell is solid ink with paper text. Me is a hub sheet: a profile summary (96px photo, sheet title, typed facts, links) above ruled index rows.

Home signed in is a dashboard: a welcome line on the board, then three sticky-note tiles in an auto-fit grid (min 320px), each tilted and nudged differently,: your live or next event with your position, your latest session, your places; then "Track boards". Signed out: an on-board intro with two actions, the boards, and a lilac sticky "Running a track day?" notice in the side column; track slips are sticky notes cycling yellow, pink, blue, lilac. The track boards are a 2fr : 1fr grid (feature sheet with top five and map; slips to the side) that stacks at 960px. The track sheet opens with a two-column header (facts left, circuit map right) and the classification directly below, above the fold on desktop; it stacks at 880px (title, facts, classification, then map) and at 560px the PROVISIONAL stamp moves beside the title at 0.78 scale.

Phones (760px and under): the rail header keeps only the wordmark (and Sign in when signed out); places and Me move to a fixed 64px bottom tab bar (plus safe-area inset), and main and footer pad themselves clear of it. At 640px and under the reflow is global: the gutter drops to 10px, sheets pad 18px 14px 20px, push pins shrink to 15px, wide columns hide, typed sub-lines appear under the first cell, table cells tighten to 6px side padding, sheet titles shrink, rubrics close up to 24px above.

### Named Rules
**The Essential Columns Rule.** On phones, tables reflow to the essential columns (Pos, Driver, Best lap, Gap) and hide the rest; secondary facts (car, rig, track, date) fold into a dim sub-line under the first cell. Tables never rely on horizontal scroll to be legible.

**The Sheet First Rule.** The classification, not the map or the chrome, owns the first viewport.

**The Thumb Rule.** On phones every place is one tap away in the bottom tab bar; the header carries only the wordmark.

## Elevation & Depth

Depth is physical and minimal: a sheet lies on the board with one soft contact-plus-drop shadow, and nothing on the sheet itself is elevated. The rail is flat, separated from the board by a 1px rail rule. No hover lift inside sheets; the only motion lift is a 2px rise on home-page track slips. Rotation stands in for depth: stamps strike at -3 to -7deg, the record impression at -1.5deg, and home-page slips sit a fraction of a degree askew (straightened on phones).

### Shadow Vocabulary
- **Sheet on board** (`box-shadow: 0 1px 1px rgb(60 32 8 / 0.22), 0 12px 24px -12px rgb(60 32 8 / 0.55)`, tinted to the cork): every paper sheet. The only shadow in the system.

### Named Rules
**The Flat Sheet Rule.** One shadow, on sheets only. Buttons, tags, tables, the rail and the tab bar are flat; pins, tape, notes and the car key carry their own small cast shadows.

## Shapes

Square by default: sheets, inputs, tables, switches, index rows and tape have no radius; buttons, tags and the Me button take a barely-there 2px. Structure comes from rules, not boxes: 2px ink rules under letterheads, rubrics, table heads and above index lists, 1px hairlines between rows, a dashed 2px rule around the "get on this sheet" invitation. Stamps use a 3px double border (the record impression 4px double). Dymo tape is cut with a shallow 5px notch at each end via clip-path. Drawing pins are flat 13px discs (10px on phones) with a darker 2px rim. Photos sit in a square frame with a 4px paper mat and a 1px ink rule; the Me initials badge is a square 34px block of rail ink. Icons are authored line icons on a 24-unit grid, 1.75 stroke, square caps and mitred joins, matching the ruled sheets.

## Components

### Buttons
Written on the paper by hand, in black marker. No fill, no border.
- **Type:** Caveat (variable, 700), 1.55rem, line-height 1, tilted -0.8deg; marker ink #1b1b1d. Min height 44px, padding 2px 14px 6px.
- **Primary:** underlined with a quick hand-drawn black marker stroke. A trailing arrow icon marks "open" actions.
- **Plain:** the same handwriting without the underline.
- **Danger:** written in Steward Red; account deletion only.
- **Hover / keyboard focus:** a red marker (#d3302a) rings the word, drawn on round the loop in 380ms (a conic mask animating a registered `--ring` angle); the loop overshoots where it closes. Focus uses the ring instead of an outline.
- **Press:** a red marker scribble strikes the word out left to right in 240ms. A document click handler keeps `.struck` on the button for 900ms so the scribble shows through the page change.
- **Disabled:** 45% opacity, no ring, no scribble.
- **Text link with arrow:** 700-weight underlined link with a 16px arrow, for "All sessions", "All personal bests" and similar onward links.

### Timing Tags
- **Style:** tiny expanded caps (800, 0.62rem, 0.08em) in a 1.5px currentColor box with 2px corners, following the colour of the cell it sits in: OB in violet, PB in green, SB and You in ink, Void in red, Ranked in violet, Private dim.

### Cards / Containers (Sheets)
- **Corner Style:** square.
- **Background:** Sheet White on the board, text in Ink.
- **Shadow Strategy:** the single sheet shadow (see Elevation).
- **Pinned pad sheet** (`.sheet.pinned`): track sheets, the event board, driver pages and the home feature. A perforation line of punched holes (board-coloured, a shade deeper) runs across at 34px (24px on phones) with a half-round notch at each end, and two push pins are pressed into the stub above it. The pins are drawn 3D, after a classic map pin: a glossy flared dome, a narrow handle and a flat cap on a steel needle, leaning about 22deg with a soft shadow cast down-left onto the board (`--pin-red`, `--pin-blue`, `--pin-yellow`, `--pin-green`, `--pin-white`, each with a `-left` lean variant; a 78x61 image, 56x44 on phones, with the needle point placed in the paper). Red by default, or `.pin-blue`, `.pin-yellow`, `.pin-green`, `.pin-white`. `.pin-top` puts a single pin at the top centre of a small note.
- **Board extras** (`.extras` in the app shell, 1400px and wider, `aria-hidden`): a few things left in the bare cork either side of the page column, never under or over content. Left: a paddock pass (green pin, red-striped lanyard, laminated card with a chequer band, PADDOCK, ALL AREAS, a number and a barcode) that swings on hover, a taped grandstand ticket stub, and one spare red pin. Right: a yellow sticky with hot tyre pressures and a red "box box!" in handwriting, and one spare blue pin. Keep it to these; the board should not get busier. The browser console also greets developers with a one-line chequered-flag note.
- **Car key** (`.car-key`, home only, 1180px and wider): a Porsche key hung on a white pin in the bare cork right of the intro page: a gold split ring carrying a black car-shaped smart key (chrome edge, red reflector strip, four grey buttons with unlock, lock and boot icons, a tiny crest at the nose, emergency-key tip) and a stitched black leather shield fob with a gold crest-like shield. The shields are simplified (banner, red and black striped quarters, gold quarters, small centre shield) rather than a reproduction of the trademarked crest. It sways briefly on hover (off under reduced motion).
- **Clear tape** (`.taped`): a 96x26 strip of translucent cream tape with torn ends, across the top centre at -3deg (`--tape-tilt`). Spiral pages are also taped down at both bottom corners with diagonal strips. Home intros are taped pad sheets; track slips alternate a centre pin and a strip of tape.
- **Dymo label** (`.dymo-label`): the "Track boards" heading, black tape stuck on the cork at -1deg.
- **Paper tag** (`.paper-tag`): the back links above track and event sheets and the "All N tracks" link: a small paper slip at -1deg with a short shadow.
- **Spiral notebook page** (`.sheet.spiral`): the single-document layout (My laps, Events, Me, Garage, My tracks, Account) and the sign-in and register forms. Metal coils (22px pitch, spaced to whole coils) come out of punched holes and over the top edge, 14px above the page.
- **Sticky note** (`.sheet.sticky` plus yellow, pink, blue or lilac): home dashboard tiles, track slips, the "Running a track day?" notice and the not-found page. Rotated by `--tilt` (about ±0.7 to 2deg) and offset by `--nudge-x`/`--nudge-y` so neighbours never line up or share a colour; a slightly deeper glue strip at the top and a lifted bottom corner in the shadow.
- **Letterhead:** only on document sheets that carry distinct facts: the track sheet (doc ref and printed time) and the driver record (ref). Typed, uppercase, 0.78rem, over a 2px ink rule.
- **Footer:** typed 0.78rem over a hairline; carries counting rules and provenance.
- **Dashboard tile:** a sticky note (yellow, blue, pink, in that order) with a headline, a dim fact line, an optional big figure, and one action.

### Inputs / Fields
- **Style:** ruled entry boxes: Sheet Tint fill, no side borders, a 2px ink bottom rule, square, min height 46px, Courier Prime at 1rem, violet caret. Label above in 0.72rem uppercase label type.
- **Focus:** 2px violet outline flush with the box and a violet bottom rule.
- **Error / Disabled:** red bottom rule and a 600-weight red message below; disabled buttons drop to 50% opacity.

### Navigation
- **Rail header (desktop):** sticky dark rail, 64px. Wordmark in 900 weight, width 125%, uppercase, with a 20px chequer square. Places are Dymo tape: black tape, pale 0.78rem expanded caps at 0.14em tracking, notched ends, 36px tall, flat. The current place's tape is Stamp Violet with white text. At the right end: the Me button (initials badge plus name, 1px rail-rule outline; lit, it takes a violet outline and a 3px violet bottom strip). Signed out, Sign in is a Dymo label. Focus on the rail is a highlighter-yellow ring.
- **Tab bar (phones, 760px and under):** fixed to the bottom, dark rail, one equal column per place plus Me or Sign in. Each tab is a 22px authored icon over a caps label; unlit tabs in Rail Ink Dim, the lit tab in Rail Ink with a 3px violet strip along its top edge (inset 22% each side). Focus is an inset yellow ring.
- **Section switch:** a two-cell 2px ink-ruled switch (0.8rem caps, 44px tall); the current cell is solid ink with paper text.
- **Index rows (Me):** a list under a 2px ink rule; each row is a 22px icon, an 800-weight label with an ink-2 description under it, and a trailing arrow, 64px min height, hairline between rows, Stamp Wash on hover. Theme and Sign out sit in the same list as rows.

### Notices
- **Style:** a stewards' notice: 2px Steward Red border on a red wash with an uppercase red heading, stating the problem and the way out. The ok variant swaps to PB Green.

### Rubber Stamp (signature)
Heavy expanded caps (800, 0.95rem, 0.16em, width 122%) in a 3px double frame, struck at a tilt (default -4deg). Tones: violet (default), green, red, muted ink. The worn-ink filter `#tb-ink`, defined once in the app shell, goes on the frame and the struck word only; the typed subline under it (Courier, 700, 0.74rem) stays crisp. Used for PROVISIONAL, LIVE, record holder, empty and not-found states, private tracks.

### Lap Record Impression (signature)
The track's record struck onto the sheet in violet: a 4px double frame with the ink filter on the frame only, the time in 800 condensed figures, a vertical "Lap record" label, and a typed byline (driver, car, date). Rotated -1.5deg.

### Circuit Map (signature)
The outline drawn from the track's own ordered points: a 15-unit ink casing with a 5-unit paper core (a double ink line), traced in over 1.5s on load (static under reduced motion). A chequer across the start (and finish on sprints), a small ink arrowhead just after the start on the outside of the loop, and numbered sector callouts (paper disc, ink ring). Callouts sit beside each sector's midpoint on whichever side leaves the most clearance from the rest of the outline, preferring the outside. The selected driver's fastest-in-field sectors turn the casing and callout violet; slower sectors print their delta in typed ink-2.

### Loading, Waking, Empty
Loading is a sheet coming off the printer: a caps placard and dashed rule lines drawing in, never a spinner. After four seconds the placard reads "Waking the timekeeper" and explains the sleeping server.

## Do's and Don'ts

### Do:
- **Do** put every classification on a pinned, perforated paper sheet over the cork board, with 2px ink rules under the rubric and table head and 1px hairlines between rows.
- **Do** keep the board warm tan cork and carry the chrome on the dark rail.
- **Do** keep violet for overall best, the current place and stamps (never buttons); show a session best as plain ink with an SB tag and a PB in green with a PB tag.
- **Do** pair every timing colour with a printed tag or best-mark.
- **Do** mark the signed-in driver's row with the highlighter (hl-bg / hl-ink) and nothing else.
- **Do** apply the `#tb-ink` filter to a stamp's frame and struck word only, never to its typed subline or to body text.
- **Do** cut Dymo labels with notched ends via clip-path and keep them flat.
- **Do** draw pins as flat discs with a darker rim.
- **Do** on phones put every place in the bottom tab bar, hide wide columns and fold their facts into a typed sub-line under the first cell.
- **Do** draw new icons on the 24-unit grid at 1.75 stroke with square caps and mitred joins.
- **Do** place map callouts by clearance from the outline, never on the line.
- **Do** reserve letterheads for document sheets that carry distinct facts (doc ref, printed time, record ref).

### Don't:
- **Don't** build a dark racing dashboard or a red timing tower.
- **Don't** make the board green, orange, red or bright blue.
- **Don't** put kicker or eyebrow labels above headings; the title stands alone under the letterhead rule.
- **Don't** emboss, bevel or shade the Dymo tape, and don't give pins highlights or 3D shading.
- **Don't** use violet for session bests, links at rest, decoration or generic emphasis.
- **Don't** show a slower time as an error; red is for faults and voids only.
- **Don't** add shadows beyond the single sheet shadow, and don't round corners past 2px.
- **Don't** imply times are verified; provisional stamps and provenance lines stay.

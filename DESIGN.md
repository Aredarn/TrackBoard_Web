---
name: TrackBoard
description: Best-lap classifications posted like official timing sheets pinned to a paddock noticeboard.
colors:
  board: "#2b4438"
  board-deep: "#223830"
  board-ink: "#edf2ee"
  board-ink-dim: "#b7c7bd"
  board-rule: "#3f5d4e"
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
  pin-head: "#c9c6bd"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.2rem + 2.6vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.015em"
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
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.on-stamp}"
    rounded: "{rounded.tag}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.stamp-deep}"
    textColor: "{colors.on-stamp}"
  button-plain:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "0 18px"
    height: "44px"
  button-plain-hover:
    backgroundColor: "{colors.paper-2}"
  button-danger:
    backgroundColor: "{colors.fault}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tag}"
    padding: "0 18px"
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
  dymo-label:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.tape-ink}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "36px"
  dymo-label-current:
    backgroundColor: "{colors.stamp}"
    textColor: "{colors.on-stamp}"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "clamp(20px, 3.4vw, 44px) clamp(16px, 3.4vw, 44px)"
  classification-row-own:
    backgroundColor: "{colors.hl-bg}"
    textColor: "{colors.hl-ink}"
---

# Design System: TrackBoard

## Overview

**Creative North Star: "The Paddock Noticeboard"**

Every page is a sheet of paper pinned to a felt-green board: results posted the way the timekeeper posts them. Sheets are bright paper with hard ink rules and dense, tabular classifications; the board around them carries the chrome (wordmark, Dymo-tape navigation, footer). Violet rubber-stamp ink is the one accent, and it only ever means something: overall best, the primary action, or a stamp. Because every time is self-reported, the classification carries a PROVISIONAL stamp rather than any claim of verification.

Density is that of a timing sheet: condensed Archivo figures in tabular numerals, hairline row rules, heavy caps rubrics over 2px rules, typed Courier metadata. Decoration is limited to what a real noticeboard would have: flat drawing pins, notched Dymo tape, worn stamp ink, a highlighter stroke across your own line. At night the whole board becomes a carbon copy: carbon-blue type on near-black flimsy.

This system explicitly refuses the dark racing dashboard with a red timing tower. The sister Android app TrackPro keeps its own, deliberately different DESIGN.md; the two are related by name and timing conventions, not by look.

**Key Characteristics:**
- Felt-green board ground, paper sheets on top; content never sits directly on the felt except board chrome and short intros.
- One accent, violet stamp ink, with a fixed meaning set; green is reserved for personal bests; yellow highlighter marks only your own row.
- Hard ink rules (2px strong, 1px light) do the structural work; corners are square.
- Two type voices: condensed/expanded Archivo for figures and headings, Courier Prime for typed metadata.
- Night mode is a carbon copy, not an inverted dashboard.

## Colors

A green felt board, near-white paper, near-black ink, and three meaningful inks (violet, green, yellow highlighter) plus a fault red.

### Primary
- **Stamp Violet** (stamp): overall best times and splits, the lap-record impression, every rubber stamp, the primary button, the current Dymo nav label, focus rings on paper, the best-sector callouts on the circuit map. Hover deepens to **Stamp Violet Deep** (stamp-deep). **Stamp Wash** (stamp-soft) is the hover fill for clickable classification rows.

### Secondary
- **Personal-Best Green** (pb): personal bests only (the PB tag and PB lap times), the "ok" notice, and the PB stamp tone. **PB Wash** (pb-soft) backs success notices.

### Tertiary
- **Highlighter Yellow** (hl-bg, with hl-ink text): the signed-in driver's own row in any classification or top list, the "you are P-n" line when your row is off the sheet, and the legend swatch. Also the text selection colour and the focus ring on the felt board.
- **Steward Red** (fault, fault-soft): errors, voided sessions, the danger button, the not-found stamp. Never used for "slower".

### Neutral
- **Paddock Felt** (board) and **Felt Shadow** (board-deep): page ground (with a fine fractal-noise felt texture) and the header/footer bars. **Felt Rule** (board-rule) divides them.
- **Board Chalk** (board-ink) and **Board Chalk Dim** (board-ink-dim): text on the felt.
- **Sheet White** (paper) and **Sheet Tint** (paper-2): sheet surface; tint fills input boxes, plain-button hover and photo initials.
- **Ink** (ink), **Ink 2** (ink-2), **Ink 3** (ink-3): primary, secondary (dim, letterheads, table heads) and tertiary (meta labels, placeholders, gapped laps) text on paper.
- **Hairline** (rule) and **Ink Rule** (rule-strong): row rules and the heavy rules under letterheads, rubrics and table heads.
- **Dymo Tape** (tape, tape-ink) and **Pin Head** (pin-head): navigation labels and drawing pins.

Night ("carbon copy") remaps every token: near-black stock (#11131b), carbon-blue ink (#c9d2ff / #9aa6dc / #8390c4), lighter violet (#a58eff) and green (#58cc8e), highlighter at 20% alpha with pale yellow ink. It applies from `prefers-color-scheme: dark` unless the user picked day, or from an explicit night choice. Full values are in the sidecar.

### Named Rules
**The Stamp Ink Rule.** Violet means overall best, primary action, or a stamp. Nothing else. A session best is plain ink with an SB tag (bold, with a plain-ink square mark on best sectors); a PB is green with a PB tag.

**The Colour-Plus-Print Rule.** A timing colour is never the only cue: every coloured time carries a printed tag (OB, PB, SB, You) or a square best-mark, and fastest splits carry screen-reader text.

**The One Highlighter Rule.** Yellow belongs to your own line. It is never a decorative fill, never a hover, and clickable-row hover does not override it.

## Typography

**Display Font:** Archivo Variable (with Archivo, system-ui)
**Body Font:** Archivo Variable (same family; width axis does the role work)
**Label/Mono Font:** Courier Prime (with Courier New, monospace)

**Character:** One grotesque stretched in both directions: expanded heavy caps for titles, rubrics, stamps and tape; condensed bold for figures so long time columns stay tight. Courier Prime is the typewriter on the timekeeper's desk, used for anything typed onto the sheet rather than printed.

### Hierarchy
- **Display** (800, clamp(2rem, 1.2rem + 2.6vw, 3.4rem), 1.02, width 112%): the sheet title, one per sheet (track name, driver name, page name).
- **Title / Rubric** (800, 0.95rem, 0.08em, uppercase, width 118%): section headings on a sheet, sitting on a 2px ink rule with an optional typed aside at the right.
- **Figure** (700, 1.08rem, width 86%, tabular lining numerals): lap times; positions go to 800 at 1.35rem. The lap-record impression uses 800 at width 72%.
- **Body** (400, 1rem, 1.5, tabular lining numerals everywhere): prose and table cells; prose capped at 56 to 70ch.
- **Label** (700, 0.7rem, 0.1em, uppercase): table heads and meta labels (meta labels sit under their value, 600 in ink-3).
- **Typed** (Courier Prime, 0.78rem, 0.02em): letterheads, rubric asides, sheet footers, rig codes, record byline, map callout notes and captions.

### Named Rules
**The Tabular Rule.** Every number is tabular and lining, site-wide (set on body). Time columns are right-aligned.

**The Typewriter Rule.** Courier is for facts typed onto a sheet (refs, printed time, rig, provenance notes). It is not used for headings or for buttons.

## Layout

Content sits in a centered page column (max 1240px) with a fluid gutter (clamp(16px, 3.2vw, 40px)). Spacing follows an 8-step scale from 4px to 72px; sheet padding is fluid (about 20 to 44px). The track sheet opens with a two-column header (facts left, circuit map right, 1fr : 1.1fr) and the classification table directly below, starting above the fold on desktop.

Responsive behaviour at 880px: the header dissolves into a single column and reorders to title, facts, classification, then map, then the rest. At 560px the letterhead drops its descriptive half, the PROVISIONAL stamp moves beside the title and scales to 0.78, and table cells tighten to 6px side padding. The shell collapses the wordmark chequer and moves the theme toggle into the footer. The signed-in area uses index tabs along the top of one sheet, scrolling sideways on phones with a right-edge fade.

### Named Rules
**The Essential Columns Rule.** On phones, classification tables reflow to the essential columns (Pos, Driver, Best lap, Gap) and hide the rest; the car and rig code move to a dim second line under the driver name. Tables never rely on horizontal scroll to be legible.

**The Sheet First Rule.** The classification, not the map or the chrome, owns the first viewport.

## Elevation & Depth

Depth is physical and minimal: a sheet lies on the felt with one soft contact-plus-drop shadow, and nothing on the sheet itself is elevated. No hover lift inside sheets; the only motion lift is a 2px rise on home-page track slips. Rotation stands in for depth: stamps strike at -3 to -7deg, the record impression at -1.5deg, and home-page slips and the notice sheet sit a fraction of a degree askew.

### Shadow Vocabulary
- **Sheet on felt** (`box-shadow: 0 1px 1px rgb(0 0 0 / 0.2), 0 14px 28px -12px rgb(0 0 0 / 0.55)`; night deepens to 0.5 / 0.8): every paper sheet. The only shadow in the system.

### Named Rules
**The Flat Sheet Rule.** One shadow, on sheets only. Buttons, tags, tape, pins and tables are flat.

## Shapes

Square by default: sheets, inputs, tables, tabs and tape have no radius; buttons, tags and the theme toggle take a barely-there 2px. Structure comes from rules, not boxes: 2px ink rules under letterheads, rubrics and table heads, 1px hairlines between rows, a dashed 2px rule around the "get on this sheet" invitation. Stamps use a 3px double border (the record impression 4px double). Dymo tape is cut with a shallow 5px notch at each end via clip-path. Drawing pins are flat 13px discs with a darker 2px rim. Photos sit in a square frame with a 4px paper mat and a 1px ink rule. Icons are authored line icons on a 24-unit grid, 1.75 stroke, square caps and mitred joins, matching the ruled sheets.

## Components

### Buttons
Rubber-stamp solid, heavy caps, compact.
- **Shape:** near-square (2px), 2px border, min height 44px.
- **Primary:** Stamp Violet fill and border, white text; 800 weight, 0.82rem, 0.08em tracking, uppercase, width 112%; padding 0 18px.
- **Hover / Active:** fill deepens to Stamp Violet Deep over 140ms; press drops 1px. Focus is a 3px violet outline offset 2px.
- **Plain:** transparent with an ink border and ink text; hover fills Sheet Tint. On the felt the border and text become Board Chalk.
- **Danger:** Steward Red fill, paper text; used for account deletion only.

### Timing Tags
- **Style:** tiny expanded caps (800, 0.62rem, 0.08em) in a 1.5px currentColor box with 2px corners, following the colour of the cell it sits in: OB in violet, PB in green, SB and You in ink, Void in red, Ranked in violet, Private dim.

### Cards / Containers (Sheets)
- **Corner Style:** square.
- **Background:** Sheet White on the felt, text in Ink.
- **Shadow Strategy:** the single sheet shadow (see Elevation).
- **Pins:** pinned sheets carry two flat pin discs at the top corners, 12px in and 10px down.
- **Letterhead:** only on document sheets that carry distinct facts: the track sheet (doc ref and printed time) and the driver record (ref). Typed, uppercase, 0.78rem, over a 2px ink rule.
- **Footer:** typed 0.78rem over a hairline; carries counting rules and provenance.

### Inputs / Fields
- **Style:** ruled entry boxes: Sheet Tint fill, no side borders, a 2px ink bottom rule, square, min height 46px, Courier Prime at 1rem, violet caret. Label above in 0.72rem uppercase label type.
- **Focus:** 2px violet outline flush with the box and a violet bottom rule.
- **Error / Disabled:** red bottom rule and a 600-weight red message below; disabled buttons drop to 50% opacity.

### Navigation
- **Style:** Dymo tape labels on the felt header: black tape, pale 0.78rem expanded caps at 0.16em tracking, notched ends, 36px tall, flat with no emboss or bevel. The current page's tape is Stamp Violet with white text. On phones the tape shrinks to 34px, 0.7rem and 0.08em tracking.
- **Section tabs:** the signed-in area uses paper index tabs above one sheet; inactive tabs are paper mixed 72% with felt and sit 3px low, the current tab is full paper and flush.

### Notices
- **Style:** a stewards' notice: 2px Steward Red border on a red wash with an uppercase red heading, stating the problem and the way out. The ok variant swaps to PB Green.

### Rubber Stamp (signature)
Heavy expanded caps (800, 0.95rem, 0.16em, width 122%) in a 3px double frame, struck at a tilt (default -4deg). Tones: violet (default), green, red, muted ink. The worn-ink filter `#tb-ink`, defined once in the app shell, goes on the frame and the struck word only; the typed subline under it (Courier, 700, 0.74rem) stays crisp. Used for PROVISIONAL, record holder, empty and not-found states, private tracks.

### Lap Record Impression (signature)
The track's record struck onto the sheet in violet: a 4px double frame with the ink filter on the frame only, the time in 800 condensed figures, a vertical "Lap record" label, and a typed byline (driver, car, date). Rotated -1.5deg.

### Circuit Map (signature)
The outline drawn from the track's own ordered points: a 15-unit ink casing with a 5-unit paper core (a double ink line), traced in over 1.5s on load (static under reduced motion). A chequer across the start (and finish on sprints), a small ink arrowhead just after the start on the outside of the loop, and numbered sector callouts (paper disc, ink ring). Callouts sit beside each sector's midpoint on whichever side leaves the most clearance from the rest of the outline, preferring the outside. The selected driver's fastest-in-field sectors turn the casing and callout violet; slower sectors print their delta in typed ink-2.

### Loading, Waking, Empty
Loading is a sheet coming off the printer: a caps placard and dashed rule lines drawing in, never a spinner. After four seconds the placard reads "Waking the timekeeper" and explains the sleeping server.

## Do's and Don'ts

### Do:
- **Do** put every classification on a paper sheet over the felt, with 2px ink rules under the rubric and table head and 1px hairlines between rows.
- **Do** keep violet for overall best, the primary action, the current nav label and stamps; show a session best as plain ink with an SB tag and a PB in green with a PB tag.
- **Do** pair every timing colour with a printed tag or best-mark.
- **Do** mark the signed-in driver's row with the highlighter (hl-bg / hl-ink) and nothing else.
- **Do** apply the `#tb-ink` filter to a stamp's frame and struck word only, never to its typed subline or to body text.
- **Do** cut Dymo labels with notched ends via clip-path and keep them flat.
- **Do** draw pins as flat discs with a darker rim.
- **Do** render night as a carbon copy: carbon-blue ink on near-black stock, remapped through the tokens.
- **Do** reflow tables on phones to the essential columns with a second line under the driver name.
- **Do** place map callouts by clearance from the outline, never on the line.
- **Do** reserve letterheads for document sheets that carry distinct facts (doc ref, printed time, record ref).

### Don't:
- **Don't** build a dark racing dashboard or a red timing tower.
- **Don't** put kicker or eyebrow labels above headings; the title stands alone under the letterhead rule.
- **Don't** emboss, bevel or shade the Dymo tape, and don't give pins highlights or 3D shading.
- **Don't** use violet for session bests, links at rest, decoration or generic emphasis.
- **Don't** show a slower time as an error; red is for faults and voids only.
- **Don't** add shadows beyond the single sheet shadow, and don't round corners past 2px.
- **Don't** imply times are verified; provisional stamps and provenance lines stay.

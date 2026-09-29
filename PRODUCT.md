# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular (user's choice), standalone components and signals, no SSR. Scaffolded on Angular 21
because the machine's Node 24.13 is below Angular 22's floor (24.15); upgrade with `ng update`
once Node is newer. Deployed as a Render static site with SPA rewrites, next to the API on the
same Render account. Talks only to the TrackBoard REST API (`/api/v1`).

## Users

**Primary: the TrackPro driver, back home after a track day.** They drove with the TrackPro
Android app, the phone synced their sessions to TrackBoard, and now — at a desk or on the sofa,
unhurried — they want to see where their laps placed, how their career adds up, and how they
stack against other drivers on the same track. They are signed in with the same TrackBoard
account the app uses.

**Second: someone who opened a shared leaderboard link.** A friend, a club member, another
driver. No account, often no app. They should understand the board instantly and see how to
get on it themselves (TrackPro).

## Product Purpose

The browser face of TrackBoard: public per-track best-lap leaderboards and published tracks,
public driver profiles, and a private driver area that mirrors what the phone uploaded —
career stats, personal bests with leaderboard position, sessions with lap and sector
breakdown, garage, own tracks — plus account management.

Success: a driver can go from "I drove Pannonia-ring today" to "I'm P4 of 23, two tenths off
P3, and it's my sector 2" without opening the phone; and a shared link makes a stranger want
to be on that board.

## Positioning

The leaderboard is built from laps timed by a phone or a ~€20 DIY ESP32 GPS rig, against
track geometry that drivers publish themselves — not from a commercial logger or a sim. Every
entry says which GPS source timed it. It is open source end to end (app GPL-2.0, TrackBoard
Apache-2.0, firmware public), free, and account-optional for the app itself.

## Operating Context

- Data arrives only from the phone. The phone is the source of truth and the server is a
  one-way mirror; the web never creates or edits sessions, laps, tracks, or vehicles.
- A driver drives, the app uploads later (network-constrained), then the driver reviews.
  Sessions can be private, ranked, or voided; only ranked, non-voided laps without a GPS
  signal gap on a published track reach a leaderboard.
- Tracks are shared by publishing, not by geometry matching. A published track's timing
  geometry freezes once it has a ranked lap.
- Leaderboards and published tracks are public and meant to be shared as links.
- The API is on a Render free plan and sleeps after ~15 minutes idle: the first request can
  take tens of seconds. Cold start is a real, frequent state.

## Capabilities and Constraints

**In v1**

- Public: browse/search published tracks (by type, near a point), a track page with its
  outline drawn from the ordered points plus start and sector markers, its leaderboard.
- Public driver profiles (new backend endpoint): name, photo, country, bio, and bests on
  published tracks only. Private tracks and sessions are never exposed.
- Signed in: own profile and career stats (sessions, laps, tracks, vehicles, distance, main
  car, personal best per track with rank / field size), sessions list and session detail
  (laps, sector splits, which laps count and their rank, weather, GPS source, voided state),
  garage (vehicles with photos and specs), own tracks including private ones.
- Account from the web: edit name/bio/country, upload/clear avatar (signed upload URL, JPEG
  or WebP), download the JSON export, delete the account (typed confirmation).
- Sign in, register, token refresh (access 60 min, refresh 90 days, rotating; reuse of a
  rotated refresh token revokes all sessions).

**Not in v1**

- Any write to sessions, laps, tracks, vehicles (would be overwritten by the next phone sync).
- The parked championship model (series, events, results, points).
- Lap verification. Lap times are trusted as uploaded; the site must not imply they are
  verified.
- GPS traces, ghost laps, map tiles for lap traces.

**Constraints**

- Durations are integer milliseconds; the app displays laps as `M:SS.hh`-style times.
- Track type is `Circuit` or `Sprint`. GPS source is `Wifi`, `Bluetooth` (both the ESP32 rig)
  or `PhoneGps`.
- Auth endpoints are rate limited to 5/min. Errors are RFC 7807 ProblemDetails.
- Any map or track geometry derived from OpenStreetMap needs contributor attribution.

## Brand Commitments

- Name: **TrackBoard**, the online companion to **TrackPro**
  (`github.com/Aredarn/trackpro`; firmware `github.com/Aredarn/TrackPro_ESP`).
- The user chose a **distinct TrackBoard identity**, related to TrackPro but not a copy of the
  app's "Blackout Dash" look.
- Motorsport timing conventions are the sport's, not decoration: purple overall best, green
  personal best. Slower is never shown as an error.
- Open source and hardware-hackable is part of the identity.

## Evidence on Hand

- Real circuits that ship in the app: Pannonia-ring, Nordschleife (BTG), Euro-ring,
  Hungaroring, Mugello, Circuit Paul Ricard (GP), Kakucs ring (plus reverse).
- The live API: `https://trackboard-u9uj.onrender.com`. Real user and lap counts are small and
  unknown; the site must not invent driver counts, lap counts, testimonials, or accuracy
  claims. Demo content shown before real data exists must be labelled as such.
- No logo or wordmark exists yet.

## Product Principles

1. **The lap time is the hero.** Every screen is organised around times, gaps, and positions;
   everything else is context for a number.
2. **Honest about provenance.** Show which GPS source timed a lap, that times are
   self-reported, and which laps count and why the others do not.
3. **Mirror, don't edit.** The phone owns the data. The web explains and compares; it only
   writes to the account.
4. **A link is a front door.** A shared leaderboard must make sense to someone with no
   account and no app, and point them to TrackPro.
5. **Cold starts are normal.** Loading, sleeping-server, empty, and error states are designed
   states, never spinners on a blank page.

## Accessibility & Inclusion

WCAG 2.2 AA. Timing colours (purple/green/amber) are never the only cue; ranks, deltas and
badges carry text. Tabular numerals for all times so columns align and do not jitter. Full
keyboard navigation for tables and forms. Honour `prefers-reduced-motion`.

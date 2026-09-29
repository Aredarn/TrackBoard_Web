# TrackBoard Web

The browser face of [TrackBoard](../TrackBoard), the backend for the
[TrackPro](https://github.com/Aredarn/trackpro) lap-timing app.

- **Public:** every published track with its outline drawn from the driver-published GPS
  points, a best-lap classification per track (shareable link), and a public page per driver.
- **Signed in:** your season record and personal bests with board position, every uploaded
  session with lap and sector breakdown, your garage, your tracks (private ones too), and your
  account: edit name, country, bio and photo, download a JSON export, delete the account.

The phone is the source of truth. Sessions, laps, tracks and cars are read-only here; the web
only writes to the account.

Built with Angular 21 (standalone components, signals, `rxResource`), no UI library. Fonts are
self-hosted from `@fontsource` (Archivo variable, Courier Prime).

## Run it

Requires Node 20.19+, 22.12+ or 24+.

```bash
npm install
```

```bash
npm start
```

Open `http://localhost:4200`. In development every `/api` call is proxied to the live API at
`https://trackboard-u9uj.onrender.com` (see [proxy.conf.json](proxy.conf.json)), so no CORS
setup is needed. The API runs on Render's free plan and sleeps when idle: the first request
can take up to a minute, and the page says so while it waits.

To run against a local API instead, change the proxy `target` to `http://localhost:5000`.

## Test and build

```bash
npm test -- --watch=false
```

```bash
npm run build
```

The production build lands in `dist/TrackBoard-Web/browser`.

## Deploy (Render)

[render.yaml](render.yaml) is a Blueprint for a free static site with SPA rewrites.

1. Push this repo to GitHub and create a Blueprint from it in Render.
2. After the first deploy, copy the site URL (for example `https://trackboard-web.onrender.com`).
3. On the **API** service, set `Cors__AllowedOrigins__0` to that URL and redeploy it. Without it
   the browser blocks every API response.
4. If the site URL differs from what [src/environments/environment.ts](src/environments/environment.ts)
   expects of the API, update `apiBase` there.

Public driver pages need the API's `GET /api/v1/drivers/{id}` endpoint (TrackBoard branch
`public-driver-profiles`). Until that is deployed, driver pages show "Not on the board".

## Layout

```
src/app/
  core/     API client and types, auth (tokens, refresh, guard, interceptor), formatting, theme
  ui/       circuit map, stamp, loading/empty/error gate, photo frame, timing pipes, icons
  pages/    home, tracks, track (classification), driver, sign-in, register, not-found
  pages/me/ record, sessions, session, garage, my tracks, account
```

## Design

A paddock noticeboard: classification sheets pinned to a felt board, violet rubber-stamp ink
for the overall best and primary actions, green for personal bests, a highlighter over your own
line. Night mode renders sheets as carbon copies. The track page's map is drawn from the track's
own points; picking a driver in the classification shades each sector on the map by who holds
the fastest split. Design decisions are recorded in [DESIGN.md](DESIGN.md) and product context
in [PRODUCT.md](PRODUCT.md).

## Notes

- Tokens are kept in `localStorage`: the API issues bearer tokens, not cookies. The site loads
  no third-party scripts.
- Lap times are posted as the app uploads them and are not verified; the site says so on every
  classification.

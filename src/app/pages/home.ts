import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/api.service';
import { EventSummary } from '../core/api.types';
import { AuthService } from '../core/auth.service';
import { eventWindow, plural } from '../core/format';
import { load } from '../core/load';
import { CircuitMap } from '../ui/circuit-map';
import { Gate } from '../ui/gate';
import { Icon } from '../ui/icon';
import { TIMING_PIPES } from '../ui/pipes';
import { Stamp } from '../ui/stamp';

/**
 * Home. Signed in, it is the driver's own board first: the event they are in, their latest
 * session, where they stand. Signed out, it says what TrackBoard is and how to get on it.
 * Either way the track boards follow.
 */
@Component({
  selector: 'tb-home-page',
  imports: [RouterLink, Gate, CircuitMap, Icon, Stamp, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      @if (auth.user(); as user) {
        <header class="intro on-board">
          <h1>Welcome back, {{ firstName() }}</h1>
          <p>Your event, your latest session and where you stand, then every track board.</p>
        </header>

        <div class="dash">
          <!-- Your event: the live one with your place, else the next one, else how to get in one. -->
          <article class="sheet sticky yellow tile">
            @if (liveEvent(); as ev) {
              <div class="tile-head">
                <h2>{{ ev.name }}</h2>
                <tb-stamp text="Live" [tilt]="-5" />
              </div>
              <p class="dim">{{ ev.trackName }} · {{ window(ev) }}</p>
              @if (myLine(); as me) {
                <p class="big"><span class="pos">P{{ me.rank }}</span><span class="of dim"> of {{ rankedCount() }}</span></p>
                <p>Best {{ me.bestLapMs | lap }}@if (me.gapToLeaderMs) { · {{ me.gapToLeaderMs | gap }} to P1}</p>
              } @else {
                <p class="tile-note">No lap from you yet. Drive a session on {{ ev.trackName }} and each lap posts as you cross the line.</p>
              }
              <a class="btn" [routerLink]="['/events', ev.id]">Open live board <tb-icon name="arrowRight" [size]="16" /></a>
            } @else if (nextEvent(); as ev) {
              <h2>Next event</h2>
              <p class="tile-name">{{ ev.name }}</p>
              <p class="dim">{{ ev.trackName }} · {{ window(ev) }}</p>
              <a class="btn plain" [routerLink]="['/events', ev.id]">See its board</a>
            } @else {
              <h2>Track days</h2>
              <p class="tile-note">Got a code from a host? Join their event and your laps go onto its live board as you drive.</p>
              <div class="actions">
                <a class="btn" routerLink="/events">Join with a code</a>
                <a class="btn plain" routerLink="/events">Host an event</a>
              </div>
            }
          </article>

          <!-- Latest session -->
          <article class="sheet sticky blue tile">
            <h2>Latest session</h2>
            <tb-gate [status]="latest.status()" [error]="latest.error()" [empty]="!latestSession()" (retry)="latest.reload()">
              @if (latestSession(); as s) {
                <p class="tile-name">{{ s.name }}</p>
                <p class="dim">{{ s.trackName ?? 'No track' }} · {{ s.startedAt | day: true }}</p>
                <p class="big">{{ s.bestLapMs | lap }}</p>
                <p class="dim">{{ plural(s.lapCount, 'lap') }}{{ s.voided ? ' · void' : s.visibility === 'Ranked' ? ' · ranked' : ' · private' }}</p>
                <div class="actions">
                  <a class="btn plain" [routerLink]="['/laps/sessions', s.id]">Open session</a>
                  <a class="more" routerLink="/laps/sessions">All sessions <tb-icon name="arrowRight" [size]="16" /></a>
                </div>
              }
              <p empty class="tile-note">Nothing uploaded yet. Sign in to TrackPro on your phone with this account; sessions sync after each drive.</p>
            </tb-gate>
          </article>

          <!-- Where you stand -->
          <article class="sheet sticky pink tile">
            <h2>Your places</h2>
            <tb-gate [status]="stats.status()" [error]="stats.error()" [empty]="ranked().length === 0" (retry)="stats.reload()">
              <ul class="mine">
                @for (pb of ranked(); track pb.trackId) {
                  <li>
                    <a [routerLink]="['/tracks', pb.trackId]">{{ pb.trackName }}</a>
                    <span class="place">P{{ pb.rank }}<span class="dim">/{{ pb.fieldSize }}</span></span>
                    <span class="t">{{ pb.rankedLapMs | lap }}</span>
                  </li>
                }
              </ul>
              <p empty class="tile-note">None of your laps are on a public board yet. Set a session to Ranked in TrackPro on a published track.</p>
            </tb-gate>
            <a class="more" routerLink="/laps">All personal bests <tb-icon name="arrowRight" [size]="16" /></a>
          </article>
        </div>

        <h2 class="boards-title on-board">Track boards</h2>
      } @else {
        <header class="intro on-board">
          <h1>Best laps, posted by the drivers who set them.</h1>
          <p>
            Every track published from the TrackPro app keeps a classification of each driver's fastest ranked lap,
            timed by phone GPS or a DIY ESP32 rig. Track days get a live board of their own.
          </p>
          <div class="actions">
            <a class="btn" routerLink="/register">Create a free account</a>
            <a class="btn plain on-board-btn" routerLink="/tracks">Browse the tracks</a>
          </div>
        </header>
      }

      <tb-gate [status]="tracks.status()" [error]="tracks.error()" [empty]="!feature()" (retry)="tracks.reload()">
        <div class="board">
          @if (feature(); as f) {
            <article class="sheet pinned feature">
              <div class="feature-body">
                <div>
                  <h2 class="feature-title"><a [routerLink]="['/tracks', f.id]">{{ f.name }}</a></h2>
                  <p class="dim">
                    {{ f.country }} · {{ f.type }} · {{ f.lengthMeters | km }} ·
                    {{ f.rankedLapCount ? 'most driven, ' + f.rankedLapCount + ' ranked laps' : 'no ranked laps yet' }}
                  </p>

                  <tb-gate [status]="featureBoard.status()" [error]="featureBoard.error()" [empty]="(featureBoard.value()?.entries?.length ?? 0) === 0" (retry)="featureBoard.reload()">
                    <ol class="top">
                      @for (e of featureBoard.value()?.entries; track e.userId) {
                        <li [class.me]="e.userId === myId()">
                          <span class="p">{{ e.rank }}</span>
                          <a [routerLink]="['/drivers', e.userId]" class="who">{{ e.displayName }}</a>
                          <span class="t" [class.ob]="e.rank === 1">{{ e.lapTimeMs | lap }}</span>
                          <span class="g dim">{{ e.gapToLeaderMs | gap }}</span>
                        </li>
                      }
                    </ol>
                    <p empty class="dim">No ranked laps posted yet.</p>
                  </tb-gate>

                  <a class="btn" [routerLink]="['/tracks', f.id]">Full classification <tb-icon name="arrowRight" [size]="16" /></a>
                </div>
                <div class="feature-map">
                  @if (featureTrack.value(); as t) {
                    <tb-circuit-map [points]="t.points" [type]="t.type" [name]="t.name" />
                  }
                </div>
              </div>
            </article>
          }

          <div class="side">
            @for (s of slips(); track s.track.id) {
              <a class="sheet sticky slip" [class]="slipColour($index)" [routerLink]="['/tracks', s.track.id]">
                <span class="slip-name">{{ s.track.name }}</span>
                <span class="slip-meta dim">{{ s.track.country }} · {{ s.track.rankedLapCount }} ranked laps</span>
                @if (s.leader; as l) {
                  <span class="slip-rec"><span class="ob">{{ l.lapTimeMs | lap }}</span> {{ l.displayName }}</span>
                } @else {
                  <span class="slip-rec dim">No laps posted</span>
                }
              </a>
            }

            @if (!auth.signedIn()) {
              <article class="sheet sticky lilac notice-sheet">
                <h2>Running a track day?</h2>
                <p class="dim">
                  Create an event, hand out its code, and every lap your drivers set lands on one live board, overall
                  and per run group. Put it on a screen in the paddock.
                </p>
                <a class="more" routerLink="/events">How events work <tb-icon name="arrowRight" [size]="16" /></a>
              </article>
            }

            <a class="all on-board" routerLink="/tracks">All {{ trackCount() }} <tb-icon name="arrowRight" [size]="16" /></a>
          </div>
        </div>

        <article empty class="sheet pinned first">
          <h2>The board is empty</h2>
          <p class="dim">
            No track has been published yet. Build one in TrackPro's track builder and publish it, and its
            classification sheet goes up here.
          </p>
        </article>
      </tb-gate>
    </div>
  `,
  styles: `
    .intro {
      max-width: 60rem;
      padding-block: var(--s4) var(--s6);
    }

    .intro h1 {
      font-weight: 850;
      font-stretch: 116%;
      font-size: clamp(2rem, 1.3rem + 3vw, 3.6rem);
      line-height: 1.02;
      letter-spacing: -0.02em;
    }

    .intro p {
      margin-top: var(--s3);
      max-width: 58ch;
      font-size: 1.05rem;
      color: var(--board-ink-dim);
    }

    .intro .actions {
      margin-top: var(--s5);
    }

    .on-board-btn {
      border-color: var(--board-ink);
      color: var(--board-ink);
    }

    .on-board-btn:hover {
      background: var(--board-deep);
    }

    /* The driver's own three sheets. */
    .dash {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: var(--s5);
      align-items: start;
    }

    /* Stuck on by hand: each note at its own angle and a little off the line. */
    .tile:nth-child(1) {
      --tilt: -1.6deg;
      --nudge-y: 6px;
    }

    .tile:nth-child(2) {
      --tilt: 1.2deg;
      --nudge-y: -4px;
    }

    .tile:nth-child(3) {
      --tilt: -0.7deg;
      --nudge-y: 12px;
    }

    .tile {
      display: grid;
      gap: var(--s2);
      align-content: start;
    }

    .tile h2 {
      font-weight: 800;
      font-stretch: 112%;
      font-size: 1.3rem;
      line-height: 1.1;
    }

    .tile-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--s3);
    }

    .tile-name {
      font-weight: 700;
      font-size: 1.05rem;
    }

    .tile-note {
      color: var(--ink-2);
      max-width: 46ch;
    }

    .big {
      margin-top: var(--s2);
      font-weight: 800;
      font-stretch: 80%;
      font-size: 2.6rem;
      line-height: 1;
    }

    .big .of {
      font-weight: 600;
      font-stretch: 100%;
      font-size: 1rem;
    }

    .tile .btn,
    .tile .actions {
      margin-top: var(--s3);
      justify-self: start;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--s2) var(--s4);
    }

    .more {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }

    .mine {
      margin: var(--s2) 0;
      padding: 0;
      list-style: none;
      border-top: 2px solid var(--rule-strong);
    }

    .mine li {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: var(--s3);
      padding: 9px 0;
      border-bottom: 1px solid var(--rule);
      font-stretch: 88%;
    }

    .mine a {
      font-weight: 700;
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .mine .place {
      font-weight: 800;
    }

    .boards-title {
      margin: var(--s7) 0 var(--s4);
      font-weight: 800;
      font-stretch: 118%;
      font-size: 1rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    /* Track boards */
    .board {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
      gap: var(--s5);
      align-items: start;
    }

    .feature-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: var(--s5);
    }

    .feature-title {
      font-weight: 800;
      font-stretch: 112%;
      font-size: clamp(1.6rem, 1.2rem + 1.6vw, 2.4rem);
      line-height: 1.05;
    }

    .feature-title a {
      text-decoration: none;
    }

    .feature-title a:hover {
      text-decoration: underline;
    }

    .top {
      margin: var(--s4) 0 var(--s5);
      padding: 0;
      list-style: none;
      border-top: 2px solid var(--rule-strong);
    }

    .top li {
      display: grid;
      grid-template-columns: 2rem minmax(0, 1fr) auto auto;
      gap: var(--s3);
      align-items: baseline;
      padding: 9px 6px;
      border-bottom: 1px solid var(--rule);
      font-stretch: 88%;
    }

    .top li.me {
      background: var(--hl-bg);
      color: var(--hl-ink);
    }

    .top .p {
      font-weight: 800;
      font-size: 1.2rem;
    }

    .top .who {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 700;
      text-decoration: none;
    }

    .top .t {
      font-weight: 700;
    }

    .top .g {
      min-width: 4.5em;
      text-align: right;
    }

    .feature-map {
      --map-max-h: 360px;
      align-self: center;
    }

    .side {
      display: grid;
      gap: var(--s4);
    }

    .slip {
      display: grid;
      gap: 2px;
      padding: 22px 20px 18px;
      text-decoration: none;
      transition: transform 180ms var(--ease-out);
    }

    .slip:nth-of-type(odd) {
      --tilt: -1.4deg;
      --nudge-x: -6px;
    }

    .slip:nth-of-type(even) {
      --tilt: 1.1deg;
      --nudge-x: 10px;
    }

    .slip:hover {
      transform: translateY(-3px);
    }

    .notice-sheet {
      --tilt: 0.8deg;
    }

    .slip-name {
      font-weight: 800;
      font-stretch: 110%;
      font-size: 1.15rem;
    }

    .slip-meta {
      font-size: 0.85rem;
    }

    .slip-rec {
      margin-top: 6px;
      font-weight: 700;
      font-stretch: 90%;
    }

    .notice-sheet {
      display: grid;
      gap: var(--s2);
    }

    .notice-sheet h2,
    .first h2 {
      font-weight: 800;
      font-stretch: 112%;
      font-size: 1.3rem;
      line-height: 1.1;
    }

    .all {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      justify-self: start;
      font-weight: 700;
    }

    .first {
      max-width: 40rem;
    }

    @media (max-width: 960px) {
      .board {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .feature-body {
        grid-template-columns: 1fr;
      }

      .feature-map {
        order: -1;
        --map-max-h: 240px;
      }

      .slip:nth-of-type(odd) {
        --nudge-x: -2px;
      }

      .slip:nth-of-type(even) {
        --nudge-x: 4px;
      }

      .dash {
        gap: var(--s4);
      }
    }
  `,
})
export class HomePage {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  protected readonly env = environment;
  protected readonly plural = plural;

  protected readonly myId = computed(() => this.auth.user()?.id ?? null);
  /** Sticky-note colour for the nth track slip, so neighbours never match. */
  protected slipColour(i: number): string {
    return ['yellow', 'pink', 'blue', 'lilac'][i % 4];
  }

  protected readonly firstName = computed(() => this.auth.user()?.displayName.split(/\s+/)[0] ?? '');

  // ── The driver's own ──

  private readonly signedIn = () => (this.auth.signedIn() ? true : undefined);

  private readonly events = load({ params: this.signedIn, stream: () => this.api.myEvents() });

  protected readonly liveEvent = computed<EventSummary | null>(
    () => this.events.value()?.find((e) => e.status === 'Live' && (e.isJoined || e.isHost)) ?? null,
  );

  protected readonly nextEvent = computed<EventSummary | null>(() => {
    const upcoming = (this.events.value() ?? []).filter((e) => e.status === 'Upcoming');
    return upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;
  });

  private readonly liveBoard = load({
    params: () => this.liveEvent()?.id,
    stream: ({ params: id }) => this.api.eventBoard(id),
  });

  protected readonly myLine = computed(() => {
    const me = this.liveBoard.value()?.entries.find((e) => e.userId === this.myId());
    return me?.rank ? me : null;
  });

  protected readonly rankedCount = computed(() => this.liveBoard.value()?.entries.filter((e) => e.rank !== null).length ?? 0);

  protected readonly latest = load({ params: this.signedIn, stream: () => this.api.sessions(1, null, 1) });
  protected readonly latestSession = computed(() => this.latest.value()?.items[0] ?? null);

  protected readonly stats = load({ params: this.signedIn, stream: () => this.api.stats() });
  protected readonly ranked = computed(() =>
    (this.stats.value()?.personalBests ?? []).filter((pb) => pb.rank !== null).slice(0, 5),
  );

  // ── Track boards ──

  protected readonly tracks = load({ stream: () => this.api.tracks({ pageSize: 50 }) });

  private readonly byActivity = computed(() =>
    [...(this.tracks.value()?.items ?? [])].sort((a, b) => b.rankedLapCount - a.rankedLapCount),
  );

  protected readonly trackCount = computed(() => plural(this.tracks.value()?.totalCount ?? 0, 'track'));

  protected readonly feature = computed(() => this.byActivity()[0] ?? null);

  protected readonly featureTrack = load({
    params: () => this.feature()?.id,
    stream: ({ params: id }) => this.api.track(id),
  });

  protected readonly featureBoard = load({
    params: () => (this.feature() ? { id: this.feature()!.id, signedIn: this.auth.signedIn() } : undefined),
    stream: ({ params }) =>
      this.api.leaderboard(params.id, 5).pipe(map((b) => ({ ...b, entries: b.entries.slice(0, 5) }))),
  });

  /** The next few boards, each with only its record holder. */
  private readonly slipData = load({
    params: () => {
      const ids = this.byActivity().slice(1, 5).map((t) => t.id);
      return ids.length ? { ids } : undefined;
    },
    stream: ({ params }) =>
      forkJoin(params.ids.map((id) => this.api.leaderboard(id, 1).pipe(catchError(() => of(null))))),
  });

  protected readonly slips = computed(() => {
    const boards = this.slipData.value() ?? [];
    return this.byActivity()
      .slice(1, 5)
      .map((track, i) => ({ track, leader: boards[i]?.entries[0] ?? null }));
  });

  protected window(ev: EventSummary): string {
    return eventWindow(ev.startsAt, ev.endsAt);
  }
}

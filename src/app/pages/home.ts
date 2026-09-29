import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { load } from '../core/load';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { plural } from '../core/format';
import { CircuitMap } from '../ui/circuit-map';
import { Gate } from '../ui/gate';
import { Icon } from '../ui/icon';
import { TIMING_PIPES } from '../ui/pipes';

@Component({
  selector: 'tb-home-page',
  imports: [RouterLink, Gate, CircuitMap, Icon, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="intro on-board">
        <h1>Best laps, posted by the drivers who set them.</h1>
        <p>
          Every track published from the TrackPro app keeps a classification of each driver's fastest
          ranked lap, timed by phone GPS or a DIY ESP32 rig.
        </p>
      </header>

      <tb-gate [status]="tracks.status()" [error]="tracks.error()" [empty]="!feature()" (retry)="tracks.reload()" class="board-gate">
        <div class="board">
          @if (feature(); as f) {
            <article class="sheet pinned feature">
              <div class="feature-body">
                <div>
                  <h2 class="feature-title"><a [routerLink]="['/tracks', f.id]">{{ f.name }}</a></h2>
                  <p class="dim">{{ f.country }} · {{ f.type }} · {{ f.lengthMeters | km }} · most driven, {{ f.rankedLapCount }} ranked laps</p>

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
            @if (auth.signedIn()) {
              <article class="sheet pinned standings">
                <h2 class="side-title">Your standings</h2>
                <tb-gate [status]="stats.status()" [error]="stats.error()" [empty]="ranked().length === 0" (retry)="stats.reload()">
                  <ul class="mine">
                    @for (pb of ranked(); track pb.trackId) {
                      <li>
                        <a [routerLink]="['/tracks', pb.trackId]">{{ pb.trackName }}</a>
                        <span class="pos">P{{ pb.rank }}<span class="dim">/{{ pb.fieldSize }}</span></span>
                        <span class="t">{{ pb.rankedLapMs | lap }}</span>
                      </li>
                    }
                  </ul>
                  <p empty class="dim">
                    None of your laps are on a public board yet. Set a session to Ranked in TrackPro on a published track.
                  </p>
                </tb-gate>
                <a class="more" routerLink="/me">My season <tb-icon name="arrowRight" [size]="16" /></a>
              </article>
            } @else {
              <article class="sheet pinned notice-sheet">
                <h2>How a lap gets on the board</h2>
                <ol>
                  <li>Record it with <a [href]="env.trackProUrl" rel="noopener">TrackPro</a>, the free Android lap timer.</li>
                  <li>Drive a published track with the session set to <strong>Ranked</strong>.</li>
                  <li>Sign in on the phone. Your best lap posts itself when it syncs.</li>
                </ol>
                <p class="dim small">
                  Timing hardware is optional: phone GPS works, and the
                  <a [href]="env.firmwareUrl" rel="noopener">open ESP32 firmware</a> gives a sharper fix.
                </p>
                <div class="cta">
                  <a class="btn" routerLink="/register">Create an account</a>
                  <a class="btn plain" routerLink="/sign-in">Sign in</a>
                </div>
              </article>
            }

            @for (s of slips(); track s.track.id) {
              <a class="sheet slip" [routerLink]="['/tracks', s.track.id]">
                <span class="slip-name">{{ s.track.name }}</span>
                <span class="slip-meta dim">{{ s.track.country }} · {{ s.track.rankedLapCount }} ranked laps</span>
                @if (s.leader; as l) {
                  <span class="slip-rec"><span class="ob">{{ l.lapTimeMs | lap }}</span> {{ l.displayName }}</span>
                } @else {
                  <span class="slip-rec dim">No laps posted</span>
                }
              </a>
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
      padding-block: var(--s5) var(--s6);
    }

    .intro h1 {
      font-weight: 850;
      font-stretch: 116%;
      font-size: clamp(2.1rem, 1.3rem + 3vw, 4rem);
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .intro p {
      margin-top: var(--s4);
      max-width: 58ch;
      font-size: 1.08rem;
      color: var(--board-ink-dim);
    }

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
      margin-top: var(--s3);
    }

    .feature-title {
      font-weight: 800;
      font-stretch: 112%;
      font-size: clamp(1.7rem, 1.2rem + 1.6vw, 2.5rem);
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
      --map-max-h: 380px;
      align-self: center;
    }

    .side {
      display: grid;
      gap: var(--s5);
    }

    .standings .mine {
      margin: var(--s3) 0;
      padding: 0;
      list-style: none;
    }

    .mine li {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: var(--s3);
      padding: 8px 0;
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

    .mine .pos {
      font-weight: 800;
    }

    .more {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }

    .notice-sheet h2,
    .first h2,
    .side-title {
      font-weight: 800;
      font-stretch: 112%;
      font-size: 1.35rem;
      line-height: 1.1;
      margin-top: var(--s3);
    }

    .notice-sheet {
      rotate: 0.6deg;
    }

    .slip:nth-of-type(odd) {
      rotate: -0.5deg;
    }

    .slip:nth-of-type(even) {
      rotate: 0.4deg;
    }

    .notice-sheet ol {
      margin: var(--s3) 0;
      padding-left: 1.25em;
      display: grid;
      gap: 6px;
    }

    .small {
      font-size: 0.9rem;
    }

    .cta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2);
      margin-top: var(--s4);
    }

    .slip {
      display: grid;
      gap: 2px;
      padding: 18px 20px;
      text-decoration: none;
      transition: transform 180ms var(--ease-out);
    }

    .slip:hover {
      transform: translateY(-2px);
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

    @media (max-width: 620px) {
      .feature-body {
        grid-template-columns: 1fr;
      }

      .feature-map {
        order: -1;
        --map-max-h: 260px;
      }
    }
  `,
})
export class HomePage {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);
  protected readonly env = environment;

  protected readonly myId = computed(() => this.auth.user()?.id ?? null);

  protected readonly tracks = load({
    stream: () => this.api.tracks({ pageSize: 50 }),
  });

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
      this.api.leaderboard(params.id, 5).pipe(
        map((b) => ({ ...b, entries: b.entries.slice(0, 5) })),
      ),
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

  protected readonly stats = load({
    params: () => (this.auth.signedIn() ? true : undefined),
    stream: () => this.api.stats(),
  });

  protected readonly ranked = computed(() =>
    (this.stats.value()?.personalBests ?? []).filter((pb) => pb.rank !== null).slice(0, 6),
  );
}

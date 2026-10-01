import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ResourceStatus,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Observable, catchError, defer, filter, fromEvent, map, of, repeat, take, timer } from 'rxjs';
import { ApiService } from '../core/api.service';
import { EventBoard, EventBoardEntry } from '../core/api.types';
import { AuthService } from '../core/auth.service';
import { ago, clock, eventWindow, plural } from '../core/format';
import { load } from '../core/load';
import { Gate } from '../ui/gate';
import { Icon } from '../ui/icon';
import { TIMING_PIPES } from '../ui/pipes';
import { Stamp } from '../ui/stamp';

interface Row {
  entry: EventBoardEntry;
  pos: number | null;
  gap: number | null;
  me: boolean;
  fresh: boolean;
}

/** Polled every few seconds while the event runs, rarely otherwise, never while the tab is hidden. */
const LIVE_POLL_MS = 5_000;
const IDLE_POLL_MS = 60_000;

@Component({
  selector: 'tb-event-page',
  imports: [RouterLink, Gate, Stamp, Icon, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.screen]': 'screen()' },
  template: `
    <div class="page">
      @if (!screen()) {
        <p class="crumbs on-board">
          @if (auth.signedIn()) {
            <a routerLink="/events"><tb-icon name="arrowLeft" [size]="16" /> Events</a>
          } @else {
            <a routerLink="/tracks"><tb-icon name="arrowLeft" [size]="16" /> Tracks</a>
          }
        </p>
      }

      <article class="sheet pinned">
        <div class="letterhead">
          <span>Doc EV-{{ id().slice(0, 4).toUpperCase() }} · {{ updatedLabel() }}</span>
          <button type="button" class="screen-toggle" (click)="toggleScreen()">
            {{ screen() ? 'Leave screen mode' : 'Screen mode' }}
          </button>
        </div>

        <tb-gate [status]="boardStatus()" [error]="boardError()" loadingLabel="Posting the timing sheet" (retry)="reload()">
          @if (board(); as b) {
            <div class="stamp-slot">
              @switch (b.status) {
                @case ('Live') {
                  <tb-stamp text="Live" sub="provisional · self-reported" [tilt]="-6" />
                }
                @case ('Finished') {
                  <tb-stamp text="Final" sub="event closed" tone="muted" [tilt]="-5" />
                }
                @default {
                  <tb-stamp text="Upcoming" [sub]="startsIn(b.startsAt)" tone="muted" [tilt]="-4" />
                }
              }
            </div>

            <header class="head">
              <h1 class="sheet-title">{{ b.name }}</h1>
              <dl class="meta">
                <div>
                  <dt>Track</dt>
                  <dd><a [routerLink]="['/tracks', b.trackId]">{{ b.trackName }}</a></dd>
                </div>
                <div><dt>When</dt><dd>{{ window(b.startsAt, b.endsAt) }}</dd></div>
                <div><dt>Drivers</dt><dd>{{ b.entries.length }}</dd></div>
                <div><dt>On track</dt><dd>{{ onTrackCount() }}</dd></div>
              </dl>

              @if (detail.value()?.event; as ev) {
                @if (ev.isHost && ev.joinCode) {
                  <div class="code-block">
                    <span class="code-label">Join code</span>
                    <span class="code">{{ ev.joinCode.slice(0, 3) }}&thinsp;{{ ev.joinCode.slice(3) }}</span>
                    <span class="code-help">Drivers enter it in TrackPro under Events, or at trackboard on the web.</span>
                    @if (!screen()) {
                      <a class="btn plain" [routerLink]="['/events', ev.id, 'manage']">Manage event</a>
                    }
                  </div>
                } @else if (!ev.isJoined && b.status !== 'Finished' && !screen()) {
                  <p class="join-hint dim">
                    Driving today? Ask the host for the join code and enter it in TrackPro under
                    <strong>Events</strong>, or <a routerLink="/events">join on the web</a>.
                  </p>
                }
              }
            </header>

            @if (b.groups.length) {
              <div class="ticks" role="tablist" aria-label="Run group">
                <button type="button" role="tab" class="tick" [attr.aria-selected]="group() === null" (click)="group.set(null)">
                  Overall
                </button>
                @for (g of b.groups; track g.id) {
                  <button type="button" role="tab" class="tick" [attr.aria-selected]="group() === g.id" (click)="group.set(g.id)">
                    {{ g.name }}
                  </button>
                }
              </div>
            }

            <h2 class="rubric">
              {{ groupName() ?? 'Classification' }}
              <small>{{ rankedLabel() }} · best lap each · updates every few seconds while live</small>
            </h2>

            @if (rows().length) {
              <div class="table-wrap">
                <table class="classification">
                  <caption class="sr-only">Event classification by best lap</caption>
                  <thead>
                    <tr>
                      <th scope="col" class="num">Pos</th>
                      <th scope="col">Driver</th>
                      <th scope="col" class="num">Best lap</th>
                      <th scope="col" class="num">Gap</th>
                      <th scope="col" class="num c-wide">Laps</th>
                      <th scope="col" class="num c-wide">Last lap</th>
                      <th scope="col" class="c-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of rows(); track r.entry.userId) {
                      <tr [class.me]="r.me" [class.fresh]="r.fresh">
                        <td class="pos num">{{ r.pos ?? '—' }}</td>
                        <td class="drv">
                          <a [routerLink]="['/drivers', r.entry.userId]">{{ r.entry.displayName }}</a>
                          @if (r.me) {
                            <span class="tag">You</span>
                          }
                          @if (group() === null && groupLabel(r.entry.groupId); as gl) {
                            <span class="tag dim">{{ gl }}</span>
                          }
                          <span class="sub-line typed">
                            {{ plural(r.entry.lapCount, 'lap') }}
                            @if (r.entry.onTrack) {
                              · on track
                            }
                          </span>
                        </td>
                        <td class="time num" [class.ob]="r.pos === 1">
                          {{ r.entry.bestLapMs | lap }}
                          @if (r.pos === 1) {
                            <span class="tag">{{ group() === null ? 'OB' : 'GB' }}</span>
                          }
                        </td>
                        <td class="num">{{ r.entry.bestLapMs === null ? '' : (r.gap | gap: '—') }}</td>
                        <td class="num c-wide">{{ r.entry.lapCount }}</td>
                        <td class="num c-wide" [class.pb]="r.entry.lastLapIsBest">
                          {{ r.entry.lastLapMs | lap }}
                          @if (r.entry.lastLapIsBest) {
                            <span class="tag">PB</span>
                          }
                        </td>
                        <td class="c-wide">
                          @if (r.entry.onTrack) {
                            <span class="on-track"><span class="lamp" aria-hidden="true"></span>On track</span>
                          } @else {
                            <span class="typed dim">{{ lastSeen(r.entry.lastActivityAt) }}</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="empty dim">
                @if (b.entries.length === 0) {
                  Nobody has joined yet. The host hands out the join code; drivers enter it in TrackPro.
                } @else {
                  No one in this group yet.
                }
              </p>
            }

            <p class="sheet-foot">
              Every lap a joined driver drives on {{ b.trackName }} during the event counts, private sessions included.
              Voided sessions and laps with a GPS signal gap do not. Times are posted as TrackPro uploads them and are not verified.
              {{ group() === null ? 'OB = fastest overall.' : 'GB = fastest in the group.' }} PB = the driver's latest lap is their best of the day.
            </p>
          }
        </tb-gate>
      </article>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    /* Screen mode: the sheet takes the whole display, for a TV in the paddock. */
    :host(.screen) {
      position: fixed;
      inset: 0;
      z-index: 20;
      overflow: auto;
      padding-block: var(--s4);
      background: var(--board);
    }

    :host(.screen) .page {
      max-width: none;
    }

    :host(.screen) .classification {
      font-size: 1.35rem;
    }

    :host(.screen) .classification td.pos {
      font-size: 1.9rem;
    }

    :host(.screen) .classification td.time {
      font-size: 1.6rem;
    }

    .crumbs {
      margin-bottom: var(--s3);
      font-size: 0.9rem;
    }

    .crumbs a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }

    .screen-toggle {
      all: unset;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    .screen-toggle:focus-visible {
      outline: 3px solid var(--focus);
    }

    .stamp-slot {
      display: flex;
      justify-content: flex-end;
      margin: var(--s3) 0 -40px;
    }

    .head {
      display: grid;
      gap: var(--s4);
      max-width: calc(100% - 160px);
    }

    .code-block {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 4px var(--s4);
      justify-self: start;
      padding: 12px 16px;
      border: 2px solid var(--rule-strong);
    }

    .code-label {
      grid-column: 1 / -1;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-2);
    }

    .code {
      font-family: var(--font-typed);
      font-weight: 700;
      font-size: 2.2rem;
      letter-spacing: 0.12em;
      line-height: 1;
    }

    .code-help {
      max-width: 34ch;
      font-size: 0.85rem;
      color: var(--ink-2);
    }

    .code-block .btn {
      grid-column: 1 / -1;
      justify-self: start;
    }

    .join-hint {
      max-width: 64ch;
    }

    .ticks {
      display: inline-flex;
      flex-wrap: wrap;
      margin-top: var(--s5);
      border: 2px solid var(--rule-strong);
    }

    .tick {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 0 14px;
      font-weight: 700;
      font-stretch: 112%;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .tick + .tick {
      border-left: 2px solid var(--rule-strong);
    }

    .tick[aria-selected='true'] {
      background: var(--ink);
      color: var(--paper);
    }

    .tick:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }

    .sub-line {
      display: none;
      color: var(--ink-2);
    }

    .on-track {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
    }

    .lamp {
      width: 8px;
      height: 8px;
      background: currentColor;
      animation: blink 1.6s steps(2, jump-none) infinite;
    }

    @keyframes blink {
      50% {
        opacity: 0.2;
      }
    }

    /* Fresh ink: a new best lap lands on the sheet and fades into it. */
    tr.fresh > td {
      animation: ink 3.5s var(--ease-out);
    }

    @keyframes ink {
      from {
        background: color-mix(in srgb, var(--stamp) 22%, transparent);
      }
      to {
        background: transparent;
      }
    }

    tr.me.fresh > td {
      animation: none;
    }

    .empty {
      padding-block: var(--s4);
      max-width: 62ch;
    }

    @media (max-width: 640px) {
      .head {
        max-width: none;
      }

      .stamp-slot {
        margin-bottom: 0;
      }

      .c-wide {
        display: none;
      }

      td.drv {
        white-space: normal;
      }

      .sub-line {
        display: block;
        margin-top: 2px;
      }

      .classification td,
      .classification th {
        padding-inline: 6px;
      }
    }
  `,
})
export class EventPage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);

  protected readonly board = signal<EventBoard | null>(null);
  protected readonly boardStatus = signal<ResourceStatus>('loading');
  protected readonly boardError = signal<unknown>(undefined);
  protected readonly group = signal<string | null>(null);
  protected readonly screen = signal(false);
  private readonly fresh = signal<ReadonlySet<string>>(new Set());
  private readonly reloadTick = signal(0);
  private readonly now = signal(Date.now());

  protected readonly plural = plural;

  /** Host view (join code) and the viewer's own group. Refetched when sign-in changes. */
  protected readonly detail = load({
    params: () => ({ id: this.id(), signedIn: this.auth.signedIn() }),
    stream: ({ params }) => this.api.event(params.id),
  });

  protected readonly updatedLabel = computed(() => {
    const b = this.board();
    return b ? `Updated ${clock(new Date(b.generatedAt))}` : 'Fetching';
  });

  protected readonly onTrackCount = computed(() => this.board()?.entries.filter((e) => e.onTrack).length ?? 0);

  protected readonly groupName = computed(() => {
    const id = this.group();
    return this.board()?.groups.find((g) => g.id === id)?.name ?? null;
  });

  protected readonly rows = computed<Row[]>(() => {
    const b = this.board();
    if (!b) return [];
    const groupId = this.group();
    const myId = this.auth.user()?.id;
    const fresh = this.fresh();
    const entries = groupId === null ? b.entries : b.entries.filter((e) => e.groupId === groupId);
    return entries.map((entry) => ({
      entry,
      pos: groupId === null ? entry.rank : entry.groupRank,
      gap: groupId === null ? entry.gapToLeaderMs : entry.gapToGroupLeaderMs,
      me: entry.userId === myId,
      fresh: fresh.has(entry.userId),
    }));
  });

  protected readonly rankedLabel = computed(() => {
    const rows = this.rows();
    const ranked = rows.filter((r) => r.pos !== null).length;
    return `${plural(ranked, 'driver')} with a time of ${rows.length}`;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect((onCleanup) => {
      const id = this.id();
      this.reloadTick();
      this.board.set(null);
      this.boardStatus.set('loading');
      this.group.set(null);

      const sub = defer(() => this.api.eventBoard(id))
        .pipe(
          map((board) => ({ board, error: null as unknown })),
          catchError((error: unknown) => of({ board: null, error })),
          repeat({ delay: () => this.nextPoll() }),
        )
        .subscribe(({ board, error }) => {
          if (board) {
            this.apply(board);
          } else if (!this.board()) {
            // Only a failure before the first sheet is worth a notice; later blips keep the last sheet up.
            this.boardError.set(error);
            this.boardStatus.set('error');
          }
        });

      onCleanup(() => sub.unsubscribe());
    });

    effect(() => {
      const b = this.board();
      if (b) this.title.setTitle(`${b.name} — live board — TrackBoard`);
    });

    const tick = setInterval(() => this.now.set(Date.now()), 30_000);
    destroyRef.onDestroy(() => {
      clearInterval(tick);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    });
  }

  protected reload(): void {
    this.reloadTick.update((n) => n + 1);
  }

  protected toggleScreen(): void {
    const on = !this.screen();
    this.screen.set(on);
    try {
      if (on && !document.fullscreenElement) void document.documentElement.requestFullscreen().catch(() => undefined);
      if (!on && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } catch {
      // Fullscreen refused (iframe, old browser): screen mode still fills the window.
    }
  }

  protected window(startsAt: string, endsAt: string): string {
    return eventWindow(startsAt, endsAt);
  }

  protected lastSeen(iso: string | null): string {
    return iso ? `seen ${ago(iso, this.now())}` : 'no laps yet';
  }

  protected startsIn(startsAt: string): string {
    const minutes = Math.round((Date.parse(startsAt) - this.now()) / 60_000);
    if (minutes <= 0) return 'starting';
    if (minutes < 120) return `starts in ${minutes} min`;
    return `starts ${new Date(startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  }

  protected groupLabel(groupId: string | null): string | null {
    return groupId ? (this.board()?.groups.find((g) => g.id === groupId)?.name ?? null) : null;
  }

  private apply(next: EventBoard): void {
    const previous = this.board();

    // A driver whose best lap improved since the last sheet gets fresh ink for a moment.
    if (previous) {
      const before = new Map(previous.entries.map((e) => [e.userId, e.bestLapMs]));
      const improved = next.entries
        .filter((e) => e.bestLapMs !== null && (before.get(e.userId) ?? null) !== e.bestLapMs)
        .map((e) => e.userId);
      if (improved.length) {
        this.fresh.set(new Set(improved));
        setTimeout(() => this.fresh.set(new Set()), 3_600);
      }
    }

    this.board.set(next);
    this.boardStatus.set('resolved');
    this.now.set(Date.now());

    // A group that was removed while the tab was open falls back to the overall view.
    const g = this.group();
    if (g && !next.groups.some((x) => x.id === g)) this.group.set(null);
  }

  private nextPoll(): Observable<unknown> {
    if (document.hidden) {
      return fromEvent(document, 'visibilitychange').pipe(
        filter(() => !document.hidden),
        take(1),
      );
    }
    return timer(this.board()?.status === 'Live' ? LIVE_POLL_MS : IDLE_POLL_MS);
  }
}

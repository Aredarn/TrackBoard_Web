import { ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, signal } from '@angular/core';
import { load } from '../core/load';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/api.service';
import { LeaderboardEntry } from '../core/api.types';
import { AuthService } from '../core/auth.service';
import { clock, gpsCode, gpsLabel, lapTime, plural } from '../core/format';
import { CircuitMap, SectorMark } from '../ui/circuit-map';
import { Gate } from '../ui/gate';
import { Icon } from '../ui/icon';
import { TIMING_PIPES } from '../ui/pipes';
import { Stamp } from '../ui/stamp';

interface Row {
  entry: LeaderboardEntry;
  interval: number | null;
  me: boolean;
  /** Sector index → true when this split is the fastest in the field. */
  bestSectors: Set<number>;
}

@Component({
  selector: 'tb-track-page',
  imports: [RouterLink, Gate, CircuitMap, Stamp, Icon, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <p class="crumbs"><a class="paper-tag" routerLink="/tracks"><tb-icon name="arrowLeft" [size]="16" /> All tracks</a></p>

      <article class="sheet pinned">
        <div class="letterhead">
          <span>Doc CL-{{ docRef() }} · Printed {{ printed }}</span>
        </div>

        <tb-gate [status]="track.status()" [error]="track.error()" (retry)="track.reload()">
          @if (track.value(); as t) {
            <div class="flow">
            <div class="provisional">
              <tb-stamp text="Provisional" sub="times self-reported" [tilt]="-7" />
            </div>

            <header class="head">
              <div class="facts">
                <h1 class="sheet-title">{{ t.name }}</h1>
                <dl class="meta">
                  <div><dt>Country</dt><dd>{{ t.country }}</dd></div>
                  <div><dt>Layout</dt><dd>{{ t.type }}</dd></div>
                  <div><dt>Length</dt><dd>{{ t.lengthMeters | km }}</dd></div>
                  <div><dt>Sectors</dt><dd>{{ t.sectorCount ? t.sectorCount + 1 : 'None' }}</dd></div>
                  <div><dt>Ranked laps</dt><dd>{{ t.rankedLapCount }}</dd></div>
                </dl>
                <p class="byline dim">
                  Outline published by <strong>{{ t.ownerDisplayName }}</strong>
                  @if (t.geometryLocked) {
                    · geometry frozen since the first ranked lap
                  }
                </p>

                @if (leader(); as l) {
                  <div class="record" role="group" aria-label="Lap record">
                    <span class="record-ink" aria-hidden="true"></span>
                    <span class="record-time"><span class="record-label">Lap record</span>{{ l.lapTimeMs | lap }}</span>
                    <span class="record-by">
                      <a [routerLink]="['/drivers', l.userId]">{{ l.displayName }}</a> · {{ l.vehicle | car }} ·
                      {{ l.setAt | day }}
                    </span>
                  </div>
                }

                <div class="actions">
                  <button type="button" class="btn plain" (click)="share(t.name)">
                    <tb-icon name="link" [size]="16" />
                    {{ copied() ? 'Link copied' : 'Share this board' }}
                  </button>
                </div>
              </div>

              <figure class="map">
                <tb-circuit-map [points]="t.points" [type]="t.type" [name]="t.name" [marks]="marks()" />
                <figcaption class="typed dim">
                  @if (selected(); as s) {
                    @if (hasSectors()) {
                      <span class="cap-line">
                        P{{ s.entry.rank }} {{ s.entry.displayName }}:
                        @for (m of marks() ?? []; track m.index) {
                          <span class="split" [class.ob]="m.state === 'best'">S{{ m.index + 1 }} {{ splitText(s.entry, m.index) }}</span>
                        }
                      </span>
                    } @else {
                      No sector splits recorded on this board yet.
                    }
                  } @else {
                    Start/finish chequer; arrow shows running direction.
                  }
                </figcaption>
              </figure>
            </header>

            @if (t.visibility === 'Private') {
              <div class="private">
                <tb-stamp text="Private track" tone="muted" [tilt]="-3" />
                <p>Only you can see this outline. It has no public classification until you publish it from TrackPro.</p>
              </div>
            } @else {
            <h2 class="rubric">
              Classification
              <small>
                {{ rowCountLabel() }} · best ranked lap each
                @if (hasSectors()) {
                  · pick a row to shade the map, <span class="ob">violet</span> = fastest split
                }
              </small>
            </h2>

            <tb-gate [status]="board.status()" [error]="board.error()" [empty]="rows().length === 0" (retry)="board.reload()">
              <div class="table-wrap">
                <table class="classification">
                  <caption class="sr-only">Best lap per driver on {{ t.name }}, fastest first</caption>
                  <thead>
                    <tr>
                      <th scope="col" class="num">Pos</th>
                      <th scope="col">Driver</th>
                      <th scope="col" class="c-wide">Car</th>
                      <th scope="col" class="num">Best lap</th>
                      <th scope="col" class="num">Gap</th>
                      <th scope="col" class="num c-wide">Int.</th>
                      @for (i of sectorColumns(); track i) {
                        <th scope="col" class="num c-wide">S{{ i + 1 }}</th>
                      }
                      <th scope="col" class="c-wide">Rig</th>
                      <th scope="col" class="c-wide">Set on</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of rows(); track r.entry.userId) {
                      <tr
                        class="clickable"
                        [class.me]="r.me"
                        [class.picked]="selected()?.entry?.userId === r.entry.userId"
                        (click)="pick(r)"
                      >
                        <td class="pos num">
                          <button
                            type="button"
                            class="pick"
                            [attr.aria-pressed]="selected()?.entry?.userId === r.entry.userId"
                            [attr.aria-label]="'Show sectors for P' + r.entry.rank + ' ' + r.entry.displayName + ' on the map'"
                            (click)="pick(r); $event.stopPropagation()"
                          >
                            {{ r.entry.rank }}
                          </button>
                        </td>
                        <td class="drv">
                          <a [routerLink]="['/drivers', r.entry.userId]" (click)="$event.stopPropagation()">{{ r.entry.displayName }}</a>
                          @if (r.me) {
                            <span class="tag">You</span>
                          }
                          <span class="car-line dim">{{ r.entry.vehicle | car }} · {{ code(r.entry) }}</span>
                        </td>
                        <td class="dim c-wide">{{ r.entry.vehicle | car }}</td>
                        <td class="time num" [class.ob]="r.entry.rank === 1">
                          {{ r.entry.lapTimeMs | lap }}
                          @if (r.entry.rank === 1) {
                            <span class="tag">OB</span>
                          }
                        </td>
                        <td class="num">{{ r.entry.gapToLeaderMs | gap: '—' }}</td>
                        <td class="num dim c-wide">{{ r.interval | gap: '—' }}</td>
                        @for (i of sectorColumns(); track i) {
                          <td class="num c-wide" [class.ob]="r.bestSectors.has(i)">
                            @if (split(r.entry, i); as ms) {
                              <span [class.best-mark]="r.bestSectors.has(i)">{{ ms | lap }}</span>
                              @if (r.bestSectors.has(i)) {
                                <span class="sr-only">(fastest in the field)</span>
                              }
                            } @else {
                              <span class="dim">—</span>
                            }
                          </td>
                        }
                        <td class="typed c-wide" [attr.title]="rig(r.entry)">{{ code(r.entry) }}</td>
                        <td class="dim c-wide">{{ r.entry.setAt | day }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (outsideMe(); as m) {
                <p class="me-outside">
                  You are <strong>P{{ m.rank }}</strong> with {{ m.lapTimeMs | lap }}, {{ m.gapToLeaderMs | gap }} behind the record.
                </p>
              }

              <div empty class="empty">
                <tb-stamp text="No classified laps" tone="muted" [tilt]="-3" />
                <p>
                  Nobody has posted a ranked lap here yet. Drive {{ t.name }} in TrackPro with the
                  session set to <strong>Ranked</strong> and the first lap on the sheet is yours.
                </p>
              </div>
            </tb-gate>

            }

            @if (ideal(); as ideal) {
              <section class="after">
                <h2 class="rubric">Sector analysis <small>derived, not driven</small></h2>
                <table class="classification sectors">
                  <caption class="sr-only">Fastest split in each sector and who set it</caption>
                  <thead>
                    <tr><th scope="col">Sector</th><th scope="col" class="num">Best split</th><th scope="col">Held by</th></tr>
                  </thead>
                  <tbody>
                    @for (b of ideal.sectors; track b.index) {
                      <tr>
                        <td>S{{ b.index + 1 }}</td>
                        <td class="num ob"><span class="best-mark">{{ b.ms | lap }}</span></td>
                        <td>{{ b.holder }}</td>
                      </tr>
                    }
                    <tr class="ideal-row">
                      <td>Ideal lap</td>
                      <td class="num time">{{ ideal.total | lap }}</td>
                      <td class="dim">best splits added together; nobody has driven it</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            }

            @if (!auth.signedIn()) {
              <aside class="join after">
                <h2>Get your name on this sheet</h2>
                <ol>
                  <li>Install <a [href]="env.trackProUrl" rel="noopener">TrackPro</a> on an Android phone. Phone GPS works; an ESP32 rig is sharper.</li>
                  <li>Download <strong>{{ t.name }}</strong> from TrackBoard inside the app, so you are timed against the same gates.</li>
                  <li>Drive a session set to <strong>Ranked</strong>. Your best lap lands here when the phone syncs.</li>
                </ol>
                <a class="btn" routerLink="/register">Create a free account</a>
              </aside>
            }

            <p class="sheet-foot after">
              Laps count when the session is ranked and not voided, the lap had no GPS signal gap, and the track is published.
              Times are posted as the TrackPro app uploads them and are not verified.
              <span class="legend"><span class="swatch hl"></span> your line · <span class="ob">OB</span> overall best</span>
            </p>
            </div>
          }
        </tb-gate>
      </article>
    </div>
  `,
  styles: `
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

    .crumbs a:hover {
      text-decoration: underline;
    }

    /* Struck across the empty middle of the letterhead rule, as a timekeeper would. */
    .provisional {
      position: absolute;
      top: clamp(18px, 2.6vw, 34px);
      left: 50%;
      translate: -50% 0;
      z-index: 1;
    }

    .head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      gap: var(--s5) var(--s7);
      align-items: start;
      margin-top: var(--s3);
    }

    .flow > .rubric,
    .flow tb-gate + .rubric {
      margin-top: var(--s5);
    }

    .facts {
      display: grid;
      gap: var(--s4);
      align-content: start;
      padding-top: var(--s6);
    }

    .byline {
      font-size: 0.92rem;
    }

    /* The record is struck onto the sheet: one impression in violet ink, slightly askew. */
    .record {
      position: relative;
      display: grid;
      gap: 6px;
      justify-self: start;
      padding: 12px 18px;
      color: var(--stamp);
      rotate: -1.5deg;
    }

    .record-ink {
      position: absolute;
      inset: 0;
      border: 4px double var(--stamp);
      filter: url(#tb-ink);
      opacity: 0.9;
    }

    .record-time {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-stretch: 72%;
      font-size: clamp(2.2rem, 1.6rem + 1.8vw, 3rem);
      line-height: 1;
    }

    .record-label {
      font-stretch: 125%;
      font-size: 0.66rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      writing-mode: vertical-rl;
      rotate: 180deg;
      line-height: 1;
    }

    .record-by {
      font-family: var(--font-typed);
      font-size: 0.82rem;
    }

    .record-by a {
      font-weight: 700;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2);
    }

    .map {
      min-width: 0;
      margin: 0;
      --map-max-h: 340px;
    }

    .cap-line {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      column-gap: 10px;
    }

    .map figcaption {
      display: grid;
      gap: 4px;
      margin-top: var(--s2);
      font-size: 0.8rem;
      text-align: right;
    }

    .split {
      white-space: nowrap;
      color: var(--ink);
    }

    .split.ob {
      color: var(--stamp);
      font-weight: 700;
    }

    .car-line {
      display: none;
      font-size: 0.82rem;
      font-weight: 400;
    }

    .sectors {
      max-width: 40rem;
    }

    .ideal-row td:last-child {
      white-space: normal;
    }

    .ideal-row td {
      border-top: 2px solid var(--rule-strong);
      font-weight: 700;
    }

    .pick {
      all: unset;
      cursor: pointer;
      display: inline-block;
      min-width: 1.6em;
      text-align: right;
    }

    .pick:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: 3px;
    }

    tr.picked .pick::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 12px;
      margin-right: 6px;
      background: var(--stamp);
      clip-path: polygon(0 0, 100% 50%, 0 100%);
      vertical-align: 0.05em;
    }

    .me-outside {
      margin-top: var(--s3);
      padding: 8px 12px;
      background: var(--hl-bg);
      color: var(--hl-ink);
    }

    .empty {
      display: grid;
      justify-items: start;
      gap: var(--s3);
      padding-block: var(--s4);
      max-width: 62ch;
    }

    .private {
      display: grid;
      justify-items: start;
      gap: var(--s3);
      margin-top: var(--s6);
      max-width: 62ch;
    }

    .join {
      margin-top: var(--s6);
      padding: var(--s4) var(--s5) var(--s5);
      border: 2px dashed var(--rule-strong);
    }

    .join h2 {
      font-weight: 800;
      font-stretch: 112%;
      font-size: 1.25rem;
    }

    .join ol {
      margin: var(--s3) 0 var(--s4);
      padding-left: 1.3em;
      display: grid;
      gap: 6px;
      max-width: 70ch;
    }

    .legend {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: var(--s2);
    }

    .swatch.hl {
      display: inline-block;
      width: 22px;
      height: 10px;
      background: var(--hl-bg);
      outline: 1px solid var(--rule);
    }

    /* Narrow: title and classification first, the map after, then the rest. */
    @media (max-width: 880px) {
      .flow {
        display: flex;
        flex-direction: column;
      }

      .head {
        display: contents;
      }

      .facts {
        padding-top: var(--s4);
      }

      .map {
        order: 1;
        --map-max-h: 320px;
        margin-top: var(--s6);
      }

      .after {
        order: 2;
      }

      .c-wide {
        display: none;
      }

      .car-line {
        display: block;
      }

      .map figcaption {
        text-align: left;
      }

      .cap-line {
        justify-content: flex-start;
      }

      .provisional {
        position: static;
        translate: none;
        margin-top: var(--s4);
      }
    }

    @media (max-width: 560px) {
      /* Struck beside the title, clear of the letterhead and inside the sheet. */
      .provisional {
        position: static;
        align-self: flex-end;
        margin: var(--s3) 0 -52px;
        scale: 0.78;
        transform-origin: top right;
      }

      .facts > .sheet-title {
        max-width: calc(100% - 136px);
      }

      .facts {
        display: contents;
      }

      .facts > .sheet-title {
        margin-top: var(--s2);
      }

      .facts > .meta {
        margin-top: var(--s3);
      }

      .byline,
      .actions {
        order: 2;
        margin-top: var(--s4);
      }

      .record {
        margin-top: var(--s4);
        padding: 8px 12px;
        gap: 2px;
      }

      .record-time {
        font-size: 1.9rem;
        gap: 10px;
      }

      .record-label {
        writing-mode: horizontal-tb;
        rotate: none;
      }

      .classification td,
      .classification th {
        padding-inline: 6px;
      }

      td.drv {
        white-space: normal;
      }

      td.pos {
        width: 2.4rem;
      }
    }
  `,
})
export class TrackPage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly title = inject(Title);
  protected readonly auth = inject(AuthService);
  protected readonly env = environment;
  protected readonly printed = clock(new Date());
  protected readonly copied = signal(false);

  protected readonly track = load({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.track(params.id),
  });

  protected readonly board = load({
    params: () => ({ id: this.id(), signedIn: this.auth.signedIn() }),
    stream: ({ params }) => this.api.leaderboard(params.id, 100),
  });

  protected readonly docRef = computed(() => this.id().slice(0, 4).toUpperCase());

  protected readonly leader = computed(() => this.board.value()?.entries[0] ?? null);

  protected readonly sectorColumns = computed(() => {
    const entries = this.board.value()?.entries ?? [];
    const max = Math.max(-1, ...entries.flatMap((e) => e.sectors.map((s) => s.sectorIndex)));
    return Array.from({ length: max + 1 }, (_, i) => i);
  });

  protected readonly hasSectors = computed(() => this.sectorColumns().length > 0);

  private readonly bestSplit = computed(() => {
    const best = new Map<number, number>();
    for (const e of this.board.value()?.entries ?? []) {
      for (const s of e.sectors) {
        const current = best.get(s.sectorIndex);
        if (current === undefined || s.splitMs < current) best.set(s.sectorIndex, s.splitMs);
      }
    }
    return best;
  });

  protected readonly rows = computed<Row[]>(() => {
    const board = this.board.value();
    if (!board) return [];
    const myId = this.auth.user()?.id;
    const best = this.bestSplit();
    return board.entries.map((entry, i, all) => ({
      entry,
      interval: i === 0 ? null : entry.lapTimeMs - all[i - 1].lapTimeMs,
      me: entry.userId === myId,
      bestSectors: new Set(entry.sectors.filter((s) => best.get(s.sectorIndex) === s.splitMs).map((s) => s.sectorIndex)),
    }));
  });

  protected readonly rowCountLabel = computed(() => plural(this.rows().length, 'driver') + ' classified');

  /** The signed-in driver's standing when it falls below the printed rows. */
  protected readonly outsideMe = computed(() => {
    const me = this.board.value()?.me;
    return me && !this.rows().some((r) => r.me) ? me : null;
  });

  /** Which driver the map describes: your own line by default, else the record holder. */
  protected readonly selected = linkedSignal<Row[], Row | null>({
    source: this.rows,
    computation: (rows, previous) =>
      rows.find((r) => r.entry.userId === previous?.value?.entry.userId) ??
      rows.find((r) => r.me) ??
      rows[0] ??
      null,
  });

  protected readonly marks = computed<SectorMark[] | null>(() => {
    const row = this.selected();
    if (!row || !this.hasSectors()) return null;
    const best = this.bestSplit();
    return row.entry.sectors.map((s) => {
      const fastest = best.get(s.sectorIndex) ?? s.splitMs;
      const isBest = s.splitMs === fastest;
      return {
        index: s.sectorIndex,
        state: isBest ? 'best' : 'slower',
        note: isBest ? lapTime(s.splitMs) : `+${lapTime(s.splitMs - fastest)}`,
      };
    });
  });

  protected readonly ideal = computed(() => {
    const best = this.bestSplit();
    const cols = this.sectorColumns();
    if (cols.length < 2 || cols.some((i) => !best.has(i))) return null;
    const entries = this.board.value()?.entries ?? [];
    return {
      total: cols.reduce((sum, i) => sum + (best.get(i) ?? 0), 0),
      sectors: cols.map((index) => ({
        index,
        ms: best.get(index) ?? 0,
        holder:
          entries.find((e) => e.sectors.some((s) => s.sectorIndex === index && s.splitMs === best.get(index)))
            ?.displayName ?? '—',
      })),
    };
  });

  constructor() {
    effect(() => {
      const t = this.track.value();
      if (t) this.title.setTitle(`${t.name} classification — TrackBoard`);
    });
  }

  protected pick(row: Row): void {
    this.selected.set(row);
  }

  protected splitText(e: LeaderboardEntry, index: number): string {
    const ms = this.split(e, index);
    const best = this.bestSplit().get(index);
    if (ms === null) return '—';
    return best !== undefined && ms > best ? lapTime(ms) + ' (+' + lapTime(ms - best) + ')' : lapTime(ms);
  }

  protected split(e: LeaderboardEntry, index: number): number | null {
    return e.sectors.find((s) => s.sectorIndex === index)?.splitMs ?? null;
  }

  protected code(e: LeaderboardEntry): string {
    return gpsCode(e.gpsSource);
  }

  protected rig(e: LeaderboardEntry): string {
    return gpsLabel(e.gpsSource);
  }

  protected async share(name: string): Promise<void> {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} — TrackBoard`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    } catch {
      // Share sheet dismissed or clipboard refused: nothing to report.
    }
  }
}

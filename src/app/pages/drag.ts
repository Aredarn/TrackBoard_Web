import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { load } from '../core/load';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService } from '../core/api.service';
import { DragClass, DragEntry, DragMetric } from '../core/api.types';
import { AuthService } from '../core/auth.service';
import { DRAG_CLASSES, DRAG_METRICS, clock, dragClassBand, dragMetricLabel, gpsCode, gpsLabel, plural } from '../core/format';
import { Gate } from '../ui/gate';
import { TIMING_PIPES } from '../ui/pipes';
import { Stamp } from '../ui/stamp';

interface Row {
  entry: DragEntry;
  interval: number | null;
  me: boolean;
}

@Component({
  selector: 'tb-drag-page',
  imports: [RouterLink, DecimalPipe, Gate, Stamp, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet pinned">
        <div class="letterhead">
          <span>Doc DR-{{ docRef() }} · Printed {{ printed }}</span>
        </div>

        <div class="provisional">
          <tb-stamp text="Provisional" sub="times self-reported" [tilt]="-7" />
        </div>

        <h1 class="sheet-title title">Drag boards</h1>
        <p class="lede dim">
          The quickest standing starts and pulls TrackPro drivers have posted, one line per driver. Timed from GPS on any
          stretch of road or strip, so read the rig column with the time.
        </p>

        <div class="filters" role="group" aria-label="Pick a board">
          <fieldset class="ticks">
            <legend class="sr-only">Measurement</legend>
            @for (m of metrics; track m) {
              <label class="tick">
                <input type="radio" name="metric" [checked]="selectedMetric() === m" (change)="go({ metric: m })" />
                <span>{{ label(m) }}</span>
              </label>
            }
          </fieldset>

          <fieldset class="ticks">
            <legend class="sr-only">Power-to-weight class</legend>
            <label class="tick">
              <input type="radio" name="class" [checked]="selectedClass() === null" (change)="go({ class: null })" />
              <span>All</span>
            </label>
            @for (c of classes; track c) {
              <label class="tick" [attr.title]="band(c)">
                <input type="radio" name="class" [checked]="selectedClass() === c" (change)="go({ class: c })" />
                <span>{{ c }}<span class="sr-only">, {{ band(c) }}</span></span>
              </label>
            }
          </fieldset>
        </div>

        @if (leader(); as l) {
          <div class="record" role="group" [attr.aria-label]="label(selectedMetric()) + ' record'">
            <span class="record-ink" aria-hidden="true"></span>
            <span class="record-time"><span class="record-label">Record</span>{{ l.timeMs | lap }}</span>
            <span class="record-by">
              <a [routerLink]="['/drivers', l.userId]">{{ l.displayName }}</a> · {{ l.vehicle | car }} · {{ l.setAt | day }}
            </span>
          </div>
        }

        <h2 class="rubric">
          {{ label(selectedMetric()) }}
          <small>{{ countLabel() }}{{ selectedClass() ? ' · class ' + selectedClass() + ', ' + band(selectedClass()!) : '' }}</small>
        </h2>

        <tb-gate [status]="board.status()" [error]="board.error()" [empty]="rows().length === 0" (retry)="board.reload()">
          <div class="table-wrap">
            <table class="classification">
              <caption class="sr-only">Best {{ label(selectedMetric()) }} per driver, fastest first</caption>
              <thead>
                <tr>
                  <th scope="col" class="num">Pos</th>
                  <th scope="col">Driver</th>
                  <th scope="col" class="c-wide">Car</th>
                  <th scope="col" class="c-wide">Class</th>
                  <th scope="col" class="num">Time</th>
                  @if (showsTrap()) {
                    <th scope="col" class="num">Trap</th>
                  }
                  <th scope="col" class="num">Gap</th>
                  <th scope="col" class="num c-wide">Int.</th>
                  <th scope="col" class="c-wide">Rig</th>
                  <th scope="col" class="c-wide">Set on</th>
                </tr>
              </thead>
              <tbody>
                @for (r of rows(); track r.entry.userId) {
                  <tr [class.me]="r.me">
                    <td class="pos num">{{ r.entry.rank }}</td>
                    <td class="drv">
                      <a [routerLink]="['/drivers', r.entry.userId]">{{ r.entry.displayName }}</a>
                      @if (r.me) {
                        <span class="tag">You</span>
                      }
                      <span class="car-line dim">{{ r.entry.vehicle | car }} · {{ r.entry.carClass ?? '—' }} · {{ code(r.entry) }}</span>
                    </td>
                    <td class="dim c-wide">{{ r.entry.vehicle | car }}</td>
                    <td class="typed c-wide" [attr.title]="r.entry.carClass ? band(r.entry.carClass) : 'No power or weight on file'">
                      {{ r.entry.carClass ?? '—' }}
                    </td>
                    <td class="time num" [class.ob]="r.entry.rank === 1">
                      {{ r.entry.timeMs | lap }}
                      @if (r.entry.rank === 1) {
                        <span class="tag">OB</span>
                      }
                    </td>
                    @if (showsTrap()) {
                      <td class="num">
                        @if (r.entry.trapSpeedKmh !== null) {
                          {{ r.entry.trapSpeedKmh | number: '1.1-1' }}
                        } @else {
                          <span class="dim">—</span>
                        }
                      </td>
                    }
                    <td class="num">{{ r.entry.gapToLeaderMs | gap: '—' }}</td>
                    <td class="num dim c-wide">{{ r.interval | gap: '—' }}</td>
                    <td class="typed c-wide" [attr.title]="rig(r.entry)">{{ code(r.entry) }}</td>
                    <td class="dim c-wide">{{ r.entry.setAt | day }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (outsideMe(); as m) {
            <p class="me-outside">
              You are <strong>P{{ m.rank }}</strong> with {{ m.timeMs | lap }}, {{ m.gapToLeaderMs | gap }} behind the record.
            </p>
          }

          <div empty class="empty">
            <tb-stamp text="No times posted" tone="muted" [tilt]="-3" />
            @if (selectedClass()) {
              <p>
                Nobody has posted a {{ label(selectedMetric()) }} in class {{ selectedClass() }} yet.
                <button type="button" class="linkish" (click)="go({ class: null })">Show every class</button>
              </p>
            } @else {
              <p>Nobody has posted a {{ label(selectedMetric()) }} yet. Open a drag run in TrackPro and post it; the first time on the sheet is yours.</p>
            }
          </div>
        </tb-gate>

        @if (!auth.signedIn()) {
          <aside class="join">
            <h2>Get your name on this sheet</h2>
            <ol>
              <li>Install <a [href]="env.trackProUrl" rel="noopener">TrackPro</a> on an Android phone. Phone GPS works; an ESP32 rig is sharper.</li>
              <li>Add your car to the garage, with its power and weight, and record a drag run from a standstill.</li>
              <li>Open the run and tap <strong>Post</strong>. Its best clean times land here when the phone syncs.</li>
            </ol>
            <a class="btn" routerLink="/register">Create a free account</a>
          </aside>
        }

        <p class="sheet-foot">
          Each driver's best in a ranked run with a car on it. TrackPro leaves out runs with a GPS dropout or a clear drop in
          elevation, but times are posted as the app uploads them and are not verified. Classes go by horsepower per tonne from
          the garage: D under 100, C under 150, B under 250, A under 400, S above.
          <span class="legend"><span class="swatch hl"></span> your line · <span class="ob">OB</span> overall best</span>
        </p>
      </article>
    </div>
  `,
  styles: `
    /* Struck across the empty middle of the letterhead rule, as on a track's sheet. */
    .provisional {
      position: absolute;
      top: clamp(18px, 2.6vw, 34px);
      left: 50%;
      translate: -50% 0;
      z-index: 1;
    }

    .title {
      margin-top: var(--s4);
    }

    .lede {
      margin-top: var(--s2);
      max-width: 64ch;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--s3) var(--s4);
      margin: var(--s5) 0 var(--s4);
    }

    .ticks {
      display: flex;
      margin: 0;
      padding: 0;
      border: 2px solid var(--rule-strong);
    }

    .tick {
      position: relative;
      display: inline-flex;
      flex: 1 1 auto;
    }

    .tick + .tick {
      border-left: 2px solid var(--rule-strong);
    }

    .tick input {
      position: absolute;
      opacity: 0;
      inset: 0;
      cursor: pointer;
    }

    .tick > span {
      display: inline-flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      padding: 0 14px;
      font-weight: 700;
      font-stretch: 112%;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .tick input:checked + span {
      background: var(--ink);
      color: var(--paper);
    }

    .tick input:focus-visible + span {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }

    /* The record is struck onto the sheet: one impression in violet ink, slightly askew. */
    .record {
      position: relative;
      display: inline-grid;
      gap: 6px;
      margin-bottom: var(--s4);
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

    .car-line {
      display: none;
      font-size: 0.82rem;
      font-weight: 400;
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

    @media (max-width: 880px) {
      .c-wide {
        display: none;
      }

      .car-line {
        display: block;
      }

      .provisional {
        position: static;
        translate: none;
        margin-top: var(--s4);
      }
    }

    @media (max-width: 560px) {
      .filters {
        display: grid;
      }

      .tick > span {
        padding: 0 8px;
        font-size: 0.72rem;
        letter-spacing: 0.04em;
      }

      .record {
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
    }
  `,
})
export class DragPage {
  /** From the address, so a board can be linked to exactly as it is shown. */
  readonly metric = input<string>();
  readonly carClass = input<string | undefined>(undefined, { alias: 'class' });

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly env = environment;
  protected readonly printed = clock(new Date());
  protected readonly metrics = DRAG_METRICS;
  protected readonly classes = DRAG_CLASSES;
  protected readonly label = dragMetricLabel;
  protected readonly band = dragClassBand;

  protected readonly selectedMetric = computed<DragMetric>(() => {
    const wanted = this.metric();
    return DRAG_METRICS.find((m) => m === wanted) ?? 'ZeroToHundred';
  });

  protected readonly selectedClass = computed<DragClass | null>(() => {
    const wanted = this.carClass();
    return DRAG_CLASSES.find((c) => c === wanted) ?? null;
  });

  protected readonly board = load({
    params: () => ({ metric: this.selectedMetric(), carClass: this.selectedClass(), signedIn: this.auth.signedIn() }),
    stream: ({ params }) => this.api.dragBoard(params.metric, params.carClass, 100),
  });

  protected readonly docRef = computed(() => this.selectedMetric().slice(0, 4).toUpperCase());

  protected readonly leader = computed(() => this.board.value()?.entries[0] ?? null);

  protected readonly showsTrap = computed(() => this.selectedMetric() === 'QuarterMile');

  protected readonly rows = computed<Row[]>(() => {
    const myId = this.auth.user()?.id;
    return (this.board.value()?.entries ?? []).map((entry, i, all) => ({
      entry,
      interval: i === 0 ? null : entry.timeMs - all[i - 1].timeMs,
      me: entry.userId === myId,
    }));
  });

  protected readonly countLabel = computed(() => plural(this.rows().length, 'driver') + ' classified');

  /** The signed-in driver's standing when it falls below the printed rows. */
  protected readonly outsideMe = computed(() => {
    const me = this.board.value()?.me;
    return me && !this.rows().some((r) => r.me) ? me : null;
  });

  protected go(queryParams: { metric?: DragMetric; class?: DragClass | null }): void {
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected code(e: DragEntry): string {
    return gpsCode(e.gpsSource);
  }

  protected rig(e: DragEntry): string {
    return gpsLabel(e.gpsSource);
  }
}

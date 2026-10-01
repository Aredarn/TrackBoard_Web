import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { load } from '../../core/load';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Lap, Session } from '../../core/api.types';
import { weatherLabel } from '../../core/format';
import { Gate } from '../../ui/gate';
import { Icon } from '../../ui/icon';
import { TIMING_PIPES } from '../../ui/pipes';
import { Stamp } from '../../ui/stamp';

@Component({
  selector: 'tb-session-page',
  imports: [RouterLink, DecimalPipe, Gate, Stamp, Icon, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="crumbs"><a routerLink="/laps/sessions"><tb-icon name="arrowLeft" [size]="16" /> Sessions</a></p>

    <tb-gate [status]="session.status()" [error]="session.error()" (retry)="session.reload()">
      @if (session.value(); as s) {
        <header class="head">
          <div class="title">
            <h1 class="sheet-title">{{ s.name }}</h1>
            <p class="dim">{{ s.startedAt | day: true }}@if (duration(s); as d) { · {{ d }}}</p>
          </div>
          @if (s.voided) {
            <tb-stamp text="Void" sub="does not count" tone="fault" [tilt]="-8" />
          } @else if (s.visibility === 'Ranked') {
            <tb-stamp text="Ranked" sub="posts to the board" [tilt]="-5" />
          } @else {
            <tb-stamp text="Private" sub="not posted" tone="muted" [tilt]="-5" />
          }
        </header>

        <dl class="meta facts">
          <div>
            <dt>Track</dt>
            <dd>
              @if (s.trackId) {
                <a [routerLink]="['/tracks', s.trackId]">{{ s.trackName }}</a>
              } @else {
                None
              }
            </dd>
          </div>
          <div><dt>GPS rig</dt><dd>{{ s.gpsSource | gps }}</dd></div>
          <div><dt>Laps</dt><dd>{{ s.lapCount }}</dd></div>
          <div><dt>Best lap</dt><dd>{{ s.bestLapMs | lap }}</dd></div>
          @if (s.weather; as w) {
            @if (weatherText(w.weatherCode); as sky) {
              <div><dt>Sky</dt><dd>{{ sky }}</dd></div>
            }
            @if (w.tempC !== null) {
              <div><dt>Air</dt><dd>{{ w.tempC | number: '1.0-1' }} °C</dd></div>
            }
            @if (w.windKph !== null) {
              <div><dt>Wind</dt><dd>{{ w.windKph | number: '1.0-0' }} km/h</dd></div>
            }
            @if (w.humidityPct !== null) {
              <div><dt>Humidity</dt><dd>{{ w.humidityPct }}%</dd></div>
            }
          }
          @if (s.appVersion) {
            <div><dt>App</dt><dd class="typed">{{ s.appVersion }}</dd></div>
          }
        </dl>

        <h2 class="rubric">Lap chart <small>bars show time lost to the session best</small></h2>
        @if (s.laps.length) {
          <div class="table-wrap">
            <table class="classification">
              <caption class="sr-only">Every lap of this session</caption>
              <thead>
                <tr>
                  <th scope="col" class="num">Lap</th>
                  <th scope="col" class="num">Time</th>
                  <th scope="col" class="num">To best</th>
                  <th scope="col" class="bar-col c-wide"><span class="sr-only">Time lost, drawn</span></th>
                  @for (i of sectorColumns(); track i) {
                    <th scope="col" class="num c-wide">S{{ i + 1 }}</th>
                  }
                  <th scope="col">Board</th>
                </tr>
              </thead>
              <tbody>
                @for (lap of s.laps; track lap.lapNumber) {
                  <tr [class.gap]="lap.signalGap">
                    <td class="num">{{ lap.lapNumber }}</td>
                    <td class="time num" [class.pb]="lap.leaderboardRank !== null">
                      {{ lap.timeMs | lap }}
                      @if (lap.leaderboardRank !== null) {
                        <span class="tag">PB</span>
                      } @else if (lap.timeMs === best()) {
                        <span class="tag">SB</span>
                      }
                    </td>
                    <td class="num dim">{{ lap.timeMs - (best() ?? lap.timeMs) | gap: '—' }}</td>
                    <td class="bar-col c-wide" aria-hidden="true">
                      <span class="bar" [style.width.%]="barWidth(lap)"></span>
                    </td>
                    @for (i of sectorColumns(); track i) {
                      <td class="num c-wide" [class.sb]="isBestSector(lap, i)">
                        @if (split(lap, i); as ms) {
                          <span [class.best-mark]="isBestSector(lap, i)">{{ ms | lap }}</span>
                        } @else {
                          <span class="dim">—</span>
                        }
                      </td>
                    }
                    <td>
                      @if (lap.countsForLeaderboard) {
                        @if (lap.leaderboardRank) {
                          <span class="counts"><strong>P{{ lap.leaderboardRank }}</strong> on the board</span>
                        } @else {
                          <span class="counts">Counts</span>
                        }
                      } @else {
                        <span class="dim">{{ reason(s, lap) }}</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="dim">This session was uploaded without laps.</p>
        }

        <p class="sheet-foot">
          SB = session best. PB = your best ranked lap on this track, the one on the board. Laps reach the public board when the session is ranked and not voided, the lap had no GPS
          signal gap, and the track is published. Changes to a session are made in TrackPro and sync from the phone.
        </p>
      }
    </tb-gate>
  `,
  styles: `
    .crumbs {
      margin-top: var(--s4);
      font-size: 0.9rem;
    }

    .crumbs a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: var(--s4);
      margin-top: var(--s3);
    }

    .title {
      display: grid;
      gap: 6px;
    }

    .facts {
      margin-top: var(--s5);
      padding: var(--s3) 0;
      border-block: 1px solid var(--rule);
    }

    .bar-col {
      width: 22%;
      min-width: 90px;
    }

    .bar {
      display: block;
      height: 8px;
      min-width: 2px;
      background: repeating-linear-gradient(90deg, var(--ink-2) 0 5px, transparent 5px 7px);
    }

    tr.gap td {
      color: var(--ink-3);
    }

    .counts {
      font-family: var(--font-typed);
      font-size: 0.9rem;
    }

    td.sb {
      font-weight: 700;
    }
  `,
})
export class SessionPage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);

  protected readonly session = load({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.session(params.id),
  });

  /** Fastest clean lap: a lap with a GPS gap is not a fair time. */
  protected readonly best = computed(() => {
    const laps = (this.session.value()?.laps ?? []).filter((l) => !l.signalGap);
    return laps.length ? Math.min(...laps.map((l) => l.timeMs)) : null;
  });

  private readonly worstLoss = computed(() => {
    const best = this.best();
    const laps = (this.session.value()?.laps ?? []).filter((l) => !l.signalGap);
    return best === null ? 0 : Math.max(0, ...laps.map((l) => l.timeMs - best));
  });

  protected readonly sectorColumns = computed(() => {
    const laps = this.session.value()?.laps ?? [];
    const max = Math.max(-1, ...laps.flatMap((l) => l.sectors.map((s) => s.sectorIndex)));
    return Array.from({ length: max + 1 }, (_, i) => i);
  });

  private readonly bestSplit = computed(() => {
    const best = new Map<number, number>();
    for (const l of this.session.value()?.laps ?? []) {
      if (l.signalGap) continue;
      for (const s of l.sectors) {
        const cur = best.get(s.sectorIndex);
        if (cur === undefined || s.splitMs < cur) best.set(s.sectorIndex, s.splitMs);
      }
    }
    return best;
  });

  protected split(lap: Lap, i: number): number | null {
    return lap.sectors.find((s) => s.sectorIndex === i)?.splitMs ?? null;
  }

  protected isBestSector(lap: Lap, i: number): boolean {
    const ms = this.split(lap, i);
    return !lap.signalGap && ms !== null && this.bestSplit().get(i) === ms;
  }

  protected barWidth(lap: Lap): number {
    const best = this.best();
    const worst = this.worstLoss();
    if (best === null || lap.signalGap || worst === 0) return 0;
    return Math.max(1, ((lap.timeMs - best) / worst) * 100);
  }

  protected reason(s: Session, lap: Lap): string {
    if (s.voided) return 'Session void';
    if (s.visibility !== 'Ranked') return 'Private session';
    if (lap.signalGap) return 'GPS signal gap';
    if (!s.trackId) return 'No track';
    return 'Track not published';
  }

  protected duration(s: Session): string | null {
    if (!s.endedAt) return null;
    const mins = Math.round((Date.parse(s.endedAt) - Date.parse(s.startedAt)) / 60_000);
    return mins > 0 ? `${mins} min` : null;
  }

  protected weatherText = weatherLabel;
}

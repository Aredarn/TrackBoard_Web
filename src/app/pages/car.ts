import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { DragClass, DragMetric } from '../core/api.types';
import { AuthService } from '../core/auth.service';
import { dragClassBand, dragMetricLabel, gpsCode, gpsLabel, plural } from '../core/format';
import { load } from '../core/load';
import { Gate } from '../ui/gate';
import { PhotoFrame } from '../ui/photo-frame';
import { TIMING_PIPES } from '../ui/pipes';
import { Stamp } from '../ui/stamp';

/**
 * A car's public page, opened from a track or drag board: its garage entry, who drives it, and
 * where it stands on every public board. Cars kept to private sessions have no page.
 */
@Component({
  selector: 'tb-car-page',
  imports: [RouterLink, DecimalPipe, Gate, PhotoFrame, Stamp, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet pinned">
        <div class="letterhead">
          <span>Ref CAR-{{ id().slice(0, 4).toUpperCase() }}</span>
        </div>

        <tb-gate
          [status]="car.status()"
          [error]="car.error()"
          notFoundMessage="This car isn't on any public board. A car driven only in private sessions has no page."
          (retry)="car.reload()"
        >
          @if (car.value(); as c) {
            <header class="logbook">
              <tb-photo [url]="c.photoUrl" [name]="c.manufacturer + ' ' + c.model" [size]="160" [alt]="'Photo of the ' + c.manufacturer + ' ' + c.model" />
              <div class="who">
                <h1 class="sheet-title">{{ c.manufacturer }} {{ c.model }}</h1>
                <dl class="meta">
                  <div><dt>Driven by</dt><dd><a [routerLink]="['/drivers', c.ownerId]">{{ c.ownerDisplayName }}</a></dd></div>
                  <div><dt>Year</dt><dd>{{ c.year }}</dd></div>
                  <div>
                    <dt>Drag class</dt>
                    <dd [attr.title]="c.carClass ? band(c.carClass) : 'No power or weight on file'">{{ c.carClass ?? '—' }}</dd>
                  </div>
                  <div><dt>Boards</dt><dd>{{ c.trackBests.length + c.dragBests.length }}</dd></div>
                </dl>
                @if (isMine()) {
                  <p class="own typed">This is your car. Edit its specs and photo in TrackPro.</p>
                }
              </div>
              @if (wins() > 0) {
                <tb-stamp class="wins" [text]="wins() === 1 ? 'Record holder' : wins() + '× record holder'" [tilt]="-6" />
              }
            </header>

            <h2 class="rubric">Specification <small>as entered by the driver</small></h2>
            <dl class="spec">
              <div><dt>Engine</dt><dd>{{ c.engineType }}</dd></div>
              <div><dt>Power</dt><dd>{{ c.horsepower }} hp</dd></div>
              @if (c.torque) {
                <div><dt>Torque</dt><dd>{{ c.torque }} Nm</dd></div>
              }
              <div><dt>Weight</dt><dd>{{ c.weight | number: '1.0-0' }} kg</dd></div>
              @if (powerToWeight(); as p) {
                <div><dt>Power to weight</dt><dd>{{ p | number: '1.0-0' }} hp/t</dd></div>
              }
              <div><dt>Drivetrain</dt><dd>{{ c.drivetrain }}</dd></div>
              <div><dt>Gearbox</dt><dd>{{ c.transmission }}</dd></div>
              <div><dt>Tyres</dt><dd>{{ c.tireType }}</dd></div>
              <div><dt>Fuel</dt><dd>{{ c.fuelType }}</dd></div>
              @if (c.acceleration) {
                <div><dt>0–100 km/h</dt><dd>{{ c.acceleration | number: '1.1-1' }} s</dd></div>
              }
              @if (c.topSpeed) {
                <div><dt>Top speed</dt><dd>{{ c.topSpeed | number: '1.0-0' }} km/h</dd></div>
              }
              @if (c.suspensionType) {
                <div><dt>Suspension</dt><dd>{{ c.suspensionType }}</dd></div>
              }
            </dl>

            @if (c.trackBests.length) {
              <h2 class="rubric">Track boards <small>{{ trackLabel() }}</small></h2>
              <div class="table-wrap">
                <table class="classification">
                  <caption class="sr-only">The {{ c.manufacturer }} {{ c.model }}'s position on each published track</caption>
                  <thead>
                    <tr>
                      <th scope="col">Track</th>
                      <th scope="col" class="num">Pos</th>
                      <th scope="col" class="num c-wide"><abbr title="Highest GPS speed on that lap">Top speed</abbr></th>
                      <th scope="col" class="num">Best lap</th>
                      <th scope="col" class="num">Gap</th>
                      <th scope="col" class="c-wide">Rig</th>
                      <th scope="col" class="c-wide">Set on</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (t of c.trackBests; track t.trackId) {
                      <tr>
                        <td class="wrap">
                          <a [routerLink]="['/tracks', t.trackId]">{{ t.trackName }}</a>
                          <span class="dim"> · {{ t.country }}</span>
                          <span class="sub-line typed">
                            {{ code(t.gpsSource) }} · {{ t.setAt | day }}@if (t.topSpeedKmh != null) { · {{ t.topSpeedKmh | number: '1.0-0' }} km/h}
                          </span>
                        </td>
                        <td class="pos num">{{ t.rank }}<span class="of dim">/{{ t.fieldSize }}</span></td>
                        <td class="num c-wide">
                          @if (t.topSpeedKmh != null) {
                            {{ t.topSpeedKmh | number: '1.0-0' }} <span class="dim unit">km/h</span>
                          } @else {
                            <span class="dim">—</span>
                          }
                        </td>
                        <td class="time num" [class.ob]="t.rank === 1">
                          {{ t.lapTimeMs | lap }}
                          @if (t.rank === 1) {
                            <span class="tag">OB</span>
                          }
                        </td>
                        <td class="num">{{ t.gapToLeaderMs | gap: '—' }}</td>
                        <td class="typed c-wide" [attr.title]="rig(t.gpsSource)">{{ code(t.gpsSource) }}</td>
                        <td class="dim c-wide">{{ t.setAt | day }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            @if (c.dragBests.length) {
              <h2 class="rubric">Drag boards <small>overall, every class</small></h2>
              <div class="table-wrap">
                <table class="classification">
                  <caption class="sr-only">The {{ c.manufacturer }} {{ c.model }}'s position on each drag board</caption>
                  <thead>
                    <tr>
                      <th scope="col">Run</th>
                      <th scope="col" class="num">Pos</th>
                      <th scope="col" class="num">Time</th>
                      <th scope="col" class="num">Gap</th>
                      <th scope="col" class="num c-wide">Trap</th>
                      <th scope="col" class="c-wide">Rig</th>
                      <th scope="col" class="c-wide">Set on</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (d of c.dragBests; track d.metric) {
                      <tr>
                        <td class="wrap">
                          <a routerLink="/drag" [queryParams]="{ metric: d.metric }">{{ metric(d.metric) }}</a>
                          <span class="sub-line typed">{{ code(d.gpsSource) }} · {{ d.setAt | day }}</span>
                        </td>
                        <td class="pos num">{{ d.rank }}<span class="of dim">/{{ d.fieldSize }}</span></td>
                        <td class="time num" [class.ob]="d.rank === 1">
                          {{ d.timeMs | lap }}
                          @if (d.rank === 1) {
                            <span class="tag">OB</span>
                          }
                        </td>
                        <td class="num">{{ d.gapToLeaderMs | gap: '—' }}</td>
                        <td class="num c-wide">
                          @if (d.trapSpeedKmh != null) {
                            {{ d.trapSpeedKmh | number: '1.1-1' }} <span class="dim unit">km/h</span>
                          } @else {
                            <span class="dim">—</span>
                          }
                        </td>
                        <td class="typed c-wide" [attr.title]="rig(d.gpsSource)">{{ code(d.gpsSource) }}</td>
                        <td class="dim c-wide">{{ d.setAt | day }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <p class="sheet-foot">
              Only ranked laps on published tracks and ranked drag runs appear here. Specs are as the driver entered
              them in TrackPro and are not checked.
            </p>
          }
        </tb-gate>
      </article>
    </div>
  `,
  styles: `
    .logbook {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: var(--s5);
      align-items: flex-start;
      margin-top: var(--s5);
    }

    .who {
      display: grid;
      gap: var(--s3);
      flex: 1 1 320px;
    }

    .own {
      padding: 6px 10px;
      background: var(--hl-bg);
      color: var(--hl-ink);
      justify-self: start;
    }

    .wins {
      position: absolute;
      right: 0;
      top: 0;
    }

    .spec {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 10px 18px;
      margin: var(--s3) 0 0;
    }

    .spec div {
      display: flex;
      flex-direction: column-reverse;
    }

    .spec dt {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-3);
    }

    .spec dd {
      margin: 0;
      font-weight: 700;
      font-stretch: 90%;
    }

    .of {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .unit {
      font-size: 0.78em;
    }

    @media (max-width: 720px) {
      .wins {
        position: static;
      }
    }
  `,
})
export class CarPage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);

  protected readonly car = load({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.car(params.id),
  });

  protected readonly isMine = computed(() => {
    const c = this.car.value();
    return !!c && this.auth.user()?.id === c.ownerId;
  });

  protected readonly wins = computed(() => {
    const c = this.car.value();
    return c ? [...c.trackBests, ...c.dragBests].filter((b) => b.rank === 1).length : 0;
  });

  protected readonly powerToWeight = computed(() => {
    const c = this.car.value();
    return c && c.horsepower > 0 && c.weight > 0 ? c.horsepower / (c.weight / 1000) : null;
  });

  protected readonly trackLabel = computed(() => plural(this.car.value()?.trackBests.length ?? 0, 'published track'));

  constructor() {
    effect(() => {
      const c = this.car.value();
      if (c) this.title.setTitle(`${c.manufacturer} ${c.model} — TrackBoard`);
    });
  }

  protected code = gpsCode;
  protected rig = gpsLabel;
  protected metric = (m: DragMetric) => dragMetricLabel(m);
  protected band = (c: DragClass) => dragClassBand(c);
}

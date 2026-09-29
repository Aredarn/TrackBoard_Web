import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { load } from '../core/load';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { gpsCode, gpsLabel, plural } from '../core/format';
import { Gate } from '../ui/gate';
import { PhotoFrame } from '../ui/photo-frame';
import { TIMING_PIPES } from '../ui/pipes';
import { Stamp } from '../ui/stamp';

@Component({
  selector: 'tb-driver-page',
  imports: [RouterLink, Gate, PhotoFrame, Stamp, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet pinned">
        <div class="letterhead">
          <span>Ref DR-{{ id().slice(0, 4).toUpperCase() }}</span>
        </div>

        <tb-gate [status]="driver.status()" [error]="driver.error()" (retry)="driver.reload()">
          @if (driver.value(); as d) {
            <header class="licence">
              <tb-photo [url]="d.avatarUrl" [name]="d.displayName" [size]="132" [alt]="'Photo of ' + d.displayName" />
              <div class="who">
                <h1 class="sheet-title">{{ d.displayName }}</h1>
                <dl class="meta">
                  @if (d.country) {
                    <div><dt>Country</dt><dd>{{ d.country }}</dd></div>
                  }
                  <div><dt>On TrackBoard since</dt><dd>{{ d.memberSince | day }}</dd></div>
                  <div><dt>Boards</dt><dd>{{ d.standings.length }}</dd></div>
                  <div><dt>Wins</dt><dd>{{ wins() }}</dd></div>
                </dl>
                @if (d.bio) {
                  <p class="bio">{{ d.bio }}</p>
                }
                @if (isMe()) {
                  <p class="own typed">This is your public page. <a routerLink="/me/account">Edit what it shows</a>.</p>
                }
              </div>
              @if (wins() > 0) {
                <tb-stamp class="wins" [text]="wins() === 1 ? 'Record holder' : wins() + '× record holder'" [tilt]="-6" />
              }
            </header>

            <h2 class="rubric">Standings <small>{{ standingsLabel() }}</small></h2>
            @if (d.standings.length) {
              <div class="table-wrap">
                <table class="classification">
                  <caption class="sr-only">{{ d.displayName }}'s position on each published track</caption>
                  <thead>
                    <tr>
                      <th scope="col">Track</th>
                      <th scope="col" class="num">Pos</th>
                      <th scope="col" class="num">Best lap</th>
                      <th scope="col" class="num">Gap</th>
                      <th scope="col">Car</th>
                      <th scope="col">Rig</th>
                      <th scope="col">Set on</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (s of d.standings; track s.trackId) {
                      <tr>
                        <td>
                          <a [routerLink]="['/tracks', s.trackId]">{{ s.trackName }}</a>
                          <span class="dim"> · {{ s.country }}</span>
                        </td>
                        <td class="pos num">{{ s.rank }}<span class="of dim">/{{ s.fieldSize }}</span></td>
                        <td class="time num" [class.ob]="s.rank === 1">
                          {{ s.lapTimeMs | lap }}
                          @if (s.rank === 1) {
                            <span class="tag">OB</span>
                          }
                        </td>
                        <td class="num">{{ s.gapToLeaderMs | gap: '—' }}</td>
                        <td class="dim">{{ s.vehicle | car }}</td>
                        <td class="typed" [attr.title]="rig(s.gpsSource)">{{ code(s.gpsSource) }}</td>
                        <td class="dim">{{ s.setAt | day }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="dim empty">No ranked laps on a published track yet.</p>
            }

            <p class="sheet-foot">
              Only ranked laps on published tracks appear here. Private sessions, private tracks and contact
              details are never shown.
            </p>
          }
        </tb-gate>
      </article>
    </div>
  `,
  styles: `
    .licence {
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

    .bio {
      max-width: 62ch;
      white-space: pre-line;
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

    .of {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .empty {
      padding-block: var(--s3);
    }

    @media (max-width: 720px) {
      .wins {
        position: static;
      }
    }
  `,
})
export class DriverPage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly title = inject(Title);

  protected readonly driver = load({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.driver(params.id),
  });

  protected readonly wins = computed(() => this.driver.value()?.standings.filter((s) => s.rank === 1).length ?? 0);
  protected readonly isMe = computed(() => this.auth.user()?.id === this.id());
  protected readonly standingsLabel = computed(() =>
    plural(this.driver.value()?.standings.length ?? 0, 'published track'),
  );

  constructor() {
    effect(() => {
      const d = this.driver.value();
      if (d) this.title.setTitle(`${d.displayName} — TrackBoard`);
    });
  }

  protected code = gpsCode;
  protected rig = gpsLabel;
}

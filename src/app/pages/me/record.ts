import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { load } from '../../core/load';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Gate } from '../../ui/gate';
import { PhotoFrame } from '../../ui/photo-frame';
import { TIMING_PIPES } from '../../ui/pipes';

@Component({
  selector: 'tb-record-page',
  imports: [RouterLink, DecimalPipe, Gate, PhotoFrame, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tb-gate [status]="data.status()" [error]="data.error()" (retry)="data.reload()">
      @if (data.value(); as d) {
        <header class="who">
          <tb-photo [url]="d.profile.avatarUrl" [name]="d.profile.displayName" [size]="112" [alt]="'Your photo'" />
          <div>
            <h1 class="sheet-title">{{ d.profile.displayName }}</h1>
            <p class="dim">
              {{ d.profile.country || 'Country not set' }} · on TrackBoard since {{ d.profile.memberSince | day }}
            </p>
            <p class="links">
              <a [routerLink]="['/drivers', d.profile.id]">View my public page</a>
              <a routerLink="/me/account">Edit profile</a>
            </p>
          </div>
        </header>

        <h2 class="rubric">Career <small>voided sessions and GPS-gap laps not counted</small></h2>
        <p class="summary">
          <strong>{{ d.stats.sessionCount | number }}</strong> sessions ·
          <strong>{{ d.stats.lapCount | number }}</strong> laps ·
          <strong>{{ d.stats.trackCount | number }}</strong> tracks ·
          <strong>{{ d.stats.vehicleCount | number }}</strong> cars ·
          <strong>{{ d.stats.distanceKm === null ? '—' : (d.stats.distanceKm | number: '1.0-1') + ' km' }}</strong> driven
          <span class="dim"> · {{ d.stats.firstSessionAt | day }} to {{ d.stats.lastSessionAt | day }}</span>
        </p>
        @if (d.stats.mainVehicle; as car) {
          <p class="main-car">
            Main car: <strong>{{ car.year }} {{ car.manufacturer }} {{ car.model }}</strong>
            <span class="dim"> (most sessions)</span>
          </p>
        }

        <h2 class="rubric">Personal bests <small>one per track, public position alongside</small></h2>
        @if (d.stats.personalBests.length) {
          <div class="table-wrap">
            <table class="classification">
              <caption class="sr-only">Your fastest lap on each track and your place on its public board</caption>
              <thead>
                <tr>
                  <th scope="col">Track</th>
                  <th scope="col" class="num">Personal best</th>
                  <th scope="col" class="num">Board pos</th>
                  <th scope="col" class="num">Ranked lap</th>
                  <th scope="col">Car</th>
                  <th scope="col" class="num">Laps</th>
                  <th scope="col">Set on</th>
                </tr>
              </thead>
              <tbody>
                @for (pb of d.stats.personalBests; track pb.trackId) {
                  <tr>
                    <td><a [routerLink]="['/tracks', pb.trackId]">{{ pb.trackName }}</a><span class="dim"> · {{ pb.country }}</span></td>
                    <td class="time num pb">{{ pb.bestLapMs | lap }}<span class="tag">PB</span></td>
                    <td class="pos num">
                      @if (pb.rank !== null) {
                        {{ pb.rank }}<span class="of dim">/{{ pb.fieldSize }}</span>
                      } @else {
                        <span class="dim unranked">—</span>
                      }
                    </td>
                    <td class="num">
                      @if (pb.rankedLapMs === null) {
                        <span class="dim">Not ranked</span>
                      } @else if (pb.rankedLapMs !== pb.bestLapMs) {
                        {{ pb.rankedLapMs | lap }} <span class="dim note">(PB was private)</span>
                      } @else {
                        <span class="dim">same</span>
                      }
                    </td>
                    <td class="dim">{{ pb.vehicle ? pb.vehicle.manufacturer + ' ' + pb.vehicle.model : '—' }}</td>
                    <td class="num">{{ pb.lapCount }}</td>
                    <td class="dim">{{ pb.setAt | day }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="dim empty">
            Nothing recorded yet. Sign in to TrackPro on your phone with this account; sessions sync after each drive.
          </p>
        }
      }
    </tb-gate>
  `,
  styles: `
    .who {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s5);
      align-items: center;
      margin-top: var(--s2);
    }

    .who > div {
      display: grid;
      gap: 6px;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s4);
      font-weight: 700;
    }

    .summary {
      padding-bottom: var(--s3);
      border-bottom: 1px solid var(--rule);
      font-size: 1.05rem;
      line-height: 1.7;
    }

    .summary strong {
      font-weight: 800;
      font-stretch: 88%;
      font-size: 1.25rem;
    }

    .main-car {
      margin-top: var(--s3);
    }

    .of {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .note {
      font-size: 0.82rem;
    }

    .empty {
      padding-block: var(--s3);
      max-width: 62ch;
    }
  `,
})
export class RecordPage {
  private readonly api = inject(ApiService);

  protected readonly data = load({
    stream: () => forkJoin({ profile: this.api.profile(), stats: this.api.stats() }),
  });

}

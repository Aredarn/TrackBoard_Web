import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { load } from '../../core/load';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Gate } from '../../ui/gate';
import { TIMING_PIPES } from '../../ui/pipes';

@Component({
  selector: 'tb-my-tracks-page',
  imports: [RouterLink, Gate, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sheet-title title">My tracks</h1>
    <p class="dim lede">
      Tracks you built in TrackPro, private ones included. Publishing and unpublishing happen in the app.
    </p>

    <tb-gate [status]="tracks.status()" [error]="tracks.error()" [empty]="(tracks.value()?.items?.length ?? 0) === 0" (retry)="tracks.reload()">
      <div class="table-wrap">
        <table class="classification">
          <caption class="sr-only">Tracks you own</caption>
          <thead>
            <tr>
              <th scope="col">Track</th>
              <th scope="col" class="c-wide">Layout</th>
              <th scope="col" class="num c-wide">Length</th>
              <th scope="col" class="num c-wide">Sectors</th>
              <th scope="col">Visibility</th>
              <th scope="col" class="num">Ranked laps</th>
              <th scope="col" class="c-wide">Geometry</th>
            </tr>
          </thead>
          <tbody>
            @for (t of tracks.value()?.items; track t.id) {
              <tr>
                <td class="wrap">
                  <a [routerLink]="['/tracks', t.id]">{{ t.name }}</a><span class="dim"> · {{ t.country }}</span>
                  <span class="sub-line typed">{{ t.type }} · {{ t.lengthMeters | km }}{{ t.geometryLocked ? ' · frozen' : '' }}</span>
                </td>
                <td class="c-wide">{{ t.type }}</td>
                <td class="num c-wide">{{ t.lengthMeters | km }}</td>
                <td class="num c-wide">{{ t.sectorCount ? t.sectorCount + 1 : '—' }}</td>
                <td>
                  @if (t.visibility === 'Published') {
                    <span class="tag ob">Published</span>
                  } @else {
                    <span class="tag dim">Private</span>
                  }
                </td>
                <td class="num">{{ t.rankedLapCount }}</td>
                <td class="dim c-wide">{{ t.geometryLocked ? 'Frozen' : 'Editable' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <p empty class="dim empty">You have not built a track yet. Use the track builder in TrackPro; it syncs here when you sign in.</p>
    </tb-gate>

    <p class="sheet-foot">
      A published track's geometry freezes at its first ranked lap, because every lap on its board was timed
      against the gates derived from those points. A new layout means publishing a new track.
    </p>
  `,
  styles: `
    .title {
      margin-top: var(--s5);
    }

    .lede {
      margin: var(--s2) 0 var(--s5);
      max-width: 64ch;
    }

    .empty {
      padding-block: var(--s4);
    }
  `,
})
export class MyTracksPage {
  private readonly api = inject(ApiService);

  protected readonly tracks = load({
    stream: () => this.api.tracks({ mine: true, pageSize: 100 }),
  });
}

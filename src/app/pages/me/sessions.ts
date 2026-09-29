import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { load } from '../../core/load';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { gpsCode, plural } from '../../core/format';
import { Gate } from '../../ui/gate';
import { TIMING_PIPES } from '../../ui/pipes';

@Component({
  selector: 'tb-sessions-page',
  imports: [RouterLink, Gate, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <h1 class="sheet-title">Sessions</h1>
      <label class="field filter">
        <span>Track</span>
        <select (change)="setTrack($any($event.target).value)">
          <option value="">Every track</option>
          @for (t of trackOptions(); track t.id) {
            <option [value]="t.id" [selected]="t.id === trackId()">{{ t.name }}</option>
          }
        </select>
      </label>
    </div>
    <p class="dim lede">Newest first. Sessions are uploaded by TrackPro; void or re-rank them in the app.</p>

    <tb-gate [status]="list.status()" [error]="list.error()" [empty]="(list.value()?.items?.length ?? 0) === 0" (retry)="list.reload()">
      <div class="table-wrap">
        <table class="classification">
          <caption class="sr-only">Your uploaded sessions</caption>
          <thead>
            <tr>
              <th scope="col" class="c-wide">Date</th>
              <th scope="col">Session</th>
              <th scope="col" class="c-wide">Track</th>
              <th scope="col" class="num c-wide">Laps</th>
              <th scope="col" class="num">Best lap</th>
              <th scope="col">Status</th>
              <th scope="col" class="c-wide">Rig</th>
            </tr>
          </thead>
          <tbody>
            @for (s of list.value()?.items; track s.id) {
              <tr class="clickable" [class.voided]="s.voided" (click)="open(s.id)">
                <td class="dim c-wide">{{ s.startedAt | day: true }}</td>
                <td class="name">
                  <a [routerLink]="['/me/sessions', s.id]" (click)="$event.stopPropagation()">{{ s.name }}</a>
                  <span class="sub-line typed">{{ s.startedAt | day }} · {{ s.trackName ?? 'No track' }} · {{ s.lapCount }} laps</span>
                </td>
                <td class="c-wide">{{ s.trackName ?? 'No track' }}</td>
                <td class="num c-wide">{{ s.lapCount }}</td>
                <td class="time num">{{ s.bestLapMs | lap }}</td>
                <td>
                  @if (s.voided) {
                    <span class="tag fault">Void</span>
                  } @else if (s.visibility === 'Ranked') {
                    <span class="tag ob">Ranked</span>
                  } @else {
                    <span class="tag dim">Private</span>
                  }
                </td>
                <td class="typed c-wide">{{ code(s.gpsSource) }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (list.value(); as p) {
        <nav class="pager" aria-label="Pages">
          <span class="typed dim">{{ countLabel() }}</span>
          @if (p.totalPages > 1) {
            <span class="pages">
              <button type="button" class="btn plain" [disabled]="!p.hasPrevious" (click)="page.set(p.page - 1)">Newer</button>
              <span class="typed">Page {{ p.page }} of {{ p.totalPages }}</span>
              <button type="button" class="btn plain" [disabled]="!p.hasNext" (click)="page.set(p.page + 1)">Older</button>
            </span>
          }
        </nav>
      }

      <p empty class="dim empty">
        @if (trackId()) {
          No sessions on this track.
        } @else {
          No sessions uploaded yet. Sign in to TrackPro with this account and they sync after each drive.
        }
      </p>
    </tb-gate>
  `,
  styles: `
    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: end;
      gap: var(--s4);
      margin-top: var(--s5);
    }

    .filter {
      min-width: 240px;
    }

    .lede {
      margin: var(--s2) 0 var(--s5);
    }

    tr.voided td:not(:nth-child(6)) a {
      text-decoration: line-through;
      text-decoration-color: var(--fault);
      color: var(--ink-3);
    }

    .pager {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: var(--s3);
      margin-top: var(--s4);
    }

    .pages {
      display: flex;
      align-items: center;
      gap: var(--s3);
    }

    .empty {
      padding-block: var(--s4);
    }

    .sub-line {
      display: none;
      color: var(--ink-2);
    }

    @media (max-width: 640px) {
      .c-wide {
        display: none;
      }

      td.name {
        white-space: normal;
      }

      .sub-line {
        display: block;
        margin-top: 2px;
      }
    }
  `,
})
export class SessionsPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly page = signal(1);
  protected readonly trackId = signal<string | null>(null);

  protected readonly list = load({
    params: () => ({ page: this.page(), trackId: this.trackId() }),
    stream: ({ params }) => this.api.sessions(params.page, params.trackId),
  });

  /** The tracks this driver has driven, from their stats, for the filter. */
  private readonly stats = load({ stream: () => this.api.stats() });

  protected readonly trackOptions = computed(() =>
    (this.stats.value()?.personalBests ?? [])
      .map((pb) => ({ id: pb.trackId, name: pb.trackName }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );

  protected readonly countLabel = computed(() => plural(this.list.value()?.totalCount ?? 0, 'session'));

  protected setTrack(id: string): void {
    this.trackId.set(id || null);
    this.page.set(1);
  }

  protected open(id: string): void {
    void this.router.navigate(['/me/sessions', id]);
  }

  protected code = gpsCode;
}

import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { load } from '../core/load';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { TrackType } from '../core/api.types';
import { plural } from '../core/format';
import { Gate } from '../ui/gate';
import { Icon } from '../ui/icon';
import { TIMING_PIPES } from '../ui/pipes';

type Near = { lat: number; lon: number } | null;

@Component({
  selector: 'tb-tracks-page',
  imports: [RouterLink, DecimalPipe, Gate, Icon, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet pinned">
        <h1 class="sheet-title title">Tracks</h1>
        <p class="lede dim">
          {{ totalLabel() }}: every circuit and sprint a TrackPro driver has published. Each one keeps its own
          classification, timed against the gates in its outline.
        </p>

        <div class="filters" role="group" aria-label="Filter tracks">
          <fieldset class="ticks">
            <legend class="sr-only">Layout</legend>
            @for (opt of layouts; track opt.label) {
              <label class="tick">
                <input type="radio" name="layout" [checked]="type() === opt.value" (change)="setType(opt.value)" />
                <span>{{ opt.label }}</span>
              </label>
            }
          </fieldset>

          <label class="field search">
            <span class="sr-only">Find a track by name or country</span>
            <input
              type="search"
              placeholder="Find by name or country"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </label>

          @if (near()) {
            <button type="button" class="btn plain" (click)="clearNear()">Show all distances</button>
          } @else {
            <button type="button" class="btn plain" (click)="locate()" [disabled]="locating()">
              <tb-icon name="locate" [size]="16" />
              {{ locating() ? 'Finding you…' : 'Near me' }}
            </button>
          }
        </div>
        @if (geoError()) {
          <p class="geo-error fault" role="status">{{ geoError() }}</p>
        }

        <tb-gate [status]="tracks.status()" [error]="tracks.error()" [empty]="rows().length === 0" (retry)="tracks.reload()">
          <div class="table-wrap">
            <table class="classification">
              <caption class="sr-only">Published tracks</caption>
              <thead>
                <tr>
                  <th scope="col">Track</th>
                  <th scope="col" class="c-wide">Country</th>
                  <th scope="col" class="c-wide">Layout</th>
                  <th scope="col" class="num c-wide">Length</th>
                  <th scope="col" class="num">Ranked laps</th>
                  @if (near()) {
                    <th scope="col" class="num">Distance</th>
                  }
                  <th scope="col" class="c-wide">Published by</th>
                </tr>
              </thead>
              <tbody>
                @for (t of rows(); track t.id) {
                  <tr class="clickable" (click)="open(t.id)">
                    <td class="name">
                      <a [routerLink]="['/tracks', t.id]" (click)="$event.stopPropagation()">{{ t.name }}</a>
                      <span class="sub-line typed">{{ t.country }} · {{ t.type }} · {{ t.lengthMeters | km }}</span>
                    </td>
                    <td class="c-wide">{{ t.country }}</td>
                    <td class="c-wide">{{ t.type }}</td>
                    <td class="num c-wide">{{ t.lengthMeters | km }}</td>
                    <td class="num">{{ t.rankedLapCount }}</td>
                    @if (near()) {
                      <td class="num">{{ t.distanceKm === null ? '—' : (t.distanceKm | number: '1.0-1') + ' km' }}</td>
                    }
                    <td class="dim c-wide">{{ t.ownerDisplayName }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (page(); as p) {
            @if (p.totalPages > 1) {
              <nav class="pager" aria-label="Pages">
                <button type="button" class="btn plain" [disabled]="!p.hasPrevious" (click)="pageNo.set(p.page - 1)">Previous</button>
                <span class="typed">Page {{ p.page }} of {{ p.totalPages }}</span>
                <button type="button" class="btn plain" [disabled]="!p.hasNext" (click)="pageNo.set(p.page + 1)">Next</button>
              </nav>
            }
          }

          <div empty class="empty">
            @if (near()) {
              <p>No published track within {{ radius }} km of you. <button type="button" class="linkish" (click)="clearNear()">Show every track</button></p>
            } @else if (query()) {
              <p>No track matches “{{ query() }}”.</p>
            } @else {
              <p>No tracks are published yet. A driver publishes one from the track builder in TrackPro.</p>
            }
          </div>
        </tb-gate>
      </article>
    </div>
  `,
  styles: `
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

    .tick span {
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

    .tick input:checked + span {
      background: var(--ink);
      color: var(--paper);
    }

    .tick input:focus-visible + span {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }

    .search {
      flex: 1 1 240px;
      max-width: 360px;
    }

    .geo-error {
      margin: calc(var(--s2) * -1) 0 var(--s3);
      font-size: 0.9rem;
    }

    td.name a {
      font-weight: 800;
      font-stretch: 100%;
      font-size: 1.05rem;
    }

    .pager {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--s4);
      margin-top: var(--s5);
    }

    .empty {
      padding-block: var(--s5);
      color: var(--ink-2);
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

    .linkish {
      all: unset;
      cursor: pointer;
      color: var(--ink);
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }
  `,
})
export class TracksPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly radius = 150;
  protected readonly layouts: { label: string; value: TrackType | null }[] = [
    { label: 'All', value: null },
    { label: 'Circuits', value: 'Circuit' },
    { label: 'Sprints', value: 'Sprint' },
  ];

  protected readonly type = signal<TrackType | null>(null);
  protected readonly near = signal<Near>(null);
  protected readonly pageNo = signal(1);
  protected readonly query = signal('');
  protected readonly locating = signal(false);
  protected readonly geoError = signal<string | null>(null);

  protected readonly tracks = load({
    params: () => ({ type: this.type(), near: this.near(), page: this.pageNo() }),
    stream: ({ params }) =>
      this.api.tracks({ type: params.type, near: params.near, radiusKm: this.radius, page: params.page, pageSize: 50 }),
  });

  protected readonly page = computed(() => this.tracks.value() ?? null);

  protected readonly rows = computed(() => {
    const items = this.tracks.value()?.items ?? [];
    const q = this.query().trim().toLowerCase();
    return q ? items.filter((t) => `${t.name} ${t.country}`.toLowerCase().includes(q)) : items;
  });

  protected readonly totalLabel = computed(() => {
    const total = this.tracks.value()?.totalCount;
    return total === undefined ? 'Tracks on file' : plural(total, 'track') + ' on file';
  });

  protected setType(value: TrackType | null): void {
    this.type.set(value);
    this.pageNo.set(1);
  }

  protected open(id: string): void {
    void this.router.navigate(['/tracks', id]);
  }

  protected locate(): void {
    if (!('geolocation' in navigator)) {
      this.geoError.set('This browser cannot share a location. Search by name instead.');
      return;
    }
    this.locating.set(true);
    this.geoError.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating.set(false);
        this.pageNo.set(1);
        this.near.set({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        this.locating.set(false);
        this.geoError.set('Location was not shared, so tracks are listed without distances.');
      },
      { maximumAge: 600_000, timeout: 15_000 },
    );
  }

  protected clearNear(): void {
    this.near.set(null);
    this.pageNo.set(1);
  }
}

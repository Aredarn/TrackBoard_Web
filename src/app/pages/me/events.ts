import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { EventDetail } from '../../core/api.types';
import { eventWindow, fromLocalInput, problemMessage, toLocalInput } from '../../core/format';
import { load } from '../../core/load';
import { Gate } from '../../ui/gate';

/** Today 09:00–17:00 local, or tomorrow's if the day is already over: a sensible first draft. */
function defaultWindow(): { start: string; end: string } {
  const start = new Date();
  if (start.getHours() >= 17) start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(17, 0, 0, 0);
  return { start: toLocalInput(start), end: toLocalInput(end) };
}

@Component({
  selector: 'tb-events-page',
  imports: [FormsModule, RouterLink, Gate],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sheet-title title">Events</h1>
    <p class="dim lede">
      Track days and club events. Drivers join with the host's code; every lap they drive on the event's track
      during the event goes onto its live board.
    </p>

    <section aria-labelledby="h-join">
      <h2 class="rubric" id="h-join">Join an event</h2>
      <form class="join" (ngSubmit)="lookUp()" novalidate>
        <label class="field code-field">
          <span>Join code</span>
          <input
            name="code"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            maxlength="9"
            placeholder="ABC 123"
            [(ngModel)]="code"
          />
        </label>
        <button class="btn plain" type="submit" [disabled]="busy()">Find event</button>
      </form>

      @if (found(); as f) {
        <div class="found">
          <p>
            <strong>{{ f.event.name }}</strong> · {{ f.event.trackName }} · {{ window(f.event.startsAt, f.event.endsAt) }}
            <span class="dim">· hosted by {{ f.event.hostDisplayName }}</span>
          </p>
          @if (f.groups.length) {
            <label class="field group-field">
              <span>Your run group</span>
              <select name="group" [(ngModel)]="groupId">
                <option [ngValue]="null">Not sure yet</option>
                @for (g of f.groups; track g.id) {
                  <option [ngValue]="g.id">{{ g.name }}</option>
                }
              </select>
            </label>
          }
          <div class="actions">
            <button class="btn" type="button" (click)="join(f)" [disabled]="busy()">
              {{ f.event.isJoined ? 'Update my group' : 'Join event' }}
            </button>
            <a class="btn plain" [routerLink]="['/events', f.event.id]">View board</a>
          </div>
          <p class="hint dim">
            Joining shares every lap you drive on {{ f.event.trackName }} during the event with its board, private
            sessions included. Download the track in TrackPro first so you are timed on the same gates.
          </p>
        </div>
      }
      @if (joinError()) {
        <div class="notice" role="alert"><strong>Not joined</strong><p>{{ joinError() }}</p></div>
      }
    </section>

    <section aria-labelledby="h-mine">
      <h2 class="rubric" id="h-mine">My events</h2>
      <tb-gate [status]="mine.status()" [error]="mine.error()" [empty]="(mine.value()?.length ?? 0) === 0" (retry)="mine.reload()">
        <div class="table-wrap">
          <table class="classification">
            <caption class="sr-only">Events you host or joined</caption>
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col" class="c-wide">When</th>
                <th scope="col" class="num c-wide">Drivers</th>
                <th scope="col">Status</th>
                <th scope="col" class="c-wide">Role</th>
              </tr>
            </thead>
            <tbody>
              @for (e of mine.value(); track e.id) {
                <tr>
                  <td class="name">
                    <a [routerLink]="['/events', e.id]">{{ e.name }}</a>
                    <span class="sub-line typed">{{ e.trackName }} · {{ window(e.startsAt, e.endsAt) }}</span>
                  </td>
                  <td class="dim c-wide">{{ window(e.startsAt, e.endsAt) }}</td>
                  <td class="num c-wide">{{ e.entryCount }}</td>
                  <td>
                    @switch (e.status) {
                      @case ('Live') {
                        <span class="tag ob">Live</span>
                      }
                      @case ('Upcoming') {
                        <span class="tag">Upcoming</span>
                      }
                      @default {
                        <span class="tag dim">Finished</span>
                      }
                    }
                  </td>
                  <td class="c-wide">
                    @if (e.isHost) {
                      <a [routerLink]="['/me/events', e.id]">Host · manage</a>
                    } @else {
                      <span class="dim">Driver</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p empty class="dim empty">No events yet. Join one with a code above, or create your own below.</p>
      </tb-gate>
    </section>

    <section aria-labelledby="h-create">
      <h2 class="rubric" id="h-create">Host an event</h2>
      <form class="create" (ngSubmit)="create()" novalidate>
        <label class="field">
          <span>Event name</span>
          <input name="name" required minlength="2" maxlength="120" placeholder="Kakucs club day" [(ngModel)]="name" />
        </label>

        <label class="field">
          <span>Track</span>
          <select name="track" required [(ngModel)]="trackId">
            <option [ngValue]="null" disabled>Choose a published track</option>
            @for (t of tracks.value()?.items; track t.id) {
              <option [ngValue]="t.id">{{ t.name }} · {{ t.country }}</option>
            }
          </select>
          <span class="hint">Only published tracks: every driver downloads the same outline, so laps compare fairly.</span>
        </label>

        <div class="two">
          <label class="field">
            <span>Starts</span>
            <input type="datetime-local" name="start" required [(ngModel)]="start" />
          </label>
          <label class="field">
            <span>Ends</span>
            <input type="datetime-local" name="end" required [(ngModel)]="end" />
          </label>
        </div>

        <fieldset class="groups">
          <legend>Run groups <span class="dim">(optional)</span></legend>
          @for (g of groups(); track $index; let i = $index) {
            <div class="group-row">
              <label class="field">
                <span class="sr-only">Group {{ i + 1 }} name</span>
                <input [name]="'group' + i" maxlength="60" [placeholder]="groupPlaceholder(i)" [ngModel]="g" (ngModelChange)="setGroup(i, $event)" />
              </label>
              <button type="button" class="linkish" (click)="removeGroup(i)" [attr.aria-label]="'Remove group ' + (i + 1)">Remove</button>
            </div>
          }
          @if (groups().length < 12) {
            <button type="button" class="btn plain" (click)="addGroup()">Add a group</button>
          }
        </fieldset>

        @if (createError()) {
          <div class="notice" role="alert"><strong>Not created</strong><p>{{ createError() }}</p></div>
        }

        <button class="btn" type="submit" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create event' }}</button>
      </form>
    </section>
  `,
  styles: `
    .title {
      margin-top: var(--s5);
    }

    .lede {
      margin: var(--s2) 0 0;
      max-width: 66ch;
    }

    .join {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: var(--s3);
    }

    .code-field input {
      width: 11ch;
      font-size: 1.3rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .found {
      display: grid;
      gap: var(--s3);
      margin-top: var(--s4);
      padding: var(--s4);
      border: 2px dashed var(--rule-strong);
      max-width: 44rem;
    }

    .group-field {
      max-width: 20rem;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2);
    }

    .hint {
      font-size: 0.85rem;
    }

    .notice {
      margin-top: var(--s4);
    }

    td.name a {
      font-weight: 800;
      font-stretch: 100%;
    }

    .sub-line {
      display: none;
      color: var(--ink-2);
    }

    .empty {
      padding-block: var(--s3);
    }

    .create {
      display: grid;
      gap: var(--s4);
      max-width: 40rem;
    }

    .create > .btn {
      justify-self: start;
    }

    .two {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--s3);
    }

    .groups {
      display: grid;
      gap: var(--s2);
      margin: 0;
      padding: 0;
      border: 0;
    }

    .groups legend {
      margin-bottom: 6px;
      padding: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-2);
    }

    .groups > .btn {
      justify-self: start;
    }

    .group-row {
      display: flex;
      align-items: center;
      gap: var(--s3);
    }

    .group-row .field {
      flex: 1;
    }

    .linkish {
      all: unset;
      cursor: pointer;
      font-size: 0.9rem;
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    .linkish:focus-visible {
      outline: 3px solid var(--focus);
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

      .two {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EventsPage implements OnInit {
  /** Pre-fills the join box, so a shared /me/events?code=ABC123 link lands ready to join. */
  readonly codeParam = input<string | undefined>(undefined, { alias: 'code' });

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly mine = load({ stream: () => this.api.myEvents() });
  protected readonly tracks = load({ stream: () => this.api.tracks({ pageSize: 100 }) });

  protected code = '';
  protected groupId: string | null = null;
  protected readonly found = signal<EventDetail | null>(null);
  private foundCode = '';
  protected readonly joinError = signal<string | null>(null);

  protected name = '';
  protected trackId: string | null = null;
  protected start = defaultWindow().start;
  protected end = defaultWindow().end;
  protected readonly groups = signal<string[]>([]);
  protected readonly createError = signal<string | null>(null);
  protected readonly busy = signal(false);

  private readonly placeholders = ['Novice', 'Intermediate', 'Fast'];

  ngOnInit(): void {
    const code = this.codeParam();
    if (code) {
      this.code = code;
      this.lookUp();
    }
  }

  protected window(startsAt: string, endsAt: string): string {
    return eventWindow(startsAt, endsAt);
  }

  protected lookUp(): void {
    const code = this.code.replace(/[^a-z0-9]/gi, '');
    if (code.length < 4) {
      this.joinError.set('Enter the 6-character code the host gave you.');
      return;
    }
    this.busy.set(true);
    this.joinError.set(null);
    this.found.set(null);
    this.api.eventByCode(code).subscribe({
      next: (detail) => {
        this.busy.set(false);
        this.found.set(detail);
        this.foundCode = code;
        this.groupId = detail.event.myGroupId;
      },
      error: (e: { status?: number }) => {
        this.busy.set(false);
        this.joinError.set(e.status === 404 ? 'No event has that code. Check it with the host.' : problemMessage(e));
      },
    });
  }

  protected join(detail: EventDetail): void {
    this.busy.set(true);
    this.joinError.set(null);
    this.api.joinEvent(this.foundCode, this.groupId).subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigate(['/events', detail.event.id]);
      },
      error: (e: { status?: number }) => {
        this.busy.set(false);
        this.joinError.set(e.status === 409 ? 'This event has finished and no longer takes drivers.' : problemMessage(e));
      },
    });
  }

  protected groupPlaceholder(i: number): string {
    return this.placeholders[i] ?? `Group ${i + 1}`;
  }

  protected addGroup(): void {
    this.groups.update((g) => [...g, '']);
  }

  protected setGroup(i: number, value: string): void {
    this.groups.update((g) => g.map((x, j) => (j === i ? value : x)));
  }

  protected removeGroup(i: number): void {
    this.groups.update((g) => g.filter((_, j) => j !== i));
  }

  protected create(): void {
    const startsAt = fromLocalInput(this.start);
    const endsAt = fromLocalInput(this.end);
    const groups = this.groups().map((g) => g.trim()).filter(Boolean);

    if (this.name.trim().length < 2) return this.createError.set('Give the event a name.');
    if (!this.trackId) return this.createError.set('Choose the track the event runs on.');
    if (!startsAt || !endsAt) return this.createError.set('Set when the event starts and ends.');
    if (endsAt <= startsAt) return this.createError.set('The event has to end after it starts.');

    this.busy.set(true);
    this.createError.set(null);
    this.api
      .createEvent({ name: this.name.trim(), trackId: this.trackId, startsAt, endsAt, groups: groups.map((name) => ({ name })) })
      .subscribe({
        next: (created) => {
          this.busy.set(false);
          void this.router.navigate(['/events', created.event.id]);
        },
        error: (e) => {
          this.busy.set(false);
          this.createError.set(problemMessage(e));
        },
      });
  }
}

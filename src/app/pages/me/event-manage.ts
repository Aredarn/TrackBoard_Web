import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { EventDetail } from '../../core/api.types';
import { fromLocalInput, problemMessage, toLocalInput } from '../../core/format';
import { load } from '../../core/load';
import { Gate } from '../../ui/gate';
import { Icon } from '../../ui/icon';
import { TIMING_PIPES } from '../../ui/pipes';

interface GroupDraft {
  id?: string;
  name: string;
}

type Notice = { ok: boolean; text: string } | null;

@Component({
  selector: 'tb-event-manage-page',
  imports: [FormsModule, RouterLink, Gate, Icon, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="crumbs"><a routerLink="/events"><tb-icon name="arrowLeft" [size]="16" /> Events</a></p>

    <tb-gate [status]="detail.status()" [error]="detail.error()" (retry)="detail.reload()">
      @if (detail.value(); as d) {
        @if (!d.event.isHost) {
          <div class="notice" role="alert">
            <strong>Not your event</strong>
            <p>Only the host can manage {{ d.event.name }}. <a [routerLink]="['/events', d.event.id]">See its board</a>.</p>
          </div>
        } @else {
          <header class="head">
            <h1 class="sheet-title">{{ d.event.name }}</h1>
            <p class="links">
              <a [routerLink]="['/events', d.event.id]">Open the live board</a>
              <span class="typed">Join code {{ d.event.joinCode }}</span>
            </p>
          </header>

          <section aria-labelledby="h-drivers">
            <h2 class="rubric" id="h-drivers">Drivers <small>{{ d.entries.length }} joined</small></h2>
            @if (d.entries.length) {
              <div class="table-wrap">
                <table class="classification">
                  <caption class="sr-only">Drivers in this event</caption>
                  <thead>
                    <tr>
                      <th scope="col">Driver</th>
                      @if (d.groups.length) {
                        <th scope="col">Run group</th>
                      }
                      <th scope="col" class="c-wide">Joined</th>
                      <th scope="col"><span class="sr-only">Remove</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (x of d.entries; track x.userId) {
                      <tr>
                        <td><a [routerLink]="['/drivers', x.userId]">{{ x.displayName }}</a></td>
                        @if (d.groups.length) {
                          <td>
                            <label class="field inline">
                              <span class="sr-only">Run group for {{ x.displayName }}</span>
                              <select [ngModel]="x.groupId" (ngModelChange)="move(d, x.userId, $event)" [disabled]="busy()">
                                <option [ngValue]="null">No group</option>
                                @for (g of d.groups; track g.id) {
                                  <option [ngValue]="g.id">{{ g.name }}</option>
                                }
                              </select>
                            </label>
                          </td>
                        }
                        <td class="dim c-wide">{{ x.joinedAt | day: true }}</td>
                        <td class="num">
                          @if (confirmRemove() === x.userId) {
                            <button type="button" class="linkish fault" (click)="remove(d, x.userId)">Confirm remove</button>
                          } @else {
                            <button type="button" class="linkish" (click)="confirmRemove.set(x.userId)">Remove</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="dim">Nobody has joined yet. Hand out the code {{ d.event.joinCode }}; drivers enter it in TrackPro under Events.</p>
            }
          </section>

          <section aria-labelledby="h-edit">
            <h2 class="rubric" id="h-edit">Event details <small>the track is fixed once created</small></h2>
            <form class="edit" (ngSubmit)="save(d)" novalidate>
              <label class="field">
                <span>Event name</span>
                <input name="name" required minlength="2" maxlength="120" [(ngModel)]="name" />
              </label>
              <div class="two">
                <label class="field">
                  <span>Starts</span>
                  <input type="datetime-local" name="start" [(ngModel)]="start" />
                </label>
                <label class="field">
                  <span>Ends</span>
                  <input type="datetime-local" name="end" [(ngModel)]="end" />
                </label>
              </div>

              <fieldset class="groups">
                <legend>Run groups</legend>
                @for (g of groups(); track $index; let i = $index) {
                  <div class="group-row">
                    <label class="field">
                      <span class="sr-only">Group {{ i + 1 }} name</span>
                      <input [name]="'group' + i" maxlength="60" [ngModel]="g.name" (ngModelChange)="rename(i, $event)" />
                    </label>
                    <button type="button" class="linkish" (click)="dropGroup(i)">Remove</button>
                  </div>
                }
                @if (groups().length < 12) {
                  <button type="button" class="btn plain" (click)="addGroup()">Add a group</button>
                }
                <span class="hint">Removing a group keeps its drivers in the event, without a group.</span>
              </fieldset>

              <button class="btn" type="submit" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save details' }}</button>
            </form>
          </section>

          @if (notice(); as n) {
            <div class="notice" [class.ok]="n.ok" role="status">
              <strong>{{ n.ok ? 'Saved' : 'Not saved' }}</strong>
              <p>{{ n.text }}</p>
            </div>
          }

          <section aria-labelledby="h-delete" class="danger">
            <h2 class="rubric" id="h-delete">Delete event</h2>
            <p>Removes the event, its groups and its board. Drivers keep every session and lap; only the event goes.</p>
            @if (confirmDelete()) {
              <div class="actions">
                <button type="button" class="btn danger" (click)="deleteEvent(d)" [disabled]="busy()">Delete {{ d.event.name }}</button>
                <button type="button" class="btn plain" (click)="confirmDelete.set(false)">Keep it</button>
              </div>
            } @else {
              <button type="button" class="btn plain" (click)="confirmDelete.set(true)">Delete event…</button>
            }
          </section>
        }
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
      display: grid;
      gap: 6px;
      margin-top: var(--s3);
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s5);
      font-weight: 700;
    }

    .field.inline select {
      min-height: 38px;
      padding: 6px 10px;
    }

    .edit {
      display: grid;
      gap: var(--s4);
      max-width: 40rem;
    }

    .edit > .btn {
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

    .hint {
      font-size: 0.85rem;
      color: var(--ink-2);
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

    .notice {
      margin-top: var(--s4);
    }

    .danger p {
      max-width: 66ch;
      margin-bottom: var(--s3);
    }

    .danger .rubric {
      color: var(--fault);
      border-color: var(--fault);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2);
    }

    @media (max-width: 640px) {
      .c-wide {
        display: none;
      }

      .two {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EventManagePage {
  readonly id = input.required<string>();

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly detail = load({
    params: () => ({ id: this.id() }),
    stream: ({ params }) => this.api.event(params.id),
  });

  protected name = '';
  protected start = '';
  protected end = '';
  protected readonly groups = signal<GroupDraft[]>([]);
  protected readonly busy = signal(false);
  protected readonly notice = signal<Notice>(null);
  protected readonly confirmRemove = signal<string | null>(null);
  protected readonly confirmDelete = signal(false);

  constructor() {
    effect(() => {
      const d = this.detail.value();
      if (!d) return;
      this.name = d.event.name;
      this.start = toLocalInput(d.event.startsAt);
      this.end = toLocalInput(d.event.endsAt);
      this.groups.set(d.groups.map((g) => ({ id: g.id, name: g.name })));
    });
  }

  protected addGroup(): void {
    this.groups.update((g) => [...g, { name: '' }]);
  }

  protected rename(i: number, name: string): void {
    this.groups.update((g) => g.map((x, j) => (j === i ? { ...x, name } : x)));
  }

  protected dropGroup(i: number): void {
    this.groups.update((g) => g.filter((_, j) => j !== i));
  }

  protected save(d: EventDetail): void {
    const startsAt = fromLocalInput(this.start);
    const endsAt = fromLocalInput(this.end);
    if (this.name.trim().length < 2) return this.notice.set({ ok: false, text: 'Give the event a name.' });
    if (!startsAt || !endsAt || endsAt <= startsAt) {
      return this.notice.set({ ok: false, text: 'The event has to end after it starts.' });
    }

    this.busy.set(true);
    this.notice.set(null);
    this.api
      .updateEvent(d.event.id, {
        name: this.name.trim(),
        startsAt,
        endsAt,
        groups: this.groups()
          .map((g) => ({ ...g, name: g.name.trim() }))
          .filter((g) => g.name),
      })
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.detail.set(updated);
          this.notice.set({ ok: true, text: 'The board shows the new details within a few seconds.' });
        },
        error: (e) => {
          this.busy.set(false);
          this.notice.set({ ok: false, text: problemMessage(e) });
        },
      });
  }

  protected move(d: EventDetail, userId: string, groupId: string | null): void {
    this.busy.set(true);
    this.api.setEntryGroup(d.event.id, userId, groupId).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.detail.set(updated);
      },
      error: (e) => {
        this.busy.set(false);
        this.notice.set({ ok: false, text: problemMessage(e) });
      },
    });
  }

  protected remove(d: EventDetail, userId: string): void {
    this.busy.set(true);
    this.api.removeEntry(d.event.id, userId).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmRemove.set(null);
        this.detail.set({ ...d, entries: d.entries.filter((x) => x.userId !== userId) });
      },
      error: (e) => {
        this.busy.set(false);
        this.notice.set({ ok: false, text: problemMessage(e) });
      },
    });
  }

  protected deleteEvent(d: EventDetail): void {
    this.busy.set(true);
    this.api.deleteEvent(d.event.id).subscribe({
      next: () => void this.router.navigateByUrl('/events'),
      error: (e) => {
        this.busy.set(false);
        this.notice.set({ ok: false, text: problemMessage(e) });
      },
    });
  }
}

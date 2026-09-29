import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Stamp } from '../ui/stamp';

@Component({
  selector: 'tb-not-found-page',
  imports: [RouterLink, Stamp],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet pinned lost">
        <tb-stamp text="Not classified" tone="fault" [tilt]="-5" />
        <h1 class="sheet-title">Nothing is posted here</h1>
        <p class="dim">The address may be mistyped, or the sheet was taken down.</p>
        <p><a class="btn" routerLink="/tracks">Browse the tracks</a></p>
      </article>
    </div>
  `,
  styles: `
    .lost {
      display: grid;
      gap: var(--s4);
      justify-items: start;
      max-width: 40rem;
      margin-inline: auto;
      padding-top: var(--s7);
    }
  `,
})
export class NotFoundPage {}

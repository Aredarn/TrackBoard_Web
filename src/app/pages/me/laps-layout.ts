import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** My laps: your personal bests and every session you uploaded, one switch apart. */
@Component({
  selector: 'tb-laps-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="head">
      <h1 class="sheet-title">My laps</h1>
      <nav class="ticks" aria-label="My laps">
        <a routerLink="/laps" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page">
          Personal bests
        </a>
        <a routerLink="/laps/sessions" routerLinkActive="on" ariaCurrentWhenActive="page">Sessions</a>
      </nav>
    </header>
    <router-outlet />
  `,
  styles: `
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: space-between;
      gap: var(--s3) var(--s5);
    }

    .ticks {
      display: inline-flex;
      border: 2px solid var(--rule-strong);
    }

    .ticks a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 0 16px;
      font-weight: 700;
      font-stretch: 112%;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
    }

    .ticks a + a {
      border-left: 2px solid var(--rule-strong);
    }

    .ticks a.on {
      background: var(--ink);
      color: var(--paper);
    }
  `,
})
export class LapsLayout {}

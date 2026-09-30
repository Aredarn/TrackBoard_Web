import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/**
 * The driver's own file: index tabs along the top edge of one sheet. Everything in it is
 * a mirror of what the phone uploaded; only the account tab writes anything.
 */
@Component({
  selector: 'tb-me-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <nav class="tabs" aria-label="My season">
        @for (t of tabs; track t.path) {
          <a [routerLink]="t.path" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: t.exact }" ariaCurrentWhenActive="page">{{ t.label }}</a>
        }
      </nav>
      <article class="sheet file">
        <router-outlet />
      </article>
    </div>
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-top: 6px;
    }

    .tabs a {
      flex: none;
      padding: 10px 16px 8px;
      background: color-mix(in srgb, var(--paper) 72%, var(--board));
      color: var(--ink-2);
      font-weight: 800;
      font-stretch: 114%;
      font-size: 0.78rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-decoration: none;
      transition:
        background-color 140ms var(--ease-out),
        transform 140ms var(--ease-out);
      transform: translateY(3px);
    }

    .tabs a:hover {
      background: color-mix(in srgb, var(--paper) 88%, var(--board));
      transform: translateY(0);
    }

    .tabs a.on {
      background: var(--paper);
      color: var(--ink);
      transform: translateY(0);
    }

    .file {
      min-height: 60vh;
    }

    /* On a phone the tabs scroll; the fade says there is more to the right. */
    @media (max-width: 640px) {
      .tabs {
        mask-image: linear-gradient(90deg, #000 82%, transparent);
        padding-right: 40px;
      }
    }
  `,
})
export class MeLayout {
  protected readonly auth = inject(AuthService);
  protected readonly tabs = [
    { path: '/me', label: 'Record', exact: true },
    { path: '/me/sessions', label: 'Sessions', exact: false },
    { path: '/me/events', label: 'Events', exact: false },
    { path: '/me/garage', label: 'Garage', exact: true },
    { path: '/me/tracks', label: 'My tracks', exact: true },
    { path: '/me/account', label: 'Account', exact: true },
  ];
}

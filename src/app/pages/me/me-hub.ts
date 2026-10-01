import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { load } from '../../core/load';
import { Gate } from '../../ui/gate';
import { Icon, IconName } from '../../ui/icon';
import { PhotoFrame } from '../../ui/photo-frame';
import { TIMING_PIPES } from '../../ui/pipes';

interface Place {
  path: string;
  label: string;
  what: string;
  icon: IconName;
}

/**
 * Me: who you are on TrackBoard and every page that is yours, listed by name with what it
 * holds. The phone's bottom bar and the desktop header both lead here.
 */
@Component({
  selector: 'tb-me-hub',
  imports: [RouterLink, Gate, Icon, PhotoFrame, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tb-gate [status]="profile.status()" [error]="profile.error()" (retry)="profile.reload()">
      @if (profile.value(); as p) {
        <header class="who">
          <tb-photo [url]="p.avatarUrl" [name]="p.displayName" [size]="96" alt="Your photo" />
          <div class="who-text">
            <h1 class="sheet-title">{{ p.displayName }}</h1>
            <p class="dim">{{ p.country || 'Country not set' }} · on TrackBoard since {{ p.memberSince | day }}</p>
            <p class="links">
              <a [routerLink]="['/drivers', p.id]">My public page</a>
              <a routerLink="/account">Edit profile</a>
            </p>
          </div>
        </header>
      }
    </tb-gate>

    <nav class="index" aria-label="Your pages">
      @for (place of places; track place.path) {
        <a class="row" [routerLink]="place.path">
          <tb-icon [name]="place.icon" [size]="22" />
          <span class="row-text">
            <span class="row-label">{{ place.label }}</span>
            <span class="row-what">{{ place.what }}</span>
          </span>
          <tb-icon name="arrowRight" [size]="18" />
        </a>
      }
      <button type="button" class="row" (click)="auth.signOut()">
        <tb-icon name="signOut" [size]="22" />
        <span class="row-text">
          <span class="row-label">Sign out</span>
          <span class="row-what">Your phone stays signed in</span>
        </span>
      </button>
    </nav>
  `,
  styles: `
    .who {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s4) var(--s5);
      align-items: center;
    }

    .who-text {
      display: grid;
      gap: 6px;
      min-width: 0;
    }

    .who-text .sheet-title {
      overflow-wrap: anywhere;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2) var(--s5);
      font-weight: 700;
    }

    .index {
      display: grid;
      margin-top: var(--s6);
      border-top: 2px solid var(--rule-strong);
    }

    .row {
      all: unset;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: center;
      gap: var(--s4);
      min-height: 64px;
      padding: var(--s3) var(--s2);
      border-bottom: 1px solid var(--rule);
      cursor: pointer;
      color: var(--ink);
      text-decoration: none;
      transition: background-color 140ms var(--ease-out);
    }

    .row:hover {
      background: var(--stamp-soft);
    }

    .row:focus-visible {
      outline: 3px solid var(--focus);
      outline-offset: -3px;
    }

    .row-text {
      display: grid;
      gap: 2px;
    }

    .row-label {
      font-weight: 800;
      font-stretch: 108%;
      font-size: 1.05rem;
    }

    .row-what {
      font-size: 0.9rem;
      color: var(--ink-2);
    }
  `,
})
export class MeHubPage {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  protected readonly profile = load({ stream: () => this.api.profile() });

  protected readonly places: Place[] = [
    { path: '/laps', label: 'My laps', what: 'Personal bests and every session you uploaded', icon: 'stopwatch' },
    { path: '/events', label: 'Events', what: 'Join a track day with a code, host one, open live boards', icon: 'flag' },
    { path: '/garage', label: 'Garage', what: 'Your cars and their specs', icon: 'car' },
    { path: '/my-tracks', label: 'My tracks', what: 'Tracks you built in TrackPro, private ones too', icon: 'track' },
    { path: '/account', label: 'Account', what: 'Name, photo, bio, data export, delete account', icon: 'user' },
  ];
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth.service';
import { initials } from './core/format';
import { Icon, IconName } from './ui/icon';

interface Place {
  path: string;
  label: string;
  icon: IconName;
  exact: boolean;
}

/** The account side: everything reached from Me lights Me up. */
const ME_AREA = /^\/(me|garage|my-tracks|account)(\/|$|\?)/;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'strike($event)' },
  template: `
    <!-- Worn rubber-stamp ink, referenced by every stamp on the site. -->
    <svg class="defs" aria-hidden="true" focusable="false">
      <filter id="tb-ink" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="d" />
        <feComponentTransfer in="n" result="speckle">
          <feFuncA type="discrete" tableValues="1 1 1 0.35 1 1" />
        </feComponentTransfer>
        <feComposite in="d" in2="speckle" operator="in" />
      </filter>
    </svg>

    <a class="skip" href="#main">Skip to the board</a>

    <header class="rail">
      <div class="page rail-row">
        <a class="wordmark" routerLink="/" aria-label="TrackBoard, home">
          <span class="chq" aria-hidden="true"></span>
          <span>TrackBoard</span>
        </a>

        <nav class="places" aria-label="Main">
          @for (p of places(); track p.path) {
            <a class="dymo" [routerLink]="p.path" routerLinkActive="lit" [routerLinkActiveOptions]="{ exact: p.exact }" ariaCurrentWhenActive="page">
              {{ p.label }}
            </a>
          }
        </nav>

        <div class="rail-end">
          @if (auth.user(); as user) {
            <a class="me" routerLink="/me" [class.lit]="inMeArea()" [attr.aria-current]="inMeArea() ? 'page' : null">
              <span class="me-badge" aria-hidden="true">{{ initialsOf(user.displayName) }}</span>
              <span class="me-name">{{ user.displayName }}</span>
              <span class="sr-only">, your account</span>
            </a>
          } @else {
            <a class="dymo sign-in" routerLink="/sign-in" routerLinkActive="lit">Sign in</a>
          }
        </div>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <router-outlet />
    </main>

    <footer class="foot">
      <div class="page foot-row">
        <p>
          Lap times are recorded by the TrackPro app and posted as uploaded. They are
          <strong>not verified</strong>, and every entry shows which GPS rig timed it.
        </p>
        <ul>
          <li>
            <a [href]="env.trackProUrl" rel="noopener">TrackPro app <tb-icon name="external" [size]="14" /></a>
          </li>
          <li>
            <a [href]="env.firmwareUrl" rel="noopener">ESP32 timing firmware <tb-icon name="external" [size]="14" /></a>
          </li>
          <li><span class="typed">Open source</span></li>
        </ul>
      </div>
    </footer>

    <!-- Phones: the same places, under the thumb. -->
    <nav class="tabbar" aria-label="Main">
      @for (p of tabs(); track p.path) {
        @if (p.path === '/me') {
          <a class="tab" routerLink="/me" [class.lit]="inMeArea()" [attr.aria-current]="inMeArea() ? 'page' : null">
            <tb-icon [name]="p.icon" [size]="22" />
            <span>{{ p.label }}</span>
          </a>
        } @else {
          <a class="tab" [routerLink]="p.path" routerLinkActive="lit" [routerLinkActiveOptions]="{ exact: p.exact }" ariaCurrentWhenActive="page">
            <tb-icon [name]="p.icon" [size]="22" />
            <span>{{ p.label }}</span>
          </a>
        }
      }
    </nav>
  `,
  styles: `
    :host {
      --tabbar-h: 64px;
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }

    .defs {
      position: absolute;
      width: 0;
      height: 0;
    }

    .skip {
      position: absolute;
      left: 12px;
      top: -60px;
      z-index: 30;
      padding: 10px 14px;
      background: var(--rail-focus);
      color: #17181a;
      font-weight: 700;
    }

    .skip:focus {
      top: 12px;
    }

    main {
      flex: 1;
      padding-block: var(--s5) var(--s8);
      /* Tape ends and tilted notes may poke past the gutter; never let them scroll the page. */
      overflow-x: clip;
    }

    main:focus {
      outline: none;
    }

    /* The rail the board hangs from: dark graphite. */
    .rail {
      --focus: var(--rail-focus);
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--rail);
      color: var(--rail-ink);
      border-bottom: 1px solid var(--rail-rule);
    }

    .rail-row {
      display: flex;
      align-items: center;
      gap: var(--s4) var(--s6);
      min-height: 64px;
    }

    .wordmark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--rail-ink);
      text-decoration: none;
      font-weight: 900;
      font-stretch: 125%;
      font-size: 1.2rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .chq {
      width: 20px;
      height: 20px;
      background: conic-gradient(var(--rail-ink) 0 25%, transparent 0 50%, var(--rail-ink) 0 75%, transparent 0) 0 0 / 10px 10px;
      outline: 1.5px solid var(--rail-ink);
      outline-offset: 1px;
    }

    .places {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .rail-end {
      display: flex;
      align-items: center;
      gap: var(--s3);
      margin-left: auto;
    }

    /* Dymo tape, cut from the roll: a shallow notch at each end. */
    .dymo {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 0 16px;
      background: var(--tape);
      color: var(--tape-ink);
      font-weight: 700;
      font-stretch: 118%;
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      text-decoration: none;
      white-space: nowrap;
      clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 50%, 100% 100%, 0 100%, 5px 50%);
      transition: background-color 140ms var(--ease-out);
    }

    .dymo:hover {
      background: color-mix(in srgb, var(--tape) 80%, var(--tape-ink));
    }

    .dymo.lit {
      background: var(--stamp);
      color: var(--on-stamp);
    }

    .me {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      padding: 2px 12px 2px 2px;
      border: 1px solid var(--rail-rule);
      border-radius: 2px;
      color: var(--rail-ink);
      text-decoration: none;
      font-weight: 700;
      max-width: 22ch;
    }

    .me:hover {
      background: color-mix(in srgb, var(--rail) 80%, var(--rail-ink));
    }

    .me.lit {
      border-color: var(--stamp);
      box-shadow: inset 0 -3px 0 var(--stamp);
    }

    .me-badge {
      display: inline-grid;
      place-items: center;
      width: 34px;
      height: 34px;
      background: var(--rail-ink);
      color: var(--rail);
      font-weight: 800;
      font-stretch: 112%;
      font-size: 0.78rem;
      letter-spacing: 0.04em;
    }

    .me-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .foot {
      --focus: var(--rail-focus);
      background: var(--rail);
      color: var(--rail-ink-dim);
      border-top: 1px solid var(--rail-rule);
      font-size: 0.88rem;
    }

    .foot-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--s4) var(--s6);
      padding-block: var(--s5);
    }

    .foot-row p {
      max-width: 62ch;
    }

    .foot-row strong {
      color: var(--rail-ink);
    }

    .foot-row ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2) var(--s5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .foot-row a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--rail-ink);
    }

    .tabbar {
      display: none;
    }

    /* Phone and small tablet: places move to a bottom bar under the thumb. */
    @media (max-width: 760px) {
      .rail-row {
        min-height: 56px;
      }

      .places,
      .me {
        display: none;
      }

      .wordmark {
        font-size: 1.05rem;
      }

      .sign-in {
        min-height: 34px;
        font-size: 0.72rem;
        letter-spacing: 0.1em;
      }

      main {
        padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + var(--s6));
      }

      .foot {
        padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
      }

      .tabbar {
        --focus: var(--rail-focus);
        position: fixed;
        inset: auto 0 0 0;
        z-index: 20;
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
        padding-bottom: env(safe-area-inset-bottom);
        background: var(--rail);
        border-top: 1px solid var(--rail-rule);
      }

      .tab {
        position: relative;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 4px;
        color: var(--rail-ink-dim);
        text-decoration: none;
        font-size: 0.68rem;
        font-weight: 700;
        font-stretch: 108%;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .tab.lit {
        color: var(--rail-ink);
      }

      /* The lit tab carries a strip of violet tape along its top edge. */
      .tab.lit::before {
        content: '';
        position: absolute;
        top: 0;
        left: 22%;
        right: 22%;
        height: 3px;
        background: var(--stamp);
      }

      .tab:focus-visible {
        outline: 3px solid var(--focus);
        outline-offset: -3px;
      }
    }
  `,
})
export class App {
  /** Leave a clicked button scribbled out for a moment, so the strike shows through the page change. */
  protected strike(event: Event): void {
    const btn = (event.target as Element | null)?.closest?.('.btn');
    if (!btn || (btn as HTMLButtonElement).disabled) return;
    btn.classList.add('struck');
    setTimeout(() => btn.classList.remove('struck'), 900);
  }

  protected readonly auth = inject(AuthService);
  protected readonly env = environment;
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly inMeArea = computed(() => ME_AREA.test(this.url()));

  /** Header places. My laps only exists for a signed-in driver. */
  protected readonly places = computed<Place[]>(() => [
    { path: '/', label: 'Home', icon: 'home', exact: true },
    { path: '/tracks', label: 'Tracks', icon: 'track', exact: false },
    { path: '/events', label: 'Events', icon: 'flag', exact: false },
    ...(this.auth.signedIn() ? [{ path: '/laps', label: 'My laps', icon: 'stopwatch' as IconName, exact: false }] : []),
  ]);

  /** Bottom bar: the same places plus Me, or Sign in when signed out. */
  protected readonly tabs = computed<Place[]>(() => [
    ...this.places(),
    this.auth.signedIn()
      ? { path: '/me', label: 'Me', icon: 'user', exact: false }
      : { path: '/sign-in', label: 'Sign in', icon: 'user', exact: false },
  ]);

  protected initialsOf = initials;
}

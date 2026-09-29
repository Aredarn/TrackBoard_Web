import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../environments/environment';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { Icon } from './ui/icon';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

    <header class="board-head on-board">
      <div class="page head-row">
        <a class="wordmark" routerLink="/" aria-label="TrackBoard, home">
          <span class="chq" aria-hidden="true"></span>
          <span>TrackBoard</span>
        </a>

        <nav class="labels" aria-label="Main">
          <a class="dymo" routerLink="/tracks" routerLinkActive="lit">Tracks</a>
          @if (auth.user(); as user) {
            <a class="dymo" routerLink="/me" routerLinkActive="lit" [attr.title]="'Signed in as ' + user.displayName">My season</a>
          } @else {
            <a class="dymo" routerLink="/sign-in" routerLinkActive="lit">Sign in</a>
          }
          <button
            type="button"
            class="theme head-theme"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.night() ? 'Switch to day sheets' : 'Switch to carbon copies (dark)'"
            [attr.title]="theme.night() ? 'Day sheets' : 'Carbon copies'"
          >
            <tb-icon [name]="theme.night() ? 'sun' : 'moon'" />
          </button>
        </nav>
      </div>
    </header>

    <main id="main" tabindex="-1">
      <router-outlet />
    </main>

    <footer class="board-foot on-board">
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
          <li class="foot-theme">
            <button type="button" class="theme" (click)="theme.toggle()">
              <tb-icon [name]="theme.night() ? 'sun' : 'moon'" [size]="16" />
              {{ theme.night() ? 'Day sheets' : 'Carbon copies' }}
            </button>
          </li>
        </ul>
      </div>
    </footer>
  `,
  styles: `
    :host {
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
      z-index: 10;
      padding: 10px 14px;
      background: #f7e86a;
      color: #17181a;
      font-weight: 700;
    }

    .skip:focus {
      top: 12px;
    }

    main {
      flex: 1;
      padding-block: var(--s5) var(--s8);
    }

    main:focus {
      outline: none;
    }

    .board-head {
      border-bottom: 1px solid var(--board-rule);
      background: var(--board-deep);
    }

    .head-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--s3) var(--s5);
      min-height: 72px;
      padding-block: var(--s3);
    }

    .wordmark {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--board-ink);
      text-decoration: none;
      font-weight: 900;
      font-stretch: 125%;
      font-size: 1.3rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .chq {
      width: 22px;
      height: 22px;
      background: conic-gradient(
          var(--board-ink) 0 25%,
          transparent 0 50%,
          var(--board-ink) 0 75%,
          transparent 0
        )
        0 0 / 11px 11px;
      outline: 1.5px solid var(--board-ink);
      outline-offset: 1px;
    }

    .labels {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    /* Dymo embossed tape: raised pale letters on black plastic. */
    .dymo {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 0 12px;
      background: var(--tape);
      color: var(--tape-ink);
      font-weight: 700;
      font-stretch: 118%;
      font-size: 0.78rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      text-decoration: none;
      /* Tape cut from the roll: a shallow notch at each end. */
      clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 50%, 100% 100%, 0 100%, 5px 50%);
      padding-inline: 16px;
      max-width: 22ch;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: background-color 140ms var(--ease-out);
    }

    .dymo:hover {
      background: color-mix(in srgb, var(--tape) 82%, var(--tape-ink));
    }

    .dymo.lit {
      background: var(--stamp);
      color: var(--on-stamp);
    }

    .theme {
      display: inline-grid;
      place-items: center;
      width: 40px;
      height: 36px;
      border: 1px solid var(--board-rule);
      border-radius: 2px;
      background: transparent;
      color: var(--board-ink);
      cursor: pointer;
    }

    .theme:hover {
      background: var(--board);
    }

    .board-foot {
      border-top: 1px solid var(--board-rule);
      background: var(--board-deep);
      font-size: 0.88rem;
      color: var(--board-ink-dim);
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
      color: var(--board-ink);
    }

    .foot-row ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--s2) var(--s5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .foot-theme {
      display: none;
    }

    .foot-theme .theme {
      width: auto;
      gap: 6px;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      font-size: 0.85rem;
    }

    @media (max-width: 560px) {
      .head-row {
        flex-wrap: nowrap;
        min-height: 60px;
      }

      .wordmark {
        font-size: 0.95rem;
        font-stretch: 104%;
        gap: 8px;
      }

      .chq {
        display: none;
      }

      .labels {
        flex-wrap: nowrap;
        gap: 6px;
      }

      .dymo {
        min-height: 34px;
        padding-inline: 11px;
        font-size: 0.7rem;
        letter-spacing: 0.08em;
      }

      .head-theme {
        display: none;
      }

      .foot-theme {
        display: list-item;
        list-style: none;
      }
    }

    .foot-row a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--board-ink);
    }
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly env = environment;
}

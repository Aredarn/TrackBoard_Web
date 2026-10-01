import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { problemMessage } from '../core/format';

@Component({
  selector: 'tb-sign-in-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet spiral form-sheet">
        <h1 class="sheet-title">Sign in</h1>
        <p class="dim lede">Use the same account as the TrackPro app.</p>

        @if (expired()) {
          <div class="notice" role="status"><strong>Signed out</strong><p>Your session ran out. Sign in again to carry on.</p></div>
        }

        <form (ngSubmit)="submit()" #f="ngForm" novalidate>
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required [(ngModel)]="email" />
          </label>
          <label class="field">
            <span>Password</span>
            <input type="password" name="password" autocomplete="current-password" required [(ngModel)]="password" />
          </label>

          @if (error()) {
            <div class="notice" role="alert"><strong>Not signed in</strong><p>{{ error() }}</p></div>
          }

          <button class="btn" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
        </form>

        <p class="sheet-foot">No account yet? <a routerLink="/register" [queryParams]="{ returnUrl: returnUrl() }">Create one</a>. It is free.</p>
      </article>
    </div>
  `,
  styles: `
    .form-sheet {
      max-width: 34rem;
      margin-inline: auto;
    }

    .sheet-title {
      margin-top: var(--s5);
    }

    .lede {
      margin: var(--s2) 0 var(--s4);
    }

    form {
      display: grid;
      gap: var(--s4);
      margin-top: var(--s4);
    }

    form .btn {
      justify-self: start;
    }
  `,
})
export class SignInPage {
  readonly returnUrl = input<string>('/');
  readonly expired = input<string | undefined>(undefined);

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    if (!this.email.trim() || !this.password) {
      this.error.set('Enter your email and password.');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.auth.signIn(this.email.trim(), this.password).subscribe({
      next: () => void this.router.navigateByUrl(safeReturn(this.returnUrl())),
      error: (e: { status?: number }) => {
        this.busy.set(false);
        this.error.set(
          e.status === 401 ? 'That email and password do not match an account.' : problemMessage(e),
        );
      },
    });
  }
}

/** Only ever return to a path on this site. */
export function safeReturn(url: string | undefined): string {
  return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
}

import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { problemMessage } from '../core/format';
import { safeReturn } from './sign-in';

@Component({
  selector: 'tb-register-page',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <article class="sheet spiral form-sheet">
        <h1 class="sheet-title">Create an account</h1>
        <p class="dim lede">
          One account for the website and the TrackPro app. Sign in on the phone with it and your ranked laps post themselves.
        </p>

        <form (ngSubmit)="submit()" novalidate>
          <label class="field">
            <span>Name on the board</span>
            <input name="displayName" autocomplete="nickname" required minlength="2" maxlength="100" [(ngModel)]="displayName" />
            <span class="hint">Shown on leaderboards and your public driver page.</span>
          </label>
          <label class="field">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required maxlength="256" [(ngModel)]="email" />
            <span class="hint">Never shown to anyone.</span>
          </label>
          <label class="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autocomplete="new-password"
              required
              minlength="12"
              maxlength="128"
              [(ngModel)]="password"
              [attr.aria-invalid]="tooShort() ? 'true' : null"
              aria-describedby="pw-hint"
            />
            <span class="hint" id="pw-hint">At least 12 characters. A short phrase is easier to remember than symbols.</span>
          </label>

          @if (error()) {
            <div class="notice" role="alert"><strong>Not created</strong><p>{{ error() }}</p></div>
          }

          <button class="btn" type="submit" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create account' }}</button>
        </form>

        <p class="sheet-foot">Already have one? <a routerLink="/sign-in" [queryParams]="{ returnUrl: returnUrl() }">Sign in</a>.</p>
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
export class RegisterPage {
  readonly returnUrl = input<string>('/');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected displayName = '';
  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly tooShort = signal(false);

  protected submit(): void {
    const name = this.displayName.trim();
    this.tooShort.set(this.password.length > 0 && this.password.length < 12);
    if (name.length < 2) return this.error.set('Your name on the board needs at least two characters.');
    if (!this.email.includes('@')) return this.error.set('Enter the email address you want to sign in with.');
    if (this.password.length < 12) {
      this.tooShort.set(true);
      return this.error.set('The password needs at least 12 characters.');
    }

    this.busy.set(true);
    this.error.set(null);
    this.auth.register(this.email.trim(), name, this.password).subscribe({
      next: () => void this.router.navigateByUrl(safeReturn(this.returnUrl())),
      error: (e: { status?: number }) => {
        this.busy.set(false);
        this.error.set(
          e.status === 409 ? 'An account already uses that email. Sign in instead.' : problemMessage(e),
        );
      },
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { load } from '../../core/load';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Profile } from '../../core/api.types';
import { AuthService } from '../../core/auth.service';
import { problemMessage } from '../../core/format';
import { Gate } from '../../ui/gate';
import { Icon } from '../../ui/icon';
import { PhotoFrame } from '../../ui/photo-frame';
import { TIMING_PIPES } from '../../ui/pipes';

type Notice = { ok: boolean; text: string } | null;

@Component({
  selector: 'tb-account-page',
  imports: [FormsModule, RouterLink, Gate, Icon, PhotoFrame, ...TIMING_PIPES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="sheet-title title">Account</h1>

    <tb-gate [status]="profile.status()" [error]="profile.error()" (retry)="profile.reload()">
      @if (profile.value(); as p) {
        <p class="dim lede">
          Signed in as <strong class="typed">{{ p.email }}</strong> since {{ p.memberSince | day }}.
          Your name, photo, country and bio appear on your
          <a [routerLink]="['/drivers', p.id]">public driver page</a> and beside your laps.
        </p>

        <section aria-labelledby="h-profile">
          <h2 class="rubric" id="h-profile">Driver details</h2>
          <div class="profile">
            <div class="photo">
              <tb-photo [url]="p.avatarUrl" [name]="p.displayName" [size]="148" alt="Your photo" />
              <label class="btn plain upload" [class.busy]="photoBusy()">
                <tb-icon name="upload" [size]="16" />
                {{ photoBusy() ? 'Uploading…' : p.avatarUrl ? 'Replace photo' : 'Add photo' }}
                <input type="file" accept="image/jpeg,image/png,image/webp" (change)="pickPhoto($event)" [disabled]="photoBusy()" />
              </label>
              @if (p.avatarUrl) {
                <button type="button" class="linkish" (click)="removePhoto()" [disabled]="photoBusy()">Remove photo</button>
              }
            </div>

            <form class="details" (ngSubmit)="save(p)" novalidate>
              <label class="field">
                <span>Name on the board</span>
                <input name="displayName" required minlength="2" maxlength="100" [(ngModel)]="displayName" />
              </label>
              <label class="field">
                <span>Country</span>
                <input name="country" maxlength="60" autocomplete="country-name" [(ngModel)]="country" />
              </label>
              <label class="field">
                <span>Bio</span>
                <textarea name="bio" maxlength="500" [(ngModel)]="bio" placeholder="Where you drive, what you drive."></textarea>
                <span class="hint">{{ bio.length }}/500</span>
              </label>
              <button class="btn" type="submit" [disabled]="saving() || !dirty(p)">{{ saving() ? 'Saving…' : 'Save details' }}</button>
            </form>
          </div>
          @if (notice(); as n) {
            <div class="notice" [class.ok]="n.ok" role="status">
              <strong>{{ n.ok ? 'Saved' : 'Not saved' }}</strong>
              <p>{{ n.text }}</p>
            </div>
          }
        </section>

        <section aria-labelledby="h-data">
          <h2 class="rubric" id="h-data">Your data</h2>
          <div class="row">
            <p>Everything TrackBoard holds about you (profile, cars, tracks, sessions and laps) as one JSON file.</p>
            <button type="button" class="btn plain" (click)="download()" [disabled]="exporting()">
              <tb-icon name="download" [size]="16" /> {{ exporting() ? 'Preparing…' : 'Download export' }}
            </button>
          </div>
          <div class="row">
            <p>Sign out of TrackBoard in this browser. The phone stays signed in.</p>
            <button type="button" class="btn plain" (click)="auth.signOut()"><tb-icon name="signOut" [size]="16" /> Sign out</button>
          </div>
        </section>

        <section aria-labelledby="h-delete" class="danger">
          <h2 class="rubric" id="h-delete">Delete account</h2>
          <p>
            Deletes your account, cars, photos, sessions and laps, and removes you from every board. Published
            tracks that other drivers have timed on stay up under an anonymous owner. This cannot be undone.
          </p>
          <label class="field confirm">
            <span>Type <strong class="typed">{{ p.displayName }}</strong> to confirm</span>
            <input name="confirm" autocomplete="off" [(ngModel)]="confirmText" />
          </label>
          <button type="button" class="btn danger" [disabled]="confirmText !== p.displayName || deleting()" (click)="deleteAccount()">
            {{ deleting() ? 'Deleting…' : 'Delete my account' }}
          </button>
          @if (deleteError()) {
            <div class="notice" role="alert"><strong>Not deleted</strong><p>{{ deleteError() }}</p></div>
          }
        </section>
      }
    </tb-gate>
  `,
  styles: `
    .title {
      margin-top: var(--s5);
    }

    .lede {
      margin: var(--s2) 0 0;
      max-width: 70ch;
    }

    .profile {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      gap: var(--s6);
      align-items: start;
    }

    .photo {
      display: grid;
      gap: var(--s3);
      justify-items: start;
    }

    .upload {
      position: relative;
      overflow: hidden;
    }

    .upload input {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    .upload:focus-within {
      outline: 3px solid var(--focus);
      outline-offset: 2px;
    }

    .upload.busy {
      opacity: 0.6;
    }

    .details {
      display: grid;
      gap: var(--s4);
      max-width: 36rem;
    }

    .details .btn {
      justify-self: start;
    }

    .notice {
      margin-top: var(--s4);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: var(--s3) var(--s5);
      padding-block: var(--s3);
      border-bottom: 1px solid var(--rule);
    }

    .row p {
      max-width: 60ch;
    }

    .danger p {
      max-width: 70ch;
    }

    .danger .rubric {
      color: var(--fault);
      border-color: var(--fault);
    }

    .confirm {
      max-width: 24rem;
      margin: var(--s4) 0;
    }

    .confirm strong {
      text-transform: none;
      letter-spacing: 0;
      color: var(--ink);
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

    @media (max-width: 720px) {
      .profile {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class AccountPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly profile = load({ stream: () => this.api.profile() });

  protected displayName = '';
  protected country = '';
  protected bio = '';
  protected confirmText = '';

  protected readonly saving = signal(false);
  protected readonly photoBusy = signal(false);
  protected readonly exporting = signal(false);
  protected readonly deleting = signal(false);
  protected readonly notice = signal<Notice>(null);
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    // Fill the form once the profile arrives, and again whenever it is replaced by a save.
    effect(() => {
      const p = this.profile.value();
      if (!p) return;
      this.displayName = p.displayName;
      this.country = p.country ?? '';
      this.bio = p.bio ?? '';
    });
  }

  protected dirty(p: Profile): boolean {
    return (
      this.displayName.trim() !== p.displayName ||
      this.country.trim() !== (p.country ?? '') ||
      this.bio.trim() !== (p.bio ?? '')
    );
  }

  protected save(p: Profile): void {
    const name = this.displayName.trim();
    if (name.length < 2) {
      this.notice.set({ ok: false, text: 'Your name on the board needs at least two characters.' });
      return;
    }
    this.saving.set(true);
    this.notice.set(null);
    this.api
      .updateProfile({
        displayName: name !== p.displayName ? name : undefined,
        country: this.country.trim(),
        bio: this.bio.trim(),
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.profile.set(updated);
          this.auth.setDisplayName(updated.displayName);
          this.notice.set({ ok: true, text: 'Your details are updated on every board.' });
        },
        error: (e) => {
          this.saving.set(false);
          this.notice.set({ ok: false, text: problemMessage(e) });
        },
      });
  }

  protected async pickPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.notice.set({ ok: false, text: 'That file is not an image. Choose a JPEG, PNG or WebP photo.' });
      return;
    }

    this.photoBusy.set(true);
    this.notice.set(null);
    let jpeg: Blob;
    try {
      jpeg = await toJpeg(file, 1024);
    } catch {
      this.photoBusy.set(false);
      this.notice.set({ ok: false, text: 'That image could not be read. Try a different photo.' });
      return;
    }

    this.api
      .createAvatarUpload('image/jpeg')
      .pipe(
        switchMap((target) =>
          this.api.uploadBytes(target, jpeg, 'image/jpeg').pipe(switchMap(() => this.api.setAvatar(target.path))),
        ),
      )
      .subscribe({
        next: (updated) => {
          this.photoBusy.set(false);
          this.profile.set(updated);
          this.notice.set({ ok: true, text: 'New photo is up.' });
        },
        error: (e: { status?: number }) => {
          this.photoBusy.set(false);
          this.notice.set({
            ok: false,
            text: e.status === 503 ? 'Photo storage is switched off on this server for now.' : problemMessage(e),
          });
        },
      });
  }

  protected removePhoto(): void {
    this.photoBusy.set(true);
    this.api.clearAvatar().subscribe({
      next: (updated) => {
        this.photoBusy.set(false);
        this.profile.set(updated);
      },
      error: (e) => {
        this.photoBusy.set(false);
        this.notice.set({ ok: false, text: problemMessage(e) });
      },
    });
  }

  protected download(): void {
    this.exporting.set(true);
    this.api.export().subscribe({
      next: (blob) => {
        this.exporting.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trackboard-export.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (e) => {
        this.exporting.set(false);
        this.notice.set({ ok: false, text: problemMessage(e, 'The export could not be prepared.') });
      },
    });
  }

  protected deleteAccount(): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.api.deleteAccount().subscribe({
      next: () => {
        this.auth.clear();
        void this.router.navigateByUrl('/');
      },
      error: (e) => {
        this.deleting.set(false);
        this.deleteError.set(problemMessage(e));
      },
    });
  }
}

/** Re-encode to JPEG at most `max` px on the long edge, as the app does before uploading. */
async function toJpeg(file: File, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode failed'))), 'image/jpeg', 0.88),
  );
}

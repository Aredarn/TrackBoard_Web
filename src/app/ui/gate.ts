import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ResourceStatus } from '@angular/core';
import { problemMessage } from '../core/format';

/**
 * Four branches, never two sharing one: loading, failed, empty, content.
 *
 * Loading is a sheet coming off the printer, not a spinner. The API runs on a free plan
 * that sleeps when idle, so after a few seconds the placard says so plainly rather than
 * leaving the driver guessing whether anything is happening.
 */
@Component({
  selector: 'tb-gate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (branch()) {
      @case ('loading') {
        <div class="printing" role="status" aria-live="polite">
          <p class="placard">{{ slow() ? 'Waking the timekeeper' : loadingLabel() }}</p>
          @if (slow()) {
            <p class="why">
              The TrackBoard server sleeps when nobody has used it for a while. The first request
              can take up to a minute; this page fills in on its own.
            </p>
          }
          <div class="lines" aria-hidden="true">
            @for (w of widths; track $index) {
              <span [style.width.%]="w" [style.animation-delay.ms]="$index * 140"></span>
            }
          </div>
        </div>
      }
      @case ('error') {
        <div class="notice" role="alert">
          <strong>{{ notFound() ? 'Not on the board' : 'Could not load this sheet' }}</strong>
          <p>{{ message() }}</p>
          @if (!notFound()) {
            <button type="button" class="btn plain retry" (click)="retry.emit()">Try again</button>
          }
        </div>
      }
      @case ('empty') {
        <ng-content select="[empty]" />
      }
      @default {
        <ng-content />
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .printing {
      padding-block: var(--s4);
    }

    .placard {
      font-weight: 800;
      font-stretch: 118%;
      font-size: 0.85rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--ink-2);
    }

    .why {
      max-width: 56ch;
      margin-top: var(--s2);
      color: var(--ink-2);
    }

    .lines {
      display: grid;
      gap: 12px;
      margin-top: var(--s4);
    }

    .lines span {
      display: block;
      height: 10px;
      background: repeating-linear-gradient(
        90deg,
        var(--rule) 0 6px,
        transparent 6px 9px
      );
      transform-origin: left;
      animation: print 1.6s var(--ease-out) infinite;
    }

    @keyframes print {
      0% {
        transform: scaleX(0);
        opacity: 1;
      }
      60% {
        transform: scaleX(1);
        opacity: 1;
      }
      100% {
        transform: scaleX(1);
        opacity: 0.35;
      }
    }

    .notice p {
      margin-top: 4px;
    }

    .retry {
      margin-top: var(--s3);
    }
  `,
})
export class Gate {
  readonly status = input.required<ResourceStatus>();
  readonly error = input<unknown>(undefined);
  readonly empty = input(false);
  readonly loadingLabel = input('Printing the sheet');
  readonly retry = output<void>();

  protected readonly widths = [92, 78, 86, 64, 88, 71];
  protected readonly slow = signal(false);

  protected readonly branch = computed(() => {
    const s = this.status();
    if (s === 'loading') return 'loading';
    if (s === 'error') return 'error';
    if (s === 'idle') return 'loading';
    return this.empty() ? 'empty' : 'content';
  });

  protected readonly notFound = computed(
    () => (this.error() as { status?: number } | undefined)?.status === 404,
  );

  protected readonly message = computed(() =>
    this.notFound()
      ? 'Nothing is posted under this address. It may have been unpublished or deleted.'
      : problemMessage(this.error(), 'The server answered with an error. Try again in a moment.'),
  );

  constructor() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      clearTimeout(timer);
      if (this.branch() === 'loading') {
        timer = setTimeout(() => this.slow.set(true), 4000);
      } else {
        this.slow.set(false);
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }
}

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { initials } from '../core/format';

/**
 * A driver or car photo in a square, ruled frame — the passport photo stapled to a
 * competition licence. With no photo the frame still stands, holding initials.
 */
@Component({
  selector: 'tb-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--size.px]': 'size()' },
  template: `
    @if (url() && !failed()) {
      <img [src]="url()" [alt]="alt()" loading="lazy" (error)="failed.set(true)" />
    } @else {
      <span class="initials" [attr.aria-label]="alt()" role="img">{{ letters() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      flex: none;
      align-self: flex-start;
      width: var(--size);
      aspect-ratio: 1;
      padding: 4px;
      background: var(--paper);
      border: 1px solid var(--rule-strong);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(0.15) contrast(1.05);
    }

    .initials {
      display: grid;
      place-items: center;
      background: var(--paper-2);
      color: var(--ink-2);
      font-weight: 800;
      font-stretch: 118%;
      font-size: calc(var(--size) * 0.3);
      letter-spacing: 0.04em;
    }
  `,
})
export class PhotoFrame {
  readonly url = input<string | null | undefined>(null);
  readonly name = input.required<string>();
  readonly size = input(96);
  readonly alt = input('');

  protected readonly failed = signal(false);
  protected readonly letters = computed(() => initials(this.name()));
}

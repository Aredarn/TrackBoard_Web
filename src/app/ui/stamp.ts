import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A rubber stamp: heavy caps in a ruled frame, struck at a slight angle, ink roughened by
 * the `#tb-ink` filter the shell defines once. Decorative only when `label` repeats text
 * that is already on the page; otherwise it is read out.
 */
@Component({
  selector: 'tb-stamp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "'stamp ' + tone()",
    '[style.--tilt]': "tilt() + 'deg'",
  },
  template: `
    <span class="face">
      <span class="line">{{ text() }}</span>
      @if (sub()) {
        <span class="sub">{{ sub() }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      --ink-color: var(--stamp);
      display: inline-block;
      transform: rotate(var(--tilt, -4deg));
      color: var(--ink-color);
      pointer-events: none;
      user-select: none;
    }

    :host(.fault) {
      --ink-color: var(--fault);
    }

    :host(.pb) {
      --ink-color: var(--pb);
    }

    :host(.muted) {
      --ink-color: var(--ink-2);
    }

    .face {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 2px;
      padding: 6px 12px 5px;
    }

    .face::before {
      content: '';
      position: absolute;
      inset: 0;
      border: 3px double currentColor;
      filter: url(#tb-ink);
      opacity: 0.88;
    }

    .line {
      font-weight: 800;
      font-stretch: 122%;
      font-size: 0.95rem;
      letter-spacing: 0.16em;
      line-height: 1.1;
      text-transform: uppercase;
      white-space: nowrap;
      filter: url(#tb-ink);
      opacity: 0.9;
    }

    .sub {
      font-family: var(--font-typed);
      font-weight: 700;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }
  `,
})
export class Stamp {
  readonly text = input.required<string>();
  readonly sub = input<string | null>(null);
  readonly tone = input<'ob' | 'pb' | 'fault' | 'muted'>('ob');
  readonly tilt = input(-4);
}

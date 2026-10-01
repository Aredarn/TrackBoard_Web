import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Authored line icons: one 24-unit grid, one 1.75 stroke, square caps to match the ruled sheets. */
const PATHS = {
  arrowRight: 'M4 12h15M13 6l6 6-6 6',
  arrowLeft: 'M20 12H5M11 6l-6 6 6 6',
  link: 'M10 14a4 4 0 0 0 5.7 0l3.6-3.6a4 4 0 0 0-5.7-5.7L12 6.3M14 10a4 4 0 0 0-5.7 0l-3.6 3.6a4 4 0 0 0 5.7 5.7L12 17.7',
  check: 'M4 12.5l5 5L20 6.5',
  pin: 'M12 13v8M7 4h10l-1.5 4.5L18 13H6l2.5-4.5z',
  download: 'M12 4v11M7 10l5 5 5-5M4 20h16',
  upload: 'M12 20V9M7 14l5-5 5 5M4 4h16',
  locate: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  signOut: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  flag: 'M5 21V4M5 4h13l-2.5 4.5L18 13H5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  home: 'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5',
  stopwatch: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M9.5 2.5h5M18.5 5.5l1.5-1.5',
  car: 'M3 17v-4.5L5.5 7h13l2.5 5.5V17zM3 17v2.5h3V17M18 17v2.5h3V17M3 12.5h18M6.5 14.5h2M15.5 14.5h2',
  track: 'M7 19c-2.5 0-4-1.7-4-4s1.5-4 4-4h2.5l2-5H16c3 0 5 2.2 5 5.5S19 19 16 19z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c.8-4 4-6 8-6s7.2 2 8 6',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'tb-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="square"
      stroke-linejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="d()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  protected readonly d = computed(() => PATHS[this.name()]);
}

import { Injectable, computed, signal } from '@angular/core';

export type ThemeChoice = 'auto' | 'day' | 'night';

const KEY = 'trackboard.theme';

/** Day sheet or carbon copy. Follows the system until the driver picks one. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly systemNight = signal(this.media.matches);
  readonly choice = signal<ThemeChoice>(readChoice());

  readonly night = computed(() =>
    this.choice() === 'auto' ? this.systemNight() : this.choice() === 'night',
  );

  constructor() {
    this.media.addEventListener('change', (e) => this.systemNight.set(e.matches));
    this.apply();
  }

  toggle(): void {
    const next: ThemeChoice = this.night() ? 'day' : 'night';
    // Picking what the system already says means "follow the system" again.
    this.choice.set(next === (this.systemNight() ? 'night' : 'day') ? 'auto' : next);
    try {
      localStorage.setItem(KEY, this.choice());
    } catch {
      // Not persisted; still applies for this visit.
    }
    this.apply();
  }

  private apply(): void {
    const c = this.choice();
    if (c === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', c);
  }
}

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'day' || v === 'night' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

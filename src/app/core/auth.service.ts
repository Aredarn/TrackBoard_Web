import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, AuthenticatedUser } from './api.types';

const STORAGE_KEY = 'trackboard.auth';

interface StoredAuth {
  accessToken: string;
  expiresAt: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

/**
 * Holds the signed-in driver's tokens. Access tokens last 60 minutes and refresh tokens 90
 * days; refresh tokens rotate on every use, and presenting a rotated one revokes every
 * session, so exactly one refresh may be in flight at a time.
 *
 * Tokens live in localStorage: the API issues bearer tokens rather than cookies, so there is
 * no httpOnly option. The page loads no third-party scripts, which keeps that exposure small.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Bypasses the interceptors, so auth calls never try to refresh themselves.
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly router = inject(Router);
  private readonly base = `${environment.apiBase}/api/v1/auth`;

  private readonly state = signal<StoredAuth | null>(read());
  private refreshing: Observable<string> | null = null;

  readonly user = computed(() => this.state()?.user ?? null);
  readonly signedIn = computed(() => this.state() !== null);

  constructor() {
    // Another tab signing in or out should not leave this one holding stale tokens.
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) this.state.set(read());
    });
  }

  signIn(email: string, password: string): Observable<AuthenticatedUser> {
    return this.http
      .post<AuthResponse>(`${this.base}/login`, { email, password })
      .pipe(tap((r) => this.store(r)), map((r) => r.user));
  }

  register(email: string, displayName: string, password: string): Observable<AuthenticatedUser> {
    return this.http
      .post<AuthResponse>(`${this.base}/register`, { email, displayName, password })
      .pipe(tap((r) => this.store(r)), map((r) => r.user));
  }

  signOut(redirect = true): void {
    const current = this.state();
    if (current) {
      // Best effort: revoke the refresh token server-side, but never block leaving on it.
      this.http
        .post(`${this.base}/logout`, { refreshToken: current.refreshToken }, {
          headers: { Authorization: `Bearer ${current.accessToken}` },
        })
        .subscribe({ error: () => undefined });
    }
    this.clear();
    if (redirect) void this.router.navigateByUrl('/');
  }

  /** Drops local state only, e.g. after the account was deleted or a refresh was refused. */
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state.set(null);
  }

  /** Renamed on the account page: keep the header and leaderboard highlight in step. */
  setDisplayName(displayName: string): void {
    const current = this.state();
    if (!current) return;
    this.persist({ ...current, user: { ...current.user, displayName } });
  }

  /** A usable access token, refreshing first when it expires within a minute. Null when signed out. */
  accessToken(): Observable<string> | string | null {
    const current = this.state();
    if (!current) return null;
    if (Date.parse(current.expiresAt) - Date.now() > 60_000) return current.accessToken;
    return this.refresh();
  }

  /** Single-flight refresh: concurrent callers share one request. */
  refresh(): Observable<string> {
    const current = this.state();
    if (!current) throw new Error('Not signed in.');

    this.refreshing ??= this.http
      .post<AuthResponse>(`${this.base}/refresh`, { refreshToken: current.refreshToken })
      .pipe(
        tap({ next: (r) => this.store(r), error: () => this.clear() }),
        map((r) => r.accessToken),
        finalize(() => (this.refreshing = null)),
        shareReplay(1),
      );

    return this.refreshing;
  }

  private store(r: AuthResponse): void {
    this.persist({
      accessToken: r.accessToken,
      expiresAt: r.expiresAt,
      refreshToken: r.refreshToken,
      user: r.user,
    });
  }

  private persist(value: StoredAuth): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Private mode or full storage: the session still works until the tab closes.
    }
    this.state.set(value);
  }
}

function read(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

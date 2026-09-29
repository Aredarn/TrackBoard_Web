import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, isObservable, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

const withToken = (req: HttpRequest<unknown>, token: string) =>
  req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * Adds the bearer token to API calls and refreshes once on a 401. The public endpoints
 * answer 401 to a stale token rather than treating the caller as anonymous, so the refresh
 * path matters on every page, not just the driver area.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = req.url.startsWith(`${environment.apiBase}/api/`);

  if (!isApi) return next(req);

  const token = auth.accessToken();
  if (token === null) return next(req);

  const token$ = isObservable(token) ? token : of(token);

  return token$.pipe(
    catchError(() => of(null)),
    switchMap((t) => next(t ? withToken(req, t) : req)),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !auth.signedIn()) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        switchMap((fresh) => next(withToken(req, fresh))),
        catchError((refreshError: unknown) => {
          auth.clear();
          void router.navigate(['/sign-in'], {
            queryParams: { returnUrl: router.url, expired: 1 },
          });
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

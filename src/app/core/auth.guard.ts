import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const signedInGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.signedIn()
    ? true
    : inject(Router).createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } });
};

export const signedOutGuard: CanActivateFn = () =>
  inject(AuthService).signedIn() ? inject(Router).createUrlTree(['/me']) : true;

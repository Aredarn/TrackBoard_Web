import { Routes } from '@angular/router';
import { signedInGuard, signedOutGuard } from './core/auth.guard';

/**
 * Four places everyone can find from the top bar (or the bottom bar on a phone) — Home,
 * Tracks, Events, My laps — plus Me for the account side. Every other page is reached from
 * one of them.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'TrackBoard — lap-time boards for TrackPro drivers',
    loadComponent: () => import('./pages/home').then((m) => m.HomePage),
  },
  {
    path: 'tracks',
    title: 'Tracks — TrackBoard',
    loadComponent: () => import('./pages/tracks').then((m) => m.TracksPage),
  },
  {
    path: 'tracks/:id',
    title: 'Classification — TrackBoard',
    loadComponent: () => import('./pages/track').then((m) => m.TrackPage),
  },
  {
    path: 'events/:id',
    title: 'Event — TrackBoard',
    loadComponent: () => import('./pages/event').then((m) => m.EventPage),
  },
  {
    path: 'drivers/:id',
    title: 'Driver — TrackBoard',
    loadComponent: () => import('./pages/driver').then((m) => m.DriverPage),
  },
  {
    path: 'sign-in',
    title: 'Sign in — TrackBoard',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/sign-in').then((m) => m.SignInPage),
  },
  {
    path: 'register',
    title: 'Create an account — TrackBoard',
    canActivate: [signedOutGuard],
    loadComponent: () => import('./pages/register').then((m) => m.RegisterPage),
  },

  // Addresses from the first version of the site.
  { path: 'me/sessions', redirectTo: 'laps/sessions' },
  { path: 'me/events', redirectTo: 'events' },
  { path: 'me/garage', redirectTo: 'garage' },
  { path: 'me/tracks', redirectTo: 'my-tracks' },
  { path: 'me/account', redirectTo: 'account' },

  // Pages that sit on one plain sheet.
  {
    path: '',
    loadComponent: () => import('./pages/sheet-layout').then((m) => m.SheetLayout),
    children: [
      {
        path: 'laps',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/me/laps-layout').then((m) => m.LapsLayout),
        children: [
          {
            path: '',
            title: 'Personal bests — TrackBoard',
            loadComponent: () => import('./pages/me/record').then((m) => m.RecordPage),
          },
          {
            path: 'sessions',
            title: 'Sessions — TrackBoard',
            loadComponent: () => import('./pages/me/sessions').then((m) => m.SessionsPage),
          },
          {
            path: 'sessions/:id',
            title: 'Session — TrackBoard',
            loadComponent: () => import('./pages/me/session').then((m) => m.SessionPage),
          },
        ],
      },
      {
        // Open to everyone: signed out, it explains events and how to join one.
        path: 'events',
        title: 'Events — TrackBoard',
        loadComponent: () => import('./pages/me/events').then((m) => m.EventsPage),
      },
      {
        path: 'events/:id/manage',
        title: 'Manage event — TrackBoard',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/me/event-manage').then((m) => m.EventManagePage),
      },
      {
        path: 'me',
        title: 'Me — TrackBoard',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/me/me-hub').then((m) => m.MeHubPage),
      },
      {
        path: 'garage',
        title: 'Garage — TrackBoard',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/me/garage').then((m) => m.GaragePage),
      },
      {
        path: 'my-tracks',
        title: 'My tracks — TrackBoard',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/me/my-tracks').then((m) => m.MyTracksPage),
      },
      {
        path: 'account',
        title: 'Account — TrackBoard',
        canActivate: [signedInGuard],
        loadComponent: () => import('./pages/me/account').then((m) => m.AccountPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found — TrackBoard',
    loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage),
  },
];

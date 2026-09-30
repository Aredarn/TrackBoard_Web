import { Routes } from '@angular/router';
import { signedInGuard, signedOutGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
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
  {
    path: 'me',
    canActivate: [signedInGuard],
    loadComponent: () => import('./pages/me/me-layout').then((m) => m.MeLayout),
    children: [
      {
        path: '',
        title: 'My season — TrackBoard',
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
      {
        path: 'events',
        title: 'Events — TrackBoard',
        loadComponent: () => import('./pages/me/events').then((m) => m.EventsPage),
      },
      {
        path: 'events/:id',
        title: 'Manage event — TrackBoard',
        loadComponent: () => import('./pages/me/event-manage').then((m) => m.EventManagePage),
      },
      {
        path: 'garage',
        title: 'Garage — TrackBoard',
        loadComponent: () => import('./pages/me/garage').then((m) => m.GaragePage),
      },
      {
        path: 'tracks',
        title: 'My tracks — TrackBoard',
        loadComponent: () => import('./pages/me/my-tracks').then((m) => m.MyTracksPage),
      },
      {
        path: 'account',
        title: 'Account — TrackBoard',
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

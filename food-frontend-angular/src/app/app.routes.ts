import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';
import { profileCompleteGuard, profileIncompleteGuard } from './core/guards/profile.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth.component').then((m) => m.AuthComponent)
  },
  {
    path: 'welcome',
    canActivate: [authGuard, profileIncompleteGuard],
    loadComponent: () =>
      import('./features/welcome/welcome-wizard.component').then((m) => m.WelcomeWizardComponent)
  },
  {
    path: '',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];

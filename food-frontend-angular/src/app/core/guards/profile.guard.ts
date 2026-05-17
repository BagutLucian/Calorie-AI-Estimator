import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ProfileService } from '../services/profile.service';

export const profileCompleteGuard: CanActivateFn = () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const cached = profileService.profile();
  if (cached) {
    return cached.goal !== null ? true : router.createUrlTree(['/welcome']);
  }

  return profileService.load().pipe(
    map((profile) => (profile.goal !== null ? true : router.createUrlTree(['/welcome']))),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

export const profileIncompleteGuard: CanActivateFn = () => {
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const cached = profileService.profile();
  if (cached) {
    return cached.goal === null ? true : router.createUrlTree(['/home']);
  }

  return profileService.load().pipe(
    map((profile) => (profile.goal === null ? true : router.createUrlTree(['/home']))),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

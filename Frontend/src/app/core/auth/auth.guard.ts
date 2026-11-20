import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';

export const authGuard: CanActivateChildFn = async () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  return (await session.isAuthenticated()) || router.createUrlTree(['/auth']);
};

export const verificationGuard: CanActivateFn = async () => {
  const session = inject(AuthSessionService);
  const router = inject(Router);

  if (await session.isAuthenticated()) {
    return router.createUrlTree(['/dashboard']);
  }

  return session.hasPendingVerification() || router.createUrlTree(['/auth']);
};

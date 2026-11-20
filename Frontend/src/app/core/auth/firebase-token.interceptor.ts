import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthSessionService } from './auth-session.service';
import { environment } from '../../../environments/environment';

export const firebaseTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const apiPrefix = environment.apiBaseUrl
    ? `${environment.apiBaseUrl}/api/v1/`
    : '/api/v1/';
  if (!request.url.startsWith(apiPrefix)) {
    return next(request);
  }

  const session = inject(AuthSessionService);

  return from(session.getIdToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(request);
      }

      return next(
        request.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        }),
      );
    }),
  );
};
